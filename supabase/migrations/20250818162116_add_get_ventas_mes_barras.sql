-- Función RPC para obtener ventas por mes (gráfico de barras stacked)
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
    p_sku text[] DEFAULT NULL
)
RETURNS TABLE(
    "2024" numeric,
    "2025" numeric,
    "MES" character varying
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
        AND (p_sku IS NULL OR hv.sku = ANY(p_sku))
    GROUP BY hv.mes
    ORDER BY 
        CASE hv.mes
            WHEN 'Enero' THEN 1
            WHEN 'Febrero' THEN 2
            WHEN 'Marzo' THEN 3
            WHEN 'Abril' THEN 4
            WHEN 'Mayo' THEN 5
            WHEN 'Junio' THEN 6
            WHEN 'Julio' THEN 7
            WHEN 'Agosto' THEN 8
            WHEN 'Septiembre' THEN 9
            WHEN 'Octubre' THEN 10
            WHEN 'Noviembre' THEN 11
            WHEN 'Diciembre' THEN 12
        END;
END;
$$;