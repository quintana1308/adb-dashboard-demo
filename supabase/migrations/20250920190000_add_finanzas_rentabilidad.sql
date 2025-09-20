-- Finanzas - Rentabilidad: filtros, datos paginados y totales
-- Proyecto: ADN Dashboard Demo

-- 1) Filtros
CREATE OR REPLACE FUNCTION public.get_filtros_finanzas_rentabilidad()
RETURNS TABLE(campo text, valores text[])
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 'anio'::text AS campo, ARRAY(
    SELECT DISTINCT COALESCE("AÑO"::text, '') FROM public."RENTABILIDAD" WHERE "AÑO" IS NOT NULL ORDER BY 1
  )::text[] AS valores
  UNION ALL
  SELECT 'mes'::text, ARRAY(
    SELECT DISTINCT COALESCE("MES", '') FROM public."RENTABILIDAD" WHERE "MES" IS NOT NULL ORDER BY 1
  )
  UNION ALL
  SELECT 'cliente'::text, ARRAY(
    SELECT DISTINCT COALESCE("CLIENTE", '') FROM public."RENTABILIDAD" WHERE "CLIENTE" IS NOT NULL ORDER BY 1
  )
  UNION ALL
  SELECT 'vendedor'::text, ARRAY(
    SELECT DISTINCT COALESCE("VENDEDOR", '') FROM public."RENTABILIDAD" WHERE "VENDEDOR" IS NOT NULL ORDER BY 1
  )
  UNION ALL
  SELECT 'categoria'::text, ARRAY(
    SELECT DISTINCT COALESCE("CATEGORIA", '') FROM public."RENTABILIDAD" WHERE "CATEGORIA" IS NOT NULL ORDER BY 1
  )
  UNION ALL
  SELECT 'producto'::text, ARRAY(
    SELECT DISTINCT COALESCE("PRODUCTO", '') FROM public."RENTABILIDAD" WHERE "PRODUCTO" IS NOT NULL ORDER BY 1
  );
END;
$$;

-- 2) Datos paginados y ordenables
CREATE OR REPLACE FUNCTION public.get_finanzas_rentabilidad(
  p_anio bigint DEFAULT NULL,
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
  "AÑO" bigint,
  "MES" text,
  "CLIENTE" text,
  "VENDEDOR" text,
  "CATEGORIA" text,
  "PRODUCTO" text,
  "VENTA_BRUTA" double precision,
  "COSTO_BRUTO" double precision,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_sql text;
BEGIN
  -- Construir SQL dinámico para ORDER BY seguro con columnas permitidas
  v_sql := format(
    'SELECT t.*,
            COUNT(*) OVER() AS total_count
     FROM (
       SELECT "AÑO", "MES", "CLIENTE", "VENDEDOR", "CATEGORIA", "PRODUCTO",
              COALESCE("VENTA_BRUTA", 0)::double precision AS "VENTA_BRUTA",
              COALESCE("COSTO_BRUTO", 0)::double precision AS "COSTO_BRUTO"
       FROM public."RENTABILIDAD"
       WHERE (%s) AND (%s) AND (%s) AND (%s) AND (%s) AND (%s)
     ) t
     ORDER BY %s %s
     OFFSET %s LIMIT %s',
    '($1::bigint IS NULL OR "AÑO" = $1::bigint)',
    '($2::text IS NULL OR "MES" = $2::text)',
    '($3::text IS NULL OR "CLIENTE" = $3::text)',
    '($4::text IS NULL OR "VENDEDOR" = $4::text)',
    '($5::text IS NULL OR "CATEGORIA" = $5::text)',
    '($6::text IS NULL OR "PRODUCTO" = $6::text)',
    -- Sanitizar columna de orden permitiendo sólo columnas conocidas
    CASE 
      WHEN p_sort_column IN ('AÑO','MES','CLIENTE','VENDEDOR','CATEGORIA','PRODUCTO','VENTA_BRUTA','COSTO_BRUTO') THEN quote_ident(p_sort_column)
      ELSE '"AÑO"'
    END,
    CASE WHEN upper(p_sort_direction) = 'DESC' THEN 'DESC' ELSE 'ASC' END,
    GREATEST((p_page - 1), 0) * GREATEST(p_page_size, 1),
    GREATEST(p_page_size, 1)
  );

  RETURN QUERY EXECUTE v_sql USING p_anio, p_mes, p_cliente, p_vendedor, p_categoria, p_producto;
END;
$$;

-- 3) Totales
CREATE OR REPLACE FUNCTION public.get_finanzas_rentabilidad_totales(
  p_anio bigint DEFAULT NULL,
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
  SELECT COALESCE(SUM("VENTA_BRUTA"), 0), COALESCE(SUM("COSTO_BRUTO"), 0)
  INTO v_vta, v_costo
  FROM public."RENTABILIDAD"
  WHERE (p_anio IS NULL OR "AÑO" = p_anio)
    AND (p_mes IS NULL OR "MES" = p_mes)
    AND (p_cliente IS NULL OR "CLIENTE" = p_cliente)
    AND (p_vendedor IS NULL OR "VENDEDOR" = p_vendedor)
    AND (p_categoria IS NULL OR "CATEGORIA" = p_categoria)
    AND (p_producto IS NULL OR "PRODUCTO" = p_producto);

  venta_bruta_total := v_vta;
  costo_bruto_total := v_costo;
  utilidad_pct := CASE WHEN v_vta IS NULL OR v_vta = 0 THEN 0 ELSE ((v_vta - v_costo) / v_vta) * 100 END;

  RETURN NEXT;
END;
$$;
