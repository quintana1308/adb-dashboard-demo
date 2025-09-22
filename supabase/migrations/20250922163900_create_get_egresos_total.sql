-- Crear función para obtener el total de gastos generales filtrado
-- Esta función calculará la suma real de todos los registros que cumplen los filtros

CREATE OR REPLACE FUNCTION get_egresos_total(
  p_anio bigint DEFAULT NULL,
  p_mes text DEFAULT NULL,
  p_dia text DEFAULT NULL,
  p_clasificacion text DEFAULT NULL,
  p_cuenta text DEFAULT NULL,
  p_centrodecosto text DEFAULT NULL,
  p_nivelcuenta text DEFAULT NULL
)
RETURNS TABLE (
  total_gastos_generales numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CAST(eg."GASTOSGENERALES" AS numeric)), 0) as total_gastos_generales
  FROM "EGRESOS" eg
  WHERE (p_anio IS NULL OR p_anio = 0 OR eg."AÑO" = p_anio)
    AND (p_mes IS NULL OR p_mes = '' OR p_mes = 'All' OR eg."MES" = p_mes)
    AND (p_dia IS NULL OR p_dia = '' OR p_dia = 'All' OR eg."DIA"::text = p_dia)
    AND (p_clasificacion IS NULL OR p_clasificacion = '' OR p_clasificacion = 'All' OR eg."CLASIFICACION" = p_clasificacion)
    AND (p_cuenta IS NULL OR p_cuenta = '' OR p_cuenta = 'All' OR eg."CUENTA" = p_cuenta)
    AND (p_centrodecosto IS NULL OR p_centrodecosto = '' OR p_centrodecosto = 'All' OR eg."CENTRODECOSTO" = p_centrodecosto)
    AND (p_nivelcuenta IS NULL OR p_nivelcuenta = '' OR p_nivelcuenta = 'All' OR eg."NIVELCUENTA"::text = p_nivelcuenta);
END;
$$;

-- Comentario sobre la función
COMMENT ON FUNCTION get_egresos_total IS 'Función para calcular el total de gastos generales con filtros aplicados';
