-- Eliminar las 5 funciones RPC existentes
DROP FUNCTION IF EXISTS get_ventas_consolidado_total_toneladas(text, text, text);
DROP FUNCTION IF EXISTS get_ventas_consolidado_total_cajas(text, text, text);
DROP FUNCTION IF EXISTS get_ventas_consolidado_productos_porcentaje(text, text, text);
DROP FUNCTION IF EXISTS get_ventas_consolidado_top_aliados(text, text, text, integer);
DROP FUNCTION IF EXISTS get_ventas_consolidado_top_productos_gpo(text, text, text, integer);

-- Recrear get_ventas_consolidado_total_toneladas con filtros gpo y aliado_especifico
CREATE OR REPLACE FUNCTION public.get_ventas_consolidado_total_toneladas(
  p_mes text DEFAULT NULL::text, 
  p_aliado text DEFAULT NULL::text, 
  p_marca text DEFAULT NULL::text,
  p_gpo text DEFAULT NULL::text,
  p_aliado_especifico text DEFAULT NULL::text
)
RETURNS numeric
LANGUAGE plpgsql
AS $function$
DECLARE
  result DECIMAL(10,2);
  sql_query TEXT;
BEGIN
  sql_query := 'SELECT ROUND(COALESCE(SUM(pesoactual), 0), 2) FROM "HOMOLOGACIONVTA" WHERE 1=1';
  
  IF p_mes IS NOT NULL AND p_mes != 'All' THEN
    sql_query := sql_query || ' AND mes = ' || quote_literal(p_mes);
  END IF;
  
  IF p_aliado IS NOT NULL AND p_aliado != 'All' THEN
    sql_query := sql_query || ' AND dep = ' || quote_literal(p_aliado);
  END IF;
  
  IF p_marca IS NOT NULL AND p_marca != 'All' THEN
    sql_query := sql_query || ' AND marca = ' || quote_literal(p_marca);
  END IF;
  
  IF p_gpo IS NOT NULL AND p_gpo != 'All' THEN
    sql_query := sql_query || ' AND gpo = ' || quote_literal(p_gpo);
  END IF;
  
  IF p_aliado_especifico IS NOT NULL AND p_aliado_especifico != 'All' THEN
    sql_query := sql_query || ' AND aliado = ' || quote_literal(p_aliado_especifico);
  END IF;
  
  EXECUTE sql_query INTO result;
  
  RETURN COALESCE(result, 0);
END;
$function$;

-- Recrear get_ventas_consolidado_total_cajas con filtros gpo y aliado_especifico
CREATE OR REPLACE FUNCTION public.get_ventas_consolidado_total_cajas(
  p_mes text DEFAULT NULL::text, 
  p_aliado text DEFAULT NULL::text, 
  p_marca text DEFAULT NULL::text,
  p_gpo text DEFAULT NULL::text,
  p_aliado_especifico text DEFAULT NULL::text
)
RETURNS numeric
LANGUAGE plpgsql
AS $function$
DECLARE
  result DECIMAL(10,2);
  sql_query TEXT;
BEGIN
  sql_query := 'SELECT ROUND(COALESCE(SUM(cajasactual), 0), 2) FROM "HOMOLOGACIONVTA" WHERE 1=1';
  
  IF p_mes IS NOT NULL AND p_mes != 'All' THEN
    sql_query := sql_query || ' AND mes = ' || quote_literal(p_mes);
  END IF;
  
  IF p_aliado IS NOT NULL AND p_aliado != 'All' THEN
    sql_query := sql_query || ' AND dep = ' || quote_literal(p_aliado);
  END IF;
  
  IF p_marca IS NOT NULL AND p_marca != 'All' THEN
    sql_query := sql_query || ' AND marca = ' || quote_literal(p_marca);
  END IF;
  
  IF p_gpo IS NOT NULL AND p_gpo != 'All' THEN
    sql_query := sql_query || ' AND gpo = ' || quote_literal(p_gpo);
  END IF;
  
  IF p_aliado_especifico IS NOT NULL AND p_aliado_especifico != 'All' THEN
    sql_query := sql_query || ' AND aliado = ' || quote_literal(p_aliado_especifico);
  END IF;
  
  EXECUTE sql_query INTO result;
  
  RETURN COALESCE(result, 0);
