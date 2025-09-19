-- Agregar filtro tipo_cliente a todas las RPC que lo necesitan
-- Modificar: get_ventas_region_aliado_sku, get_ventas_mes_barras, get_ventas_total_2024, get_ventas_total_2025

-- 1. Modificar get_ventas_region_aliado_sku
DROP FUNCTION IF EXISTS get_ventas_region_aliado_sku(
    text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], text[]
);

CREATE OR REPLACE FUNCTION get_ventas_region_aliado_sku(
    p_mes text[] DEFAULT NULL,
    p_aliado text[] DEFAULT NULL,
    p_sucursal text[] DEFAULT NULL,
    p_marca text[] DEFAULT NULL,
    p_rubro text[] DEFAULT NULL,
    p_portafolio_interno text[] DEFAULT NULL,
    p_consumo_masivo text[] DEFAULT NULL,
    p_version text[] DEFAULT NULL,
    p_presentacion text[] DEFAULT NULL,
    p_region text[] DEFAULT NULL,
    p_sku text[] DEFAULT NULL,
    p_tipo_cliente text[] DEFAULT NULL
)
RETURNS TABLE(
    "REGION" character varying(50),
    "ALIADO" character varying(50),
    "SKU" character varying(50),
    "2024" numeric,
    "2025" numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hv.region as "REGION",
        hv.aliado as "ALIADO", 
        hv.sku as "SKU",
        SUM(hv.pesoanterior::numeric) as "2024",
        SUM(hv.pesoactual::numeric) as "2025"
    FROM "HOMOLOGACIONVTA" hv
    WHERE 1=1
        AND (p_mes IS NULL OR hv.mes = ANY(p_mes))
        AND (p_aliado IS NULL OR hv.aliado = ANY(p_aliado))
        AND (p_sucursal IS NULL OR hv.sucursal = ANY(p_sucursal))
        AND (p_marca IS NULL OR hv.marca = ANY(p_marca))
        AND (p_rubro IS NULL OR hv.dep = ANY(p_rubro))
        AND (p_portafolio_interno IS NULL OR hv.gpo = ANY(p_portafolio_interno))
        AND (p_consumo_masivo IS NULL OR hv.cat = ANY(p_consumo_masivo))
        AND (p_version IS NULL OR hv.ver = ANY(p_version))
        AND (p_presentacion IS NULL OR hv.presentacion::text = ANY(p_presentacion))
        AND (p_region IS NULL OR hv.region = ANY(p_region))
        AND (p_sku IS NULL OR EXISTS (
            SELECT 1 FROM unnest(p_sku) AS sku_filter 
            WHERE hv.sku ILIKE '%' || sku_filter || '%'
        ))
        AND (p_tipo_cliente IS NULL OR hv.tipocliente = ANY(p_tipo_cliente))
    GROUP BY hv.region, hv.aliado, hv.sku
    ORDER BY hv.region, hv.aliado, hv.sku;
END;
$$;

-- 2. Modificar get_ventas_mes_barras
DROP FUNCTION IF EXISTS get_ventas_mes_barras(
    text[], text[], text[], text[], text[], text[], text[], text[], numeric[], text[], text[]
);

CREATE OR REPLACE FUNCTION get_ventas_mes_barras(
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
    p_tipo_cliente text[] DEFAULT NULL
)
RETURNS TABLE(
    "2024" numeric,
    "2025" numeric,
    "MES" character varying(50)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(hv.pesoanterior::numeric) as "2024",
        SUM(hv.pesoactual::numeric) as "2025",
        hv.mes as "MES"
    FROM "HOMOLOGACIONVTA" hv
    WHERE hv.mes IS NOT NULL
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
        AND (p_sku IS NULL OR EXISTS (
            SELECT 1 FROM unnest(p_sku) AS sku_filter 
            WHERE hv.sku ILIKE '%' || sku_filter || '%'
        ))
        AND (p_tipo_cliente IS NULL OR hv.tipocliente = ANY(p_tipo_cliente))
    GROUP BY hv.mes
    ORDER BY hv.mes;
END;
$$;

-- 3. Modificar get_ventas_total_2024
DROP FUNCTION IF EXISTS get_ventas_total_2024(
    text[], text[], text[], text[], text[], text[], text[], text[], numeric[], text[], text[]
);

CREATE OR REPLACE FUNCTION get_ventas_total_2024(
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
    p_tipo_cliente text[] DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    total_ventas numeric;
BEGIN
    SELECT COALESCE(SUM(hv.pesoanterior::numeric), 0) INTO total_ventas
    FROM "HOMOLOGACIONVTA" hv
    WHERE 1=1
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
        AND (p_sku IS NULL OR EXISTS (
            SELECT 1 FROM unnest(p_sku) AS sku_filter 
            WHERE hv.sku ILIKE '%' || sku_filter || '%'
        ))
        AND (p_tipo_cliente IS NULL OR hv.tipocliente = ANY(p_tipo_cliente));
    
    RETURN total_ventas;
END;
$$;

-- 4. Modificar get_ventas_total_2025
DROP FUNCTION IF EXISTS get_ventas_total_2025(
    text[], text[], text[], text[], text[], text[], text[], text[], numeric[], text[], text[]
);

CREATE OR REPLACE FUNCTION get_ventas_total_2025(
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
    p_tipo_cliente text[] DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    total_ventas numeric;
BEGIN
    SELECT COALESCE(SUM(hv.pesoactual::numeric), 0) INTO total_ventas
    FROM "HOMOLOGACIONVTA" hv
    WHERE 1=1
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
        AND (p_sku IS NULL OR EXISTS (
            SELECT 1 FROM unnest(p_sku) AS sku_filter 
            WHERE hv.sku ILIKE '%' || sku_filter || '%'
        ))
        AND (p_tipo_cliente IS NULL OR hv.tipocliente = ANY(p_tipo_cliente));
    
    RETURN total_ventas;
END;
$$;