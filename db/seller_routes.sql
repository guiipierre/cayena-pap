-- =============================================================================
-- Rotas planejadas por vendedor (admin desenha / ordena paradas no mapa)
-- Rode no SQL Editor do Supabase APÓS db/supabase.sql (ou merge no mesmo projeto).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabelas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seller_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Rota',
  notes TEXT,
  -- Opcional (fase 2): GeoJSON LineString se o admin desenhar trilha livre no mapa; se null, o app liga os pins em ordem com linha reta.
  path_geojson jsonb,
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_routes_seller ON public.seller_routes (seller_user_id);

CREATE TABLE IF NOT EXISTS public.seller_route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.seller_routes (id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments (id) ON DELETE CASCADE,
  stop_order INT NOT NULL CHECK (stop_order > 0),
  UNIQUE (route_id, establishment_id),
  UNIQUE (route_id, stop_order)
);

CREATE INDEX IF NOT EXISTS idx_route_stops_route ON public.seller_route_stops (route_id);

-- Só pode incluir cliente que já está atribuído ao vendedor da rota
CREATE OR REPLACE FUNCTION public.enforce_route_stop_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller uuid;
BEGIN
  SELECT seller_user_id INTO v_seller FROM public.seller_routes WHERE id = NEW.route_id;
  IF v_seller IS NULL THEN
    RAISE EXCEPTION 'route not found';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.establishment_assignments ea
    WHERE ea.establishment_id = NEW.establishment_id AND ea.user_id = v_seller
  ) THEN
    RAISE EXCEPTION 'establishment must be assigned to this seller';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_route_stops_assignment ON public.seller_route_stops;
CREATE TRIGGER tr_route_stops_assignment
  BEFORE INSERT OR UPDATE ON public.seller_route_stops
  FOR EACH ROW EXECUTE PROCEDURE public.enforce_route_stop_assignment();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.seller_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_route_stops ENABLE ROW LEVEL SECURITY;

-- Helper: admin?
CREATE OR REPLACE FUNCTION public.is_profile_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_profile_admin() TO authenticated;

-- Políticas: admins enxergam todos os perfis (lista de vendedores no planejador)
DROP POLICY IF EXISTS "profiles_select_admin_all" ON public.profiles;
CREATE POLICY "profiles_select_admin_all" ON public.profiles FOR SELECT USING (public.is_profile_admin());

-- Admin vê todos os estabelecimentos (mapa / rotas)
DROP POLICY IF EXISTS "est_select_admin" ON public.establishments;
CREATE POLICY "est_select_admin" ON public.establishments FOR SELECT USING (public.is_profile_admin());

-- Admin vê todos os vínculos vendedor–cliente
DROP POLICY IF EXISTS "ea_select_admin" ON public.establishment_assignments;
CREATE POLICY "ea_select_admin" ON public.establishment_assignments FOR SELECT USING (public.is_profile_admin());

-- Rotas
DROP POLICY IF EXISTS "seller_routes_select" ON public.seller_routes;
CREATE POLICY "seller_routes_select" ON public.seller_routes FOR SELECT USING (
  seller_user_id = auth.uid() OR public.is_profile_admin()
);

DROP POLICY IF EXISTS "seller_routes_insert_admin" ON public.seller_routes;
CREATE POLICY "seller_routes_insert_admin" ON public.seller_routes FOR INSERT WITH CHECK (
  public.is_profile_admin() AND created_by = auth.uid()
);

DROP POLICY IF EXISTS "seller_routes_update_admin" ON public.seller_routes;
CREATE POLICY "seller_routes_update_admin" ON public.seller_routes FOR UPDATE USING (public.is_profile_admin()) WITH CHECK (public.is_profile_admin());

DROP POLICY IF EXISTS "seller_routes_delete_admin" ON public.seller_routes;
CREATE POLICY "seller_routes_delete_admin" ON public.seller_routes FOR DELETE USING (public.is_profile_admin());

-- Paradas
DROP POLICY IF EXISTS "seller_route_stops_select" ON public.seller_route_stops;
CREATE POLICY "seller_route_stops_select" ON public.seller_route_stops FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.seller_routes r
    WHERE r.id = seller_route_stops.route_id
      AND (r.seller_user_id = auth.uid() OR public.is_profile_admin())
  )
);

DROP POLICY IF EXISTS "seller_route_stops_insert_admin" ON public.seller_route_stops;
CREATE POLICY "seller_route_stops_insert_admin" ON public.seller_route_stops FOR INSERT WITH CHECK (public.is_profile_admin());

DROP POLICY IF EXISTS "seller_route_stops_update_admin" ON public.seller_route_stops;
CREATE POLICY "seller_route_stops_update_admin" ON public.seller_route_stops FOR UPDATE USING (public.is_profile_admin()) WITH CHECK (public.is_profile_admin());

DROP POLICY IF EXISTS "seller_route_stops_delete_admin" ON public.seller_route_stops;
CREATE POLICY "seller_route_stops_delete_admin" ON public.seller_route_stops FOR DELETE USING (public.is_profile_admin());
