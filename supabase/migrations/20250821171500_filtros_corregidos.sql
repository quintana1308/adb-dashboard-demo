-- Crear nuevas funciones con nombres diferentes y columnas correctas

-- Función para filtros geográficos (sin cambios, funciona bien)
CREATE OR REPLACE FUNCTION "public"."get_filtros_geograficos_v2"(
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

-- Función para filtros de producto usando columnas REALES: dep -> cat -> gpo -> sku
CREATE OR REPLACE FUNCTION "public"."get_filtros_producto_v2"(
  p_rubro text DEFAULT NULL,
  p_categoria text DEFAULT NULL,
  p_grupo text DEFAULT NULL
) RETURNS json
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  result_json json;
  rubro_result json;
  categoria_result json;
  grupo_result json;
  sku_result json;
BEGIN
  -- Obtener rubros (dep - siempre disponible)
  SELECT json_agg(dep ORDER BY dep) INTO rubro_result
  FROM (SELECT DISTINCT dep FROM "HOMOLOGACIONVTA" WHERE dep IS NOT NULL) t;

  -- Obtener categorías (cat) filtradas por rubro
  IF p_rubro IS NOT NULL THEN
    SELECT json_agg(cat ORDER BY cat) INTO categoria_result
    FROM (SELECT DISTINCT cat FROM "HOMOLOGACIONVTA" 
          WHERE dep = p_rubro AND cat IS NOT NULL) t;
  ELSE
    SELECT json_agg(cat ORDER BY cat) INTO categoria_result
    FROM (SELECT DISTINCT cat FROM "HOMOLOGACIONVTA" WHERE cat IS NOT NULL) t;
  END IF;

  -- Obtener grupos (gpo) filtrados por rubro y categoría
  IF p_categoria IS NOT NULL THEN
    SELECT json_agg(gpo ORDER BY gpo) INTO grupo_result
    FROM (SELECT DISTINCT gpo FROM "HOMOLOGACIONVTA" 
          WHERE (p_rubro IS NULL OR dep = p_rubro)
            AND cat = p_categoria 
            AND gpo IS NOT NULL) t;
  ELSE
    SELECT json_agg(gpo ORDER BY gpo) INTO grupo_result
    FROM (SELECT DISTINCT gpo FROM "HOMOLOGACIONVTA" 
          WHERE (p_rubro IS NULL OR dep = p_rubro)
            AND gpo IS NOT NULL) t;
  END IF;

  -- Obtener SKUs filtrados por rubro, categoría y grupo
  IF p_grupo IS NOT NULL THEN
    SELECT json_agg(sku ORDER BY sku) INTO sku_result
    FROM (SELECT DISTINCT sku FROM "HOMOLOGACIONVTA" 
          WHERE (p_rubro IS NULL OR dep = p_rubro)
            AND (p_categoria IS NULL OR cat = p_categoria)
            AND gpo = p_grupo 
            AND sku IS NOT NULL) t;
  ELSE
    SELECT json_agg(sku ORDER BY sku) INTO sku_result
    FROM (SELECT DISTINCT sku FROM "HOMOLOGACIONVTA" 
          WHERE (p_rubro IS NULL OR dep = p_rubro)
            AND (p_categoria IS NULL OR cat = p_categoria)
            AND sku IS NOT NULL) t;
  END IF;

  -- Construir resultado JSON con nombres que coincidan con React
  result_json := json_build_object(
    'rubro', COALESCE(rubro_result, '[]'::json),
    'categoria', COALESCE(categoria_result, '[]'::json),
    'grupo', COALESCE(grupo_result, '[]'::json),
    'sku', COALESCE(sku_result, '[]'::json)
  );

  RETURN result_json;
END;
$$;

-- Función para filtros independientes (sin cambios)
CREATE OR REPLACE FUNCTION "public"."get_filtros_independientes_v2"() RETURNS json
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

-- Otorgar permisos para todas las funciones nuevas
GRANT ALL ON FUNCTION "public"."get_filtros_geograficos_v2"(text, text, text, text) TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_geograficos_v2"(text, text, text, text) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_geograficos_v2"(text, text, text, text) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_filtros_producto_v2"(text, text, text) TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_producto_v2"(text, text, text) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_producto_v2"(text, text, text) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_filtros_independientes_v2"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_independientes_v2"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_independientes_v2"() TO "service_role";
