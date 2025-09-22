-- Corrección final de la función get_activacion_vendedor
-- Eliminar función problemática y crear una nueva versión simplificada

-- Eliminar función con diferentes firmas posibles
DROP FUNCTION IF EXISTS get_activacion_vendedor(bigint, text, text) CASCADE;
DROP FUNCTION IF EXISTS get_activacion_vendedor(bigint, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS get_activacion_vendedor() CASCADE;

-- Crear función nueva con manejo correcto de tipos
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
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    av."AÑO" as anio,
    av."MES" as mes,
    av."CODIGORUTA" as codigoruta,
    av."VENDEDOR" as vendedor,
    COALESCE(av."PORCENTAJE_ACOMULADO_MES", 0.0) as porcentaje_acumulado_mes,
    COALESCE(av."ACTIVACION_ACOCUMALDA_MES", 0) as activacion_acumulada_mes,
    COALESCE(av."CARTERA_GENERAL", 0) as cartera_general,
    -- Convertir TEXT a BIGINT para semana1 y semana6 usando CASE más simple
    COALESCE(
      CASE 
        WHEN av."CARTERA_SEMANA1" IS NOT NULL AND av."CARTERA_SEMANA1" != '' AND av."CARTERA_SEMANA1"::text ~ '^[0-9]+$' 
        THEN av."CARTERA_SEMANA1"::bigint 
        ELSE 0 
      END, 0
    ) as cartera_semana1,
    COALESCE(av."CARTERA_SEMANA2", 0) as cartera_semana2,
    COALESCE(av."CARTERA_SEMANA3", 0) as cartera_semana3,
    COALESCE(av."CARTERA_SEMANA4", 0) as cartera_semana4,
    COALESCE(av."CARTERA_SEMANA5", 0) as cartera_semana5,
    COALESCE(
      CASE 
        WHEN av."CARTERA_SEMANA6" IS NOT NULL AND av."CARTERA_SEMANA6" != '' AND av."CARTERA_SEMANA6"::text ~ '^[0-9]+$' 
        THEN av."CARTERA_SEMANA6"::bigint 
        ELSE 0 
      END, 0
    ) as cartera_semana6,
    COALESCE(
      CASE 
        WHEN av."ACTIVACION_SEMANA1" IS NOT NULL AND av."ACTIVACION_SEMANA1" != '' AND av."ACTIVACION_SEMANA1"::text ~ '^[0-9]+$' 
        THEN av."ACTIVACION_SEMANA1"::bigint 
        ELSE 0 
      END, 0
    ) as activacion_semana1,
    COALESCE(av."ACTIVACION_SEMANA2", 0) as activacion_semana2,
    COALESCE(av."ACTIVACION_SEMANA3", 0) as activacion_semana3,
    COALESCE(av."ACTIVACION_SEMANA4", 0) as activacion_semana4,
    COALESCE(av."ACTIVACION_SEMANA5", 0) as activacion_semana5,
    COALESCE(
      CASE 
        WHEN av."ACTIVACION_SEMANA6" IS NOT NULL AND av."ACTIVACION_SEMANA6" != '' AND av."ACTIVACION_SEMANA6"::text ~ '^[0-9]+$' 
        THEN av."ACTIVACION_SEMANA6"::bigint 
        ELSE 0 
      END, 0
    ) as activacion_semana6,
    COALESCE(av."PORCENTAJE_SEMANA1", 0.0) as porcentaje_semana1,
    COALESCE(av."PORCENTAJE_SEMANA2", 0.0) as porcentaje_semana2,
    COALESCE(av."PORCENTAJE_SEMANA3", 0.0) as porcentaje_semana3,
    COALESCE(av."PORCENTAJE_SEMANA4", 0.0) as porcentaje_semana4,
    COALESCE(av."PORCENTAJE_SEMANA5", 0.0) as porcentaje_semana5,
    COALESCE(av."PORCENTAJE_SEMANA6", 0.0) as porcentaje_semana6
  FROM "ACTIVACION_VENDEDOR" av
  WHERE (p_anio IS NULL OR p_anio = 0 OR av."AÑO" = p_anio)
    AND (p_mes IS NULL OR p_mes = '' OR p_mes = 'All' OR av."MES" = p_mes)
    AND (p_codigoruta IS NULL OR p_codigoruta = '' OR p_codigoruta = 'All' OR av."CODIGORUTA" = p_codigoruta)
  ORDER BY av."AÑO" DESC, av."MES", av."CODIGORUTA", av."VENDEDOR";
END;
$$;

-- Comentario sobre la función
COMMENT ON FUNCTION get_activacion_vendedor IS 'Función para obtener datos de activación por vendedor con tipos corregidos - versión final';

-- Refrescar esquema
NOTIFY pgrst, 'reload schema';
