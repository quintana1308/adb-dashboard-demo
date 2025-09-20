-- Función para obtener totales de cobranza con filtros
CREATE OR REPLACE FUNCTION get_cobranza_totales_v2(
  p_cliente text DEFAULT NULL,
  p_diavisita text DEFAULT NULL,
  p_codigoruta text DEFAULT NULL,
  p_vendedor text DEFAULT NULL
)
RETURNS TABLE(
  saldo_total double precision,
  valor_vencido_total double precision,
  porcentaje_vencimiento double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  where_conditions text[];
  where_clause text;
  query_text text;
  saldo_sum double precision;
  valor_vencido_sum double precision;
  porcentaje_calc double precision;
BEGIN
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
  
  -- Construir y ejecutar consulta para obtener sumas
  query_text := '
    SELECT 
      COALESCE(SUM("SALDO"), 0)::double precision,
      COALESCE(SUM("VALORVENCIDO"), 0)::double precision
    FROM "COBRANZA" 
    ' || where_clause;
  
  EXECUTE query_text INTO saldo_sum, valor_vencido_sum;
  
  -- Calcular porcentaje de vencimiento
  IF saldo_sum > 0 THEN
    porcentaje_calc := (valor_vencido_sum / saldo_sum) * 100;
  ELSE
    porcentaje_calc := 0;
  END IF;
  
  -- Retornar resultados
  RETURN QUERY SELECT 
    saldo_sum as saldo_total,
    valor_vencido_sum as valor_vencido_total,
    porcentaje_calc as porcentaje_vencimiento;
END;
$$;
