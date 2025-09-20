-- Función para obtener datos de egresos con filtros y paginación
CREATE OR REPLACE FUNCTION get_egresos_v2(
  p_anio text DEFAULT NULL,
  p_mes text DEFAULT NULL,
  p_dia text DEFAULT NULL,
  p_clasificacion text DEFAULT NULL,
  p_cuenta text DEFAULT NULL,
  p_centrodecosto text DEFAULT NULL,
  p_nivelcuenta text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 100,
  p_sort_column text DEFAULT 'AÑO',
  p_sort_direction text DEFAULT 'DESC'
)
RETURNS TABLE(
  anio bigint,
  mes text,
  dia date,
  gastosgenerales double precision,
  clasificacion text,
  cuentacodigo text,
  cuenta text,
  centrodecosto text,
  descripcion text,
  comprobante bigint,
  tipo text,
  documento text,
  fechadocumento date,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val integer;
  query_text text;
  where_conditions text[];
  where_clause text;
  order_clause text;
  total_records bigint;
BEGIN
  -- Calcular offset
  offset_val := (p_page - 1) * p_page_size;
  
  -- Construir condiciones WHERE
  where_conditions := ARRAY[]::text[];
  
  IF p_anio IS NOT NULL THEN
    where_conditions := array_append(where_conditions, '"AÑO" = ' || p_anio::bigint);
  END IF;
  
  IF p_mes IS NOT NULL THEN
    where_conditions := array_append(where_conditions, '"MES" = ' || quote_literal(p_mes));
  END IF;
  
  IF p_dia IS NOT NULL THEN
    where_conditions := array_append(where_conditions, '"DIA" = ' || quote_literal(p_dia));
  END IF;
  
  IF p_clasificacion IS NOT NULL THEN
    where_conditions := array_append(where_conditions, '"CLASIFICACION" = ' || quote_literal(p_clasificacion));
  END IF;
  
  IF p_cuenta IS NOT NULL THEN
    where_conditions := array_append(where_conditions, '"CUENTA" = ' || quote_literal(p_cuenta));
  END IF;
  
  IF p_centrodecosto IS NOT NULL THEN
    where_conditions := array_append(where_conditions, '"CENTRODECOSTO" = ' || quote_literal(p_centrodecosto));
  END IF;
  
  -- Filtro especial para nivel de cuenta (primer dígito de CUENTACODIGO)
  IF p_nivelcuenta IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 'LEFT("CUENTACODIGO", 1) = ' || quote_literal(p_nivelcuenta));
  END IF;
  
  -- Construir cláusula WHERE
  IF array_length(where_conditions, 1) > 0 THEN
    where_clause := 'WHERE ' || array_to_string(where_conditions, ' AND ');
  ELSE
    where_clause := '';
  END IF;
  
  -- Construir cláusula ORDER BY
  order_clause := 'ORDER BY "' || p_sort_column || '" ' || p_sort_direction;
  
  -- Obtener total de registros
  query_text := 'SELECT COUNT(*) FROM "EGRESOS" ' || where_clause;
  EXECUTE query_text INTO total_records;
  
  -- Construir y ejecutar consulta principal
  query_text := '
    SELECT 
      "AÑO"::bigint,
      "MES"::text,
      "DIA"::date,
      "GASTOSGENERALES"::double precision,
      "CLASIFICACION"::text,
      "CUENTACODIGO"::text,
      "CUENTA"::text,
      "CENTRODECOSTO"::text,
      "DESCRIPCION"::text,
      "COMPROBANTE"::bigint,
      "TIPO"::text,
      "DOCUMENTO"::text,
      "FECHADOCUMENTO"::date,
      ' || total_records || '::bigint as total_count
    FROM "EGRESOS" 
    ' || where_clause || ' 
    ' || order_clause || ' 
    LIMIT ' || p_page_size || ' 
    OFFSET ' || offset_val;
  
  RETURN QUERY EXECUTE query_text;
END;
$$;
