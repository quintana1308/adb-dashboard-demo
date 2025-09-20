-- Corregir función get_finanzas_rentabilidad - manejo correcto de NULLs
-- Proyecto: ADN Dashboard Demo

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
  v_order_column text;
BEGIN
  -- Sanitizar columna de orden
  v_order_column := CASE 
    WHEN p_sort_column IN ('AÑO','MES','CLIENTE','VENDEDOR','CATEGORIA','PRODUCTO','VENTA_BRUTA','COSTO_BRUTO') THEN p_sort_column
    ELSE 'AÑO'
  END;

  -- Construir SQL con condiciones correctas para NULL
  v_sql := format(
    'SELECT t.*,
            COUNT(*) OVER() AS total_count
     FROM (
       SELECT "AÑO", "MES", "CLIENTE", "VENDEDOR", "CATEGORIA", "PRODUCTO",
              COALESCE("VENTA_BRUTA", 0)::double precision AS "VENTA_BRUTA",
              COALESCE("COSTO_BRUTO", 0)::double precision AS "COSTO_BRUTO"
       FROM public."RENTABILIDAD"
       WHERE (p_anio IS NULL OR "AÑO" = p_anio)
         AND (p_mes IS NULL OR "MES" = p_mes)
         AND (p_cliente IS NULL OR "CLIENTE" = p_cliente)
         AND (p_vendedor IS NULL OR "VENDEDOR" = p_vendedor)
         AND (p_categoria IS NULL OR "CATEGORIA" = p_categoria)
         AND (p_producto IS NULL OR "PRODUCTO" = p_producto)
     ) t
     ORDER BY %I %s
     OFFSET %s LIMIT %s',
    v_order_column,
    CASE WHEN upper(p_sort_direction) = 'DESC' THEN 'DESC' ELSE 'ASC' END,
    GREATEST((p_page - 1), 0) * GREATEST(p_page_size, 1),
    GREATEST(p_page_size, 1)
  );

  RETURN QUERY EXECUTE v_sql USING p_anio, p_mes, p_cliente, p_vendedor, p_categoria, p_producto;
END;
$$;

-- También corregir la función de totales
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
