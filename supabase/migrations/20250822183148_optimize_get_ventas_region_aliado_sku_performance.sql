-- Optimizar función get_ventas_region_aliado_sku para resolver timeout
-- Primero eliminar la función existente y luego crear la versión optimizada

-- Eliminar función existente
DROP FUNCTION IF EXISTS public.get_ventas_region_aliado_sku(
    text[], text[], text[], text[], text[], text[], text[], text[], numeric[], text[], text[], text[]
);

-- Crear función optimizada eliminando subconsultas repetitivas
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
    p_sku text[] DEFAULT NULL::text[],
    p_tipo_cliente text[] DEFAULT NULL::text[]
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
DECLARE
    total_pesoanterior numeric;
    total_pesoactual numeric;
BEGIN
    -- Calcular totales una sola vez al inicio para evitar subconsultas repetitivas
    SELECT 
        COALESCE(SUM(pesoanterior::numeric), 0),
        COALESCE(SUM(pesoactual::numeric), 0)
    INTO total_pesoanterior, total_pesoactual
    FROM "HOMOLOGACIONVTA" 
    WHERE pesoanterior IS NOT NULL OR pesoactual IS NOT NULL;

    RETURN QUERY
    SELECT 
        hv.sku as "SKU",
        CASE 
            WHEN total_pesoanterior > 0 THEN
                SUM(hv.pesoanterior::numeric) / total_pesoanterior
            ELSE 0::numeric
        END as "2024 (%)",
        SUM(hv.pesoanterior::numeric) as "2024",
        CASE 
            WHEN total_pesoactual > 0 THEN
                SUM(hv.pesoactual::numeric) / total_pesoactual
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
        -- Optimizar filtro SKU: usar = ANY cuando sea posible, ILIKE solo cuando necesario
        AND (p_sku IS NULL OR (
            CASE 
                WHEN array_length(p_sku, 1) = 1 AND position('%' in p_sku[1]) = 0 THEN
                    hv.sku = ANY(p_sku)
                ELSE
                    EXISTS (
                        SELECT 1 FROM unnest(p_sku) AS sku_filter 
                        WHERE hv.sku ILIKE '%' || sku_filter || '%'
                    )
            END
        ))
        AND (p_tipo_cliente IS NULL OR hv.tipocliente = ANY(p_tipo_cliente))
    GROUP BY hv.sku
    ORDER BY hv.sku;
END;
$$;

-- Crear índices para mejorar performance si no existen
CREATE INDEX IF NOT EXISTS idx_homologacionvta_sku ON "HOMOLOGACIONVTA" (sku);
CREATE INDEX IF NOT EXISTS idx_homologacionvta_filters ON "HOMOLOGACIONVTA" (mes, aliado, sucursal, marca, dep, gpo, cat, ver, region, tipocliente);
CREATE INDEX IF NOT EXISTS idx_homologacionvta_pesos ON "HOMOLOGACIONVTA" (pesoanterior, pesoactual) WHERE pesoanterior IS NOT NULL OR pesoactual IS NOT NULL;