-- Corregir función RPC para usar los nombres correctos de columnas de HOMOLOGACIONVTA
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
    AND (p_rubro = 'All' OR cat = p_rubro)  -- Usar 'cat' en lugar de 'rubro'
    AND (p_portafolio_interno = 'All' OR gpo = p_portafolio_interno)  -- Usar 'gpo' en lugar de 'portafolio_interno'
    AND (p_consumo_masivo = 'All' OR tipocliente = p_consumo_masivo)  -- Usar 'tipocliente' en lugar de 'consumo_masivo'
    AND (p_version = 'All' OR ver = p_version)  -- Usar 'ver' en lugar de 'version'
    AND (p_presentacion = 'All' OR presentacion::text = p_presentacion)
    AND (p_region = 'All' OR region = p_region)
    AND (p_sku = 'All' OR sku = p_sku)
    GROUP BY sku
    ORDER BY sku;
END;
$$;