-- Crear función get_rentabilidad_v2 siguiendo el patrón de activación
-- Proyecto: ADN Dashboard Demo

-- 1) Función principal para datos paginados
CREATE OR REPLACE FUNCTION public.get_rentabilidad_v2(
  p_anio text DEFAULT NULL,
  p_mes text DEFAULT NULL,
  p_cliente text DEFAULT NULL,
  p_vendedor text DEFAULT NULL,
  p_categoria text DEFAULT NULL,
  p_producto text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 100,
  p_sort_column text DEFAULT 'AÑO',
  p_sort_direction text DEFAULT 'ASC'
)
RETURNS TABLE(
  anio bigint,
  mes text,
  cliente text,
  vendedor text,
  categoria text,
  producto text,
  venta_bruta numeric,
  costo_bruto numeric,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
DECLARE
  total_records BIGINT;
  offset_val INTEGER;
  order_clause TEXT;
BEGIN
  -- Calcular el total de registros
  SELECT COUNT(*) INTO total_records
  FROM "RENTABILIDAD" r
  WHERE (p_anio IS NULL OR p_anio = 'All' OR r."AÑO"::text = p_anio)
    AND (p_mes IS NULL OR p_mes = 'All' OR r."MES" = p_mes)
    AND (p_cliente IS NULL OR p_cliente = 'All' OR r."CLIENTE" = p_cliente)
    AND (p_vendedor IS NULL OR p_vendedor = 'All' OR r."VENDEDOR" = p_vendedor)
    AND (p_categoria IS NULL OR p_categoria = 'All' OR r."CATEGORIA" = p_categoria)
    AND (p_producto IS NULL OR p_producto = 'All' OR r."PRODUCTO" = p_producto);

  -- Calcular offset para paginación
  offset_val := (p_page - 1) * p_page_size;

  -- Construir cláusula ORDER BY dinámica
  IF p_sort_column = 'AÑO' THEN
    order_clause := 'r."AÑO" ' || p_sort_direction || ', r."MES" ASC, r."CLIENTE" ASC';
  ELSIF p_sort_column = 'MES' THEN
    order_clause := 'r."MES" ' || p_sort_direction || ', r."AÑO" ASC, r."CLIENTE" ASC';
  ELSIF p_sort_column = 'CLIENTE' THEN
    order_clause := 'r."CLIENTE" ' || p_sort_direction || ', r."AÑO" ASC, r."MES" ASC';
  ELSIF p_sort_column = 'VENDEDOR' THEN
    order_clause := 'r."VENDEDOR" ' || p_sort_direction || ', r."CLIENTE" ASC, r."AÑO" ASC';
  ELSIF p_sort_column = 'CATEGORIA' THEN
    order_clause := 'r."CATEGORIA" ' || p_sort_direction || ', r."PRODUCTO" ASC, r."AÑO" ASC';
  ELSIF p_sort_column = 'PRODUCTO' THEN
    order_clause := 'r."PRODUCTO" ' || p_sort_direction || ', r."CATEGORIA" ASC, r."AÑO" ASC';
  ELSIF p_sort_column = 'VENTA_BRUTA' THEN
    order_clause := 'r."VENTA_BRUTA" ' || p_sort_direction || ', r."CLIENTE" ASC, r."AÑO" ASC';
  ELSIF p_sort_column = 'COSTO_BRUTO' THEN
    order_clause := 'r."COSTO_BRUTO" ' || p_sort_direction || ', r."CLIENTE" ASC, r."AÑO" ASC';
  ELSE
    -- Ordenamiento por defecto
    order_clause := 'r."AÑO" ASC, r."MES" ASC, r."CLIENTE" ASC';
  END IF;

  -- Ejecutar consulta con paginación
  RETURN QUERY EXECUTE
    'SELECT 
       r."AÑO",
       r."MES",
       r."CLIENTE",
       r."VENDEDOR",
       r."CATEGORIA",
       r."PRODUCTO",
       ROUND(COALESCE(r."VENTA_BRUTA", 0)::NUMERIC, 2) as venta_bruta,
       ROUND(COALESCE(r."COSTO_BRUTO", 0)::NUMERIC, 2) as costo_bruto,
       $1::BIGINT as total_count
     FROM "RENTABILIDAD" r
     WHERE ($2 IS NULL OR $2 = ''All'' OR r."AÑO"::text = $2)
       AND ($3 IS NULL OR $3 = ''All'' OR r."MES" = $3)
       AND ($4 IS NULL OR $4 = ''All'' OR r."CLIENTE" = $4)
       AND ($5 IS NULL OR $5 = ''All'' OR r."VENDEDOR" = $5)
       AND ($6 IS NULL OR $6 = ''All'' OR r."CATEGORIA" = $6)
       AND ($7 IS NULL OR $7 = ''All'' OR r."PRODUCTO" = $7)
     ORDER BY ' || order_clause || '
     LIMIT $8 OFFSET $9'
  USING total_records, p_anio, p_mes, p_cliente, p_vendedor, p_categoria, p_producto, p_page_size, offset_val;
END;
$$;

-- 2) Función para filtros
CREATE OR REPLACE FUNCTION public.get_filtros_rentabilidad_v2()
RETURNS TABLE(campo text, valores text[])
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 'anio'::text AS campo, ARRAY(
    SELECT DISTINCT r."AÑO"::text FROM public."RENTABILIDAD" r WHERE r."AÑO" IS NOT NULL ORDER BY 1
  )::text[] AS valores
  UNION ALL
  SELECT 'mes'::text, ARRAY(
    SELECT DISTINCT r."MES" FROM public."RENTABILIDAD" r WHERE r."MES" IS NOT NULL ORDER BY 1
  )
  UNION ALL
  SELECT 'cliente'::text, ARRAY(
    SELECT DISTINCT r."CLIENTE" FROM public."RENTABILIDAD" r WHERE r."CLIENTE" IS NOT NULL ORDER BY 1
  )
  UNION ALL
  SELECT 'vendedor'::text, ARRAY(
    SELECT DISTINCT r."VENDEDOR" FROM public."RENTABILIDAD" r WHERE r."VENDEDOR" IS NOT NULL ORDER BY 1
  )
  UNION ALL
  SELECT 'categoria'::text, ARRAY(
    SELECT DISTINCT r."CATEGORIA" FROM public."RENTABILIDAD" r WHERE r."CATEGORIA" IS NOT NULL ORDER BY 1
  )
  UNION ALL
  SELECT 'producto'::text, ARRAY(
    SELECT DISTINCT r."PRODUCTO" FROM public."RENTABILIDAD" r WHERE r."PRODUCTO" IS NOT NULL ORDER BY 1
  );
