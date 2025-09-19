-- Corregir tipos de datos en función RPC para sincronización de ventas
DROP FUNCTION IF EXISTS public.get_sincronizacion_ventas;

CREATE OR REPLACE FUNCTION public.get_sincronizacion_ventas(
    p_page INTEGER DEFAULT 1,
    p_page_size INTEGER DEFAULT 50,
    p_sort_column TEXT DEFAULT 'aliado',
    p_sort_direction TEXT DEFAULT 'ASC'
)
RETURNS TABLE (
    aliadoid CHARACTER VARYING,
    aliado CHARACTER VARYING,
    sucursalid CHARACTER VARYING,
    sucursal CHARACTER VARYING,
    cantidad_registros BIGINT,
    ultima_fecha_carga TIMESTAMP
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_offset INTEGER;
    v_limit INTEGER;
    v_sort_column TEXT;
    v_sort_direction TEXT;
    v_query TEXT;
BEGIN
    -- Calcular offset para paginación
    v_offset := (p_page - 1) * p_page_size;
    v_limit := p_page_size;
    
    -- Validar columna de ordenamiento
    IF p_sort_column NOT IN ('aliadoid', 'aliado', 'sucursalid', 'sucursal', 'cantidad_registros', 'ultima_fecha_carga') THEN
        v_sort_column := 'aliado';
    ELSE
        v_sort_column := p_sort_column;
    END IF;
    
    -- Validar dirección de ordenamiento
    IF p_sort_direction NOT IN ('ASC', 'DESC') THEN
        v_sort_direction := 'ASC';
    ELSE
        v_sort_direction := p_sort_direction;
    END IF;
    
    -- Construir consulta dinámica con tipos de datos correctos
    v_query := 'SELECT 
                h.aliadoid,
                h.aliado,
                h.sucursalid,
                h.sucursal,
                COUNT(*) AS cantidad_registros,
                MAX(h.upd) - INTERVAL ''4 hours'' AS ultima_fecha_carga
            FROM 
                "HOMOLOGACIONVTA" h
            GROUP BY 
                h.aliadoid,
                h.aliado,
                h.sucursalid,
                h.sucursal
            ORDER BY ' || v_sort_column || ' ' || v_sort_direction || '
            LIMIT ' || v_limit || ' OFFSET ' || v_offset;
    
    -- Ejecutar consulta
    RETURN QUERY EXECUTE v_query;
END;
$$;