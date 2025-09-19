-- Eliminar la función existente
DROP FUNCTION IF EXISTS "public"."get_ventas_ventas_mapa_venezuela"(
    "p_mes" "text", 
    "p_aliado" "text", 
    "p_sucursal" "text", 
    "p_marca" "text", 
    "p_dep" "text", 
    "p_gpo" "text", 
    "p_cat" "text", 
    "p_ver" "text", 
    "p_presentacion" "text"
);

-- Crear la nueva función con tipos corregidos
CREATE OR REPLACE FUNCTION "public"."get_ventas_ventas_mapa_venezuela"(
    "p_mes" "text" DEFAULT 'All'::"text", 
    "p_aliado" "text" DEFAULT 'All'::"text", 
    "p_sucursal" "text" DEFAULT 'All'::"text", 
    "p_marca" "text" DEFAULT 'All'::"text", 
    "p_dep" "text" DEFAULT 'All'::"text", 
    "p_gpo" "text" DEFAULT 'All'::"text", 
    "p_cat" "text" DEFAULT 'All'::"text", 
    "p_ver" "text" DEFAULT 'All'::"text", 
    "p_presentacion" "text" DEFAULT 'All'::"text"
) 
RETURNS TABLE("ESTADO" "text", "ESTADO2" "text", "RATIO_ACT" numeric)
LANGUAGE "plpgsql"
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        estado as "ESTADO",
        estado as "ESTADO2",
        SUM(ratio_act::numeric) as "RATIO_ACT"
    FROM "HOMOLOGACIONVTA" 
    WHERE estado IS NOT NULL
      AND (p_mes = 'All' OR mes = p_mes)
      AND (p_aliado = 'All' OR aliado = p_aliado)
      AND (p_sucursal = 'All' OR sucursal = p_sucursal)
      AND (p_marca = 'All' OR marca = p_marca)
      AND (p_dep = 'All' OR dep = p_dep)
      AND (p_gpo = 'All' OR gpo = p_gpo)
      AND (p_cat = 'All' OR cat = p_cat)
      AND (p_ver = 'All' OR ver = p_ver)
      AND (p_presentacion = 'All' OR presentacion::text = p_presentacion)
    GROUP BY estado
    ORDER BY estado;
END;
$$;

-- Otorgar permisos
GRANT ALL ON FUNCTION "public"."get_ventas_ventas_mapa_venezuela"(
    "p_mes" "text", 
    "p_aliado" "text", 
    "p_sucursal" "text", 
    "p_marca" "text", 
    "p_dep" "text", 
    "p_gpo" "text", 
    "p_cat" "text", 
    "p_ver" "text", 
    "p_presentacion" "text"
) TO "anon";

GRANT ALL ON FUNCTION "public"."get_ventas_ventas_mapa_venezuela"(
    "p_mes" "text", 
    "p_aliado" "text", 
    "p_sucursal" "text", 
    "p_marca" "text", 
    "p_dep" "text", 
    "p_gpo" "text", 
    "p_cat" "text", 
    "p_ver" "text", 
    "p_presentacion" "text"
) TO "authenticated";

GRANT ALL ON FUNCTION "public"."get_ventas_ventas_mapa_venezuela"(
    "p_mes" "text", 
    "p_aliado" "text", 
    "p_sucursal" "text", 
    "p_marca" "text", 
    "p_dep" "text", 
    "p_gpo" "text", 
    "p_cat" "text", 
    "p_ver" "text", 
    "p_presentacion" "text"
) TO "service_role";