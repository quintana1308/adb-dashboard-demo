-- Función para obtener datos de cobranza con filtros y paginación
CREATE OR REPLACE FUNCTION get_cobranza_v2(
  p_cliente text DEFAULT NULL,
  p_diavisita text DEFAULT NULL,
  p_codigoruta text DEFAULT NULL,
  p_vendedor text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 100,
  p_sort_column text DEFAULT 'CLIENTE',
  p_sort_direction text DEFAULT 'ASC'
)
RETURNS TABLE(
  tipo text,
  documento text,
  clienteid bigint,
  cliente text,
  diavisita text,
  codigoruta text,
  vendedor text,
  saldo double precision,
  diascxc bigint,
  documentos bigint,
  vencidos bigint,
  valorvencido double precision,
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
  
  IF p_cliente IS NOT NULL THEN
    where_conditions := array_append(where_conditions, '"CLIENTE" = ' || quote_literal(p_cliente));
  END IF;
  
  IF p_diavisita IS NOT NULL THEN
    where_conditions := array_append(where_conditions, '"DIAVISITA" = ' || quote_literal(p_diavisita));
  END IF;
  
  IF p_codigoruta IS NOT NULL THEN
    where_conditions := array_append(where_conditions, '"CODIGORUTA" = ' || quote_literal(p_codigoruta));
  END IF;
  
  IF p_vendedor IS NOT NULL THEN
    where_conditions := array_append(where_conditions, '"VENDEDOR" = ' || quote_literal(p_vendedor));
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
  query_text := 'SELECT COUNT(*) FROM "COBRANZA" ' || where_clause;
  EXECUTE query_text INTO total_records;
  
  -- Construir y ejecutar consulta principal
  query_text := '
    SELECT 
      "TIPO"::text,
      "DOCUMENTO"::text,
      "CLIENTEID"::bigint,
      "CLIENTE"::text,
      "DIAVISITA"::text,
      "CODIGORUTA"::text,
      "VENDEDOR"::text,
      "SALDO"::double precision,
      "DIASCXC"::bigint,
      "DOCUMENTOS"::bigint,
      "VENCIDOS"::bigint,
      "VALORVENCIDO"::double precision,
      ' || total_records || '::bigint as total_count
    FROM "COBRANZA" 
    ' || where_clause || ' 
    ' || order_clause || ' 
    LIMIT ' || p_page_size || ' 
    OFFSET ' || offset_val;
  
  RETURN QUERY EXECUTE query_text;
END;
$$;
