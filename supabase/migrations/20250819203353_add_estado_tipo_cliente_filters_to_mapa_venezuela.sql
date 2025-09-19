-- Agregar filtros estado y tipo_cliente a get_ventas_ventas_mapa_venezuela

-- Eliminar la función existente
DROP FUNCTION IF EXISTS get_ventas_ventas_mapa_venezuela(
    text, text, text, text, text, text, text, text, text
);

-- Crear la nueva función con filtros estado y tipo_cliente
CREATE OR REPLACE FUNCTION get_ventas_ventas_mapa_venezuela(
    p_mes text DEFAULT 'All',
    p_aliado text DEFAULT 'All',
    p_sucursal text DEFAULT 'All',
    p_marca text DEFAULT 'All',
    p_dep text DEFAULT 'All',
    p_gpo text DEFAULT 'All',
    p_cat text DEFAULT 'All',
    p_ver text DEFAULT 'All',
    p_presentacion text DEFAULT 'All',
    p_estado text DEFAULT 'All',
    p_tipo_cliente text DEFAULT 'All'
)
RETURNS TABLE(
    "ESTADO" character varying,
    "ESTADO2" character varying,
    "RATIO_ACT" numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        estado as "ESTADO",
        estado as "ESTADO2",
        SUM(ratio_act::numeric) as "RATIO_ACT"
    FROM "HOMOLOGACIONVTA" 
    WHERE estado IS NOT NULL
      AND (p_mes = 'All' OR mes = p_mes)
      AND (p_aliado = 'All' OR aliado = p_aliado)
      AND (p_sucursal = 'All' OR sucursal = p_sucursal)
      AND (p_marca = 'All' OR marca = p_marca)
      AND (p_dep = 'All' OR dep = p_dep)
      AND (p_gpo = 'All' OR gpo = p_gpo)
      AND (p_cat = 'All' OR cat = p_cat)
      AND (p_ver = 'All' OR ver = p_ver)
      AND (p_presentacion = 'All' OR presentacion::text = p_presentacion)
      AND (p_estado = 'All' OR estado = p_estado)
      AND (p_tipo_cliente = 'All' OR tipocliente = p_tipo_cliente)
    GROUP BY estado
    ORDER BY estado;
END;
$$;

-- Otorgar permisos
GRANT ALL ON FUNCTION get_ventas_ventas_mapa_venezuela(
    text, text, text, text, text, text, text, text, text, text, text
) TO anon;

GRANT ALL ON FUNCTION get_ventas_ventas_mapa_venezuela(
    text, text, text, text, text, text, text, text, text, text, text
) TO authenticated;

GRANT ALL ON FUNCTION get_ventas_ventas_mapa_venezuela(
    text, text, text, text, text, text, text, text, text, text, text
) TO service_role;