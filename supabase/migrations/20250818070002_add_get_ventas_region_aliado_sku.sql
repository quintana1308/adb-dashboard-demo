-- Crear función RPC para obtener datos de ventas por región, aliado y SKU
CREATE OR REPLACE FUNCTION public.get_ventas_region_aliado_sku(
    p_mes text DEFAULT 'All',
    p_aliado text DEFAULT 'All',
    p_sucursal text DEFAULT 'All',
    p_marca text DEFAULT 'All',
    p_rubro text DEFAULT 'All',
    p_portafolio_interno text DEFAULT 'All',
    p_consumo_masivo text DEFAULT 'All',
    p_version text DEFAULT 'All',
    p_presentacion text DEFAULT 'All',
    p_region text DEFAULT 'All',
    p_sku text DEFAULT 'All'
)
RETURNS TABLE(
    "SKU" text,
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
        sku as "SKU",
        SUM(pesoanterior::numeric) / NULLIF((SELECT SUM(pesoanterior::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoanterior IS NOT NULL), 0) as "2024 (%)",
        SUM(pesoanterior::numeric) as "2024",
        SUM(pesoactual::numeric) / NULLIF((SELECT SUM(pesoactual::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoactual IS NOT NULL), 0) as "2025 (%)",
        SUM(pesoactual::numeric) as "2025",
        CASE 
            WHEN SUM(pesoanterior::numeric) > 0 THEN 
                (SUM(pesoactual::numeric) - SUM(pesoanterior::numeric)) / SUM(pesoanterior::numeric)
            ELSE NULL 
        END as "PORCENTAJE"
    FROM "HOMOLOGACIONVTA" 
    WHERE sku IS NOT NULL
    AND (p_mes = 'All' OR mes = p_mes)
    AND (p_aliado = 'All' OR aliado = p_aliado)
    AND (p_sucursal = 'All' OR sucursal = p_sucursal)
    AND (p_marca = 'All' OR marca = p_marca)
    AND (p_rubro = 'All' OR rubro = p_rubro)
    AND (p_portafolio_interno = 'All' OR portafolio_interno = p_portafolio_interno)
    AND (p_consumo_masivo = 'All' OR consumo_masivo = p_consumo_masivo)
    AND (p_version = 'All' OR version = p_version)
    AND (p_presentacion = 'All' OR presentacion = p_presentacion)
    AND (p_region = 'All' OR region = p_region)
    AND (p_sku = 'All' OR sku = p_sku)
    GROUP BY sku
    ORDER BY sku;
END;
$$;