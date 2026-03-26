/**
 * Calcula a geometria da rota (OSRM) uma vez e grava em seller_routes.path_geojson.
 * Chamado pelo admin após salvar paradas — o app do vendedor só lê o JSON.
 */
const { createClient } = require('@supabase/supabase-js');

function mergeLineStrings(geoms) {
  const all = [];
  for (let i = 0; i < geoms.length; i++) {
    const c = geoms[i].coordinates;
    if (!c || c.length < 2) continue;
    if (all.length === 0) {
      for (let k = 0; k < c.length; k++) all.push(c[k]);
    } else {
      for (let k = 1; k < c.length; k++) all.push(c[k]);
    }
  }
  return { type: 'LineString', coordinates: all };
}

async function fetchOsrmSegmentGeometry(a, b) {
  const coords = a.lng + ',' + a.lat + ';' + b.lng + ',' + b.lat;
  const url =
    'https://router.project-osrm.org/route/v1/driving/' +
    coords +
    '?overview=full&geometries=geojson&steps=false';
  try {
    const r = await fetch(url);
    const j = await r.json();
    if (j.code !== 'Ok' || !j.routes || !j.routes[0]) return null;
    return j.routes[0].geometry;
  } catch (e) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey || !anonKey) {
    return res.status(500).json({ error: 'Variáveis SUPABASE_* não configuradas no servidor' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sessão obrigatória' });
  }
  const jwt = authHeader.slice(7);

  const userClient = createClient(supabaseUrl, anonKey);
  const {
    data: { user },
    error: jwtErr,
  } = await userClient.auth.getUser(jwt);
  if (jwtErr || !user) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  const adminSb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error: pErr } = await adminSb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (pErr) {
    return res.status(500).json({ error: pErr.message });
  }
  if (!profile || profile.role !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'JSON inválido' });
    }
  }

  const routeId = body && body.routeId ? String(body.routeId) : '';
  if (!routeId) {
    return res.status(400).json({ error: 'routeId obrigatório' });
  }

  const { data: stops, error: stErr } = await adminSb
    .from('seller_route_stops')
    .select('establishment_id, stop_order')
    .eq('route_id', routeId)
    .order('stop_order');

  if (stErr) {
    return res.status(500).json({ error: stErr.message });
  }
  if (!stops || stops.length < 2) {
    return res.status(400).json({ error: 'Paradas insuficientes' });
  }

  const ids = stops.map(function (s) {
    return s.establishment_id;
  });
  const { data: ests, error: eErr } = await adminSb.from('establishments').select('id, lat, lng').in('id', ids);
  if (eErr) {
    return res.status(500).json({ error: eErr.message });
  }
  if (!ests || !ests.length) {
    return res.status(400).json({ error: 'Estabelecimentos não encontrados' });
  }

  const byId = {};
  ests.forEach(function (e) {
    byId[String(e.id)] = e;
  });

  const waypoints = [];
  for (let i = 0; i < stops.length; i++) {
    const e = byId[String(stops[i].establishment_id)];
    if (!e || e.lat == null || e.lng == null) {
      return res.status(400).json({ error: 'Coordenadas inválidas' });
    }
    waypoints.push({
      lat: parseFloat(e.lat),
      lng: parseFloat(e.lng),
    });
  }

  const geoms = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const g = await fetchOsrmSegmentGeometry(a, b);
    if (g && g.type === 'LineString' && g.coordinates && g.coordinates.length >= 2) {
      geoms.push(g);
    } else {
      geoms.push({
        type: 'LineString',
        coordinates: [
          [a.lng, a.lat],
          [b.lng, b.lat],
        ],
      });
    }
  }

  const merged = mergeLineStrings(geoms);
  if (!merged.coordinates || merged.coordinates.length < 2) {
    return res.status(500).json({ error: 'Geometria vazia' });
  }

  const { error: upErr } = await adminSb
    .from('seller_routes')
    .update({
      path_geojson: merged,
      updated_at: new Date().toISOString(),
    })
    .eq('id', routeId);

  if (upErr) {
    return res.status(500).json({ error: upErr.message });
  }

  return res.status(200).json({ ok: true, points: merged.coordinates.length });
};