END;
$function$;

-- Recrear get_ventas_consolidado_productos_porcentaje con filtros gpo y aliado_especifico
CREATE OR REPLACE FUNCTION public.get_ventas_consolidado_productos_porcentaje(
  p_mes text DEFAULT NULL::text, 
  p_aliado text DEFAULT NULL::text, 
  p_marca text DEFAULT NULL::text,
  p_gpo text DEFAULT NULL::text,
  p_aliado_especifico text DEFAULT NULL::text
)
RETURNS TABLE(grupo character varying, porcentaje numeric)
LANGUAGE plpgsql
AS $function$
DECLARE
  sql_query TEXT;
  where_clause TEXT := '';
BEGIN
  -- Construir la cláusula WHERE dinámicamente
  IF p_mes IS NOT NULL AND p_mes != 'All' THEN
    where_clause := where_clause || ' AND mes = ' || quote_literal(p_mes);
  END IF;
  
  IF p_aliado IS NOT NULL AND p_aliado != 'All' THEN
    where_clause := where_clause || ' AND dep = ' || quote_literal(p_aliado);
  END IF;
  
  IF p_marca IS NOT NULL AND p_marca != 'All' THEN
    where_clause := where_clause || ' AND marca = ' || quote_literal(p_marca);
  END IF;
  
  IF p_gpo IS NOT NULL AND p_gpo != 'All' THEN
    where_clause := where_clause || ' AND gpo = ' || quote_literal(p_gpo);
  END IF;
  
  IF p_aliado_especifico IS NOT NULL AND p_aliado_especifico != 'All' THEN
    where_clause := where_clause || ' AND aliado = ' || quote_literal(p_aliado_especifico);
  END IF;
  
  -- Construir la consulta completa
  sql_query := '
    SELECT 
      gpo as grupo,
      ROUND((SUM(pesoactual) * 100.0 / 
        (SELECT SUM(pesoactual) FROM "HOMOLOGACIONVTA" WHERE pesoactual > 0' || where_clause || ')
      ), 2) as porcentaje
    FROM "HOMOLOGACIONVTA"
    WHERE pesoactual > 0' || where_clause || '
    GROUP BY gpo 
    ORDER BY gpo ASC
  ';
  
  RETURN QUERY EXECUTE sql_query;
END;
$function$;

-- Recrear get_ventas_consolidado_top_aliados con filtros gpo y aliado_especifico
CREATE OR REPLACE FUNCTION public.get_ventas_consolidado_top_aliados(
  p_mes text DEFAULT NULL::text, 
  p_aliado text DEFAULT NULL::text, 
  p_marca text DEFAULT NULL::text, 
  p_limit integer DEFAULT 10,
  p_gpo text DEFAULT NULL::text,
  p_aliado_especifico text DEFAULT NULL::text
)
RETURNS TABLE(aliado character varying, "año" integer, toneladas numeric, cajas numeric)
LANGUAGE plpgsql
AS $function$
DECLARE
  sql_query TEXT;
  where_clause TEXT := '';
