-- Corregir tipos de datos en la función get_activacion_vendedor
-- Cambiar cartera_semana1, cartera_semana6, activacion_semana1, activacion_semana6 de TEXT a BIGINT

DROP FUNCTION IF EXISTS get_activacion_vendedor(bigint, text, text);

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
  cartera_semana1 bigint,
  cartera_semana2 bigint,
  cartera_semana3 bigint,
  cartera_semana4 bigint,
  cartera_semana5 bigint,
  cartera_semana6 bigint,
  activacion_semana1 bigint,
  activacion_semana2 bigint,
  activacion_semana3 bigint,
  activacion_semana4 bigint,
  activacion_semana5 bigint,
  activacion_semana6 bigint,
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
    -- Convertir TEXT a BIGINT para semana1 y semana6
    CASE 
      WHEN av."CARTERA_SEMANA1" ~ '^[0-9]+$' THEN av."CARTERA_SEMANA1"::bigint 
      ELSE 0 
    END as cartera_semana1,
    av."CARTERA_SEMANA2" as cartera_semana2,
    av."CARTERA_SEMANA3" as cartera_semana3,
    av."CARTERA_SEMANA4" as cartera_semana4,
    av."CARTERA_SEMANA5" as cartera_semana5,
    CASE 
      WHEN av."CARTERA_SEMANA6" ~ '^[0-9]+$' THEN av."CARTERA_SEMANA6"::bigint 
      ELSE 0 
    END as cartera_semana6,
    CASE 
      WHEN av."ACTIVACION_SEMANA1" ~ '^[0-9]+$' THEN av."ACTIVACION_SEMANA1"::bigint 
      ELSE 0 
    END as activacion_semana1,
    av."ACTIVACION_SEMANA2" as activacion_semana2,
    av."ACTIVACION_SEMANA3" as activacion_semana3,
    av."ACTIVACION_SEMANA4" as activacion_semana4,
    av."ACTIVACION_SEMANA5" as activacion_semana5,
    CASE 
      WHEN av."ACTIVACION_SEMANA6" ~ '^[0-9]+$' THEN av."ACTIVACION_SEMANA6"::bigint 
      ELSE 0 
    END as activacion_semana6,
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

-- Comentario sobre la función
COMMENT ON FUNCTION get_activacion_vendedor IS 'Función para obtener datos de activación por vendedor con tipos corregidos (S1 y S6 como BIGINT)';
