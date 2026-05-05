-- Campos comerciais extras + RPCs de cadastro atualizadas.
-- Rode no SQL Editor. Depois disso, substitua também register_establishment* no projeto se usar dump antigo.

ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS ultimo_vendedor_nome TEXT,
  ADD COLUMN IF NOT EXISTS tipo_cozinha TEXT,
  ADD COLUMN IF NOT EXISTS recencia_cliente TEXT,
  ADD COLUMN IF NOT EXISTS limite_aprovado TEXT,
  ADD COLUMN IF NOT EXISTS proprietario_nome TEXT,
  ADD COLUMN IF NOT EXISTS prazo_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS ultimo_pedido_info TEXT,
  ADD COLUMN IF NOT EXISTS tipo_do_estabelecimento TEXT,
  ADD COLUMN IF NOT EXISTS origem_lead TEXT;

DROP FUNCTION IF EXISTS public.register_establishment(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, double precision, double precision, text
);
DROP FUNCTION IF EXISTS public.register_establishment_for_seller(
  uuid,
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, double precision, double precision, text
);

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
  p_obs text,
  p_ultimo_vendedor_nome text DEFAULT NULL,
  p_tipo_cozinha text DEFAULT NULL,
  p_recencia_cliente text DEFAULT NULL,
  p_limite_aprovado text DEFAULT NULL,
  p_proprietario_nome text DEFAULT NULL,
  p_prazo_pagamento text DEFAULT NULL,
  p_metodo_pagamento text DEFAULT NULL,
  p_ultimo_pedido_info text DEFAULT NULL,
  p_tipo_do_estabelecimento text DEFAULT NULL,
  p_origem_lead text DEFAULT NULL
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
    cnpj_normalized, cnpj_display, nome, tipo, status, tel, email_cliente,
    rua, num, comp, bairro, cidade, estado, cep, lat, lng, obs,
    ultimo_vendedor_nome, tipo_cozinha, recencia_cliente, limite_aprovado, proprietario_nome,
    prazo_pagamento, metodo_pagamento, ultimo_pedido_info, tipo_do_estabelecimento, origem_lead,
    created_by, updated_by
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
    p_lat, p_lng,
    nullif(trim(p_obs), ''),
    nullif(trim(p_ultimo_vendedor_nome), ''),
    nullif(trim(p_tipo_cozinha), ''),
    nullif(trim(p_recencia_cliente), ''),
    nullif(trim(p_limite_aprovado), ''),
    nullif(trim(p_proprietario_nome), ''),
    nullif(trim(p_prazo_pagamento), ''),
    nullif(trim(p_metodo_pagamento), ''),
    nullif(trim(p_ultimo_pedido_info), ''),
    nullif(trim(p_tipo_do_estabelecimento), ''),
    nullif(trim(p_origem_lead), ''),
    v_uid, v_uid
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
    ultimo_vendedor_nome = excluded.ultimo_vendedor_nome,
    tipo_cozinha = excluded.tipo_cozinha,
    recencia_cliente = excluded.recencia_cliente,
    limite_aprovado = excluded.limite_aprovado,
    proprietario_nome = excluded.proprietario_nome,
    prazo_pagamento = excluded.prazo_pagamento,
    metodo_pagamento = excluded.metodo_pagamento,
    ultimo_pedido_info = excluded.ultimo_pedido_info,
    tipo_do_estabelecimento = excluded.tipo_do_estabelecimento,
    origem_lead = excluded.origem_lead,
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
  text, text, text, text, text, text, text, text, text, text, text, text, text, text,
  double precision, double precision, text,
  text, text, text, text, text, text, text, text, text, text
) TO authenticated;

CREATE OR REPLACE FUNCTION public.register_establishment_for_seller(
  p_seller_user_id uuid,
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
  p_obs text,
  p_ultimo_vendedor_nome text DEFAULT NULL,
  p_tipo_cozinha text DEFAULT NULL,
  p_recencia_cliente text DEFAULT NULL,
  p_limite_aprovado text DEFAULT NULL,
  p_proprietario_nome text DEFAULT NULL,
  p_prazo_pagamento text DEFAULT NULL,
  p_metodo_pagamento text DEFAULT NULL,
  p_ultimo_pedido_info text DEFAULT NULL,
  p_tipo_do_estabelecimento text DEFAULT NULL,
  p_origem_lead text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_admin uuid := auth.uid();
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_admin AND role = 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_seller_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_seller_user_id AND role = 'seller'
  ) THEN
    RAISE EXCEPTION 'invalid seller';
  END IF;
  IF p_cnpj_normalized IS NULL OR length(trim(p_cnpj_normalized)) < 14 THEN
    RAISE EXCEPTION 'invalid cnpj';
  END IF;

  INSERT INTO public.establishments (
    cnpj_normalized, cnpj_display, nome, tipo, status, tel, email_cliente,
    rua, num, comp, bairro, cidade, estado, cep, lat, lng, obs,
    ultimo_vendedor_nome, tipo_cozinha, recencia_cliente, limite_aprovado, proprietario_nome,
    prazo_pagamento, metodo_pagamento, ultimo_pedido_info, tipo_do_estabelecimento, origem_lead,
    created_by, updated_by
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
    p_lat, p_lng,
    nullif(trim(p_obs), ''),
    nullif(trim(p_ultimo_vendedor_nome), ''),
    nullif(trim(p_tipo_cozinha), ''),
    nullif(trim(p_recencia_cliente), ''),
    nullif(trim(p_limite_aprovado), ''),
    nullif(trim(p_proprietario_nome), ''),
    nullif(trim(p_prazo_pagamento), ''),
    nullif(trim(p_metodo_pagamento), ''),
    nullif(trim(p_ultimo_pedido_info), ''),
    nullif(trim(p_tipo_do_estabelecimento), ''),
    nullif(trim(p_origem_lead), ''),
    v_admin, v_admin
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
    ultimo_vendedor_nome = excluded.ultimo_vendedor_nome,
    tipo_cozinha = excluded.tipo_cozinha,
    recencia_cliente = excluded.recencia_cliente,
    limite_aprovado = excluded.limite_aprovado,
    proprietario_nome = excluded.proprietario_nome,
    prazo_pagamento = excluded.prazo_pagamento,
    metodo_pagamento = excluded.metodo_pagamento,
    ultimo_pedido_info = excluded.ultimo_pedido_info,
    tipo_do_estabelecimento = excluded.tipo_do_estabelecimento,
    origem_lead = excluded.origem_lead,
    updated_by = v_admin,
    updated_at = now()
  RETURNING id INTO v_id;

  INSERT INTO public.establishment_assignments (establishment_id, user_id)
  VALUES (v_id, p_seller_user_id)
  ON CONFLICT (establishment_id, user_id) DO NOTHING;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_establishment_for_seller(
  uuid,
  text, text, text, text, text, text, text, text, text, text, text, text, text, text,
  double precision, double precision, text,
  text, text, text, text, text, text, text, text, text, text
) TO authenticated;
