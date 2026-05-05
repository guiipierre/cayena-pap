-- Admin pode listar perfis (vendedores) para importação em massa e planejamento de rotas.
DROP POLICY IF EXISTS "profiles_select_admin_all" ON public.profiles;
CREATE POLICY "profiles_select_admin_all" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles ad WHERE ad.id = auth.uid() AND ad.role = 'admin')
);
