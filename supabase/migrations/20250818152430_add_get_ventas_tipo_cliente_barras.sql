-- Función RPC para obtener ventas por tipo de cliente (gráfico de barras)
CREATE OR REPLACE FUNCTION get_ventas_tipo_cliente_barras(
    p_mes text[] DEFAULT NULL,
    p_aliado text[] DEFAULT NULL,
    p_sucursal text[] DEFAULT NULL,
    p_marca text[] DEFAULT NULL,
    p_rubro text[] DEFAULT NULL,
    p_portafolio_interno text[] DEFAULT NULL,
    p_consumo_masivo text[] DEFAULT NULL,
    p_version text[] DEFAULT NULL,
    p_presentacion text[] DEFAULT NULL,
    p_region text[] DEFAULT NULL
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
        SUM(h.pesoanterior::numeric) as "2024",
        SUM(h.pesoactual::numeric) as "2025",
        h.tipocliente as "TIPOCLIENTE"
    FROM "HOMOLOGACIONVTA" h
    WHERE h.tipocliente IS NOT NULL
        AND (p_mes IS NULL OR h.mes = ANY(p_mes))
        AND (p_aliado IS NULL OR h.aliado = ANY(p_aliado))
        AND (p_sucursal IS NULL OR h.sucursal = ANY(p_sucursal))
        AND (p_marca IS NULL OR h.marca = ANY(p_marca))
        AND (p_rubro IS NULL OR h.rubro = ANY(p_rubro))
        AND (p_portafolio_interno IS NULL OR h.portafolio_interno = ANY(p_portafolio_interno))
        AND (p_consumo_masivo IS NULL OR h.consumo_masivo = ANY(p_consumo_masivo))
        AND (p_version IS NULL OR h.ver = ANY(p_version))
        AND (p_presentacion IS NULL OR h.presentacion::text = ANY(p_presentacion))
        AND (p_region IS NULL OR h.region = ANY(p_region))
    GROUP BY h.tipocliente
    ORDER BY h.tipocliente;
END;
$$;