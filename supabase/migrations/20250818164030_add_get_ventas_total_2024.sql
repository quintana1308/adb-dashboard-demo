-- Función RPC para obtener total ventas 2024 (pesoanterior)
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
    p_sku text[] DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (
        SELECT 
            COALESCE(SUM(hv.pesoanterior::numeric), 0) as total_2024
        FROM "HOMOLOGACIONVTA" hv
        WHERE hv.pesoanterior IS NOT NULL
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
            AND (p_sku IS NULL OR hv.sku = ANY(p_sku))
    );
END;
$$;