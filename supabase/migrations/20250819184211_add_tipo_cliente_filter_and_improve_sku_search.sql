-- Modificar la función get_ventas_tipo_cliente_barras para agregar filtro por tipo de cliente
-- y mejorar el filtro SKU para búsqueda por coincidencias

-- Primero eliminar la función existente
DROP FUNCTION IF EXISTS get_ventas_tipo_cliente_barras(
    text[], text[], text[], text[], text[], text[], text[], text[], numeric[], text[], text[]
);

-- Crear la nueva función con el parámetro adicional
CREATE OR REPLACE FUNCTION get_ventas_tipo_cliente_barras(
    p_mes text[] DEFAULT NULL,
    p_aliado text[] DEFAULT NULL,
    p_sucursal text[] DEFAULT NULL,
    p_marca text[] DEFAULT NULL,
    p_rubro text[] DEFAULT NULL,
    p_portafolio_interno text[] DEFAULT NULL,
    p_consumo_masivo text[] DEFAULT NULL,
    p_version text[] DEFAULT NULL,
    p_presentacion numeric[] DEFAULT NULL,
    p_region text[] DEFAULT NULL,
    p_sku text[] DEFAULT NULL,
    p_tipo_cliente text[] DEFAULT NULL  -- Nuevo filtro por tipo de cliente
)
RETURNS TABLE(
    "2024" numeric,
    "2025" numeric,
    "TIPOCLIENTE" text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(hv.pesoanterior::numeric) as "2024",
        SUM(hv.pesoactual::numeric) as "2025",
        hv.tipocliente as "TIPOCLIENTE"
    FROM "HOMOLOGACIONVTA" hv
    WHERE hv.tipocliente IS NOT NULL
        AND (p_mes IS NULL OR hv.mes = ANY(p_mes))
        AND (p_aliado IS NULL OR hv.aliado = ANY(p_aliado))
        AND (p_sucursal IS NULL OR hv.sucursal = ANY(p_sucursal))
        AND (p_marca IS NULL OR hv.marca = ANY(p_marca))
        AND (p_rubro IS NULL OR hv.dep = ANY(p_rubro))
        AND (p_portafolio_interno IS NULL OR hv.gpo = ANY(p_portafolio_interno))
        AND (p_consumo_masivo IS NULL OR hv.cat = ANY(p_consumo_masivo))
        AND (p_version IS NULL OR hv.ver = ANY(p_version))
        AND (p_presentacion IS NULL OR hv.presentacion = ANY(p_presentacion))
        AND (p_region IS NULL OR hv.region = ANY(p_region))
        -- Mejorar filtro SKU para búsqueda por coincidencias (ILIKE)
        AND (p_sku IS NULL OR EXISTS (
            SELECT 1 FROM unnest(p_sku) AS sku_filter 
            WHERE hv.sku ILIKE '%' || sku_filter || '%'
        ))
        -- Nuevo filtro por tipo de cliente
        AND (p_tipo_cliente IS NULL OR hv.tipocliente = ANY(p_tipo_cliente))
    GROUP BY hv.tipocliente
    ORDER BY hv.tipocliente;
END;
$$;