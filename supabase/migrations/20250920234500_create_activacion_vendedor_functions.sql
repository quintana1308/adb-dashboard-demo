-- Función para obtener filtros de activación por vendedor
CREATE OR REPLACE FUNCTION get_filtros_activacion_vendedor()
RETURNS TABLE (
  anios bigint,
  meses text,
  codigorutas text
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    av."AÑO" as anios,
    av."MES" as meses,
    av."CODIGORUTA" as codigorutas
  FROM "ACTIVACION_VENDEDOR" av
  WHERE av."AÑO" IS NOT NULL 
    AND av."MES" IS NOT NULL 
    AND av."CODIGORUTA" IS NOT NULL
  ORDER BY anios DESC, meses, codigorutas;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener datos de activación por vendedor con filtros
CREATE OR REPLACE FUNCTION get_activacion_vendedor(
  p_anio bigint DEFAULT NULL,
  p_mes text DEFAULT NULL,
  p_codigoruta text DEFAULT NULL
)
RETURNS TABLE (
  anio bigint,
  mes text,
  codigoruta text,
  vendedor text,
  porcentaje_acumulado_mes double precision,
  activacion_acumulada_mes bigint,
  cartera_general bigint,
  cartera_semana1 text,
  cartera_semana2 bigint,
  cartera_semana3 bigint,
  cartera_semana4 bigint,
  cartera_semana5 bigint,
  cartera_semana6 text,
  activacion_semana1 text,
  activacion_semana2 bigint,
  activacion_semana3 bigint,
  activacion_semana4 bigint,
  activacion_semana5 bigint,
  activacion_semana6 text,
  porcentaje_semana1 double precision,
  porcentaje_semana2 double precision,
  porcentaje_semana3 double precision,
  porcentaje_semana4 double precision,
  porcentaje_semana5 double precision,
  porcentaje_semana6 double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    av."AÑO" as anio,
    av."MES" as mes,
    av."CODIGORUTA" as codigoruta,
    av."VENDEDOR" as vendedor,
    av."PORCENTAJE_ACOMULADO_MES" as porcentaje_acumulado_mes,
    av."ACTIVACION_ACOCUMALDA_MES" as activacion_acumulada_mes,
    av."CARTERA_GENERAL" as cartera_general,
    av."CARTERA_SEMANA1" as cartera_semana1,
    av."CARTERA_SEMANA2" as cartera_semana2,
    av."CARTERA_SEMANA3" as cartera_semana3,
    av."CARTERA_SEMANA4" as cartera_semana4,
    av."CARTERA_SEMANA5" as cartera_semana5,
    av."CARTERA_SEMANA6" as cartera_semana6,
    av."ACTIVACION_SEMANA1" as activacion_semana1,
    av."ACTIVACION_SEMANA2" as activacion_semana2,
    av."ACTIVACION_SEMANA3" as activacion_semana3,
    av."ACTIVACION_SEMANA4" as activacion_semana4,
    av."ACTIVACION_SEMANA5" as activacion_semana5,
    av."ACTIVACION_SEMANA6" as activacion_semana6,
    av."PORCENTAJE_SEMANA1" as porcentaje_semana1,
    av."PORCENTAJE_SEMANA2" as porcentaje_semana2,
    av."PORCENTAJE_SEMANA3" as porcentaje_semana3,
    av."PORCENTAJE_SEMANA4" as porcentaje_semana4,
    av."PORCENTAJE_SEMANA5" as porcentaje_semana5,
    av."PORCENTAJE_SEMANA6" as porcentaje_semana6
  FROM "ACTIVACION_VENDEDOR" av
  WHERE (p_anio IS NULL OR p_anio = 0 OR av."AÑO" = p_anio)
    AND (p_mes IS NULL OR p_mes = '' OR p_mes = 'All' OR av."MES" = p_mes)
    AND (p_codigoruta IS NULL OR p_codigoruta = '' OR p_codigoruta = 'All' OR av."CODIGORUTA" = p_codigoruta)
  ORDER BY av."AÑO" DESC, av."MES", av."CODIGORUTA", av."VENDEDOR";
END;
$$ LANGUAGE plpgsql;

-- Función para contar registros de activación por vendedor
CREATE OR REPLACE FUNCTION count_activacion_vendedor(
  p_anio bigint DEFAULT NULL,
  p_mes text DEFAULT NULL,
  p_codigoruta text DEFAULT NULL
)
RETURNS bigint AS $$
DECLARE
  total_count bigint;
BEGIN
  SELECT COUNT(*)
  INTO total_count
  FROM "ACTIVACION_VENDEDOR" av
  WHERE (p_anio IS NULL OR p_anio = 0 OR av."AÑO" = p_anio)
    AND (p_mes IS NULL OR p_mes = '' OR p_mes = 'All' OR av."MES" = p_mes)
    AND (p_codigoruta IS NULL OR p_codigoruta = '' OR p_codigoruta = 'All' OR av."CODIGORUTA" = p_codigoruta);
  
  RETURN total_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener totales de activación por vendedor
CREATE OR REPLACE FUNCTION get_activacion_vendedor_totales(
  p_anio bigint DEFAULT NULL,
  p_mes text DEFAULT NULL,
  p_codigoruta text DEFAULT NULL
)
RETURNS TABLE (
  total_activacion_acumulada bigint,
  total_cartera_general bigint,
  promedio_porcentaje_acumulado double precision,
  total_activacion_semana1 bigint,
  total_activacion_semana2 bigint,
  total_activacion_semana3 bigint,
  total_activacion_semana4 bigint,
  total_activacion_semana5 bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(av."ACTIVACION_ACOCUMALDA_MES"), 0)::bigint as total_activacion_acumulada,
    COALESCE(SUM(av."CARTERA_GENERAL"), 0)::bigint as total_cartera_general,
    COALESCE(AVG(av."PORCENTAJE_ACOMULADO_MES"), 0)::double precision as promedio_porcentaje_acumulado,
    COALESCE(SUM(CASE WHEN av."ACTIVACION_SEMANA1" ~ '^[0-9]+$' THEN av."ACTIVACION_SEMANA1"::bigint ELSE 0 END), 0)::bigint as total_activacion_semana1,
    COALESCE(SUM(av."ACTIVACION_SEMANA2"), 0)::bigint as total_activacion_semana2,
    COALESCE(SUM(av."ACTIVACION_SEMANA3"), 0)::bigint as total_activacion_semana3,
    COALESCE(SUM(av."ACTIVACION_SEMANA4"), 0)::bigint as total_activacion_semana4,
    COALESCE(SUM(av."ACTIVACION_SEMANA5"), 0)::bigint as total_activacion_semana5
  FROM "ACTIVACION_VENDEDOR" av
  WHERE (p_anio IS NULL OR p_anio = 0 OR av."AÑO" = p_anio)
    AND (p_mes IS NULL OR p_mes = '' OR p_mes = 'All' OR av."MES" = p_mes)
    AND (p_codigoruta IS NULL OR p_codigoruta = '' OR p_codigoruta = 'All' OR av."CODIGORUTA" = p_codigoruta);
END;
$$ LANGUAGE plpgsql;
