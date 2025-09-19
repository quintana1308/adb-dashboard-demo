-- Corregir función RPC para usar arrays como parámetros siguiendo el patrón de get_ventas_region_tipo_cliente_detallado
CREATE OR REPLACE FUNCTION public.get_ventas_region_aliado_sku(
    p_mes text[] DEFAULT NULL::text[],
    p_aliado text[] DEFAULT NULL::text[],
    p_sucursal text[] DEFAULT NULL::text[],
    p_marca text[] DEFAULT NULL::text[],
    p_rubro text[] DEFAULT NULL::text[],
    p_portafolio_interno text[] DEFAULT NULL::text[],
    p_consumo_masivo text[] DEFAULT NULL::text[],
    p_version text[] DEFAULT NULL::text[],
    p_presentacion numeric[] DEFAULT NULL::numeric[],
    p_region text[] DEFAULT NULL::text[],
    p_sku text[] DEFAULT NULL::text[]
)
RETURNS TABLE(
    "SKU" character varying,
    "2024 (%)" numeric,
    "2024" numeric,
    "2025 (%)" numeric,
    "2025" numeric,
    "PORCENTAJE" numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hv.sku as "SKU",
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
        END as "PORCENTAJE"
    FROM "HOMOLOGACIONVTA" hv
    WHERE hv.sku IS NOT NULL
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
    GROUP BY hv.sku
    ORDER BY hv.sku;
END;
$$;