-- Migración para agregar filtro estado a las funciones RPC de ventas
-- Elimina las funciones existentes y las recrea con el nuevo parámetro p_estado

-- 1. Eliminar funciones existentes
DROP FUNCTION IF EXISTS get_ventas_detallado_grupo_mes(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_ventas_grupo_anio_data(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_ventas_detallado_meses_2024_2025(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- 2. Recrear get_ventas_detallado_grupo_mes con filtro estado
CREATE OR REPLACE FUNCTION get_ventas_detallado_grupo_mes(
  p_mes TEXT DEFAULT 'All',
  p_aliado TEXT DEFAULT 'All',
  p_sucursal TEXT DEFAULT 'All',
  p_marca TEXT DEFAULT 'All',
  p_gpo TEXT DEFAULT 'All',
  p_rubro TEXT DEFAULT 'All',
  p_consumo_masivo TEXT DEFAULT 'All',
  p_version TEXT DEFAULT 'All',
  p_presentacion TEXT DEFAULT 'All',
  p_estado TEXT DEFAULT 'All'
)
RETURNS TABLE(
  mes TEXT,
  gpo TEXT,
  "2024" NUMERIC,
  "2025" NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.mes::TEXT,
    h.gpo::TEXT,
    SUM(h.pesoanterior::numeric) as "2024",
    SUM(h.pesoactual::numeric) as "2025"
  FROM "HOMOLOGACIONVTA" h
  WHERE h.mes IS NOT NULL 
    AND h.gpo IS NOT NULL
    AND (p_mes = 'All' OR h.mes = p_mes)
    AND (p_aliado = 'All' OR h.aliado = p_aliado)
    AND (p_sucursal = 'All' OR h.sucursal = p_sucursal)
    AND (p_marca = 'All' OR h.marca = p_marca)
    AND (p_gpo = 'All' OR h.gpo = p_gpo)
    AND (p_presentacion = 'All' OR h.presentacion::TEXT = p_presentacion)
    AND (p_estado = 'All' OR h.estado = p_estado)
  GROUP BY h.mes, h.gpo
  ORDER BY h.mes, h.gpo;
END;
$$;

-- 3. Recrear get_ventas_grupo_anio_data con filtro estado
CREATE OR REPLACE FUNCTION get_ventas_grupo_anio_data(
  p_mes TEXT DEFAULT 'All',
  p_aliado TEXT DEFAULT 'All',
  p_sucursal TEXT DEFAULT 'All',
  p_marca TEXT DEFAULT 'All',
  p_gpo TEXT DEFAULT 'All',
  p_rubro TEXT DEFAULT 'All',
  p_consumo_masivo TEXT DEFAULT 'All',
  p_version TEXT DEFAULT 'All',
  p_presentacion TEXT DEFAULT 'All',
  p_estado TEXT DEFAULT 'All'
)
RETURNS TABLE(
  gpo TEXT,
  "2024" NUMERIC,
  "2025" NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.gpo::text,
    SUM(h.pesoanterior::numeric) as "2024",
    SUM(h.pesoactual::numeric) as "2025"
  FROM "HOMOLOGACIONVTA" h
  WHERE h.gpo IS NOT NULL
    AND (p_mes = 'All' OR h.mes = p_mes)
    AND (p_aliado = 'All' OR h.aliado = p_aliado)
    AND (p_sucursal = 'All' OR h.sucursal = p_sucursal)
    AND (p_marca = 'All' OR h.marca = p_marca)
    AND (p_gpo = 'All' OR h.gpo = p_gpo)
    AND (p_presentacion = 'All' OR h.presentacion::TEXT = p_presentacion)
    AND (p_estado = 'All' OR h.estado = p_estado)
  GROUP BY h.gpo
  ORDER BY h.gpo;
END;
$$;

-- 4. Recrear get_ventas_detallado_meses_2024_2025 con filtro estado
CREATE OR REPLACE FUNCTION get_ventas_detallado_meses_2024_2025(
  p_mes TEXT DEFAULT 'All',
  p_aliado TEXT DEFAULT 'All',
  p_sucursal TEXT DEFAULT 'All',
  p_marca TEXT DEFAULT 'All',
  p_dep TEXT DEFAULT 'All',
  p_gpo TEXT DEFAULT 'All',
  p_cat TEXT DEFAULT 'All',
  p_ver TEXT DEFAULT 'All',
  p_presentacion TEXT DEFAULT 'All',
  p_estado TEXT DEFAULT 'All'
)
RETURNS TABLE(
  "MES" TEXT,
  "2024" NUMERIC,
  "2025" NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.mes::TEXT as "MES",
    SUM(h.pesoanterior::numeric) as "2024",
    SUM(h.pesoactual::numeric) as "2025"
  FROM "HOMOLOGACIONVTA" h
  WHERE h.mes IS NOT NULL 
    AND (p_mes = 'All' OR h.mes = p_mes)
    AND (p_aliado = 'All' OR h.aliado = p_aliado)
    AND (p_sucursal = 'All' OR h.sucursal = p_sucursal)
    AND (p_marca = 'All' OR h.marca = p_marca)
    AND (p_dep = 'All' OR h.dep = p_dep)
    AND (p_gpo = 'All' OR h.gpo = p_gpo)
    AND (p_cat = 'All' OR h.cat = p_cat)
    AND (p_ver = 'All' OR h.ver = p_ver)
    AND (p_presentacion = 'All' OR h.presentacion::TEXT = p_presentacion)
    AND (p_estado = 'All' OR h.estado = p_estado)
  GROUP BY h.mes
  ORDER BY 
    CASE h.mes
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