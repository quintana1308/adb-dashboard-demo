-- Optimizar función get_ventas_region_tipo_cliente_detallado para resolver timeout
-- Eliminar subconsultas repetitivas usando variables DECLARE

-- Eliminar función existente
DROP FUNCTION IF EXISTS public.get_ventas_region_tipo_cliente_detallado(
    text[], text[], text[], text[], text[], text[], text[], text[], numeric[], text[], text[], text[]
);

-- Crear función optimizada eliminando subconsultas repetitivas
CREATE OR REPLACE FUNCTION public.get_ventas_region_tipo_cliente_detallado(
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
        hv.tipocliente as "TIPO CLIENTE",
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