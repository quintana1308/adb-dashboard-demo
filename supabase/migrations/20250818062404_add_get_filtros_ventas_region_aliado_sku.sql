-- Crear la función get_filtros_ventas_region_aliado_sku
CREATE OR REPLACE FUNCTION "public"."get_filtros_ventas_region_aliado_sku"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN json_build_object(
    'rubro', (
      SELECT json_agg(dep ORDER BY dep) 
      FROM (SELECT DISTINCT dep FROM "HOMOLOGACIONVTA" WHERE dep IS NOT NULL) t
    ),
    'portafolio_interno', (
      SELECT json_agg(gpo ORDER BY gpo) 
      FROM (SELECT DISTINCT gpo FROM "HOMOLOGACIONVTA" WHERE gpo IS NOT NULL) t
    ),
    'consumo_masivo', (
      SELECT json_agg(cat ORDER BY cat) 
      FROM (SELECT DISTINCT cat FROM "HOMOLOGACIONVTA" WHERE cat IS NOT NULL) t
    ),
    'marca', (
      SELECT json_agg(marca ORDER BY marca) 
      FROM (SELECT DISTINCT marca FROM "HOMOLOGACIONVTA" WHERE marca IS NOT NULL) t
    ),
    'version', (
      SELECT json_agg(ver ORDER BY ver) 
      FROM (SELECT DISTINCT ver FROM "HOMOLOGACIONVTA" WHERE ver IS NOT NULL) t
    ),
    'presentacion', (
      SELECT json_agg(presentacion ORDER BY presentacion) 
      FROM (SELECT DISTINCT presentacion FROM "HOMOLOGACIONVTA" WHERE presentacion IS NOT NULL) t
    ),
    'mes', (
      SELECT json_agg(mes ORDER BY mes) 
      FROM (SELECT DISTINCT mes FROM "HOMOLOGACIONVTA" WHERE mes IS NOT NULL) t
    ),
    'aliado', (
      SELECT json_agg(aliado ORDER BY aliado) 
      FROM (SELECT DISTINCT aliado FROM "HOMOLOGACIONVTA" WHERE aliado IS NOT NULL) t
    ),
    'sucursal', (
      SELECT json_agg(sucursal ORDER BY sucursal) 
      FROM (SELECT DISTINCT sucursal FROM "HOMOLOGACIONVTA" WHERE sucursal IS NOT NULL) t
    ),
    'region', (
      SELECT json_agg(region ORDER BY region) 
      FROM (SELECT DISTINCT region FROM "HOMOLOGACIONVTA" WHERE region IS NOT NULL) t
    ),
    'sku', (
      SELECT json_agg(sku ORDER BY sku) 
      FROM (SELECT DISTINCT sku FROM "HOMOLOGACIONVTA" WHERE sku IS NOT NULL) t
    )
  );
END;
$$;

-- Establecer el propietario de la función
ALTER FUNCTION "public"."get_filtros_ventas_region_aliado_sku"() OWNER TO "postgres";

-- Otorgar permisos a los roles necesarios
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_region_aliado_sku"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_region_aliado_sku"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_region_aliado_sku"() TO "service_role";