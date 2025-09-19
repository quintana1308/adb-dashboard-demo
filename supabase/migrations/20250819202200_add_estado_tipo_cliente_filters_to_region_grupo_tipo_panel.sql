-- Agregar filtros estado y tipo_cliente a las RPC del panel VentasRegionGrupoTipo
-- RPC identificadas: get_ventas_region_tipo_cliente_detallado, get_ventas_grupo, get_ventas_tipo_cliente

-- 1. Modificar get_ventas_region_tipo_cliente_detallado
DROP FUNCTION IF EXISTS get_ventas_region_tipo_cliente_detallado(
    text[], text[], text[], text[], text[], text[], text[], text[], numeric[], text[]
);

CREATE OR REPLACE FUNCTION get_ventas_region_tipo_cliente_detallado(
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
    p_estado text[] DEFAULT NULL,
    p_tipo_cliente text[] DEFAULT NULL
)
RETURNS TABLE(
    "TIPO CLIENTE" character varying(50),
    "2024 (%)" numeric,
    "2024" numeric,
    "2025 (%)" numeric,
    "2025" numeric,
    "DIFERENCIA" numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hv.tipocliente as "TIPO CLIENTE",
        CASE 
            WHEN (SELECT SUM(pesoanterior::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoanterior IS NOT NULL) > 0 THEN
                SUM(hv.pesoanterior::numeric) / (SELECT SUM(pesoanterior::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoanterior IS NOT NULL)
            ELSE 0::numeric
        END as "2024 (%)",
        SUM(hv.pesoanterior::numeric) as "2024",
        CASE 
            WHEN (SELECT SUM(pesoactual::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoactual IS NOT NULL) > 0 THEN
                SUM(hv.pesoactual::numeric) / (SELECT SUM(pesoactual::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoactual IS NOT NULL)
            ELSE 0::numeric
        END as "2025 (%)",
        SUM(hv.pesoactual::numeric) as "2025",
        CASE 
            WHEN SUM(hv.pesoanterior::numeric) > 0 THEN 
                (SUM(hv.pesoactual::numeric) - SUM(hv.pesoanterior::numeric)) / SUM(hv.pesoanterior::numeric)
            ELSE NULL 
        END as "DIFERENCIA"
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
        AND (p_estado IS NULL OR hv.estado = ANY(p_estado))
        AND (p_tipo_cliente IS NULL OR hv.tipocliente = ANY(p_tipo_cliente))
    GROUP BY hv.tipocliente
    ORDER BY hv.tipocliente;
END;
$$;

-- 2. Modificar get_ventas_grupo
DROP FUNCTION IF EXISTS get_ventas_grupo(
    text[], text[], text[], text[], text[], text[], text[], text[], numeric[], text[]
);

CREATE OR REPLACE FUNCTION get_ventas_grupo(
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
    p_estado text[] DEFAULT NULL,
    p_tipo_cliente text[] DEFAULT NULL
)
RETURNS TABLE(
    "2024" numeric,
    "2025" numeric,
    "GRUPO" character varying(50)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SUM(hv.pesoanterior::numeric) as "2024",
        SUM(hv.pesoactual::numeric) as "2025",
        hv.gpo as "GRUPO"
    FROM "HOMOLOGACIONVTA" hv
    WHERE hv.gpo IS NOT NULL
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
        AND (p_estado IS NULL OR hv.estado = ANY(p_estado))
        AND (p_tipo_cliente IS NULL OR hv.tipocliente = ANY(p_tipo_cliente))
    GROUP BY hv.gpo
    ORDER BY hv.gpo;
END;
$$;

-- 3. Modificar get_ventas_tipo_cliente
DROP FUNCTION IF EXISTS get_ventas_tipo_cliente(
    text[], text[], text[], text[], text[], text[], text[], text[], numeric[], text[]
);

CREATE OR REPLACE FUNCTION get_ventas_tipo_cliente(
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
    p_estado text[] DEFAULT NULL,
    p_tipo_cliente text[] DEFAULT NULL
)
RETURNS TABLE(
    "2024" numeric,
    "2025" numeric,
    "TIPOCLIENTE" character varying(50)
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
        AND (p_estado IS NULL OR hv.estado = ANY(p_estado))
        AND (p_tipo_cliente IS NULL OR hv.tipocliente = ANY(p_tipo_cliente))
    GROUP BY hv.tipocliente
    ORDER BY hv.tipocliente;
END;
$$;