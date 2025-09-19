-- Función corregida para obtener filtros con dependencias
CREATE OR REPLACE FUNCTION "public"."get_filtros_ventas_dependientes"(
  p_mes text DEFAULT NULL,
  p_region text DEFAULT NULL,
  p_aliado text DEFAULT NULL,
  p_sucursal text DEFAULT NULL
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
  -- Obtener regiones filtradas
  IF p_mes IS NOT NULL AND p_mes != 'All' THEN
    SELECT json_agg(region ORDER BY region) INTO region_result
    FROM (SELECT DISTINCT region FROM "HOMOLOGACIONVTA" WHERE mes = p_mes AND region IS NOT NULL) t;
  ELSE
    SELECT json_agg(region ORDER BY region) INTO region_result
    FROM (SELECT DISTINCT region FROM "HOMOLOGACIONVTA" WHERE region IS NOT NULL) t;
  END IF;

  -- Obtener aliados filtrados
  IF p_region IS NOT NULL AND p_region != 'All' THEN
    IF p_mes IS NOT NULL AND p_mes != 'All' THEN
      SELECT json_agg(aliado ORDER BY aliado) INTO aliado_result
      FROM (SELECT DISTINCT aliado FROM "HOMOLOGACIONVTA" WHERE mes = p_mes AND region = p_region AND aliado IS NOT NULL) t;
    ELSE
      SELECT json_agg(aliado ORDER BY aliado) INTO aliado_result
      FROM (SELECT DISTINCT aliado FROM "HOMOLOGACIONVTA" WHERE region = p_region AND aliado IS NOT NULL) t;
    END IF;
  ELSE
    SELECT json_agg(aliado ORDER BY aliado) INTO aliado_result
    FROM (SELECT DISTINCT aliado FROM "HOMOLOGACIONVTA" WHERE aliado IS NOT NULL) t;
  END IF;

  -- Obtener sucursales filtradas
  IF p_aliado IS NOT NULL AND p_aliado != 'All' THEN
    SELECT json_agg(sucursal ORDER BY sucursal) INTO sucursal_result
    FROM (
      SELECT DISTINCT sucursal FROM "HOMOLOGACIONVTA" 
      WHERE 1=1
        AND (p_mes IS NULL OR p_mes = 'All' OR mes = p_mes)
        AND (p_region IS NULL OR p_region = 'All' OR region = p_region)
        AND aliado = p_aliado
        AND sucursal IS NOT NULL
    ) t;
  ELSE
    SELECT json_agg(sucursal ORDER BY sucursal) INTO sucursal_result
    FROM (SELECT DISTINCT sucursal FROM "HOMOLOGACIONVTA" WHERE sucursal IS NOT NULL) t;
  END IF;

  -- Obtener SKUs filtrados
  IF p_sucursal IS NOT NULL AND p_sucursal != 'All' THEN
    SELECT json_agg(sku ORDER BY sku) INTO sku_result
    FROM (
      SELECT DISTINCT sku FROM "HOMOLOGACIONVTA" 
      WHERE 1=1
        AND (p_mes IS NULL OR p_mes = 'All' OR mes = p_mes)
        AND (p_region IS NULL OR p_region = 'All' OR region = p_region)
        AND (p_aliado IS NULL OR p_aliado = 'All' OR aliado = p_aliado)
        AND sucursal = p_sucursal
        AND sku IS NOT NULL
    ) t;
  ELSE
    SELECT json_agg(sku ORDER BY sku) INTO sku_result
    FROM (SELECT DISTINCT sku FROM "HOMOLOGACIONVTA" WHERE sku IS NOT NULL) t;
  END IF;

  -- Obtener otros filtros (sin dependencias)
  SELECT json_agg(dep ORDER BY dep) INTO rubro_result
  FROM (SELECT DISTINCT dep FROM "HOMOLOGACIONVTA" WHERE dep IS NOT NULL) t;

  SELECT json_agg(gpo ORDER BY gpo) INTO portafolio_result
  FROM (SELECT DISTINCT gpo FROM "HOMOLOGACIONVTA" WHERE gpo IS NOT NULL) t;

  SELECT json_agg(cat ORDER BY cat) INTO consumo_result
  FROM (SELECT DISTINCT cat FROM "HOMOLOGACIONVTA" WHERE cat IS NOT NULL) t;

  SELECT json_agg(marca ORDER BY marca) INTO marca_result
  FROM (SELECT DISTINCT marca FROM "HOMOLOGACIONVTA" WHERE marca IS NOT NULL) t;

  SELECT json_agg(ver ORDER BY ver) INTO version_result
  FROM (SELECT DISTINCT ver FROM "HOMOLOGACIONVTA" WHERE ver IS NOT NULL) t;

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
    'sku', COALESCE(sku_result, '[]'::json),
    'rubro', COALESCE(rubro_result, '[]'::json),
    'portafolio_interno', COALESCE(portafolio_result, '[]'::json),
    'consumo_masivo', COALESCE(consumo_result, '[]'::json),
    'marca', COALESCE(marca_result, '[]'::json),
    'version', COALESCE(version_result, '[]'::json),
    'presentacion', COALESCE(presentacion_result, '[]'::json)
  );

  RETURN result_json;
END;
$$;

-- Otorgar permisos
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_dependientes"(text, text, text, text) TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_dependientes"(text, text, text, text) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_dependientes"(text, text, text, text) TO "service_role";
