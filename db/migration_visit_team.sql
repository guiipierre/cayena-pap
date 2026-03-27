-- Equipe do vendedor (formulário de visita) + rastreio na visita.
-- Rodar uma vez no SQL Editor do Supabase.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS visit_team TEXT CHECK (visit_team IS NULL OR visit_team IN ('papo', 'farmer'));

COMMENT ON COLUMN public.profiles.visit_team IS 'papo = porta a porta; farmer = farmer — define o formulário de visita no app';

ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS visit_team TEXT NOT NULL DEFAULT 'papo' CHECK (visit_team IN ('papo', 'farmer'));

COMMENT ON COLUMN public.visits.visit_team IS 'Equipe no momento do registro (histórico)';
