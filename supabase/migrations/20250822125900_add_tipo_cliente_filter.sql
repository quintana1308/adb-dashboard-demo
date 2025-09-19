-- Actualizar función get_filtros_independientes_v2 para incluir tipo_cliente
CREATE OR REPLACE FUNCTION "public"."get_filtros_independientes_v2"() RETURNS json
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
  result_json json;
  marca_result json;
  version_result json;
  presentacion_result json;
  tipo_cliente_result json;
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

  -- Obtener tipo de cliente
  SELECT json_agg(tipocliente ORDER BY tipocliente) INTO tipo_cliente_result
  FROM (SELECT DISTINCT tipocliente FROM "HOMOLOGACIONVTA" WHERE tipocliente IS NOT NULL) t;

  -- Construir el resultado
  result_json := json_build_object(
    'marca', COALESCE(marca_result, '[]'::json),
    'version', COALESCE(version_result, '[]'::json),
    'presentacion', COALESCE(presentacion_result, '[]'::json),
    'tipo_cliente', COALESCE(tipo_cliente_result, '[]'::json)
  );

  RETURN result_json;
END;
$$;

-- Otorgar permisos
GRANT ALL ON FUNCTION "public"."get_filtros_independientes_v2"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_independientes_v2"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_independientes_v2"() TO "service_role";
