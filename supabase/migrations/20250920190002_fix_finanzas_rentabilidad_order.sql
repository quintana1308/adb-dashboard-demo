-- Corregir función get_finanzas_rentabilidad - problema con ORDER BY
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
  -- Sanitizar columna de orden permitiendo sólo columnas conocidas
  v_order_column := CASE 
    WHEN p_sort_column IN ('AÑO','MES','CLIENTE','VENDEDOR','CATEGORIA','PRODUCTO','VENTA_BRUTA','COSTO_BRUTO') THEN p_sort_column
    ELSE 'AÑO'
  END;

  -- Construir SQL dinámico para ORDER BY seguro
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
     ORDER BY %I %s
     OFFSET %s LIMIT %s',
    '($1::bigint IS NULL OR "AÑO" = $1::bigint)',
    '($2::text IS NULL OR "MES" = $2::text)',
    '($3::text IS NULL OR "CLIENTE" = $3::text)',
    '($4::text IS NULL OR "VENDEDOR" = $4::text)',
    '($5::text IS NULL OR "CATEGORIA" = $5::text)',
    '($6::text IS NULL OR "PRODUCTO" = $6::text)',
    v_order_column,
    CASE WHEN upper(p_sort_direction) = 'DESC' THEN 'DESC' ELSE 'ASC' END,
    GREATEST((p_page - 1), 0) * GREATEST(p_page_size, 1),
    GREATEST(p_page_size, 1)
  );

  RETURN QUERY EXECUTE v_sql USING p_anio, p_mes, p_cliente, p_vendedor, p_categoria, p_producto;
END;
$$;
