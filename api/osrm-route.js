/**
 * Proxy para OSRM (Open Source Routing Machine) — evita CORS no browser.
 * Documentação: https://project-osrm.org/
 *
 * Query: coords=lon1,lat1;lon2,lat2;... (ordem OSRM: longitude, latitude)
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const coords = req.query.coords;
  if (!coords || typeof coords !== 'string') {
    return res.status(400).json({ error: 'Parâmetro coords obrigatório' });
  }
  if (coords.length > 4096) {
    return res.status(400).json({ error: 'coords muito longo' });
  }
  const normalized = coords.replace(/\s/g, '');
  if (!/^[-0-9.,;]+$/.test(normalized)) {
    return res.status(400).json({ error: 'coords inválido' });
  }
  const url =
    'https://router.project-osrm.org/route/v1/driving/' +
    normalized +
    '?overview=full&geometries=geojson&steps=false';

  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    const j = await r.json();
    if (!r.ok) {
      return res.status(502).json({ error: 'OSRM indisponível', status: r.status });
    }
    return res.status(200).json(j);
  } catch (e) {
    return res.status(502).json({ error: 'Falha ao consultar rota' });
  }
};
