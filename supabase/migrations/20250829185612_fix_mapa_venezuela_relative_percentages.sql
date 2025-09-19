-- Crear nueva función para calcular porcentajes relativos en el mapa de Venezuela
-- Esta función calcula los porcentajes de cada estado en relación al total filtrado
-- de manera que la suma de todos los estados visibles sea siempre 100%

CREATE OR REPLACE FUNCTION get_ventas_mapa_venezuela_v2(
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
    "RATIO_ACT" numeric,
    "VENTAS_2024" numeric,
    "VENTAS_2025" numeric,
    "VARIACION" numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
    total_ventas numeric;
BEGIN
    -- Primero calculamos el total de ventas con los filtros aplicados
    SELECT COALESCE(SUM(ratio_act::numeric), 0) INTO total_ventas
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
      AND (p_tipo_cliente = 'All' OR tipocliente = p_tipo_cliente);

    -- Si no hay datos, evitar división por cero
    IF total_ventas = 0 THEN
        total_ventas := 1;
    END IF;

    -- Retornar los datos con porcentajes relativos
    RETURN QUERY
    SELECT 
        estado as "ESTADO",
        estado as "ESTADO2",
        CASE 
            WHEN total_ventas > 0 THEN 
                (SUM(ratio_act::numeric) / total_ventas)
            ELSE 
                0::numeric
        END as "RATIO_ACT",
        SUM(COALESCE(ventas_2024::numeric, 0)) as "VENTAS_2024",
        SUM(COALESCE(ventas_2025::numeric, 0)) as "VENTAS_2025",
        CASE 
            WHEN SUM(COALESCE(ventas_2024::numeric, 0)) > 0 THEN
                ((SUM(COALESCE(ventas_2025::numeric, 0)) - SUM(COALESCE(ventas_2024::numeric, 0))) / SUM(COALESCE(ventas_2024::numeric, 0))) * 100
            ELSE 
                0::numeric
        END as "VARIACION"
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
    HAVING SUM(ratio_act::numeric) > 0
    ORDER BY estado;
END;
$$;

-- Otorgar permisos
GRANT ALL ON FUNCTION get_ventas_mapa_venezuela_v2(
    text, text, text, text, text, text, text, text, text, text, text
) TO anon;

GRANT ALL ON FUNCTION get_ventas_mapa_venezuela_v2(
    text, text, text, text, text, text, text, text, text, text, text
) TO authenticated;

GRANT ALL ON FUNCTION get_ventas_mapa_venezuela_v2(
    text, text, text, text, text, text, text, text, text, text, text
) TO service_role;