-- Corregir función get_ventas_detallado_grupo_mes para aplicar filtros de rubro y consumo masivo

DROP FUNCTION IF EXISTS get_ventas_detallado_grupo_mes(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

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
    AND (p_rubro = 'All' OR h.dep = p_rubro)
    AND (p_consumo_masivo = 'All' OR h.cat = p_consumo_masivo)
    AND (p_version = 'All' OR h.ver = p_version)
    AND (p_presentacion = 'All' OR h.presentacion::TEXT = p_presentacion)
    AND (p_estado = 'All' OR h.estado = p_estado)
  GROUP BY h.mes, h.gpo
  ORDER BY h.mes, h.gpo;
END;
$$;

-- Otorgar permisos
GRANT ALL ON FUNCTION get_ventas_detallado_grupo_mes(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon;

GRANT ALL ON FUNCTION get_ventas_detallado_grupo_mes(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;

GRANT ALL ON FUNCTION get_ventas_detallado_grupo_mes(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO service_role;

-- También corregir función get_ventas_grupo_anio_data para aplicar filtros de rubro y consumo masivo

DROP FUNCTION IF EXISTS get_ventas_grupo_anio_data(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

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
    AND (p_rubro = 'All' OR h.dep = p_rubro)
    AND (p_consumo_masivo = 'All' OR h.cat = p_consumo_masivo)
    AND (p_version = 'All' OR h.ver = p_version)
    AND (p_presentacion = 'All' OR h.presentacion::TEXT = p_presentacion)
    AND (p_estado = 'All' OR h.estado = p_estado)
  GROUP BY h.gpo
  ORDER BY h.gpo;
END;
$$;

-- Otorgar permisos para get_ventas_grupo_anio_data
GRANT ALL ON FUNCTION get_ventas_grupo_anio_data(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon;

GRANT ALL ON FUNCTION get_ventas_grupo_anio_data(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;

GRANT ALL ON FUNCTION get_ventas_grupo_anio_data(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO service_role;
