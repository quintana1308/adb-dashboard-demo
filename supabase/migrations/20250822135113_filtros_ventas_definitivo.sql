-- Función para filtros geográficos: mes -> región -> aliado -> sucursal
CREATE OR REPLACE FUNCTION "public"."get_filtros_geograficos_ventas"(
  p_mes text DEFAULT NULL,
  p_region text DEFAULT NULL,
  p_aliado text DEFAULT NULL,
  p_sucursal text DEFAULT NULL
) RETURNS json
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  result_json json;
  mes_result json;
  region_result json;
  aliado_result json;
  sucursal_result json;
BEGIN
  -- Obtener meses (siempre disponible)
  SELECT json_agg(mes ORDER BY mes) INTO mes_result
  FROM (SELECT DISTINCT mes FROM "HOMOLOGACIONVTA" WHERE mes IS NOT NULL) t;

  -- Obtener regiones filtradas por mes
  IF p_mes IS NOT NULL THEN
    SELECT json_agg(region ORDER BY region) INTO region_result
    FROM (SELECT DISTINCT region FROM "HOMOLOGACIONVTA" 
          WHERE mes = p_mes AND region IS NOT NULL) t;
  ELSE
    SELECT json_agg(region ORDER BY region) INTO region_result
    FROM (SELECT DISTINCT region FROM "HOMOLOGACIONVTA" WHERE region IS NOT NULL) t;
  END IF;

  -- Obtener aliados filtrados por mes y región
  IF p_region IS NOT NULL THEN
    SELECT json_agg(aliado ORDER BY aliado) INTO aliado_result
    FROM (SELECT DISTINCT aliado FROM "HOMOLOGACIONVTA" 
          WHERE (p_mes IS NULL OR mes = p_mes)
            AND region = p_region 
            AND aliado IS NOT NULL) t;
  ELSE
    SELECT json_agg(aliado ORDER BY aliado) INTO aliado_result
    FROM (SELECT DISTINCT aliado FROM "HOMOLOGACIONVTA" 
          WHERE (p_mes IS NULL OR mes = p_mes)
            AND aliado IS NOT NULL) t;
  END IF;

  -- Obtener sucursales filtradas por mes, región y aliado
  IF p_aliado IS NOT NULL THEN
    SELECT json_agg(sucursal ORDER BY sucursal) INTO sucursal_result
    FROM (SELECT DISTINCT sucursal FROM "HOMOLOGACIONVTA" 
          WHERE (p_mes IS NULL OR mes = p_mes)
            AND (p_region IS NULL OR region = p_region)
            AND aliado = p_aliado 
            AND sucursal IS NOT NULL) t;
  ELSE
    SELECT json_agg(sucursal ORDER BY sucursal) INTO sucursal_result
    FROM (SELECT DISTINCT sucursal FROM "HOMOLOGACIONVTA" 
          WHERE (p_mes IS NULL OR mes = p_mes)
            AND (p_region IS NULL OR region = p_region)
            AND sucursal IS NOT NULL) t;
  END IF;

  -- Construir resultado JSON
  result_json := json_build_object(
    'mes', COALESCE(mes_result, '[]'::json),
    'region', COALESCE(region_result, '[]'::json),
    'aliado', COALESCE(aliado_result, '[]'::json),
    'sucursal', COALESCE(sucursal_result, '[]'::json)
  );

  RETURN result_json;
END;
$$;

-- Función para filtros de producto: dep -> gpo -> cat -> sku
CREATE OR REPLACE FUNCTION "public"."get_filtros_producto_ventas"(
  p_dep text DEFAULT NULL,
  p_gpo text DEFAULT NULL,
  p_cat text DEFAULT NULL
) RETURNS json
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  result_json json;
  dep_result json;
  gpo_result json;
  cat_result json;
  sku_result json;
