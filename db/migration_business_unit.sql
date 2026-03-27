-- Business unit como ENUM PostgreSQL (somente PAP | SAX) — comportamento de “dropdown” no banco.
-- Compatível com colunas TEXT antigas ('pap'/'sax') e com visit_team legado. Rodar uma vez no Supabase SQL Editor.

DO $$ BEGIN
  CREATE TYPE public.business_unit_enum AS ENUM ('PAP', 'SAX');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE public.business_unit_enum IS 'PAP = porta a porta; SAX = formulário SAX';

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_unit TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'visit_team'
  ) THEN
    UPDATE public.profiles SET business_unit = CASE
      WHEN visit_team = 'farmer' THEN 'sax'
      WHEN visit_team = 'papo' THEN 'pap'
      ELSE COALESCE(business_unit, 'pap')
    END;
  END IF;
END $$;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS visit_team;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_business_unit_check;

UPDATE public.profiles SET business_unit = CASE lower(trim(business_unit))
  WHEN 'sax' THEN 'SAX'
  WHEN 'pap' THEN 'PAP'
  ELSE NULL
END
WHERE business_unit IS NOT NULL;

ALTER TABLE public.profiles ALTER COLUMN business_unit DROP DEFAULT;

ALTER TABLE public.profiles
  ALTER COLUMN business_unit TYPE public.business_unit_enum USING (
    CASE
      WHEN business_unit IS NULL THEN NULL::public.business_unit_enum
      WHEN trim(business_unit::text) = 'SAX' THEN 'SAX'::public.business_unit_enum
      ELSE 'PAP'::public.business_unit_enum
    END
  );

COMMENT ON COLUMN public.profiles.business_unit IS 'PAP ou SAX — definido no cadastro do vendedor';

-- -----------------------------------------------------------------------------
-- visits
-- -----------------------------------------------------------------------------
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS business_unit TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'visits' AND column_name = 'visit_team'
  ) THEN
    UPDATE public.visits SET business_unit = CASE
      WHEN visit_team = 'farmer' THEN 'sax'
      ELSE 'pap'
    END
    WHERE business_unit IS NULL;
  END IF;
END $$;

UPDATE public.visits SET business_unit = 'pap' WHERE business_unit IS NULL;

UPDATE public.visits SET business_unit = CASE lower(trim(business_unit))
  WHEN 'sax' THEN 'SAX'
  ELSE 'PAP'
END;

ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS visits_visit_team_check;
ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS visits_business_unit_check;

ALTER TABLE public.visits ALTER COLUMN business_unit DROP DEFAULT;

ALTER TABLE public.visits
  ALTER COLUMN business_unit TYPE public.business_unit_enum USING (
    CASE trim(business_unit::text)
      WHEN 'SAX' THEN 'SAX'::public.business_unit_enum
      ELSE 'PAP'::public.business_unit_enum
    END
  );

ALTER TABLE public.visits ALTER COLUMN business_unit SET DEFAULT 'PAP'::public.business_unit_enum;
ALTER TABLE public.visits ALTER COLUMN business_unit SET NOT NULL;

ALTER TABLE public.visits DROP COLUMN IF EXISTS visit_team;

COMMENT ON COLUMN public.visits.business_unit IS 'PAP ou SAX no momento do registro';
