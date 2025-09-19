-- Eliminar la función get_filtros_ventas_region_aliado_sku ya que usaremos get_filtros_ventas_region_gpo_tiponegocio
DROP FUNCTION IF EXISTS "public"."get_filtros_ventas_region_aliado_sku"();