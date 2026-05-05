/**
 * Lista vendedores (id, e-mail, nome) para importação em massa e resolução por planilha.
 * Requer SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY e sessão admin (Bearer).
 */
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
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

  const { data: sellers, error: sErr } = await adminSb
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'seller')
    .order('full_name');

  if (sErr) {
    return res.status(500).json({ error: sErr.message });
  }

  const emailById = new Map();
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data: pageData, error: uErr } = await adminSb.auth.admin.listUsers({ page, perPage });
    if (uErr) {
      return res.status(500).json({ error: uErr.message });
    }
    const users = (pageData && pageData.users) || [];
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      if (u && u.id && u.email) emailById.set(u.id, String(u.email).toLowerCase());
    }
    if (users.length < perPage) break;
    page += 1;
    if (page > 50) break;
  }

  const rows = (sellers || []).map(function (r) {
    return {
      id: r.id,
      full_name: (r.full_name && String(r.full_name).trim()) || '',
      email: emailById.get(r.id) || '',
    };
  });

  return res.status(200).json({ sellers: rows });
};
