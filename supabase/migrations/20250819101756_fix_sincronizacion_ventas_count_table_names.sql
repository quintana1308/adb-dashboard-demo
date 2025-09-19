-- Corregir función get_sincronizacion_ventas_count con nombres de columnas correctos
DROP FUNCTION IF EXISTS public.get_sincronizacion_ventas_count;

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
            h.aliadoid,
            h.aliado
        FROM 
            "HOMOLOGACIONVTA" h
        GROUP BY 
            h.aliadoid,
            h.aliado,
            h.sucursalid,
            h.sucursal
    ) AS subquery;
    
    RETURN v_count;
END;
$$;