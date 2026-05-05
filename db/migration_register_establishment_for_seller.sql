-- Importação em massa (admin): cadastra/atualiza estabelecimento e atribui a um vendedor.
--
-- Se o projeto já usa colunas comerciais extras e RPCs com 27 parâmetros, rode apenas:
--   db/migration_establishment_commercial_fields.sql
-- O bloco abaixo é a versão antiga (17 parâmetros) e sobrescreveria as funções novas se executado depois.

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
  p_obs text
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
    v_admin,
    v_admin
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
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, double precision, double precision, text
) TO authenticated;
