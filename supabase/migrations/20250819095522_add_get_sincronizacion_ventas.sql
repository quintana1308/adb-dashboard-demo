-- Crear función RPC para obtener datos de sincronización de ventas con paginación y ordenamiento
CREATE OR REPLACE FUNCTION public.get_sincronizacion_ventas(
    p_page INTEGER DEFAULT 1,
    p_page_size INTEGER DEFAULT 50,
    p_sort_column TEXT DEFAULT 'ALIADO',
    p_sort_direction TEXT DEFAULT 'ASC'
)
RETURNS TABLE (
    aliadoid TEXT,
    aliado TEXT,
    sucursalid TEXT,
    sucursal TEXT,
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
    IF p_sort_column NOT IN ('ALIADOID', 'ALIADO', 'SUCURSALID', 'SUCURSAL', 'CANTIDAD_REGISTROS', 'ULTIMA_FECHA_CARGA') THEN
        v_sort_column := 'ALIADO';
    ELSE
        v_sort_column := p_sort_column;
    END IF;
    
    -- Validar dirección de ordenamiento
    IF p_sort_direction NOT IN ('ASC', 'DESC') THEN
        v_sort_direction := 'ASC';
    ELSE
        v_sort_direction := p_sort_direction;
    END IF;
    
    -- Construir consulta dinámica
    v_query := 'SELECT 
                    h.ALIADOID,
                    h.ALIADO,
                    h.SUCURSALID,
                    h.SUCURSAL,
                    COUNT(*) AS CANTIDAD_REGISTROS,
                    DATE_SUB(MAX(h.UPD), INTERVAL 4 HOUR) AS ULTIMA_FECHA_CARGA
                FROM 
                    HOMOLOGACIONVTA h
                GROUP BY 
                    h.ALIADOID,
                    h.ALIADO,
                    h.SUCURSALID,
                    h.SUCURSAL
                ORDER BY ' || v_sort_column || ' ' || v_sort_direction || '
                LIMIT ' || v_limit || ' OFFSET ' || v_offset;
    
    -- Ejecutar consulta
    RETURN QUERY EXECUTE v_query;
END;
$$;

-- Crear función para obtener el total de registros (para paginación)
CREATE OR REPLACE FUNCTION public.get_sincronizacion_ventas_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM (
        SELECT 
            h.ALIADOID,
            h.ALIADO
        FROM 
            HOMOLOGACIONVTA h
        GROUP BY 
            h.ALIADOID,
            h.ALIADO,
            h.SUCURSALID,
            h.SUCURSAL
    ) AS subquery;
    
    RETURN v_count;
END;
$$;