BEGIN
  -- Obtener dep (siempre disponible)
  SELECT json_agg(dep ORDER BY dep) INTO dep_result
  FROM (SELECT DISTINCT dep FROM "HOMOLOGACIONVTA" WHERE dep IS NOT NULL) t;

  -- Obtener gpo filtrado por dep
  IF p_dep IS NOT NULL THEN
    SELECT json_agg(gpo ORDER BY gpo) INTO gpo_result
    FROM (SELECT DISTINCT gpo FROM "HOMOLOGACIONVTA" 
          WHERE dep = p_dep AND gpo IS NOT NULL) t;
  ELSE
    SELECT json_agg(gpo ORDER BY gpo) INTO gpo_result
    FROM (SELECT DISTINCT gpo FROM "HOMOLOGACIONVTA" WHERE gpo IS NOT NULL) t;
  END IF;

  -- Obtener cat filtrado por dep y gpo
  IF p_gpo IS NOT NULL THEN
    SELECT json_agg(cat ORDER BY cat) INTO cat_result
    FROM (SELECT DISTINCT cat FROM "HOMOLOGACIONVTA" 
          WHERE (p_dep IS NULL OR dep = p_dep)
            AND gpo = p_gpo 
            AND cat IS NOT NULL) t;
  ELSE
    SELECT json_agg(cat ORDER BY cat) INTO cat_result
    FROM (SELECT DISTINCT cat FROM "HOMOLOGACIONVTA" 
          WHERE (p_dep IS NULL OR dep = p_dep)
            AND cat IS NOT NULL) t;
  END IF;

  -- Obtener SKUs filtrados por dep, gpo y cat
  IF p_cat IS NOT NULL THEN
    SELECT json_agg(sku ORDER BY sku) INTO sku_result
    FROM (SELECT DISTINCT sku FROM "HOMOLOGACIONVTA" 
          WHERE (p_dep IS NULL OR dep = p_dep)
            AND (p_gpo IS NULL OR gpo = p_gpo)
            AND cat = p_cat 
            AND sku IS NOT NULL) t;
  ELSE
    SELECT json_agg(sku ORDER BY sku) INTO sku_result
    FROM (SELECT DISTINCT sku FROM "HOMOLOGACIONVTA" 
          WHERE (p_dep IS NULL OR dep = p_dep)
            AND (p_gpo IS NULL OR gpo = p_gpo)
            AND sku IS NOT NULL) t;
  END IF;

  -- Construir resultado JSON
  result_json := json_build_object(
    'rubro', COALESCE(dep_result, '[]'::json),
    'portafolio_interno', COALESCE(gpo_result, '[]'::json),
    'consumo_masivo', COALESCE(cat_result, '[]'::json),
    'sku', COALESCE(sku_result, '[]'::json)
  );

  RETURN result_json;
END;
$$;

-- Función para obtener filtros independientes (marca, versión, presentación)
CREATE OR REPLACE FUNCTION "public"."get_filtros_independientes_ventas"() RETURNS json
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  result_json json;
  marca_result json;
  version_result json;
  presentacion_result json;
BEGIN
  -- Obtener marca
  SELECT json_agg(marca ORDER BY marca) INTO marca_result
  FROM (SELECT DISTINCT marca FROM "HOMOLOGACIONVTA" WHERE marca IS NOT NULL) t;

  -- Obtener versión
  SELECT json_agg(ver ORDER BY ver) INTO version_result
  FROM (SELECT DISTINCT ver FROM "HOMOLOGACIONVTA" WHERE ver IS NOT NULL) t;

  -- Obtener presentación
  SELECT json_agg(presentacion ORDER BY presentacion) INTO presentacion_result
  FROM (SELECT DISTINCT presentacion FROM "HOMOLOGACIONVTA" WHERE presentacion IS NOT NULL) t;

  -- Construir el resultado
  result_json := json_build_object(
    'marca', COALESCE(marca_result, '[]'::json),
    'version', COALESCE(version_result, '[]'::json),
    'presentacion', COALESCE(presentacion_result, '[]'::json)
  );

  RETURN result_json;
END;
$$;

-- Otorgar permisos para todas las funciones
GRANT ALL ON FUNCTION "public"."get_filtros_geograficos_ventas"(text, text, text, text) TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_geograficos_ventas"(text, text, text, text) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_geograficos_ventas"(text, text, text, text) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_filtros_producto_ventas"(text, text, text) TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_producto_ventas"(text, text, text) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_producto_ventas"(text, text, text) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_filtros_independientes_ventas"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_independientes_ventas"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_independientes_ventas"() TO "service_role";