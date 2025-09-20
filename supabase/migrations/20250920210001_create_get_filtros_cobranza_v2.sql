-- Función para obtener los filtros únicos de la tabla COBRANZA
CREATE OR REPLACE FUNCTION get_filtros_cobranza_v2()
RETURNS TABLE(campo text, valores text[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'cliente'::text as campo,
    ARRAY(
      SELECT DISTINCT "CLIENTE"::text 
      FROM "COBRANZA" 
      WHERE "CLIENTE" IS NOT NULL 
      ORDER BY "CLIENTE"
    ) as valores
  UNION ALL
  SELECT 
    'diavisita'::text as campo,
    ARRAY(
      SELECT DISTINCT "DIAVISITA"::text 
      FROM "COBRANZA" 
      WHERE "DIAVISITA" IS NOT NULL 
      ORDER BY "DIAVISITA"
    ) as valores
  UNION ALL
  SELECT 
    'codigoruta'::text as campo,
    ARRAY(
      SELECT DISTINCT "CODIGORUTA"::text 
      FROM "COBRANZA" 
      WHERE "CODIGORUTA" IS NOT NULL 
      ORDER BY "CODIGORUTA"
    ) as valores
  UNION ALL
  SELECT 
    'vendedor'::text as campo,
    ARRAY(
      SELECT DISTINCT "VENDEDOR"::text 
      FROM "COBRANZA" 
      WHERE "VENDEDOR" IS NOT NULL 
      ORDER BY "VENDEDOR"
    ) as valores;
END;
$$;
