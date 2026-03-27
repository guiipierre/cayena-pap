/**
 * Vercel Serverless: cria usuário vendedor (Auth + profile).
 * Variáveis no projeto Vercel:
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY  (nunca no front-end)
 */
const { createClient } = require('@supabase/supabase-js');

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
    return res.status(403).json({ error: 'Apenas administradores podem criar acessos' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'JSON inválido' });
    }
  }

  const email = body && body.email ? String(body.email).trim().toLowerCase() : '';
  const password = body && body.password != null ? String(body.password) : '';
  const full_name = body && body.full_name ? String(body.full_name).trim() : '';
  const phone = body && body.phone ? String(body.phone).trim() : '';
  const business_unit = body && body.business_unit === 'SAX' ? 'SAX' : 'PAP';

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }

  const { data: created, error: createErr } = await adminSb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name || email.split('@')[0] },
  });

  if (createErr) {
    return res.status(400).json({ error: createErr.message });
  }

  const uid = created.user.id;
  const updates = { role: 'seller', business_unit };
  if (full_name) updates.full_name = full_name;
  if (phone) updates.phone = phone;
  await adminSb.from('profiles').update(updates).eq('id', uid);

  return res.status(200).json({ ok: true, user_id: uid, email });
};
