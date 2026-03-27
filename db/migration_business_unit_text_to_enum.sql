-- =============================================================================
-- Você JÁ TEM business_unit como TEXT e quer virar ENUM (PAP | SAX) — “dropdown” no Postgres.
-- Rode UMA VEZ no SQL Editor do Supabase.
--
-- Antes: faça backup ou confira os dados (Table Editor → profiles / visits).
-- Depois: recarregue o Table Editor — a coluna deve aparecer com opções PAP/SAX.
-- =============================================================================

-- 1) Tipo enum (ignora se já existir)
DO $$ BEGIN
  CREATE TYPE public.business_unit_enum AS ENUM ('PAP', 'SAX');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE public.business_unit_enum IS 'Business unit fixo: PAP ou SAX';

-- 2) Remover CHECK em TEXT (nomes comuns; se der erro de outro nome, veja nota no final)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_business_unit_check;
ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS visits_business_unit_check;

-- 3) profiles — normalizar strings para PAP/SAX antes de trocar o tipo
UPDATE public.profiles
SET business_unit = CASE lower(trim(business_unit::text))
  WHEN 'sax' THEN 'SAX'
  WHEN 'pap' THEN 'PAP'
  ELSE NULL
END
WHERE business_unit IS NOT NULL;

-- DEFAULT em TEXT (ex.: 'pap') impede ALTER TYPE — remover e recolocar depois se precisar
ALTER TABLE public.profiles ALTER COLUMN business_unit DROP DEFAULT;

-- TEXT → ENUM (nullable no perfil)
ALTER TABLE public.profiles
  ALTER COLUMN business_unit TYPE public.business_unit_enum
  USING (
    CASE
      WHEN business_unit IS NULL THEN NULL::public.business_unit_enum
      WHEN trim(business_unit::text) = 'SAX' THEN 'SAX'::public.business_unit_enum
      ELSE 'PAP'::public.business_unit_enum
    END
  );

COMMENT ON COLUMN public.profiles.business_unit IS 'ENUM: PAP (porta a porta) ou SAX';

-- 4) visits — não pode ficar NULL após migração
UPDATE public.visits
SET business_unit = COALESCE(nullif(trim(business_unit::text), ''), 'pap')
WHERE business_unit IS NULL OR trim(business_unit::text) = '';

UPDATE public.visits
SET business_unit = CASE lower(trim(business_unit::text))
  WHEN 'sax' THEN 'SAX'
  ELSE 'PAP'
END;

ALTER TABLE public.visits ALTER COLUMN business_unit DROP DEFAULT;

ALTER TABLE public.visits
  ALTER COLUMN business_unit TYPE public.business_unit_enum
  USING (
    CASE trim(business_unit::text)
      WHEN 'SAX' THEN 'SAX'::public.business_unit_enum
      ELSE 'PAP'::public.business_unit_enum
    END
  );

ALTER TABLE public.visits ALTER COLUMN business_unit SET DEFAULT 'PAP'::public.business_unit_enum;
ALTER TABLE public.visits ALTER COLUMN business_unit SET NOT NULL;

COMMENT ON COLUMN public.visits.business_unit IS 'ENUM: PAP ou SAX no registro';

-- =============================================================================
-- Se o ALTER falhar com erro de constraint:
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--   WHERE conrelid = 'public.profiles'::regclass;
-- e apague o CHECK manualmente: ALTER TABLE public.profiles DROP CONSTRAINT "nome_aqui";
--
-- Se a coluna JÁ for business_unit_enum, não rode este script de novo.
-- =============================================================================
