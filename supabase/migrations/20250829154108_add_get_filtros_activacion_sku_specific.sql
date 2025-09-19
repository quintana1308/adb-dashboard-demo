-- Crear nueva función get_filtros_activacion_sku específica para el componente SKU
-- Esta función maneja filtros dependientes aliado-sucursal y excluye SKUs de la lista de filtros
CREATE OR REPLACE FUNCTION "public"."get_filtros_activacion_sku"("p_aliado" "text" DEFAULT NULL::"text") RETURNS TABLE("campo" "text", "valores" "text"[])
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
    -- Meses ordenados por orden cronológico
    SELECT 'mes'::TEXT as campo, 
           ARRAY(
             SELECT mes::TEXT 
             FROM (
               SELECT DISTINCT mes,
                 CASE mes
                   WHEN 'Enero' THEN 1
                   WHEN 'Febrero' THEN 2
                   WHEN 'Marzo' THEN 3
                   WHEN 'Abril' THEN 4
                   WHEN 'Mayo' THEN 5
                   WHEN 'Junio' THEN 6
                   WHEN 'Julio' THEN 7
                   WHEN 'Agosto' THEN 8
                   WHEN 'Septiembre' THEN 9
                   WHEN 'Octubre' THEN 10
                   WHEN 'Noviembre' THEN 11
                   WHEN 'Diciembre' THEN 12
                   ELSE 13
                 END as orden_mes
               FROM "HOMOLOGACIONACT" 
               WHERE tipo = 'SKU' AND mes IS NOT NULL
             ) t
             ORDER BY orden_mes
           ) as valores
    UNION ALL
    -- Regiones
    SELECT 'region'::TEXT as campo, 
           ARRAY(SELECT DISTINCT region::TEXT FROM "HOMOLOGACIONACT" 
                 WHERE tipo = 'SKU' AND region IS NOT NULL 
                 ORDER BY region::TEXT) as valores
    UNION ALL
    -- Estados
    SELECT 'estado'::TEXT as campo, 
           ARRAY(SELECT DISTINCT estado::TEXT FROM "HOMOLOGACIONACT" 
                 WHERE tipo = 'SKU' AND estado IS NOT NULL 
                 ORDER BY estado::TEXT) as valores
    UNION ALL
    -- Aliados
    SELECT 'aliado'::TEXT as campo, 
           ARRAY(SELECT DISTINCT aliado::TEXT FROM "HOMOLOGACIONACT" 
                 WHERE tipo = 'SKU' AND aliado IS NOT NULL 
                 ORDER BY aliado::TEXT) as valores
    UNION ALL
    -- Sucursales (filtradas por aliado si se especifica)
    SELECT 'sucursal'::TEXT as campo, 
           ARRAY(SELECT DISTINCT sucursal::TEXT FROM "HOMOLOGACIONACT" 
                 WHERE tipo = 'SKU' 
                   AND sucursal IS NOT NULL 
                   AND (p_aliado IS NULL OR p_aliado = 'All' OR aliado = p_aliado)
                 ORDER BY sucursal::TEXT) as valores;
    -- NOTA: No incluimos SKUs en la lista ya que se usa un input de texto, no un select
END;
$$;

-- Otorgar permisos a la nueva función
ALTER FUNCTION "public"."get_filtros_activacion_sku"("p_aliado" "text") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."get_filtros_activacion_sku"("p_aliado" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_activacion_sku"("p_aliado" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_activacion_sku"("p_aliado" "text") TO "service_role";