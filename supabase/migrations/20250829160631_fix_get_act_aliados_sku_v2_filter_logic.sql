-- Corregir la lógica del filtro SKU en get_act_aliados_sku_v2
-- El problema era que la condición OR permitía mostrar todos los productos cuando debería filtrar
CREATE OR REPLACE FUNCTION "public"."get_act_aliados_sku_v2"("p_mes" "text" DEFAULT NULL::"text", "p_region" "text" DEFAULT NULL::"text", "p_estado" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text", "p_sucursal" "text" DEFAULT NULL::"text", "p_sku" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 50, "p_sort_column" "text" DEFAULT 'sucursal'::"text", "p_sort_direction" "text" DEFAULT 'ASC'::"text") RETURNS TABLE("sucursal" character varying, "estado" character varying, "sku" character varying, "mes" character varying, "a2024" integer, "c2024" integer, "porcentaje_2024" numeric, "a2025" integer, "c2025" integer, "porcentaje_2025" numeric, "total_count" bigint, "total_a2024" bigint, "total_c2024" bigint, "total_a2025" bigint, "total_c2025" bigint, "total_porcentaje_2024" numeric, "total_porcentaje_2025" numeric)
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  offset_val INTEGER;
  sort_clause TEXT;
  total_records BIGINT;
  sum_a2024 BIGINT;
  sum_c2024 BIGINT;
  sum_a2025 BIGINT;
  sum_c2025 BIGINT;
  avg_prom2024 NUMERIC;
  avg_prom2025 NUMERIC;
BEGIN
  offset_val := (p_page - 1) * p_page_size;
  
  sort_clause := CASE 
    WHEN p_sort_column = 'sucursal' THEN 'h.sucursal'
    WHEN p_sort_column = 'estado' THEN 'h.estado'
    WHEN p_sort_column = 'sku' THEN 'h.descri'
    WHEN p_sort_column = 'mes' THEN 'h.mesid'
    WHEN p_sort_column = 'a2024' THEN 'h.a2024'
    WHEN p_sort_column = 'c2024' THEN 'h.c2024'
    WHEN p_sort_column = 'porcentaje_2024' THEN 'h.prom2024'
    WHEN p_sort_column = 'a2025' THEN 'h.a2025'
    WHEN p_sort_column = 'c2025' THEN 'h.c2025'
    WHEN p_sort_column = 'porcentaje_2025' THEN 'h.prom2025'
    ELSE 'h.sucursal'
  END || ' ' || CASE WHEN UPPER(p_sort_direction) = 'DESC' THEN 'DESC' ELSE 'ASC' END;

  -- Calcular totales y conteo con lógica de filtro SKU corregida
  SELECT 
    COUNT(*),
    SUM(h.a2024),
    SUM(h.c2024),
    SUM(h.a2025),
    SUM(h.c2025),
    CASE WHEN SUM(h.c2024) > 0 THEN ROUND((SUM(h.a2024)::NUMERIC / SUM(h.c2024)::NUMERIC * 100), 2) ELSE 0 END,
    CASE WHEN SUM(h.c2025) > 0 THEN ROUND((SUM(h.a2025)::NUMERIC / SUM(h.c2025)::NUMERIC * 100), 2) ELSE 0 END
  INTO total_records, sum_a2024, sum_c2024, sum_a2025, sum_c2025, avg_prom2024, avg_prom2025
  FROM "HOMOLOGACIONACT" h
  WHERE h.tipo = 'SKU'
    AND (p_mes IS NULL OR p_mes = 'All' OR h.mes = p_mes)
    AND (p_region IS NULL OR p_region = 'All' OR h.region = p_region)
    AND (p_estado IS NULL OR p_estado = 'All' OR h.estado = p_estado)
    AND (p_aliado IS NULL OR p_aliado = 'All' OR h.aliado = p_aliado)
    AND (p_sucursal IS NULL OR p_sucursal = 'All' OR h.sucursal = p_sucursal)
    AND (p_sku IS NULL OR p_sku = 'All' OR (p_sku IS NOT NULL AND p_sku != 'All' AND h.descri ILIKE '%' || p_sku || '%'));

  RETURN QUERY EXECUTE format('
    SELECT 
      h.sucursal,
      h.estado,
      h.descri as sku,
      h.mes,
      h.a2024,
      h.c2024,
      ROUND((h.prom2024::NUMERIC * 100), 2) as porcentaje_2024,
      h.a2025,
      h.c2025,
      ROUND((h.prom2025::NUMERIC * 100), 2) as porcentaje_2025,
      %L::BIGINT as total_count,
      %L::BIGINT as total_a2024,
      %L::BIGINT as total_c2024,
      %L::BIGINT as total_a2025,
      %L::BIGINT as total_c2025,
      %L::NUMERIC as total_porcentaje_2024,
      %L::NUMERIC as total_porcentaje_2025
    FROM "HOMOLOGACIONACT" h
    WHERE h.tipo = $7
      AND ($1 IS NULL OR $1 = $10 OR h.mes = $1)
      AND ($2 IS NULL OR $2 = $11 OR h.region = $2)
      AND ($3 IS NULL OR $3 = $12 OR h.estado = $3)
      AND ($4 IS NULL OR $4 = $13 OR h.aliado = $4)
      AND ($5 IS NULL OR $5 = $14 OR h.sucursal = $5)
      AND ($6 IS NULL OR $6 = $15 OR ($6 IS NOT NULL AND $6 != $16 AND h.descri ILIKE $8 || $6 || $9))
    ORDER BY %s
    LIMIT %L OFFSET %L',
    total_records, sum_a2024, sum_c2024, sum_a2025, sum_c2025, avg_prom2024, avg_prom2025, sort_clause, p_page_size, offset_val
  ) USING p_mes, p_region, p_estado, p_aliado, p_sucursal, p_sku, 'SKU', '%', '%', 'All', 'All', 'All', 'All', 'All', 'All', 'All';
END;
$_$;