-- Crear función para obtener SKUs filtrados por sucursal
-- Esta función reemplaza el input de texto por un select dinámico
CREATE OR REPLACE FUNCTION "public"."get_skus_by_sucursal"("p_sucursal" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text") RETURNS TABLE("sku" character varying)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
  RETURN QUERY
    SELECT DISTINCT h.descri as sku
    FROM "HOMOLOGACIONACT" h
    WHERE h.tipo = 'SKU' 
      AND h.descri IS NOT NULL
      AND (p_sucursal IS NULL OR p_sucursal = 'All' OR h.sucursal = p_sucursal)
      AND (p_aliado IS NULL OR p_aliado = 'All' OR h.aliado = p_aliado)
    ORDER BY h.descri;
END;
$_$;

-- Actualizar función get_filtros_activacion_sku para incluir SKUs dinámicos
CREATE OR REPLACE FUNCTION "public"."get_filtros_activacion_sku_v2"("p_aliado" "text" DEFAULT NULL::"text", "p_sucursal" "text" DEFAULT NULL::"text") RETURNS TABLE("campo" "text", "valores" "text"[])
    LANGUAGE "plpgsql"
    AS $_$
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
                 ORDER BY sucursal::TEXT) as valores
    UNION ALL
    -- SKUs (filtrados por sucursal y aliado si se especifican)
    SELECT 'sku'::TEXT as campo, 
           ARRAY(SELECT DISTINCT descri::TEXT FROM "HOMOLOGACIONACT" 
                 WHERE tipo = 'SKU' 
                   AND descri IS NOT NULL 
                   AND (p_sucursal IS NULL OR p_sucursal = 'All' OR sucursal = p_sucursal)
                   AND (p_aliado IS NULL OR p_aliado = 'All' OR aliado = p_aliado)
                 ORDER BY descri::TEXT) as valores;
END;
$_$;