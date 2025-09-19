-- Crear nueva función get_filtros_activacion_v2 que permite filtrar sucursales por aliado
CREATE OR REPLACE FUNCTION "public"."get_filtros_activacion_v2"("p_tipo" "text", "p_aliado" "text" DEFAULT NULL::"text") RETURNS TABLE("campo" "text", "valores" "text"[])
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
               WHERE tipo = p_tipo AND mes IS NOT NULL
             ) t
             ORDER BY orden_mes
           ) as valores
    UNION ALL
    -- Regiones
    SELECT 'region'::TEXT as campo, 
           ARRAY(SELECT DISTINCT region::TEXT FROM "HOMOLOGACIONACT" 
                 WHERE tipo = p_tipo AND region IS NOT NULL 
                 ORDER BY region::TEXT) as valores
    UNION ALL
    -- Estados
    SELECT 'estado'::TEXT as campo, 
           ARRAY(SELECT DISTINCT estado::TEXT FROM "HOMOLOGACIONACT" 
                 WHERE tipo = p_tipo AND estado IS NOT NULL 
                 ORDER BY estado::TEXT) as valores
    UNION ALL
    -- Aliados
    SELECT 'aliado'::TEXT as campo, 
           ARRAY(SELECT DISTINCT aliado::TEXT FROM "HOMOLOGACIONACT" 
                 WHERE tipo = p_tipo AND aliado IS NOT NULL 
                 ORDER BY aliado::TEXT) as valores
    UNION ALL
    -- Sucursales (filtradas por aliado si se especifica)
    SELECT 'sucursal'::TEXT as campo, 
           ARRAY(SELECT DISTINCT sucursal::TEXT FROM "HOMOLOGACIONACT" 
                 WHERE tipo = p_tipo 
                   AND sucursal IS NOT NULL 
                   AND (p_aliado IS NULL OR p_aliado = 'All' OR aliado = p_aliado)
                 ORDER BY sucursal::TEXT) as valores
    UNION ALL
    -- Descripción (departamento/grupo/marca) usando la columna 'descri'
    SELECT CASE 
             WHEN p_tipo = 'DEP' THEN 'departamento'
             WHEN p_tipo = 'GPO' THEN 'grupo'
             WHEN p_tipo = 'MAR' THEN 'marca'
             WHEN p_tipo = 'SKU' THEN 'sku'
           END::TEXT as campo,
           ARRAY(SELECT DISTINCT descri::TEXT 
                 FROM "HOMOLOGACIONACT" 
                 WHERE tipo = p_tipo AND descri IS NOT NULL 
                 ORDER BY descri::TEXT) as valores;
END;
$$;

-- Otorgar permisos a la nueva función
ALTER FUNCTION "public"."get_filtros_activacion_v2"("p_tipo" "text", "p_aliado" "text") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."get_filtros_activacion_v2"("p_tipo" "text", "p_aliado" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_activacion_v2"("p_tipo" "text", "p_aliado" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_activacion_v2"("p_tipo" "text", "p_aliado" "text") TO "service_role";