-- Visita SAX: campos do formulário comercial + URLs de fotos (Supabase Storage)
-- Rode no SQL Editor após db/supabase.sql (ou merge no projeto).

ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS sax_sold TEXT CHECK (sax_sold IS NULL OR sax_sold IN ('sim', 'nao')),
  ADD COLUMN IF NOT EXISTS sax_sale_reasons JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sax_no_sale_reasons JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sax_decisor_name TEXT,
  ADD COLUMN IF NOT EXISTS sax_decisor_contact TEXT,
  ADD COLUMN IF NOT EXISTS sax_best_contact_time TEXT,
  ADD COLUMN IF NOT EXISTS sax_photo_fachada_url TEXT,
  ADD COLUMN IF NOT EXISTS sax_photo_cardapio_url TEXT,
  ADD COLUMN IF NOT EXISTS sax_obs_extra TEXT;

COMMENT ON COLUMN public.visits.sax_photo_fachada_url IS 'URL pública (Storage) — arquivo não fica na linha; só o texto da URL.';
COMMENT ON COLUMN public.visits.sax_photo_cardapio_url IS 'URL pública (Storage), opcional.';

-- Bucket de fotos de visita (leve no Postgres: só URLs; arquivos ficam no Storage)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visit-photos',
  'visit-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "visit_photos_public_read" ON storage.objects;
CREATE POLICY "visit_photos_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'visit-photos');

DROP POLICY IF EXISTS "visit_photos_authenticated_insert" ON storage.objects;
CREATE POLICY "visit_photos_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'visit-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "visit_photos_owner_update" ON storage.objects;
CREATE POLICY "visit_photos_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'visit-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'visit-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "visit_photos_owner_delete" ON storage.objects;
CREATE POLICY "visit_photos_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'visit-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );
