-- =============================================================================
-- Cayena PAP — rodar no SQL Editor do Supabase (projeto → SQL → New query)
-- Modelo: 1 estabelecimento por CNPJ (cnpj_normalized); vários vendedores via
-- establishment_assignments; created_by / updated_by no estabelecimento.
-- Depois: Authentication → Providers → Email (habilitar email/senha)
-- =============================================================================

-- Perfil ligado ao usuário do Auth (auth.users é gerido pelo Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('seller', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Um registro por CNPJ real (chave de negócio: cnpj_normalized, só dígitos)
CREATE TABLE IF NOT EXISTS public.establishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj_normalized TEXT NOT NULL,
  cnpj_display TEXT,
  nome TEXT NOT NULL,
  tipo TEXT,
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'reat')),

  tel TEXT,
  email_cliente TEXT,

  rua TEXT,
  num TEXT,
  comp TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,

  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  obs TEXT,

  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT establishments_cnpj_normalized_key UNIQUE (cnpj_normalized)
);

CREATE INDEX IF NOT EXISTS idx_establishments_cnpj ON public.establishments (cnpj_normalized);
CREATE INDEX IF NOT EXISTS idx_establishments_updated ON public.establishments (updated_at DESC);

-- Vendedores ligados ao estabelecimento (N:N)
CREATE TABLE IF NOT EXISTS public.establishment_assignments (
  establishment_id UUID NOT NULL REFERENCES public.establishments (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (establishment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ea_user ON public.establishment_assignments (user_id);

CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  visit_date DATE NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('conv', 'nao', 'reag', 'aus')),

  rep_name TEXT,
  obs TEXT,
  cel_comprador TEXT,
  nome_comprador TEXT,
  tam_estab TEXT,
  tipo_estab_chip TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visits_establishment ON public.visits (establishment_id);
CREATE INDEX IF NOT EXISTS idx_visits_user ON public.visits (user_id);

CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments (id) ON DELETE CASCADE,

  remind_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'cancelled')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON public.reminders (user_id, remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_establishment ON public.reminders (establishment_id);

-- -----------------------------------------------------------------------------
-- Cadastro / merge por CNPJ: só via RPC (SECURITY DEFINER), evita vínculo arbitrário
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_establishment(
  p_cnpj_normalized text,
  p_cnpj_display text,
  p_nome text,
  p_tipo text,
  p_status text,
  p_tel text,
  p_email_cliente text,
  p_rua text,
  p_num text,
  p_comp text,
  p_bairro text,
  p_cidade text,
  p_estado text,
  p_cep text,
  p_lat double precision,
  p_lng double precision,
  p_obs text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_cnpj_normalized IS NULL OR length(trim(p_cnpj_normalized)) < 14 THEN
    RAISE EXCEPTION 'invalid cnpj';
  END IF;

  INSERT INTO public.establishments (
    cnpj_normalized,
    cnpj_display,
    nome,
    tipo,
    status,
    tel,
    email_cliente,
    rua,
    num,
    comp,
    bairro,
    cidade,
    estado,
    cep,
    lat,
    lng,
    obs,
    created_by,
    updated_by
  )
  VALUES (
    trim(p_cnpj_normalized),
    nullif(trim(p_cnpj_display), ''),
    trim(p_nome),
    nullif(trim(p_tipo), ''),
    coalesce(nullif(trim(p_status), ''), 'novo'),
    nullif(trim(p_tel), ''),
    nullif(trim(p_email_cliente), ''),
    nullif(trim(p_rua), ''),
    nullif(trim(p_num), ''),
    nullif(trim(p_comp), ''),
    nullif(trim(p_bairro), ''),
    nullif(trim(p_cidade), ''),
    coalesce(nullif(trim(p_estado), ''), 'SP'),
    nullif(trim(p_cep), ''),
    p_lat,
    p_lng,
    nullif(trim(p_obs), ''),
    v_uid,
    v_uid
  )
  ON CONFLICT (cnpj_normalized) DO UPDATE SET
    cnpj_display = coalesce(excluded.cnpj_display, establishments.cnpj_display),
    nome = excluded.nome,
    tipo = excluded.tipo,
    tel = excluded.tel,
    email_cliente = excluded.email_cliente,
    rua = excluded.rua,
    num = excluded.num,
    comp = excluded.comp,
    bairro = excluded.bairro,
    cidade = excluded.cidade,
    estado = excluded.estado,
    cep = excluded.cep,
    lat = excluded.lat,
    lng = excluded.lng,
    obs = excluded.obs,
    updated_by = v_uid,
    updated_at = now()
  RETURNING id INTO v_id;

  INSERT INTO public.establishment_assignments (establishment_id, user_id)
  VALUES (v_id, v_uid)
  ON CONFLICT (establishment_id, user_id) DO NOTHING;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_establishment(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, double precision, double precision, text
) TO authenticated;

-- -----------------------------------------------------------------------------
-- Novo usuário → linha em profiles
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RLS (DROP POLICY IF EXISTS permite rodar o script de novo sem erro 42710)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "est_select_assigned" ON public.establishments;
DROP POLICY IF EXISTS "ea_select_own" ON public.establishment_assignments;
DROP POLICY IF EXISTS "visits_select_assigned" ON public.visits;
DROP POLICY IF EXISTS "visits_insert_assigned" ON public.visits;
DROP POLICY IF EXISTS "visits_update_own" ON public.visits;
DROP POLICY IF EXISTS "visits_delete_own" ON public.visits;
DROP POLICY IF EXISTS "reminders_select_assigned" ON public.reminders;
DROP POLICY IF EXISTS "reminders_insert_assigned" ON public.reminders;
DROP POLICY IF EXISTS "reminders_update_own" ON public.reminders;
DROP POLICY IF EXISTS "reminders_delete_own" ON public.reminders;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "est_select_assigned" ON public.establishments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.establishment_assignments ea
    WHERE ea.establishment_id = establishments.id AND ea.user_id = auth.uid()
  )
);

CREATE POLICY "ea_select_own" ON public.establishment_assignments FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "visits_select_assigned" ON public.visits FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.establishment_assignments ea
    WHERE ea.establishment_id = visits.establishment_id AND ea.user_id = auth.uid()
  )
);

CREATE POLICY "visits_insert_assigned" ON public.visits FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.establishment_assignments ea
    WHERE ea.establishment_id = visits.establishment_id AND ea.user_id = auth.uid()
  )
);

CREATE POLICY "visits_update_own" ON public.visits FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "visits_delete_own" ON public.visits FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "reminders_select_assigned" ON public.reminders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.establishment_assignments ea
    WHERE ea.establishment_id = reminders.establishment_id AND ea.user_id = auth.uid()
  )
);

CREATE POLICY "reminders_insert_assigned" ON public.reminders FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.establishment_assignments ea
    WHERE ea.establishment_id = reminders.establishment_id AND ea.user_id = auth.uid()
  )
);

CREATE POLICY "reminders_update_own" ON public.reminders FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "reminders_delete_own" ON public.reminders FOR DELETE USING (user_id = auth.uid());