BEGIN
  -- Construir la cláusula WHERE dinámicamente
  IF p_mes IS NOT NULL AND p_mes != 'All' THEN
    where_clause := where_clause || ' AND mes = ' || quote_literal(p_mes);
  END IF;
  
  IF p_aliado IS NOT NULL AND p_aliado != 'All' THEN
    where_clause := where_clause || ' AND h.dep = ' || quote_literal(p_aliado);
  END IF;
  
  IF p_marca IS NOT NULL AND p_marca != 'All' THEN
    where_clause := where_clause || ' AND marca = ' || quote_literal(p_marca);
  END IF;
  
  IF p_gpo IS NOT NULL AND p_gpo != 'All' THEN
    where_clause := where_clause || ' AND gpo = ' || quote_literal(p_gpo);
  END IF;
  
  IF p_aliado_especifico IS NOT NULL AND p_aliado_especifico != 'All' THEN
    where_clause := where_clause || ' AND h.aliado = ' || quote_literal(p_aliado_especifico);
  END IF;
  
  -- Construir la consulta que usa pesoanterior (2024) y pesoactual (2025)
  sql_query := '
    WITH top_aliados AS (
      SELECT h.aliado
      FROM "HOMOLOGACIONVTA" h
      WHERE 1=1' || where_clause || '
      GROUP BY h.aliado
      ORDER BY SUM(h.pesoactual) DESC
      LIMIT ' || p_limit || '
    ),
    datos_consolidados AS (
      SELECT 
        h.aliado,
        ROUND(SUM(h.pesoanterior), 2) as toneladas_2024,
        ROUND(SUM(h.pesoactual), 2) as toneladas_2025,
        ROUND(SUM(h.cajasanterior), 2) as cajas_2024,
        ROUND(SUM(h.cajasactual), 2) as cajas_2025
      FROM "HOMOLOGACIONVTA" h
      INNER JOIN top_aliados ta ON h.aliado = ta.aliado
      WHERE 1=1' || where_clause || '
      GROUP BY h.aliado
    )
    SELECT 
      d.aliado,
      2024 as año,
      d.toneladas_2024 as toneladas,
      d.cajas_2024 as cajas
    FROM datos_consolidados d
    
    UNION ALL
    
    SELECT 
      d.aliado,
      2025 as año,
      d.toneladas_2025 as toneladas,
      d.cajas_2025 as cajas
    FROM datos_consolidados d
    
    ORDER BY aliado, año
  ';
  
  RETURN QUERY EXECUTE sql_query;
END;
$function$;

-- Recrear get_ventas_consolidado_top_productos_gpo con filtros gpo y aliado_especifico
CREATE OR REPLACE FUNCTION public.get_ventas_consolidado_top_productos_gpo(
  p_mes text DEFAULT NULL::text, 
  p_aliado text DEFAULT NULL::text, 
  p_marca text DEFAULT NULL::text, 
  p_limit integer DEFAULT 15,
  p_gpo text DEFAULT NULL::text,
  p_aliado_especifico text DEFAULT NULL::text
)
RETURNS TABLE(gpo character varying, toneladas numeric, porcentaje numeric)
LANGUAGE plpgsql
AS $function$
DECLARE
  base_query TEXT;
  where_conditions TEXT := '';
BEGIN
  -- Construir condiciones WHERE dinámicamente
  IF p_mes IS NOT NULL AND p_mes != 'All' THEN
    where_conditions := where_conditions || ' AND mes = ''' || p_mes || '''';
  END IF;
  
  IF p_aliado IS NOT NULL AND p_aliado != 'All' THEN
    where_conditions := where_conditions || ' AND dep = ''' || p_aliado || '''';
  END IF;
  
  IF p_marca IS NOT NULL AND p_marca != 'All' THEN
    where_conditions := where_conditions || ' AND marca = ''' || p_marca || '''';
  END IF;

  IF p_gpo IS NOT NULL AND p_gpo != 'All' THEN
    where_conditions := where_conditions || ' AND gpo = ''' || p_gpo || '''';
  END IF;
  
  IF p_aliado_especifico IS NOT NULL AND p_aliado_especifico != 'All' THEN
    where_conditions := where_conditions || ' AND aliado = ''' || p_aliado_especifico || '''';
  END IF;

  -- Query principal con subconsulta para calcular porcentajes
  base_query := '
    SELECT 
      gpo,
      ROUND(SUM(pesoactual), 2) as toneladas,
      ROUND((SUM(pesoactual) * 100.0 / 
        (SELECT SUM(pesoactual) 
         FROM "HOMOLOGACIONVTA" 
         WHERE pesoactual > 0' || where_conditions || ')
      ), 2) as porcentaje
    FROM "HOMOLOGACIONVTA"
    WHERE pesoactual > 0' || where_conditions || '
    GROUP BY gpo 
    ORDER BY SUM(pesoactual) DESC
    LIMIT ' || p_limit;

  -- Ejecutar la consulta y retornar resultados
  RETURN QUERY EXECUTE base_query;
END;
$function$;