-- =============================================================================
-- Promover UM usuário a administrador
-- Rode no Supabase: menu SQL → New query → Cole este arquivo → Run
-- =============================================================================
--
-- PASSO 1: Descubra o UUID do seu usuário
--   Supabase → Authentication → Users → clique no seu e-mail → copie "User UID"
--   (é um texto tipo: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
--
-- PASSO 2: Substitua COLE_SEU_UUID abaixo pelo UUID (mantenha as aspas simples)
--
-- PASSO 3: Execute a query (Run). Próximo login no app já mostra "Administração".
-- =============================================================================

UPDATE public.profiles
SET
  role = 'admin',
  updated_at = now()
WHERE id = 'COLE_SEU_UUID'::uuid;

-- Opcional: confira se atualizou (troque pelo mesmo UUID)
-- SELECT id, full_name, role FROM public.profiles WHERE id = 'COLE_SEU_UUID'::uuid;
