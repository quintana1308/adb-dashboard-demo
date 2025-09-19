-- Crear nueva función get_act_aliados_departamentos_v2 que incluye la columna estado en los resultados
CREATE OR REPLACE FUNCTION "public"."get_act_aliados_departamentos_v2"(
  "p_mes" "text" DEFAULT NULL::"text", 
  "p_region" "text" DEFAULT NULL::"text", 
  "p_estado" "text" DEFAULT NULL::"text", 
  "p_aliado" "text" DEFAULT NULL::"text", 
  "p_sucursal" "text" DEFAULT NULL::"text", 
  "p_page" integer DEFAULT 1, 
  "p_page_size" integer DEFAULT 100, 
  "p_sort_column" "text" DEFAULT 'sucursal'::"text", 
  "p_sort_direction" "text" DEFAULT 'ASC'::"text"
) 
RETURNS TABLE(
  "sucursal" character varying, 
  "departamento" character varying, 
  "estado" character varying, 
  "mes" character varying, 
  "a2024" integer, 
  "c2024" integer, 
  "porcentaje_2024" numeric, 
  "a2025" integer, 
  "c2025" integer, 
  "porcentaje_2025" numeric, 
  "total_count" bigint
)
LANGUAGE "plpgsql"
AS $$
DECLARE
  total_records BIGINT;
  offset_val INTEGER;
  order_clause TEXT;
BEGIN
  -- Calcular el total de registros
  SELECT COUNT(*) INTO total_records
  FROM "HOMOLOGACIONACT" h
  WHERE h.tipo = 'DEP'
    AND (p_mes IS NULL OR p_mes = 'All' OR h.mes = p_mes)
    AND (p_region IS NULL OR p_region = 'All' OR h.region = p_region)
    AND (p_estado IS NULL OR p_estado = 'All' OR h.estado = p_estado)
    AND (p_aliado IS NULL OR p_aliado = 'All' OR h.aliado = p_aliado)
    AND (p_sucursal IS NULL OR p_sucursal = 'All' OR h.sucursal = p_sucursal);

  -- Calcular offset para paginación
  offset_val := (p_page - 1) * p_page_size;

  -- Construir cláusula ORDER BY dinámica con ordenamiento cronológico mejorado
  IF p_sort_column = 'sucursal' THEN
    order_clause := 'h.sucursal ' || p_sort_direction || ', h.descri ASC, CAST(h.mesid AS INTEGER) ASC';
  ELSIF p_sort_column = 'departamento' THEN
    order_clause := 'h.descri ' || p_sort_direction || ', h.sucursal ASC, CAST(h.mesid AS INTEGER) ASC';
  ELSIF p_sort_column = 'estado' THEN
    order_clause := 'h.estado ' || p_sort_direction || ', h.sucursal ASC, h.descri ASC, CAST(h.mesid AS INTEGER) ASC';
  ELSIF p_sort_column = 'mes' THEN
    -- Ordenamiento cronológico: primero por año (implícito en los datos), luego por mes
    order_clause := 'CAST(h.mesid AS INTEGER) ' || p_sort_direction || ', h.sucursal ASC, h.descri ASC';
  ELSIF p_sort_column = 'a2024' THEN
    order_clause := 'h.a2024 ' || p_sort_direction || ', h.sucursal ASC, h.descri ASC, CAST(h.mesid AS INTEGER) ASC';
  ELSIF p_sort_column = 'c2024' THEN
    order_clause := 'h.c2024 ' || p_sort_direction || ', h.sucursal ASC, h.descri ASC, CAST(h.mesid AS INTEGER) ASC';
  ELSIF p_sort_column = 'a2025' THEN
    order_clause := 'h.a2025 ' || p_sort_direction || ', h.sucursal ASC, h.descri ASC, CAST(h.mesid AS INTEGER) ASC';
  ELSIF p_sort_column = 'c2025' THEN
    order_clause := 'h.c2025 ' || p_sort_direction || ', h.sucursal ASC, h.descri ASC, CAST(h.mesid AS INTEGER) ASC';
  ELSE
    -- Ordenamiento por defecto: sucursal, departamento, mes cronológico
    order_clause := 'h.sucursal ASC, h.descri ASC, CAST(h.mesid AS INTEGER) ASC';
  END IF;

  -- Ejecutar consulta con paginación y ordenamiento cronológico mejorado
  RETURN QUERY EXECUTE
    'SELECT 
       h.sucursal,
       h.descri as departamento,
       h.estado,
       h.mes,
       h.a2024,
       h.c2024,
       ROUND(h.prom2024::NUMERIC, 2) as porcentaje_2024,
       h.a2025,
       h.c2025,
       ROUND(h.prom2025::NUMERIC, 2) as porcentaje_2025,
       $1::BIGINT as total_count
     FROM "HOMOLOGACIONACT" h
     WHERE h.tipo = ''DEP''
       AND ($2 IS NULL OR $2 = ''All'' OR h.mes = $2)
       AND ($3 IS NULL OR $3 = ''All'' OR h.region = $3)
       AND ($4 IS NULL OR $4 = ''All'' OR h.estado = $4)
       AND ($5 IS NULL OR $5 = ''All'' OR h.aliado = $5)
       AND ($6 IS NULL OR $6 = ''All'' OR h.sucursal = $6)
     ORDER BY ' || order_clause || '
     LIMIT $7 OFFSET $8'
  USING total_records, p_mes, p_region, p_estado, p_aliado, p_sucursal, p_page_size, offset_val;
END;
$$;

-- Actualizar los permisos de la función
ALTER FUNCTION "public"."get_act_aliados_departamentos_v2"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."get_act_aliados_departamentos_v2"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_act_aliados_departamentos_v2"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_act_aliados_departamentos_v2"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "service_role";
