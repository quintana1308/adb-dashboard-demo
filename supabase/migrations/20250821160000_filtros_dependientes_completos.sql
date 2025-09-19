-- Función completa para obtener filtros con todas las dependencias
CREATE OR REPLACE FUNCTION "public"."get_filtros_ventas_dependientes"(
  p_mes text DEFAULT NULL,
  p_region text DEFAULT NULL,
  p_aliado text DEFAULT NULL,
  p_sucursal text DEFAULT NULL,
  p_rubro text DEFAULT NULL,
  p_portafolio_interno text DEFAULT NULL
) RETURNS json
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  result_json json;
  region_result json;
  aliado_result json;
  sucursal_result json;
  sku_result json;
  rubro_result json;
  portafolio_result json;
  consumo_result json;
  marca_result json;
  version_result json;
  presentacion_result json;
BEGIN
  -- Obtener regiones filtradas por mes
  IF p_mes IS NOT NULL AND p_mes != 'All' THEN
    SELECT json_agg(region ORDER BY region) INTO region_result
    FROM (SELECT DISTINCT region FROM "HOMOLOGACIONVTA" WHERE mes = p_mes AND region IS NOT NULL) t;
  ELSE
    SELECT json_agg(region ORDER BY region) INTO region_result
    FROM (SELECT DISTINCT region FROM "HOMOLOGACIONVTA" WHERE region IS NOT NULL) t;
  END IF;

  -- Obtener aliados filtrados por mes y región
  SELECT json_agg(aliado ORDER BY aliado) INTO aliado_result
  FROM (
    SELECT DISTINCT aliado FROM "HOMOLOGACIONVTA" 
    WHERE 1=1
      AND (p_mes IS NULL OR p_mes = 'All' OR mes = p_mes)
      AND (p_region IS NULL OR p_region = 'All' OR region = p_region)
      AND aliado IS NOT NULL
  ) t;

  -- Obtener sucursales filtradas por mes, región y aliado
  SELECT json_agg(sucursal ORDER BY sucursal) INTO sucursal_result
  FROM (
    SELECT DISTINCT sucursal FROM "HOMOLOGACIONVTA" 
    WHERE 1=1
      AND (p_mes IS NULL OR p_mes = 'All' OR mes = p_mes)
      AND (p_region IS NULL OR p_region = 'All' OR region = p_region)
      AND (p_aliado IS NULL OR p_aliado = 'All' OR aliado = p_aliado)
      AND sucursal IS NOT NULL
  ) t;

  -- Obtener rubros filtrados por mes, región, aliado y sucursal
  SELECT json_agg(dep ORDER BY dep) INTO rubro_result
  FROM (
    SELECT DISTINCT dep FROM "HOMOLOGACIONVTA" 
    WHERE 1=1
      AND (p_mes IS NULL OR p_mes = 'All' OR mes = p_mes)
      AND (p_region IS NULL OR p_region = 'All' OR region = p_region)
      AND (p_aliado IS NULL OR p_aliado = 'All' OR aliado = p_aliado)
      AND (p_sucursal IS NULL OR p_sucursal = 'All' OR sucursal = p_sucursal)
      AND dep IS NOT NULL
  ) t;

  -- Obtener portafolio interno filtrado por rubro y filtros anteriores
  SELECT json_agg(gpo ORDER BY gpo) INTO portafolio_result
  FROM (
    SELECT DISTINCT gpo FROM "HOMOLOGACIONVTA" 
    WHERE 1=1
      AND (p_mes IS NULL OR p_mes = 'All' OR mes = p_mes)
      AND (p_region IS NULL OR p_region = 'All' OR region = p_region)
      AND (p_aliado IS NULL OR p_aliado = 'All' OR aliado = p_aliado)
      AND (p_sucursal IS NULL OR p_sucursal = 'All' OR sucursal = p_sucursal)
      AND (p_rubro IS NULL OR p_rubro = 'All' OR dep = p_rubro)
      AND gpo IS NOT NULL
  ) t;

  -- Obtener consumo masivo filtrado por portafolio interno y filtros anteriores
  SELECT json_agg(cat ORDER BY cat) INTO consumo_result
  FROM (
    SELECT DISTINCT cat FROM "HOMOLOGACIONVTA" 
    WHERE 1=1
      AND (p_mes IS NULL OR p_mes = 'All' OR mes = p_mes)
      AND (p_region IS NULL OR p_region = 'All' OR region = p_region)
      AND (p_aliado IS NULL OR p_aliado = 'All' OR aliado = p_aliado)
      AND (p_sucursal IS NULL OR p_sucursal = 'All' OR sucursal = p_sucursal)
      AND (p_rubro IS NULL OR p_rubro = 'All' OR dep = p_rubro)
      AND (p_portafolio_interno IS NULL OR p_portafolio_interno = 'All' OR gpo = p_portafolio_interno)
      AND cat IS NOT NULL
  ) t;

  -- Obtener SKUs filtrados por todos los filtros anteriores
  SELECT json_agg(sku ORDER BY sku) INTO sku_result
  FROM (
    SELECT DISTINCT sku FROM "HOMOLOGACIONVTA" 
    WHERE 1=1
      AND (p_mes IS NULL OR p_mes = 'All' OR mes = p_mes)
      AND (p_region IS NULL OR p_region = 'All' OR region = p_region)
      AND (p_aliado IS NULL OR p_aliado = 'All' OR aliado = p_aliado)
      AND (p_sucursal IS NULL OR p_sucursal = 'All' OR sucursal = p_sucursal)
      AND sku IS NOT NULL
  ) t;

  -- Obtener marca (sin dependencias adicionales por ahora)
  SELECT json_agg(marca ORDER BY marca) INTO marca_result
  FROM (SELECT DISTINCT marca FROM "HOMOLOGACIONVTA" WHERE marca IS NOT NULL) t;

  -- Obtener versión (sin dependencias adicionales por ahora)
  SELECT json_agg(ver ORDER BY ver) INTO version_result
  FROM (SELECT DISTINCT ver FROM "HOMOLOGACIONVTA" WHERE ver IS NOT NULL) t;

  -- Obtener presentación (sin dependencias adicionales por ahora)
  SELECT json_agg(presentacion ORDER BY presentacion) INTO presentacion_result
  FROM (SELECT DISTINCT presentacion FROM "HOMOLOGACIONVTA" WHERE presentacion IS NOT NULL) t;

  -- Construir el resultado final
  result_json := json_build_object(
    'mes', (
      SELECT json_agg(mes ORDER BY mes) 
      FROM (SELECT DISTINCT mes FROM "HOMOLOGACIONVTA" WHERE mes IS NOT NULL) t
    ),
    'region', COALESCE(region_result, '[]'::json),
    'aliado', COALESCE(aliado_result, '[]'::json),
    'sucursal', COALESCE(sucursal_result, '[]'::json),
    'rubro', COALESCE(rubro_result, '[]'::json),
    'portafolio_interno', COALESCE(portafolio_result, '[]'::json),
    'consumo_masivo', COALESCE(consumo_result, '[]'::json),
    'sku', COALESCE(sku_result, '[]'::json),
    'marca', COALESCE(marca_result, '[]'::json),
    'version', COALESCE(version_result, '[]'::json),
    'presentacion', COALESCE(presentacion_result, '[]'::json)
  );

  RETURN result_json;
END;
$$;

-- Otorgar permisos
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_dependientes"(text, text, text, text, text, text) TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_dependientes"(text, text, text, text, text, text) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_dependientes"(text, text, text, text, text, text) TO "service_role";
