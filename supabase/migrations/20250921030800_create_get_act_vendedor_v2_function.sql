-- Crear función para obtener datos de activación por vendedor con formato de tabla estándar
-- Similar a get_act_aliados_departamentos_v2 pero para vendedores

CREATE OR REPLACE FUNCTION get_act_vendedor_v2(
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 100,
  p_sort_column TEXT DEFAULT 'vendedor',
  p_sort_direction TEXT DEFAULT 'ASC',
  p_anio TEXT DEFAULT 'All',
  p_mes TEXT DEFAULT 'All',
  p_codigoruta TEXT DEFAULT 'All'
)
RETURNS TABLE(
  anio INTEGER,
  mes TEXT,
  codigoruta TEXT,
  vendedor TEXT,
  a2024 NUMERIC,
  c2024 NUMERIC,
  porcentaje_2024 NUMERIC,
  a2025 NUMERIC,
  c2025 NUMERIC,
  porcentaje_2025 NUMERIC,
  total_count BIGINT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  offset_val INTEGER;
  sort_clause TEXT;
  where_clause TEXT := '';
  query_text TEXT;
BEGIN
  -- Calcular offset para paginación
  offset_val := (p_page - 1) * p_page_size;
  
  -- Construir cláusula WHERE dinámicamente
  IF p_anio != 'All' THEN
    where_clause := where_clause || ' AND EXTRACT(YEAR FROM fecha) = ' || p_anio::INTEGER;
  END IF;
  
  IF p_mes != 'All' THEN
    where_clause := where_clause || ' AND EXTRACT(MONTH FROM fecha) = ' || 
      CASE p_mes
        WHEN 'Enero' THEN '1'
        WHEN 'Febrero' THEN '2'
        WHEN 'Marzo' THEN '3'
        WHEN 'Abril' THEN '4'
        WHEN 'Mayo' THEN '5'
        WHEN 'Junio' THEN '6'
        WHEN 'Julio' THEN '7'
        WHEN 'Agosto' THEN '8'
        WHEN 'Septiembre' THEN '9'
        WHEN 'Octubre' THEN '10'
        WHEN 'Noviembre' THEN '11'
        WHEN 'Diciembre' THEN '12'
        ELSE '1'
      END;
  END IF;
  
  IF p_codigoruta != 'All' THEN
    where_clause := where_clause || ' AND codigoruta = ''' || p_codigoruta || '''';
  END IF;
  
  -- Construir cláusula ORDER BY
  sort_clause := 'ORDER BY ' || p_sort_column || ' ' || p_sort_direction;
  
  -- Construir consulta principal
  query_text := '
    WITH vendedor_data AS (
      SELECT 
        EXTRACT(YEAR FROM fecha)::INTEGER as anio,
        CASE EXTRACT(MONTH FROM fecha)
          WHEN 1 THEN ''Enero''
          WHEN 2 THEN ''Febrero''
          WHEN 3 THEN ''Marzo''
          WHEN 4 THEN ''Abril''
          WHEN 5 THEN ''Mayo''
          WHEN 6 THEN ''Junio''
          WHEN 7 THEN ''Julio''
          WHEN 8 THEN ''Agosto''
          WHEN 9 THEN ''Septiembre''
          WHEN 10 THEN ''Octubre''
          WHEN 11 THEN ''Noviembre''
          WHEN 12 THEN ''Diciembre''
        END as mes,
        codigoruta,
        vendedor,
        -- Datos 2024
        SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2024 THEN activacion_acumulada_mes ELSE 0 END) as a2024,
        SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2024 THEN cartera_general ELSE 0 END) as c2024,
        CASE 
          WHEN SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2024 THEN cartera_general ELSE 0 END) > 0 
          THEN ROUND((SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2024 THEN activacion_acumulada_mes ELSE 0 END) * 100.0 / 
                     SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2024 THEN cartera_general ELSE 0 END)), 2)
          ELSE 0 
        END as porcentaje_2024,
        -- Datos 2025
        SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2025 THEN activacion_acumulada_mes ELSE 0 END) as a2025,
        SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2025 THEN cartera_general ELSE 0 END) as c2025,
        CASE 
          WHEN SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2025 THEN cartera_general ELSE 0 END) > 0 
          THEN ROUND((SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2025 THEN activacion_acumulada_mes ELSE 0 END) * 100.0 / 
                     SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2025 THEN cartera_general ELSE 0 END)), 2)
          ELSE 0 
        END as porcentaje_2025
      FROM activacion_vendedor 
      WHERE 1=1 ' || where_clause || '
      GROUP BY EXTRACT(YEAR FROM fecha), EXTRACT(MONTH FROM fecha), codigoruta, vendedor
      HAVING SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2024 THEN cartera_general ELSE 0 END) > 0 
          OR SUM(CASE WHEN EXTRACT(YEAR FROM fecha) = 2025 THEN cartera_general ELSE 0 END) > 0
    ),
    total_count_cte AS (
      SELECT COUNT(*) as total_count FROM vendedor_data
    )
    SELECT 
      vd.*,
      tc.total_count
    FROM vendedor_data vd
    CROSS JOIN total_count_cte tc
    ' || sort_clause || '
    LIMIT ' || p_page_size || ' OFFSET ' || offset_val;
  
  -- Ejecutar consulta dinámica
  RETURN QUERY EXECUTE query_text;
END;
$$;

-- Comentario sobre la función
COMMENT ON FUNCTION get_act_vendedor_v2 IS 'Función para obtener datos de activación por vendedor con formato de tabla estándar, incluyendo paginación y ordenamiento';
