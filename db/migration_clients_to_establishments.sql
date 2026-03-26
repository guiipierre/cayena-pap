-- =============================================================================
-- Migração: schema antigo (clients + client_id) → establishments + assignments
--
-- Passo 1 — executar este bloco no SQL Editor (projeto que já tinha o script antigo):
-- =============================================================================

DROP POLICY IF EXISTS "reminders_all_own" ON public.reminders;
DROP POLICY IF EXISTS "visits_all_own" ON public.visits;
DROP POLICY IF EXISTS "clients_all_own" ON public.clients;

DROP TABLE IF EXISTS public.reminders CASCADE;
DROP TABLE IF EXISTS public.visits CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;

-- =============================================================================
-- Passo 2 — colar e executar o restante de db/supabase.sql a partir da linha
-- que cria public.establishments (CREATE TABLE ... establishments), até o fim,
-- para criar tabelas, função register_establishment, trigger e RLS.
-- Não é necessário recriar public.profiles se ela já existir.
-- =============================================================================
