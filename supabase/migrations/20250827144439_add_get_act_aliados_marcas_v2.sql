-- Create new function get_act_aliados_marcas_v2 adding estado and fixing aggregations
CREATE OR REPLACE FUNCTION "public"."get_act_aliados_marcas_v2"(
  "p_mes" "text" DEFAULT NULL::"text",
  "p_region" "text" DEFAULT NULL::"text",
  "p_estado" "text" DEFAULT NULL::"text",
  "p_aliado" "text" DEFAULT NULL::"text",
  "p_sucursal" "text" DEFAULT NULL::"text",
  "p_page" integer DEFAULT 1,
  "p_page_size" integer DEFAULT 100,
  "p_sort_column" "text" DEFAULT 'sucursal'::"text",
  "p_sort_direction" "text" DEFAULT 'ASC'::"text"
)
RETURNS TABLE(
  "sucursal" character varying,
  "marca" character varying,
  "estado" character varying,
  "mes" character varying,
  "a2024" integer,
  "c2024" integer,
  "porcentaje_2024" numeric,
  "a2025" integer,
  "c2025" integer,
  "porcentaje_2025" numeric,
  "total_count" bigint
)
LANGUAGE "plpgsql"
AS $$
DECLARE
  total_records BIGINT;
  offset_val INTEGER;
  order_clause TEXT;
BEGIN
  -- Total de registros (sin paginar)
  SELECT COUNT(*) INTO total_records
  FROM "HOMOLOGACIONACT" h
  WHERE h.tipo = 'MAR'
    AND (p_mes IS NULL OR p_mes = 'All' OR h.mes = p_mes)
    AND (p_region IS NULL OR p_region = 'All' OR h.region = p_region)
    AND (p_estado IS NULL OR p_estado = 'All' OR h.estado = p_estado)
    AND (p_aliado IS NULL OR p_aliado = 'All' OR h.aliado = p_aliado)
    AND (p_sucursal IS NULL OR p_sucursal = 'All' OR h.sucursal = p_sucursal);

  -- Paginación
  offset_val := (p_page - 1) * p_page_size;

  -- Ordenamiento (usar columnas reales pivotadas)
  order_clause := 
    CASE p_sort_column
      WHEN 'sucursal' THEN 'h.sucursal ' || p_sort_direction
      WHEN 'marca' THEN 'h.descri ' || p_sort_direction
      WHEN 'estado' THEN 'h.estado ' || p_sort_direction
      WHEN 'mes' THEN 'CAST(h.mesid AS INTEGER) ' || p_sort_direction
      WHEN 'a2024' THEN 'SUM(h.a2024) ' || p_sort_direction
      WHEN 'c2024' THEN 'SUM(h.c2024) ' || p_sort_direction
      WHEN 'a2025' THEN 'SUM(h.a2025) ' || p_sort_direction
      WHEN 'c2025' THEN 'SUM(h.c2025) ' || p_sort_direction
      WHEN 'porcentaje_2024' THEN 'CASE WHEN SUM(h.c2024) = 0 THEN 0 ELSE ROUND((SUM(h.a2024) * 100.0) / NULLIF(SUM(h.c2024), 0), 2) END ' || p_sort_direction
      WHEN 'porcentaje_2025' THEN 'CASE WHEN SUM(h.c2025) = 0 THEN 0 ELSE ROUND((SUM(h.a2025) * 100.0) / NULLIF(SUM(h.c2025), 0), 2) END ' || p_sort_direction
      ELSE 'h.sucursal ' || p_sort_direction
    END || ', h.sucursal ASC, h.descri ASC';

  -- Consulta principal con agregaciones correctas
  RETURN QUERY EXECUTE '
    WITH datos_agrupados AS (
      SELECT 
        h.sucursal,
        h.descri AS marca,
        h.estado,
        h.mes,
        CAST(SUM(h.a2024) AS INTEGER) AS a2024,
        CAST(SUM(h.c2024) AS INTEGER) AS c2024,
        CASE 
          WHEN SUM(h.c2024) = 0 THEN 0 
          ELSE ROUND((SUM(h.a2024) * 100.0) / NULLIF(SUM(h.c2024), 0), 2) 
        END AS porcentaje_2024,
        CAST(SUM(h.a2025) AS INTEGER) AS a2025,
        CAST(SUM(h.c2025) AS INTEGER) AS c2025,
        CASE 
          WHEN SUM(h.c2025) = 0 THEN 0 
          ELSE ROUND((SUM(h.a2025) * 100.0) / NULLIF(SUM(h.c2025), 0), 2) 
        END AS porcentaje_2025
      FROM "HOMOLOGACIONACT" h
      WHERE h.tipo = ''MAR''
        AND ($1 IS NULL OR $1 = ''All'' OR h.mes = $1)
        AND ($2 IS NULL OR $2 = ''All'' OR h.region = $2)
        AND ($3 IS NULL OR $3 = ''All'' OR h.estado = $3)
        AND ($4 IS NULL OR $4 = ''All'' OR h.aliado = $4)
        AND ($5 IS NULL OR $5 = ''All'' OR h.sucursal = $5)
      GROUP BY h.sucursal, h.descri, h.estado, h.mes, h.mesid
      ORDER BY ' || order_clause || '
      LIMIT ' || p_page_size || ' OFFSET ' || offset_val || '
    )
    SELECT 
      sucursal,
      marca,
      estado,
      mes,
      a2024,
      c2024,
      porcentaje_2024,
      a2025,
      c2025,
      porcentaje_2025,
      ' || total_records || '::bigint AS total_count
    FROM datos_agrupados'
  USING p_mes, p_region, p_estado, p_aliado, p_sucursal;
END;
$$;

-- Permisos
GRANT ALL ON FUNCTION "public"."get_act_aliados_marcas_v2"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_act_aliados_marcas_v2"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_act_aliados_marcas_v2"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "service_role";
