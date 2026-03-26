-- Rode no SQL Editor se o projeto já existia antes da política abaixo.
-- Permite ao vendedor excluir apenas seller_routes onde ele é o dono.

DROP POLICY IF EXISTS "seller_routes_delete_owner" ON public.seller_routes;
CREATE POLICY "seller_routes_delete_owner" ON public.seller_routes FOR DELETE USING (seller_user_id = auth.uid());
