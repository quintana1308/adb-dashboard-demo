-- Función para obtener filtros de ventas generales
CREATE OR REPLACE FUNCTION get_filtros_ventas_generales()
RETURNS TABLE(campo text, valores text[])
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 'anio'::text as campo, 
           array_agg(DISTINCT "AÑO"::text ORDER BY "AÑO"::text) as valores
    FROM "VENTAS"
    WHERE "AÑO" IS NOT NULL
    
    UNION ALL
    
    SELECT 'mes'::text as campo,
           array_agg(DISTINCT "MES" ORDER BY "MES") as valores
    FROM "VENTAS"
    WHERE "MES" IS NOT NULL
    
    UNION ALL
    
    SELECT 'dia'::text as campo,
           array_agg(DISTINCT "DIA"::text ORDER BY "DIA"::text) as valores
    FROM "VENTAS"
    WHERE "DIA" IS NOT NULL
    
    UNION ALL
    
    SELECT 'cliente'::text as campo,
           array_agg(DISTINCT "CLIENTE" ORDER BY "CLIENTE") as valores
    FROM "VENTAS"
    WHERE "CLIENTE" IS NOT NULL
    
    UNION ALL
    
    SELECT 'vendedor'::text as campo,
           array_agg(DISTINCT "VENDEDOR" ORDER BY "VENDEDOR") as valores
    FROM "VENTAS"
    WHERE "VENDEDOR" IS NOT NULL
    
    UNION ALL
    
    SELECT 'productoid'::text as campo,
           array_agg(DISTINCT "PRODUCTOID" ORDER BY "PRODUCTOID") as valores
    FROM "VENTAS"
    WHERE "PRODUCTOID" IS NOT NULL
    
    UNION ALL
    
    SELECT 'producto'::text as campo,
           array_agg(DISTINCT "PRODUCTO" ORDER BY "PRODUCTO") as valores
    FROM "VENTAS"
    WHERE "PRODUCTO" IS NOT NULL
    
    UNION ALL
    
    SELECT 'categoria'::text as campo,
           array_agg(DISTINCT "CATEGORIA" ORDER BY "CATEGORIA") as valores
    FROM "VENTAS"
    WHERE "CATEGORIA" IS NOT NULL;
END;
$$;

-- Función para obtener datos de ventas generales con filtros
CREATE OR REPLACE FUNCTION get_ventas_generales(
    p_anio text DEFAULT 'All',
    p_mes text DEFAULT 'All',
    p_dia text DEFAULT 'All',
    p_cliente text DEFAULT 'All',
    p_vendedor text DEFAULT 'All',
    p_productoid text DEFAULT 'All',
    p_producto text DEFAULT 'All',
    p_categoria text DEFAULT 'All'
)
RETURNS TABLE(
    anio bigint,
    mes text,
    dia date,
    cliente text,
    vendedor text,
    productoid text,
    producto text,
    categoria text,
    ventas_unidades double precision,
    ventas_kilos double precision,
    ventas_cajas double precision,
    ventas_usd double precision,
    tonelaje double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v."AÑO",
        v."MES",
        v."DIA",
        v."CLIENTE",
        v."VENDEDOR",
        v."PRODUCTOID",
        v."PRODUCTO",
        v."CATEGORIA",
        v."VENTAS_UNIDADES",
        v."VENTAS_KILOS",
        v."VENTAS_CAJAS",
        v."VENTAS_USD",
        v."TONELAJE"
    FROM "VENTAS" v
    WHERE 
        (p_anio = 'All' OR v."AÑO"::text = p_anio)
        AND (p_mes = 'All' OR v."MES" = p_mes)
        AND (p_dia = 'All' OR v."DIA"::text = p_dia)
        AND (p_cliente = 'All' OR v."CLIENTE" = p_cliente)
        AND (p_vendedor = 'All' OR v."VENDEDOR" = p_vendedor)
        AND (p_productoid = 'All' OR v."PRODUCTOID" = p_productoid)
        AND (p_producto = 'All' OR v."PRODUCTO" = p_producto)
        AND (p_categoria = 'All' OR v."CATEGORIA" = p_categoria)
    ORDER BY v."AÑO" DESC, v."MES", v."DIA" DESC;
END;
$$;

-- Función para obtener totales de ventas generales con filtros
CREATE OR REPLACE FUNCTION get_ventas_generales_totales(
    p_anio text DEFAULT 'All',
    p_mes text DEFAULT 'All',
    p_dia text DEFAULT 'All',
    p_cliente text DEFAULT 'All',
    p_vendedor text DEFAULT 'All',
    p_productoid text DEFAULT 'All',
    p_producto text DEFAULT 'All',
    p_categoria text DEFAULT 'All'
)
RETURNS TABLE(
    ventasUnidadesTotal double precision,
    ventasKilosTotal double precision,
    ventasCajasTotal double precision,
    ventasUsdTotal double precision,
    tonelajeTotal double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(v."VENTAS_UNIDADES"), 0)::double precision as ventasUnidadesTotal,
        COALESCE(SUM(v."VENTAS_KILOS"), 0)::double precision as ventasKilosTotal,
        COALESCE(SUM(v."VENTAS_CAJAS"), 0)::double precision as ventasCajasTotal,
        COALESCE(SUM(v."VENTAS_USD"), 0)::double precision as ventasUsdTotal,
        COALESCE(SUM(v."TONELAJE"), 0)::double precision as tonelajeTotal
    FROM "VENTAS" v
    WHERE 
        (p_anio = 'All' OR v."AÑO"::text = p_anio)
        AND (p_mes = 'All' OR v."MES" = p_mes)
        AND (p_dia = 'All' OR v."DIA"::text = p_dia)
        AND (p_cliente = 'All' OR v."CLIENTE" = p_cliente)
        AND (p_vendedor = 'All' OR v."VENDEDOR" = p_vendedor)
        AND (p_productoid = 'All' OR v."PRODUCTOID" = p_productoid)
        AND (p_producto = 'All' OR v."PRODUCTO" = p_producto)
        AND (p_categoria = 'All' OR v."CATEGORIA" = p_categoria);
END;
$$;
