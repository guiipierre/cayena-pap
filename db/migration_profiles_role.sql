-- Rodar no SQL Editor do Supabase (uma vez), se já tiver criado profiles antes desta coluna
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'seller'
    CHECK (role IN ('seller', 'admin'));

COMMENT ON COLUMN public.profiles.role IS 'seller = vendedor; admin = pode criar usuários internos';

-- Promover o primeiro administrador (substitua o UUID pelo id em auth.users ou profiles)
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'COLE-UUID-AQUI';