END;
$$;

-- 3) Función para totales
CREATE OR REPLACE FUNCTION public.get_rentabilidad_totales_v2(
  p_anio text DEFAULT NULL,
  p_mes text DEFAULT NULL,
  p_cliente text DEFAULT NULL,
  p_vendedor text DEFAULT NULL,
  p_categoria text DEFAULT NULL,
  p_producto text DEFAULT NULL
)
RETURNS TABLE(
  venta_bruta_total numeric,
  costo_bruto_total numeric,
  utilidad_pct numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_vta numeric;
  v_costo numeric;
BEGIN
  SELECT COALESCE(SUM(r."VENTA_BRUTA"), 0), COALESCE(SUM(r."COSTO_BRUTO"), 0)
  INTO v_vta, v_costo
  FROM public."RENTABILIDAD" r
  WHERE (p_anio IS NULL OR p_anio = 'All' OR r."AÑO"::text = p_anio)
    AND (p_mes IS NULL OR p_mes = 'All' OR r."MES" = p_mes)
    AND (p_cliente IS NULL OR p_cliente = 'All' OR r."CLIENTE" = p_cliente)
    AND (p_vendedor IS NULL OR p_vendedor = 'All' OR r."VENDEDOR" = p_vendedor)
    AND (p_categoria IS NULL OR p_categoria = 'All' OR r."CATEGORIA" = p_categoria)
    AND (p_producto IS NULL OR p_producto = 'All' OR r."PRODUCTO" = p_producto);

  venta_bruta_total := v_vta;
  costo_bruto_total := v_costo;
  utilidad_pct := CASE WHEN v_vta IS NULL OR v_vta = 0 THEN 0 ELSE ((v_vta - v_costo) / v_vta) * 100 END;

  RETURN NEXT;
END;
$$;
