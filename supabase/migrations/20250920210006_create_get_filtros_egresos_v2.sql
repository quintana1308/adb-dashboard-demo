-- Función para obtener los filtros únicos de la tabla EGRESOS
CREATE OR REPLACE FUNCTION get_filtros_egresos_v2()
RETURNS TABLE(campo text, valores text[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'anio'::text as campo,
    ARRAY(
      SELECT DISTINCT "AÑO"::text 
      FROM "EGRESOS" 
      WHERE "AÑO" IS NOT NULL 
      ORDER BY "AÑO" DESC
    ) as valores
  UNION ALL
  SELECT 
    'mes'::text as campo,
    ARRAY(
      SELECT DISTINCT "MES"::text 
      FROM "EGRESOS" 
      WHERE "MES" IS NOT NULL 
      ORDER BY "MES"
    ) as valores
  UNION ALL
  SELECT 
    'dia'::text as campo,
    ARRAY(
      SELECT DISTINCT "DIA"::text 
      FROM "EGRESOS" 
      WHERE "DIA" IS NOT NULL 
      ORDER BY "DIA" DESC
    ) as valores
  UNION ALL
  SELECT 
    'clasificacion'::text as campo,
    ARRAY(
      SELECT DISTINCT "CLASIFICACION"::text 
      FROM "EGRESOS" 
      WHERE "CLASIFICACION" IS NOT NULL 
      ORDER BY "CLASIFICACION"
    ) as valores
  UNION ALL
  SELECT 
    'cuenta'::text as campo,
    ARRAY(
      SELECT DISTINCT "CUENTA"::text 
      FROM "EGRESOS" 
      WHERE "CUENTA" IS NOT NULL 
      ORDER BY "CUENTA"
    ) as valores
  UNION ALL
  SELECT 
    'centrodecosto'::text as campo,
    ARRAY(
      SELECT DISTINCT "CENTRODECOSTO"::text 
      FROM "EGRESOS" 
      WHERE "CENTRODECOSTO" IS NOT NULL 
      ORDER BY "CENTRODECOSTO"
    ) as valores
  UNION ALL
  SELECT 
    'nivelcuenta'::text as campo,
    ARRAY(
      SELECT DISTINCT LEFT("CUENTACODIGO", 1)::text 
      FROM "EGRESOS" 
      WHERE "CUENTACODIGO" IS NOT NULL 
      ORDER BY LEFT("CUENTACODIGO", 1)
    ) as valores;
END;
$$;
