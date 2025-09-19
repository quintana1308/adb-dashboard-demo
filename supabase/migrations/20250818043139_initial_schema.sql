

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."execute_mysql_migration"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    response_status int;
    response_content text;
    project_url text := 'https://vgszusyipzoptbyvcjfo.supabase.co';
    service_role_key text;
    request_id bigint;
BEGIN
    -- Obtener la clave de servicio desde los secretos de Supabase
    service_role_key := current_setting('app.settings.service_role_key', true);
    
    -- Si no se puede obtener la clave, usar una variable de entorno
    IF service_role_key IS NULL OR service_role_key = '' THEN
        service_role_key := current_setting('supabase.service_role_key', true);
    END IF;
    
    -- Si aún no tenemos la clave, usar la clave anónima para testing
    IF service_role_key IS NULL OR service_role_key = '' THEN
        service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnc3p1c3lpcHpvcHRieXZjamZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NTE5NzAsImV4cCI6MjA3MDAyNzk3MH0.YcJcvEzgzwgQNXgOHZqGCJJvKPJDLKJXBGQJKQJKQJK';
    END IF;
    
    -- Ejecutar la Edge Function usando net.http_post
    SELECT request_id INTO request_id
    FROM net.http_post(
        url := project_url || '/functions/v1/mysql-data-migration',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || service_role_key,
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    );
    
    -- Esperar un momento para que se complete la request
    PERFORM pg_sleep(2);
    
    -- Obtener la respuesta
    SELECT status_code, content INTO response_status, response_content
    FROM net.http_collect_response(request_id, async := false);
    
    -- Registrar el resultado en la tabla de logs
    INSERT INTO api_logjson (
        json_enterprise,
        json_type,
        json_value,
        json_response,
        json_fechahora
    ) VALUES (
        'SYSTEM',
        'SCHEDULED_MIGRATION',
        json_build_object(
            'scheduled_at', NOW(),
            'function_url', project_url || '/functions/v1/mysql-data-migration',
            'trigger', 'manual_test',
            'request_id', request_id
        )::text,
        json_build_object(
            'http_status', response_status,
            'response', response_content
        )::text,
        NOW()
    );
    
    -- Log para debugging
    RAISE NOTICE 'Migration job executed. Status: %, Response: %', response_status, response_content;
    
EXCEPTION WHEN others THEN
    -- Registrar errores en la tabla de logs
    INSERT INTO api_logjson (
        json_enterprise,
        json_type,
        json_value,
        json_response,
        json_fechahora
    ) VALUES (
        'SYSTEM',
        'SCHEDULED_MIGRATION_ERROR',
        json_build_object(
            'scheduled_at', NOW(),
            'error_message', SQLERRM,
            'error_state', SQLSTATE
        )::text,
        json_build_object(
            'success', false,
            'error', SQLERRM
        )::text,
        NOW()
    );
    
    RAISE NOTICE 'Migration job failed: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."execute_mysql_migration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_sql"("query" "text", "params" "text"[] DEFAULT '{}'::"text"[]) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    result json;
    prepared_query text;
    i int;
BEGIN
    -- Replace parameter placeholders with actual values
    prepared_query := query;
    
    FOR i IN 1..array_length(params, 1) LOOP
        prepared_query := replace(prepared_query, '$' || i, quote_literal(params[i]));
    END LOOP;
    
    -- Execute the query and return results as JSON
    EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || prepared_query || ') t' INTO result;
    
    RETURN COALESCE(result, '[]'::json);
END;
$_$;


ALTER FUNCTION "public"."execute_sql"("query" "text", "params" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_act_aliados_departamentos"("p_mes" "text" DEFAULT NULL::"text", "p_region" "text" DEFAULT NULL::"text", "p_estado" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text", "p_sucursal" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 100, "p_sort_column" "text" DEFAULT 'sucursal'::"text", "p_sort_direction" "text" DEFAULT 'ASC'::"text") RETURNS TABLE("sucursal" character varying, "departamento" character varying, "mes" character varying, "a2024" integer, "c2024" integer, "porcentaje_2024" numeric, "a2025" integer, "c2025" integer, "porcentaje_2025" numeric, "total_count" bigint)
    LANGUAGE "plpgsql"
    AS $_$DECLARE
  total_records BIGINT;
  offset_val INTEGER;
  order_clause TEXT;
BEGIN
  -- Calcular el total de registros
  SELECT COUNT(*) INTO total_records
  FROM "HOMOLOGACIONACT" h
  WHERE h.tipo = 'DEP'
    AND (p_mes IS NULL OR h.mes = p_mes)
    AND (p_region IS NULL OR h.region = p_region)
    AND (p_estado IS NULL OR h.estado = p_estado)
    AND (p_aliado IS NULL OR h.aliado = p_aliado)
    AND (p_sucursal IS NULL OR h.sucursal = p_sucursal);

  -- Calcular offset para paginación
  offset_val := (p_page - 1) * p_page_size;

  -- Construir cláusula ORDER BY dinámica con ordenamiento cronológico mejorado
  IF p_sort_column = 'sucursal' THEN
    order_clause := 'h.sucursal ' || p_sort_direction || ', h.descri ASC, CAST(h.mesid AS INTEGER) ASC';
  ELSIF p_sort_column = 'departamento' THEN
    order_clause := 'h.descri ' || p_sort_direction || ', h.sucursal ASC, CAST(h.mesid AS INTEGER) ASC';
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
       AND ($2 IS NULL OR h.mes = $2)
       AND ($3 IS NULL OR h.region = $3)
       AND ($4 IS NULL OR h.estado = $4)
       AND ($5 IS NULL OR h.aliado = $5)
       AND ($6 IS NULL OR h.sucursal = $6)
     ORDER BY ' || order_clause || '
     LIMIT $7 OFFSET $8'
  USING total_records, p_mes, p_region, p_estado, p_aliado, p_sucursal, p_page_size, offset_val;
END;$_$;


ALTER FUNCTION "public"."get_act_aliados_departamentos"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_act_aliados_grupos"("p_mes" "text" DEFAULT NULL::"text", "p_region" "text" DEFAULT NULL::"text", "p_estado" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text", "p_sucursal" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 50, "p_sort_column" "text" DEFAULT 'sucursal'::"text", "p_sort_direction" "text" DEFAULT 'ASC'::"text") RETURNS TABLE("sucursal" character varying, "grupo" character varying, "mes" character varying, "a2024" integer, "c2024" integer, "porcentaje_2024" numeric, "a2025" integer, "c2025" integer, "porcentaje_2025" numeric, "total_count" bigint, "total_a2024" bigint, "total_c2024" bigint, "total_a2025" bigint, "total_c2025" bigint, "total_porcentaje_2024" numeric, "total_porcentaje_2025" numeric)
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  offset_val INTEGER;
  sort_clause TEXT;
  total_records BIGINT;
  sum_a2024 BIGINT;
  sum_c2024 BIGINT;
  sum_a2025 BIGINT;
  sum_c2025 BIGINT;
  avg_prom2024 NUMERIC;
  avg_prom2025 NUMERIC;
BEGIN
  offset_val := (p_page - 1) * p_page_size;
  
  sort_clause := CASE 
    WHEN p_sort_column = 'sucursal' THEN 'h.sucursal'
    WHEN p_sort_column = 'grupo' THEN 'h.descri'
    WHEN p_sort_column = 'mes' THEN 'h.mesid'
    WHEN p_sort_column = 'a2024' THEN 'h.a2024'
    WHEN p_sort_column = 'c2024' THEN 'h.c2024'
    WHEN p_sort_column = 'porcentaje_2024' THEN 'h.prom2024'
    WHEN p_sort_column = 'a2025' THEN 'h.a2025'
    WHEN p_sort_column = 'c2025' THEN 'h.c2025'
    WHEN p_sort_column = 'porcentaje_2025' THEN 'h.prom2025'
    ELSE 'h.sucursal'
  END || ' ' || CASE WHEN UPPER(p_sort_direction) = 'DESC' THEN 'DESC' ELSE 'ASC' END;

  -- Calcular totales y conteo
  SELECT 
    COUNT(*),
    SUM(h.a2024),
    SUM(h.c2024),
    SUM(h.a2025),
    SUM(h.c2025),
    CASE WHEN SUM(h.c2024) > 0 THEN ROUND((SUM(h.a2024)::NUMERIC / SUM(h.c2024)::NUMERIC * 100), 2) ELSE 0 END,
    CASE WHEN SUM(h.c2025) > 0 THEN ROUND((SUM(h.a2025)::NUMERIC / SUM(h.c2025)::NUMERIC * 100), 2) ELSE 0 END
  INTO total_records, sum_a2024, sum_c2024, sum_a2025, sum_c2025, avg_prom2024, avg_prom2025
  FROM "HOMOLOGACIONACT" h
  WHERE h.tipo = 'GPO'
    AND (p_mes IS NULL OR h.mes = p_mes)
    AND (p_region IS NULL OR h.region = p_region)
    AND (p_estado IS NULL OR h.estado = p_estado)
    AND (p_aliado IS NULL OR h.aliado = p_aliado)
    AND (p_sucursal IS NULL OR h.sucursal = p_sucursal);

  RETURN QUERY EXECUTE format('
    SELECT 
      h.sucursal,
      h.descri as grupo,
      h.mes,
      h.a2024,
      h.c2024,
      ROUND((h.prom2024::NUMERIC * 100), 2) as porcentaje_2024,
      h.a2025,
      h.c2025,
      ROUND((h.prom2025::NUMERIC * 100), 2) as porcentaje_2025,
      %L::BIGINT as total_count,
      %L::BIGINT as total_a2024,
      %L::BIGINT as total_c2024,
      %L::BIGINT as total_a2025,
      %L::BIGINT as total_c2025,
      %L::NUMERIC as total_porcentaje_2024,
      %L::NUMERIC as total_porcentaje_2025
    FROM "HOMOLOGACIONACT" h
    WHERE h.tipo = $1
      AND ($2 IS NULL OR h.mes = $2)
      AND ($3 IS NULL OR h.region = $3)
      AND ($4 IS NULL OR h.estado = $4)
      AND ($5 IS NULL OR h.aliado = $5)
      AND ($6 IS NULL OR h.sucursal = $6)
    ORDER BY %s
    LIMIT %L OFFSET %L',
    total_records, sum_a2024, sum_c2024, sum_a2025, sum_c2025, avg_prom2024, avg_prom2025, sort_clause, p_page_size, offset_val
  ) USING 'GPO', p_mes, p_region, p_estado, p_aliado, p_sucursal;
END;
$_$;


ALTER FUNCTION "public"."get_act_aliados_grupos"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_act_aliados_marcas"("p_mes" "text" DEFAULT NULL::"text", "p_region" "text" DEFAULT NULL::"text", "p_estado" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text", "p_sucursal" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 50, "p_sort_column" "text" DEFAULT 'sucursal'::"text", "p_sort_direction" "text" DEFAULT 'ASC'::"text") RETURNS TABLE("sucursal" character varying, "marca" character varying, "mes" character varying, "a2024" integer, "c2024" integer, "porcentaje_2024" numeric, "a2025" integer, "c2025" integer, "porcentaje_2025" numeric, "total_count" bigint, "total_a2024" bigint, "total_c2024" bigint, "total_a2025" bigint, "total_c2025" bigint, "total_porcentaje_2024" numeric, "total_porcentaje_2025" numeric)
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  offset_val INTEGER;
  sort_clause TEXT;
  total_records BIGINT;
  sum_a2024 BIGINT;
  sum_c2024 BIGINT;
  sum_a2025 BIGINT;
  sum_c2025 BIGINT;
  avg_prom2024 NUMERIC;
  avg_prom2025 NUMERIC;
BEGIN
  offset_val := (p_page - 1) * p_page_size;
  
  sort_clause := CASE 
    WHEN p_sort_column = 'sucursal' THEN 'h.sucursal'
    WHEN p_sort_column = 'marca' THEN 'h.descri'
    WHEN p_sort_column = 'mes' THEN 'h.mesid'
    WHEN p_sort_column = 'a2024' THEN 'h.a2024'
    WHEN p_sort_column = 'c2024' THEN 'h.c2024'
    WHEN p_sort_column = 'porcentaje_2024' THEN 'h.prom2024'
    WHEN p_sort_column = 'a2025' THEN 'h.a2025'
    WHEN p_sort_column = 'c2025' THEN 'h.c2025'
    WHEN p_sort_column = 'porcentaje_2025' THEN 'h.prom2025'
    ELSE 'h.sucursal'
  END || ' ' || CASE WHEN UPPER(p_sort_direction) = 'DESC' THEN 'DESC' ELSE 'ASC' END;

  -- Calcular totales y conteo
  SELECT 
    COUNT(*),
    SUM(h.a2024),
    SUM(h.c2024),
    SUM(h.a2025),
    SUM(h.c2025),
    CASE WHEN SUM(h.c2024) > 0 THEN ROUND((SUM(h.a2024)::NUMERIC / SUM(h.c2024)::NUMERIC * 100), 2) ELSE 0 END,
    CASE WHEN SUM(h.c2025) > 0 THEN ROUND((SUM(h.a2025)::NUMERIC / SUM(h.c2025)::NUMERIC * 100), 2) ELSE 0 END
  INTO total_records, sum_a2024, sum_c2024, sum_a2025, sum_c2025, avg_prom2024, avg_prom2025
  FROM "HOMOLOGACIONACT" h
  WHERE h.tipo = 'MAR'
    AND (p_mes IS NULL OR h.mes = p_mes)
    AND (p_region IS NULL OR h.region = p_region)
    AND (p_estado IS NULL OR h.estado = p_estado)
    AND (p_aliado IS NULL OR h.aliado = p_aliado)
    AND (p_sucursal IS NULL OR h.sucursal = p_sucursal);

  RETURN QUERY EXECUTE format('
    SELECT 
      h.sucursal,
      h.descri as marca,
      h.mes,
      h.a2024,
      h.c2024,
      ROUND((h.prom2024::NUMERIC * 100), 2) as porcentaje_2024,
      h.a2025,
      h.c2025,
      ROUND((h.prom2025::NUMERIC * 100), 2) as porcentaje_2025,
      %L::BIGINT as total_count,
      %L::BIGINT as total_a2024,
      %L::BIGINT as total_c2024,
      %L::BIGINT as total_a2025,
      %L::BIGINT as total_c2025,
      %L::NUMERIC as total_porcentaje_2024,
      %L::NUMERIC as total_porcentaje_2025
    FROM "HOMOLOGACIONACT" h
    WHERE h.tipo = $1
      AND ($2 IS NULL OR h.mes = $2)
      AND ($3 IS NULL OR h.region = $3)
      AND ($4 IS NULL OR h.estado = $4)
      AND ($5 IS NULL OR h.aliado = $5)
      AND ($6 IS NULL OR h.sucursal = $6)
    ORDER BY %s
    LIMIT %L OFFSET %L',
    total_records, sum_a2024, sum_c2024, sum_a2025, sum_c2025, avg_prom2024, avg_prom2025, sort_clause, p_page_size, offset_val
  ) USING 'MAR', p_mes, p_region, p_estado, p_aliado, p_sucursal;
END;
$_$;


ALTER FUNCTION "public"."get_act_aliados_marcas"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_act_aliados_sku"("p_mes" "text" DEFAULT NULL::"text", "p_region" "text" DEFAULT NULL::"text", "p_estado" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text", "p_sucursal" "text" DEFAULT NULL::"text", "p_sku" "text" DEFAULT NULL::"text", "p_page" integer DEFAULT 1, "p_page_size" integer DEFAULT 50, "p_sort_column" "text" DEFAULT 'sucursal'::"text", "p_sort_direction" "text" DEFAULT 'ASC'::"text") RETURNS TABLE("sucursal" character varying, "sku" character varying, "mes" character varying, "a2024" integer, "c2024" integer, "porcentaje_2024" numeric, "a2025" integer, "c2025" integer, "porcentaje_2025" numeric, "total_count" bigint, "total_a2024" bigint, "total_c2024" bigint, "total_a2025" bigint, "total_c2025" bigint, "total_porcentaje_2024" numeric, "total_porcentaje_2025" numeric)
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  offset_val INTEGER;
  sort_clause TEXT;
  total_records BIGINT;
  sum_a2024 BIGINT;
  sum_c2024 BIGINT;
  sum_a2025 BIGINT;
  sum_c2025 BIGINT;
  avg_prom2024 NUMERIC;
  avg_prom2025 NUMERIC;
BEGIN
  offset_val := (p_page - 1) * p_page_size;
  
  sort_clause := CASE 
    WHEN p_sort_column = 'sucursal' THEN 'h.sucursal'
    WHEN p_sort_column = 'sku' THEN 'h.descri'
    WHEN p_sort_column = 'mes' THEN 'h.mesid'
    WHEN p_sort_column = 'a2024' THEN 'h.a2024'
    WHEN p_sort_column = 'c2024' THEN 'h.c2024'
    WHEN p_sort_column = 'porcentaje_2024' THEN 'h.prom2024'
    WHEN p_sort_column = 'a2025' THEN 'h.a2025'
    WHEN p_sort_column = 'c2025' THEN 'h.c2025'
    WHEN p_sort_column = 'porcentaje_2025' THEN 'h.prom2025'
    ELSE 'h.sucursal'
  END || ' ' || CASE WHEN UPPER(p_sort_direction) = 'DESC' THEN 'DESC' ELSE 'ASC' END;

  -- Calcular totales y conteo
  SELECT 
    COUNT(*),
    SUM(h.a2024),
    SUM(h.c2024),
    SUM(h.a2025),
    SUM(h.c2025),
    CASE WHEN SUM(h.c2024) > 0 THEN ROUND((SUM(h.a2024)::NUMERIC / SUM(h.c2024)::NUMERIC * 100), 2) ELSE 0 END,
    CASE WHEN SUM(h.c2025) > 0 THEN ROUND((SUM(h.a2025)::NUMERIC / SUM(h.c2025)::NUMERIC * 100), 2) ELSE 0 END
  INTO total_records, sum_a2024, sum_c2024, sum_a2025, sum_c2025, avg_prom2024, avg_prom2025
  FROM "HOMOLOGACIONACT" h
  WHERE h.tipo = 'SKU'
    AND (p_mes IS NULL OR h.mes = p_mes)
    AND (p_region IS NULL OR h.region = p_region)
    AND (p_estado IS NULL OR h.estado = p_estado)
    AND (p_aliado IS NULL OR h.aliado = p_aliado)
    AND (p_sucursal IS NULL OR h.sucursal = p_sucursal)
    AND (p_sku IS NULL OR h.descri ILIKE '%' || p_sku || '%');

  RETURN QUERY EXECUTE format('
    SELECT 
      h.sucursal,
      h.descri as sku,
      h.mes,
      h.a2024,
      h.c2024,
      ROUND((h.prom2024::NUMERIC * 100), 2) as porcentaje_2024,
      h.a2025,
      h.c2025,
      ROUND((h.prom2025::NUMERIC * 100), 2) as porcentaje_2025,
      %L::BIGINT as total_count,
      %L::BIGINT as total_a2024,
      %L::BIGINT as total_c2024,
      %L::BIGINT as total_a2025,
      %L::BIGINT as total_c2025,
      %L::NUMERIC as total_porcentaje_2024,
      %L::NUMERIC as total_porcentaje_2025
    FROM "HOMOLOGACIONACT" h
    WHERE h.tipo = $7
      AND ($1 IS NULL OR h.mes = $1)
      AND ($2 IS NULL OR h.region = $2)
      AND ($3 IS NULL OR h.estado = $3)
      AND ($4 IS NULL OR h.aliado = $4)
      AND ($5 IS NULL OR h.sucursal = $5)
      AND ($6 IS NULL OR h.descri ILIKE $8 || $6 || $9)
    ORDER BY %s
    LIMIT %L OFFSET %L',
    total_records, sum_a2024, sum_c2024, sum_a2025, sum_c2025, avg_prom2024, avg_prom2025, sort_clause, p_page_size, offset_val
  ) USING p_mes, p_region, p_estado, p_aliado, p_sucursal, p_sku, 'SKU', '%', '%';
END;
$_$;


ALTER FUNCTION "public"."get_act_aliados_sku"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_sku" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_filtros_activacion"("p_tipo" "text") RETURNS TABLE("campo" "text", "valores" "text"[])
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
    -- Meses ordenados por orden cronológico
    SELECT 'mes'::TEXT as campo, 
           ARRAY(
             SELECT mes::TEXT 
             FROM (
               SELECT DISTINCT mes,
                 CASE mes
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
                   ELSE 13
                 END as orden_mes
               FROM "HOMOLOGACIONACT" 
               WHERE tipo = p_tipo AND mes IS NOT NULL
             ) t
             ORDER BY orden_mes
           ) as valores
    UNION ALL
    -- Regiones
    SELECT 'region'::TEXT as campo, 
           ARRAY(SELECT DISTINCT region::TEXT FROM "HOMOLOGACIONACT" 
                 WHERE tipo = p_tipo AND region IS NOT NULL 
                 ORDER BY region::TEXT) as valores
    UNION ALL
    -- Estados
    SELECT 'estado'::TEXT as campo, 
           ARRAY(SELECT DISTINCT estado::TEXT FROM "HOMOLOGACIONACT" 
                 WHERE tipo = p_tipo AND estado IS NOT NULL 
                 ORDER BY estado::TEXT) as valores
    UNION ALL
    -- Aliados
    SELECT 'aliado'::TEXT as campo, 
           ARRAY(SELECT DISTINCT aliado::TEXT FROM "HOMOLOGACIONACT" 
                 WHERE tipo = p_tipo AND aliado IS NOT NULL 
                 ORDER BY aliado::TEXT) as valores
    UNION ALL
    -- Sucursales
    SELECT 'sucursal'::TEXT as campo, 
           ARRAY(SELECT DISTINCT sucursal::TEXT FROM "HOMOLOGACIONACT" 
                 WHERE tipo = p_tipo AND sucursal IS NOT NULL 
                 ORDER BY sucursal::TEXT) as valores
    UNION ALL
    -- Descripción (departamento/grupo/marca) usando la columna 'descri'
    SELECT CASE 
             WHEN p_tipo = 'DEP' THEN 'departamento'
             WHEN p_tipo = 'GPO' THEN 'grupo'
             WHEN p_tipo = 'MAR' THEN 'marca'
             WHEN p_tipo = 'SKU' THEN 'sku'
           END::TEXT as campo,
           ARRAY(SELECT DISTINCT descri::TEXT 
                 FROM "HOMOLOGACIONACT" 
                 WHERE tipo = p_tipo AND descri IS NOT NULL 
                 ORDER BY descri::TEXT) as valores;
END;
$$;


ALTER FUNCTION "public"."get_filtros_activacion"("p_tipo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_filtros_ventas_consolidado"() RETURNS TABLE("campo" "text", "valores" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Obtener meses únicos
  RETURN QUERY
  SELECT 
    'mes'::TEXT as campo,
    jsonb_agg(DISTINCT jsonb_build_object('mes', mes) ORDER BY jsonb_build_object('mes', mes)) as valores
  FROM "HOMOLOGACIONVTA"
  WHERE mes IS NOT NULL 
    AND mes != '' 
    AND pesoactual > 0;

  -- Obtener aliados únicos (rubros/dep)
  RETURN QUERY
  SELECT 
    'aliado'::TEXT as campo,
    jsonb_agg(DISTINCT jsonb_build_object('aliado', dep) ORDER BY jsonb_build_object('aliado', dep)) as valores
  FROM "HOMOLOGACIONVTA"
  WHERE dep IS NOT NULL 
    AND dep != '' 
    AND pesoactual > 0;

  -- Obtener marcas únicas
  RETURN QUERY
  SELECT 
    'marca'::TEXT as campo,
    jsonb_agg(DISTINCT jsonb_build_object('marca', marca) ORDER BY jsonb_build_object('marca', marca)) as valores
  FROM "HOMOLOGACIONVTA"
  WHERE marca IS NOT NULL 
    AND marca != '' 
    AND pesoactual > 0;

  RETURN;
END;
$$;


ALTER FUNCTION "public"."get_filtros_ventas_consolidado"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_filtros_ventas_region_aliados_sku"() RETURNS json
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


ALTER FUNCTION "public"."get_filtros_ventas_region_aliados_sku"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_filtros_ventas_region_gpo_tiponegocio"() RETURNS json
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
    )
  );
END;
$$;


ALTER FUNCTION "public"."get_filtros_ventas_region_gpo_tiponegocio"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_filtros_ventas_ventas"() RETURNS json
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
    )
  );
END;
$$;


ALTER FUNCTION "public"."get_filtros_ventas_ventas"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_consolidado_dashboard"("p_mes" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text", "p_marca" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'toneladas', (SELECT * FROM get_ventas_consolidado_total_toneladas(p_mes, p_aliado, p_marca)),
    'cajas', (SELECT * FROM get_ventas_consolidado_total_cajas(p_mes, p_aliado, p_marca)),
    'top_aliados', (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM get_ventas_consolidado_top_aliados(p_mes, p_aliado, p_marca)) t),
    'top_productos', (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM get_ventas_consolidado_top_productos_gpo(p_mes, p_aliado, p_marca)) t),
    'productos_porcentaje', (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM get_ventas_consolidado_productos_porcentaje(p_mes, p_aliado, p_marca)) t)
  ) INTO result;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_ventas_consolidado_dashboard"("p_mes" "text", "p_aliado" "text", "p_marca" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_consolidado_inicio_sincronizacion"("p_mes" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text", "p_marca" "text" DEFAULT NULL::"text") RETURNS timestamp without time zone
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result TIMESTAMP;
  sql_query TEXT;
BEGIN
  sql_query := 'SELECT MIN(upd_sincro) FROM "HOMOLOGACIONVTA" WHERE 1=1';
  
  IF p_mes IS NOT NULL AND p_mes != 'All' THEN
    sql_query := sql_query || ' AND mes = ' || quote_literal(p_mes);
  END IF;
  
  IF p_aliado IS NOT NULL AND p_aliado != 'All' THEN
    sql_query := sql_query || ' AND aliado = ' || quote_literal(p_aliado);
  END IF;
  
  IF p_marca IS NOT NULL AND p_marca != 'All' THEN
    sql_query := sql_query || ' AND marca = ' || quote_literal(p_marca);
  END IF;
  
  EXECUTE sql_query INTO result;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_ventas_consolidado_inicio_sincronizacion"("p_mes" "text", "p_aliado" "text", "p_marca" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_consolidado_productos_porcentaje"("p_mes" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text", "p_marca" "text" DEFAULT NULL::"text") RETURNS TABLE("grupo" character varying, "porcentaje" numeric)
    LANGUAGE "plpgsql"
    AS $$DECLARE
  sql_query TEXT;
  where_clause TEXT := '';
BEGIN
  -- Construir la cláusula WHERE dinámicamente
  IF p_mes IS NOT NULL AND p_mes != 'All' THEN
    where_clause := where_clause || ' AND mes = ' || quote_literal(p_mes);
  END IF;
  
  IF p_aliado IS NOT NULL AND p_aliado != 'All' THEN
    where_clause := where_clause || ' AND dep = ' || quote_literal(p_aliado);
  END IF;
  
  IF p_marca IS NOT NULL AND p_marca != 'All' THEN
    where_clause := where_clause || ' AND marca = ' || quote_literal(p_marca);
  END IF;
  
  -- Construir la consulta completa
  sql_query := '
    SELECT 
      gpo as grupo,
      ROUND((SUM(pesoactual) * 100.0 / 
        (SELECT SUM(pesoactual) FROM "HOMOLOGACIONVTA" WHERE pesoactual > 0' || where_clause || ')
      ), 2) as porcentaje
    FROM "HOMOLOGACIONVTA"
    WHERE pesoactual > 0' || where_clause || '
    GROUP BY gpo 
    ORDER BY gpo ASC
  ';
  
  RETURN QUERY EXECUTE sql_query;
END;$$;


ALTER FUNCTION "public"."get_ventas_consolidado_productos_porcentaje"("p_mes" "text", "p_aliado" "text", "p_marca" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_consolidado_top_aliados"("p_mes" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text", "p_marca" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 10) RETURNS TABLE("aliado" character varying, "año" integer, "toneladas" numeric, "cajas" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  sql_query TEXT;
  where_clause TEXT := '';
BEGIN
  -- Construir la cláusula WHERE dinámicamente
  IF p_mes IS NOT NULL AND p_mes != 'All' THEN
    where_clause := where_clause || ' AND mes = ' || quote_literal(p_mes);
  END IF;
  
  IF p_aliado IS NOT NULL AND p_aliado != 'All' THEN
    where_clause := where_clause || ' AND h.dep = ' || quote_literal(p_aliado);
  END IF;
  
  IF p_marca IS NOT NULL AND p_marca != 'All' THEN
    where_clause := where_clause || ' AND marca = ' || quote_literal(p_marca);
  END IF;
  
  -- Construir la consulta que usa pesoanterior (2024) y pesoactual (2025)
  sql_query := '
    WITH top_aliados AS (
      SELECT h.aliado
      FROM "HOMOLOGACIONVTA" h
      WHERE 1=1' || where_clause || '
      GROUP BY h.aliado
      ORDER BY SUM(h.pesoactual) DESC
      LIMIT ' || p_limit || '
    ),
    datos_consolidados AS (
      SELECT 
        h.aliado,
        ROUND(SUM(h.pesoanterior), 2) as toneladas_2024,
        ROUND(SUM(h.pesoactual), 2) as toneladas_2025,
        ROUND(SUM(h.cajasanterior), 2) as cajas_2024,
        ROUND(SUM(h.cajasactual), 2) as cajas_2025
      FROM "HOMOLOGACIONVTA" h
      INNER JOIN top_aliados ta ON h.aliado = ta.aliado
      WHERE 1=1' || where_clause || '
      GROUP BY h.aliado
    )
    SELECT 
      d.aliado,
      2024 as año,
      d.toneladas_2024 as toneladas,
      d.cajas_2024 as cajas
    FROM datos_consolidados d
    
    UNION ALL
    
    SELECT 
      d.aliado,
      2025 as año,
      d.toneladas_2025 as toneladas,
      d.cajas_2025 as cajas
    FROM datos_consolidados d
    
    ORDER BY aliado, año
  ';
  
  RETURN QUERY EXECUTE sql_query;
END;
$$;


ALTER FUNCTION "public"."get_ventas_consolidado_top_aliados"("p_mes" "text", "p_aliado" "text", "p_marca" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_consolidado_top_productos_gpo"("p_mes" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text", "p_marca" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 15) RETURNS TABLE("gpo" character varying, "toneladas" numeric, "porcentaje" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  base_query TEXT;
  where_conditions TEXT := '';
BEGIN
  -- Construir condiciones WHERE dinámicamente
  IF p_mes IS NOT NULL AND p_mes != 'All' THEN
    where_conditions := where_conditions || ' AND mes = ''' || p_mes || '''';
  END IF;
  
  IF p_aliado IS NOT NULL AND p_aliado != 'All' THEN
    where_conditions := where_conditions || ' AND dep = ''' || p_aliado || '''';
  END IF;
  
  IF p_marca IS NOT NULL AND p_marca != 'All' THEN
    where_conditions := where_conditions || ' AND marca = ''' || p_marca || '''';
  END IF;

  -- Query principal con subconsulta para calcular porcentajes
  base_query := '
    SELECT 
      gpo,
      ROUND(SUM(pesoactual), 2) as toneladas,
      ROUND((SUM(pesoactual) * 100.0 / 
        (SELECT SUM(pesoactual) 
         FROM "HOMOLOGACIONVTA" 
         WHERE pesoactual > 0' || where_conditions || ')
      ), 2) as porcentaje
    FROM "HOMOLOGACIONVTA"
    WHERE pesoactual > 0' || where_conditions || '
    GROUP BY gpo 
    ORDER BY SUM(pesoactual) DESC
    LIMIT ' || p_limit;

  -- Ejecutar la consulta y retornar resultados
  RETURN QUERY EXECUTE base_query;
END;
$$;


ALTER FUNCTION "public"."get_ventas_consolidado_top_productos_gpo"("p_mes" "text", "p_aliado" "text", "p_marca" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_consolidado_total_cajas"("p_mes" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text", "p_marca" "text" DEFAULT NULL::"text") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result DECIMAL(10,2);
  sql_query TEXT;
BEGIN
  sql_query := 'SELECT ROUND(COALESCE(SUM(cajasactual), 0), 2) FROM "HOMOLOGACIONVTA" WHERE 1=1';
  
  IF p_mes IS NOT NULL AND p_mes != 'All' THEN
    sql_query := sql_query || ' AND mes = ' || quote_literal(p_mes);
  END IF;
  
  IF p_aliado IS NOT NULL AND p_aliado != 'All' THEN
    sql_query := sql_query || ' AND dep = ' || quote_literal(p_aliado);
  END IF;
  
  IF p_marca IS NOT NULL AND p_marca != 'All' THEN
    sql_query := sql_query || ' AND marca = ' || quote_literal(p_marca);
  END IF;
  
  EXECUTE sql_query INTO result;
  
  RETURN COALESCE(result, 0);
END;
$$;


ALTER FUNCTION "public"."get_ventas_consolidado_total_cajas"("p_mes" "text", "p_aliado" "text", "p_marca" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_consolidado_total_toneladas"("p_mes" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text", "p_marca" "text" DEFAULT NULL::"text") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result DECIMAL(10,2);
  sql_query TEXT;
BEGIN
  sql_query := 'SELECT ROUND(COALESCE(SUM(pesoactual), 0), 2) FROM "HOMOLOGACIONVTA" WHERE 1=1';
  
  IF p_mes IS NOT NULL AND p_mes != 'All' THEN
    sql_query := sql_query || ' AND mes = ' || quote_literal(p_mes);
  END IF;
  
  IF p_aliado IS NOT NULL AND p_aliado != 'All' THEN
    sql_query := sql_query || ' AND dep = ' || quote_literal(p_aliado);
  END IF;
  
  IF p_marca IS NOT NULL AND p_marca != 'All' THEN
    sql_query := sql_query || ' AND marca = ' || quote_literal(p_marca);
  END IF;
  
  EXECUTE sql_query INTO result;
  
  RETURN COALESCE(result, 0);
END;
$$;


ALTER FUNCTION "public"."get_ventas_consolidado_total_toneladas"("p_mes" "text", "p_aliado" "text", "p_marca" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_detallado_grupo_mes"("p_mes" "text" DEFAULT 'All'::"text", "p_aliado" "text" DEFAULT 'All'::"text", "p_sucursal" "text" DEFAULT 'All'::"text", "p_marca" "text" DEFAULT 'All'::"text", "p_gpo" "text" DEFAULT 'All'::"text", "p_rubro" "text" DEFAULT 'All'::"text", "p_consumo_masivo" "text" DEFAULT 'All'::"text", "p_version" "text" DEFAULT 'All'::"text", "p_presentacion" "text" DEFAULT 'All'::"text") RETURNS TABLE("mes" "text", "gpo" "text", "2024" numeric, "2025" numeric)
    LANGUAGE "plpgsql"
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
  GROUP BY h.mes, h.gpo
  ORDER BY h.mes, h.gpo;
END;
$$;


ALTER FUNCTION "public"."get_ventas_detallado_grupo_mes"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_gpo" "text", "p_rubro" "text", "p_consumo_masivo" "text", "p_version" "text", "p_presentacion" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_detallado_meses_2024_2025"("p_mes" "text" DEFAULT 'All'::"text", "p_aliado" "text" DEFAULT 'All'::"text", "p_sucursal" "text" DEFAULT 'All'::"text", "p_marca" "text" DEFAULT 'All'::"text", "p_dep" "text" DEFAULT 'All'::"text", "p_gpo" "text" DEFAULT 'All'::"text", "p_cat" "text" DEFAULT 'All'::"text", "p_ver" "text" DEFAULT 'All'::"text", "p_presentacion" "text" DEFAULT 'All'::"text") RETURNS TABLE("MES" "text", "2024" numeric, "2025" numeric)
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."get_ventas_detallado_meses_2024_2025"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_dep" "text", "p_gpo" "text", "p_cat" "text", "p_ver" "text", "p_presentacion" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_grupo"("p_mes" "text"[] DEFAULT NULL::"text"[], "p_aliado" "text"[] DEFAULT NULL::"text"[], "p_sucursal" "text"[] DEFAULT NULL::"text"[], "p_marca" "text"[] DEFAULT NULL::"text"[], "p_rubro" "text"[] DEFAULT NULL::"text"[], "p_portafolio_interno" "text"[] DEFAULT NULL::"text"[], "p_consumo_masivo" "text"[] DEFAULT NULL::"text"[], "p_version" "text"[] DEFAULT NULL::"text"[], "p_presentacion" numeric[] DEFAULT NULL::numeric[], "p_region" "text"[] DEFAULT NULL::"text"[]) RETURNS TABLE("2024" numeric, "2025" numeric, "GPO" character varying)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(pesoanterior::numeric) as "2024",
    SUM(pesoactual::numeric) as "2025",
    gpo as "GPO"
  FROM "HOMOLOGACIONVTA" 
  WHERE gpo IS NOT NULL
    AND (p_mes IS NULL OR mes = ANY(p_mes))
    AND (p_aliado IS NULL OR aliado = ANY(p_aliado))
    AND (p_sucursal IS NULL OR sucursal = ANY(p_sucursal))
    AND (p_marca IS NULL OR marca = ANY(p_marca))
    AND (p_rubro IS NULL OR dep = ANY(p_rubro))
    AND (p_portafolio_interno IS NULL OR gpo = ANY(p_portafolio_interno))
    AND (p_consumo_masivo IS NULL OR cat = ANY(p_consumo_masivo))
    AND (p_version IS NULL OR ver = ANY(p_version))
    AND (p_presentacion IS NULL OR presentacion = ANY(p_presentacion))
    AND (p_region IS NULL OR region = ANY(p_region))
  GROUP BY gpo
  ORDER BY gpo;
END;
$$;


ALTER FUNCTION "public"."get_ventas_grupo"("p_mes" "text"[], "p_aliado" "text"[], "p_sucursal" "text"[], "p_marca" "text"[], "p_rubro" "text"[], "p_portafolio_interno" "text"[], "p_consumo_masivo" "text"[], "p_version" "text"[], "p_presentacion" numeric[], "p_region" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_grupo_anio_data"("p_mes" "text" DEFAULT 'All'::"text", "p_aliado" "text" DEFAULT 'All'::"text", "p_sucursal" "text" DEFAULT 'All'::"text", "p_marca" "text" DEFAULT 'All'::"text", "p_gpo" "text" DEFAULT 'All'::"text", "p_rubro" "text" DEFAULT 'All'::"text", "p_consumo_masivo" "text" DEFAULT 'All'::"text", "p_version" "text" DEFAULT 'All'::"text", "p_presentacion" "text" DEFAULT 'All'::"text") RETURNS TABLE("gpo" "text", "2024" numeric, "2025" numeric)
    LANGUAGE "plpgsql"
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
  GROUP BY h.gpo
  ORDER BY h.gpo;
END;
$$;


ALTER FUNCTION "public"."get_ventas_grupo_anio_data"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_gpo" "text", "p_rubro" "text", "p_consumo_masivo" "text", "p_version" "text", "p_presentacion" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_region_tipo_cliente_data"("p_mes" "text" DEFAULT 'All'::"text", "p_aliado" "text" DEFAULT 'All'::"text", "p_sucursal" "text" DEFAULT 'All'::"text", "p_marca" "text" DEFAULT 'All'::"text", "p_rubro" "text" DEFAULT 'All'::"text", "p_portafolio_interno" "text" DEFAULT 'All'::"text", "p_consumo_masivo" "text" DEFAULT 'All'::"text", "p_version" "text" DEFAULT 'All'::"text", "p_presentacion" "text" DEFAULT 'All'::"text", "p_region" "text" DEFAULT 'All'::"text") RETURNS TABLE("TIPO CLIENTE" character varying, "2024 (%)" numeric, "2024" numeric, "2025 (%)" numeric, "2025" numeric, "DIFERENCIA" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hv.tipocliente as "TIPO CLIENTE",
        CASE 
            WHEN (SELECT SUM(pesoanterior::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoanterior IS NOT NULL) > 0 THEN
                SUM(hv.pesoanterior::numeric) / (SELECT SUM(pesoanterior::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoanterior IS NOT NULL)
            ELSE 0::numeric
        END as "2024 (%)",
        SUM(hv.pesoanterior::numeric) as "2024",
        CASE 
            WHEN (SELECT SUM(pesoactual::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoactual IS NOT NULL) > 0 THEN
                SUM(hv.pesoactual::numeric) / (SELECT SUM(pesoactual::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoactual IS NOT NULL)
            ELSE 0::numeric
        END as "2025 (%)",
        SUM(hv.pesoactual::numeric) as "2025",
        CASE 
            WHEN SUM(hv.pesoanterior::numeric) > 0 THEN 
                (SUM(hv.pesoactual::numeric) - SUM(hv.pesoanterior::numeric)) / SUM(hv.pesoanterior::numeric)
            ELSE NULL 
        END as "DIFERENCIA"
    FROM "HOMOLOGACIONVTA" hv
    WHERE hv.tipocliente IS NOT NULL
        AND (p_mes = 'All' OR hv.mes = p_mes)
        AND (p_aliado = 'All' OR hv.aliado = p_aliado)
        AND (p_sucursal = 'All' OR hv.sucursal = p_sucursal)
        AND (p_marca = 'All' OR hv.marca = p_marca)
        AND (p_rubro = 'All' OR hv.dep = p_rubro)
        AND (p_portafolio_interno = 'All' OR hv.gpo = p_portafolio_interno)
        AND (p_consumo_masivo = 'All' OR hv.cat = p_consumo_masivo)
        AND (p_version = 'All' OR hv.ver = p_version)
        AND (p_presentacion = 'All' OR hv.presentacion::text = p_presentacion)
        AND (p_region = 'All' OR hv.region = p_region)
    GROUP BY hv.tipocliente
    ORDER BY hv.tipocliente;
END;
$$;


ALTER FUNCTION "public"."get_ventas_region_tipo_cliente_data"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_rubro" "text", "p_portafolio_interno" "text", "p_consumo_masivo" "text", "p_version" "text", "p_presentacion" "text", "p_region" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_region_tipo_cliente_detallado"("p_mes" "text"[] DEFAULT NULL::"text"[], "p_aliado" "text"[] DEFAULT NULL::"text"[], "p_sucursal" "text"[] DEFAULT NULL::"text"[], "p_marca" "text"[] DEFAULT NULL::"text"[], "p_rubro" "text"[] DEFAULT NULL::"text"[], "p_portafolio_interno" "text"[] DEFAULT NULL::"text"[], "p_consumo_masivo" "text"[] DEFAULT NULL::"text"[], "p_version" "text"[] DEFAULT NULL::"text"[], "p_presentacion" numeric[] DEFAULT NULL::numeric[], "p_region" "text"[] DEFAULT NULL::"text"[]) RETURNS TABLE("TIPO CLIENTE" character varying, "2024 (%)" numeric, "2024" numeric, "2025 (%)" numeric, "2025" numeric, "DIFERENCIA" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hv.tipocliente as "TIPO CLIENTE",
        CASE 
            WHEN (SELECT SUM(pesoanterior::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoanterior IS NOT NULL) > 0 THEN
                SUM(hv.pesoanterior::numeric) / (SELECT SUM(pesoanterior::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoanterior IS NOT NULL)
            ELSE 0::numeric
        END as "2024 (%)",
        SUM(hv.pesoanterior::numeric) as "2024",
        CASE 
            WHEN (SELECT SUM(pesoactual::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoactual IS NOT NULL) > 0 THEN
                SUM(hv.pesoactual::numeric) / (SELECT SUM(pesoactual::numeric) FROM "HOMOLOGACIONVTA" WHERE pesoactual IS NOT NULL)
            ELSE 0::numeric
        END as "2025 (%)",
        SUM(hv.pesoactual::numeric) as "2025",
        CASE 
            WHEN SUM(hv.pesoanterior::numeric) > 0 THEN 
                (SUM(hv.pesoactual::numeric) - SUM(hv.pesoanterior::numeric)) / SUM(hv.pesoanterior::numeric)
            ELSE NULL 
        END as "DIFERENCIA"
    FROM "HOMOLOGACIONVTA" hv
    WHERE hv.tipocliente IS NOT NULL
        AND (p_mes IS NULL OR hv.mes = ANY(p_mes))
        AND (p_aliado IS NULL OR hv.aliado = ANY(p_aliado))
        AND (p_sucursal IS NULL OR hv.sucursal = ANY(p_sucursal))
        AND (p_marca IS NULL OR hv.marca = ANY(p_marca))
        AND (p_rubro IS NULL OR hv.dep = ANY(p_rubro))
        AND (p_portafolio_interno IS NULL OR hv.gpo = ANY(p_portafolio_interno))
        AND (p_consumo_masivo IS NULL OR hv.cat = ANY(p_consumo_masivo))
        AND (p_version IS NULL OR hv.ver = ANY(p_version))
        AND (p_presentacion IS NULL OR hv.presentacion = ANY(p_presentacion))
        AND (p_region IS NULL OR hv.region = ANY(p_region))
    GROUP BY hv.tipocliente
    ORDER BY hv.tipocliente;
END;
$$;


ALTER FUNCTION "public"."get_ventas_region_tipo_cliente_detallado"("p_mes" "text"[], "p_aliado" "text"[], "p_sucursal" "text"[], "p_marca" "text"[], "p_rubro" "text"[], "p_portafolio_interno" "text"[], "p_consumo_masivo" "text"[], "p_version" "text"[], "p_presentacion" numeric[], "p_region" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_tipo_cliente"("p_mes" "text"[] DEFAULT NULL::"text"[], "p_aliado" "text"[] DEFAULT NULL::"text"[], "p_sucursal" "text"[] DEFAULT NULL::"text"[], "p_marca" "text"[] DEFAULT NULL::"text"[], "p_rubro" "text"[] DEFAULT NULL::"text"[], "p_portafolio_interno" "text"[] DEFAULT NULL::"text"[], "p_consumo_masivo" "text"[] DEFAULT NULL::"text"[], "p_version" "text"[] DEFAULT NULL::"text"[], "p_presentacion" numeric[] DEFAULT NULL::numeric[], "p_region" "text"[] DEFAULT NULL::"text"[]) RETURNS TABLE("2024" numeric, "2025" numeric, "TIPOCLIENTE" character varying)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    SUM(pesoanterior::numeric) as "2024",
    SUM(pesoactual::numeric) as "2025",
    tipocliente as "TIPOCLIENTE"
  FROM "HOMOLOGACIONVTA" 
  WHERE tipocliente IS NOT NULL
    AND (p_mes IS NULL OR mes = ANY(p_mes))
    AND (p_aliado IS NULL OR aliado = ANY(p_aliado))
    AND (p_sucursal IS NULL OR sucursal = ANY(p_sucursal))
    AND (p_marca IS NULL OR marca = ANY(p_marca))
    AND (p_rubro IS NULL OR dep = ANY(p_rubro))
    AND (p_portafolio_interno IS NULL OR gpo = ANY(p_portafolio_interno))
    AND (p_consumo_masivo IS NULL OR cat = ANY(p_consumo_masivo))
    AND (p_version IS NULL OR ver = ANY(p_version))
    AND (p_presentacion IS NULL OR presentacion = ANY(p_presentacion))
    AND (p_region IS NULL OR region = ANY(p_region))
  GROUP BY tipocliente
  ORDER BY tipocliente;
END;
$$;


ALTER FUNCTION "public"."get_ventas_tipo_cliente"("p_mes" "text"[], "p_aliado" "text"[], "p_sucursal" "text"[], "p_marca" "text"[], "p_rubro" "text"[], "p_portafolio_interno" "text"[], "p_consumo_masivo" "text"[], "p_version" "text"[], "p_presentacion" numeric[], "p_region" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_ventas_barras_aliados"("p_mes" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text", "p_marca" "text" DEFAULT NULL::"text") RETURNS TABLE("aliado" "text", "toneladas" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.gpo::TEXT as aliado,
    ROUND(SUM(h.pesoactual), 2) as toneladas
  FROM "HOMOLOGACIONVTA" h
  WHERE h.pesoactual > 0
    AND (p_mes IS NULL OR p_mes = 'All' OR h.mes = p_mes)
    AND (p_aliado IS NULL OR p_aliado = 'All' OR h.gpo = p_aliado)
    AND (p_marca IS NULL OR p_marca = 'All' OR h.marca = p_marca)
  GROUP BY h.gpo
  ORDER BY SUM(h.pesoactual) DESC
  LIMIT 20;
END;
$$;


ALTER FUNCTION "public"."get_ventas_ventas_barras_aliados"("p_mes" "text", "p_aliado" "text", "p_marca" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_ventas_comparativo"("p_mes" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text", "p_marca" "text" DEFAULT NULL::"text") RETURNS TABLE("grupo" "text", "mes" "text", "actual" numeric, "anterior" numeric, "diferencia" numeric, "porcentaje" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.gpo::TEXT as grupo,
    h.mes::TEXT as mes,
    ROUND(SUM(h.pesoactual), 2) as actual,
    ROUND(SUM(h.pesoanterior), 2) as anterior,
    ROUND(SUM(h.pesoactual) - SUM(h.pesoanterior), 2) as diferencia,
    CASE 
      WHEN SUM(h.pesoanterior) > 0 THEN 
        ROUND(((SUM(h.pesoactual) - SUM(h.pesoanterior)) / SUM(h.pesoanterior)) * 100, 2)
      ELSE 0 
    END as porcentaje
  FROM "HOMOLOGACIONVTA" h
  WHERE (h.pesoactual > 0 OR h.pesoanterior > 0)
    AND (p_mes IS NULL OR p_mes = 'All' OR h.mes = p_mes)
    AND (p_aliado IS NULL OR p_aliado = 'All' OR h.gpo = p_aliado)
    AND (p_marca IS NULL OR p_marca = 'All' OR h.marca = p_marca)
  GROUP BY h.gpo, h.mes
  ORDER BY h.gpo, h.mes;
END;
$$;


ALTER FUNCTION "public"."get_ventas_ventas_comparativo"("p_mes" "text", "p_aliado" "text", "p_marca" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ventas_ventas_mapa_venezuela"("p_mes" "text" DEFAULT NULL::"text", "p_aliado" "text" DEFAULT NULL::"text", "p_marca" "text" DEFAULT NULL::"text") RETURNS TABLE("region" "text", "toneladas" numeric, "cajas" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.gpo::TEXT as region,
    ROUND(SUM(h.pesoactual), 2) as toneladas,
    ROUND(SUM(h.cajasactual), 2) as cajas
  FROM "HOMOLOGACIONVTA" h
  WHERE h.pesoactual > 0
    AND (p_mes IS NULL OR p_mes = 'All' OR h.mes = p_mes)
    AND (p_aliado IS NULL OR p_aliado = 'All' OR h.gpo = p_aliado)
    AND (p_marca IS NULL OR p_marca = 'All' OR h.marca = p_marca)
  GROUP BY h.gpo
  ORDER BY SUM(h.pesoactual) DESC;
END;
$$;


ALTER FUNCTION "public"."get_ventas_ventas_mapa_venezuela"("p_mes" "text", "p_aliado" "text", "p_marca" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_migration_direct"() RETURNS TABLE("table_name" "text", "status" "text", "row_count" bigint, "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    test_result record;
    table_list text[] := ARRAY[
        'api_enterprise',
        'user', 
        'dashboard',
        'api_logjson',
        'HOMOLOGACIONACT',
        'HOMOLOGACIONVTA',
        'HOMOLOGACIONACT_P21',
        'HOMOLOGACIONACT_P22', 
        'HOMOLOGACIONVTA_P21',
        'HOMOLOGACIONVTA_P22'
    ];
    tbl text;
    row_cnt bigint;
BEGIN
    -- Probar cada tabla para ver cuántos registros tiene
    FOREACH tbl IN ARRAY table_list
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', tbl) INTO row_cnt;
            
            table_name := tbl;
            status := 'SUCCESS';
            row_count := row_cnt;
            message := format('Tabla accesible con %s registros', row_cnt);
            
            RETURN NEXT;
            
        EXCEPTION WHEN others THEN
            table_name := tbl;
            status := 'ERROR';
            row_count := -1;
            message := SQLERRM;
            
            RETURN NEXT;
        END;
    END LOOP;
    
    -- Probar las vistas también
    FOREACH tbl IN ARRAY ARRAY['2HOMOLOGACIONACT', '2HOMOLOGACIONVTA']
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', tbl) INTO row_cnt;
            
            table_name := tbl || ' (VIEW)';
            status := 'SUCCESS';
            row_count := row_cnt;
            message := format('Vista accesible con %s registros', row_cnt);
            
            RETURN NEXT;
            
        EXCEPTION WHEN others THEN
            table_name := tbl || ' (VIEW)';
            status := 'ERROR';
            row_count := -1;
            message := SQLERRM;
            
            RETURN NEXT;
        END;
    END LOOP;
    
    RETURN;
END;
$$;


ALTER FUNCTION "public"."test_migration_direct"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_migration_manual"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result_message text;
BEGIN
    -- Registrar el intento de migración manual
    INSERT INTO api_logjson (
        json_enterprise,
        json_type,
        json_value,
        json_response,
        json_fechahora
    ) VALUES (
        'SYSTEM',
        'MANUAL_MIGRATION_TRIGGER',
        json_build_object(
            'triggered_at', NOW(),
            'method', 'manual_database_function',
            'note', 'Migración iniciada manualmente desde la base de datos'
        )::text,
        json_build_object(
            'status', 'triggered',
            'message', 'Función de migración manual ejecutada'
        )::text,
        NOW()
    );
    
    result_message := 'Migración manual registrada. Para ejecutar la migración completa, ' ||
                     'debe llamar a la Edge Function desde un cliente externo o usar el dashboard de Supabase.';
    
    RETURN result_message;
END;
$$;


ALTER FUNCTION "public"."trigger_migration_manual"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."HOMOLOGACIONACT" (
    "aliadoid" character varying(10) DEFAULT ''::character varying NOT NULL,
    "aliado" character varying(100),
    "sucursalid" character varying(10) DEFAULT ''::character varying NOT NULL,
    "sucursal" character varying(100),
    "regionid" integer DEFAULT 0 NOT NULL,
    "region" character varying(50),
    "estadoid" integer DEFAULT 0 NOT NULL,
    "estado" character varying(60),
    "tipo" character varying(50) DEFAULT ''::character varying NOT NULL,
    "mesid" character varying(20) DEFAULT ''::character varying NOT NULL,
    "mes" character varying(50),
    "codigo" character varying(20) DEFAULT ''::character varying NOT NULL,
    "descri" character varying(255),
    "a2023" integer,
    "c2023" integer,
    "a2024" integer,
    "c2024" integer,
    "a2025" integer,
    "c2025" integer,
    "prom2024" numeric(18,8) DEFAULT 0.00000000 NOT NULL,
    "prom2025" numeric(18,8) DEFAULT 0.00000000 NOT NULL,
    "upd_sincro" timestamp without time zone DEFAULT '1970-01-01 00:00:00'::timestamp without time zone NOT NULL,
    "sync_hash" character varying(32),
    "last_sync_at" timestamp without time zone DEFAULT "now"(),
    "sync_status" boolean DEFAULT false
);


ALTER TABLE "public"."HOMOLOGACIONACT" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."HOMOLOGACIONVTA" (
    "mesid" integer,
    "mes" character varying(50),
    "estadoid" integer,
    "estado" character varying(50),
    "aliadoid" character varying(10),
    "aliado" character varying(100),
    "sucursalid" character varying(10),
    "sucursal" character varying(100),
    "regionid" integer,
    "region" character varying(50),
    "tipoclienteid" character varying(10),
    "tipocliente" character varying(50),
    "skuid" character varying(20),
    "sku" character varying(100),
    "depid" character varying(10),
    "dep" character varying(50),
    "marcaid" character varying(10),
    "marca" character varying(50),
    "gpoid" character varying(10),
    "gpo" character varying(50),
    "catid" character varying(10),
    "cat" character varying(50),
    "verid" character varying(10),
    "ver" character varying(50),
    "pesoanterior" numeric(10,2),
    "pesoactual" numeric(10,2),
    "cajasanterior" numeric(10,2),
    "cajasactual" numeric(10,2),
    "diffpeso" numeric(10,6),
    "diffcaja" numeric(10,6),
    "presentacion" numeric(10,6),
    "upd" timestamp without time zone,
    "ratio_ant" numeric(27,16),
    "ratio_act" numeric(27,16),
    "upd_sincro" timestamp without time zone DEFAULT '1970-01-01 00:00:00'::timestamp without time zone NOT NULL,
    "sync_status" boolean DEFAULT false,
    "sync_hash" character varying(32),
    "last_sync_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."HOMOLOGACIONVTA" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_enterprise" (
    "etr_id" bigint NOT NULL,
    "etr_identif" character varying(255) NOT NULL,
    "etr_name" character varying(255) NOT NULL,
    "etr_rif" character varying(255) NOT NULL,
    "etr_token" character varying(255) NOT NULL,
    "etr_created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sync_status" boolean DEFAULT false
);


ALTER TABLE "public"."api_enterprise" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."api_enterprise_etr_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."api_enterprise_etr_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."api_enterprise_etr_id_seq" OWNED BY "public"."api_enterprise"."etr_id";



CREATE TABLE IF NOT EXISTS "public"."api_logjson" (
    "json_id" integer NOT NULL,
    "json_enterprise" character varying(255) NOT NULL,
    "json_type" character varying(255),
    "json_value" "text",
    "json_response" "text",
    "json_fechahora" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sync_status" boolean DEFAULT false
);


ALTER TABLE "public"."api_logjson" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."api_logjson_json_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."api_logjson_json_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."api_logjson_json_id_seq" OWNED BY "public"."api_logjson"."json_id";



CREATE TABLE IF NOT EXISTS "public"."dashboard" (
    "id" integer,
    "nombre" character varying(765),
    "tipo" character varying(765),
    "icon" character varying(765),
    "archivo" character varying(765),
    "status" integer,
    "sync_status" boolean DEFAULT false
);


ALTER TABLE "public"."dashboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."result" (
    "json_build_object" json
);


ALTER TABLE "public"."result" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user" (
    "id" integer,
    "username" character varying(765),
    "password" character varying(765),
    "status" integer,
    "sync_status" boolean DEFAULT false
);


ALTER TABLE "public"."user" OWNER TO "postgres";


ALTER TABLE ONLY "public"."api_enterprise" ALTER COLUMN "etr_id" SET DEFAULT "nextval"('"public"."api_enterprise_etr_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."api_logjson" ALTER COLUMN "json_id" SET DEFAULT "nextval"('"public"."api_logjson_json_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."api_enterprise"
    ADD CONSTRAINT "api_enterprise_pkey" PRIMARY KEY ("etr_id");



ALTER TABLE ONLY "public"."api_logjson"
    ADD CONSTRAINT "api_logjson_pkey" PRIMARY KEY ("json_id");



ALTER TABLE ONLY "public"."HOMOLOGACIONACT"
    ADD CONSTRAINT "unique_homologacionact_sync_hash" UNIQUE ("sync_hash");



ALTER TABLE ONLY "public"."HOMOLOGACIONVTA"
    ADD CONSTRAINT "unique_homologacionvta_sync_hash" UNIQUE ("sync_hash");



CREATE INDEX "idx_homologacionact_keys" ON "public"."HOMOLOGACIONACT" USING "btree" ("aliadoid", "sucursalid", "tipo", "mesid", "codigo");



CREATE INDEX "idx_homologacionact_sync_hash" ON "public"."HOMOLOGACIONACT" USING "btree" ("sync_hash");



CREATE INDEX "idx_homologacionvta_keys" ON "public"."HOMOLOGACIONVTA" USING "btree" ("mesid", "aliadoid", "sucursalid", "skuid");



CREATE INDEX "idx_homologacionvta_sync_hash" ON "public"."HOMOLOGACIONVTA" USING "btree" ("sync_hash");



ALTER TABLE "public"."HOMOLOGACIONACT" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."HOMOLOGACIONVTA" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_enterprise" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "api_enterprise_authenticated_access" ON "public"."api_enterprise" USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."api_logjson" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "api_logjson_authenticated_access" ON "public"."api_logjson" USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."dashboard" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dashboard_authenticated_access" ON "public"."dashboard" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "homologacionact_authenticated_access" ON "public"."HOMOLOGACIONACT" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "homologacionvta_authenticated_access" ON "public"."HOMOLOGACIONVTA" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "service_role_all_access" ON "public"."HOMOLOGACIONACT" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_all_access" ON "public"."HOMOLOGACIONVTA" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_authenticated_access" ON "public"."user" USING (("auth"."role"() = 'authenticated'::"text"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_mysql_migration"() TO "anon";
GRANT ALL ON FUNCTION "public"."execute_mysql_migration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_mysql_migration"() TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_sql"("query" "text", "params" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."execute_sql"("query" "text", "params" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_sql"("query" "text", "params" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_act_aliados_departamentos"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_act_aliados_departamentos"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_act_aliados_departamentos"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_act_aliados_grupos"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_act_aliados_grupos"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_act_aliados_grupos"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_act_aliados_marcas"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_act_aliados_marcas"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_act_aliados_marcas"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_act_aliados_sku"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_sku" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_act_aliados_sku"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_sku" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_act_aliados_sku"("p_mes" "text", "p_region" "text", "p_estado" "text", "p_aliado" "text", "p_sucursal" "text", "p_sku" "text", "p_page" integer, "p_page_size" integer, "p_sort_column" "text", "p_sort_direction" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_filtros_activacion"("p_tipo" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_activacion"("p_tipo" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_activacion"("p_tipo" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_filtros_ventas_consolidado"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_consolidado"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_consolidado"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_filtros_ventas_region_aliados_sku"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_region_aliados_sku"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_region_aliados_sku"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_filtros_ventas_region_gpo_tiponegocio"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_region_gpo_tiponegocio"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_region_gpo_tiponegocio"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_filtros_ventas_ventas"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_ventas"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtros_ventas_ventas"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_dashboard"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_dashboard"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_dashboard"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_inicio_sincronizacion"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_inicio_sincronizacion"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_inicio_sincronizacion"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_productos_porcentaje"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_productos_porcentaje"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_productos_porcentaje"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_top_aliados"("p_mes" "text", "p_aliado" "text", "p_marca" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_top_aliados"("p_mes" "text", "p_aliado" "text", "p_marca" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_top_aliados"("p_mes" "text", "p_aliado" "text", "p_marca" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_top_productos_gpo"("p_mes" "text", "p_aliado" "text", "p_marca" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_top_productos_gpo"("p_mes" "text", "p_aliado" "text", "p_marca" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_top_productos_gpo"("p_mes" "text", "p_aliado" "text", "p_marca" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_total_cajas"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_total_cajas"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_total_cajas"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_total_toneladas"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_total_toneladas"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_consolidado_total_toneladas"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_detallado_grupo_mes"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_gpo" "text", "p_rubro" "text", "p_consumo_masivo" "text", "p_version" "text", "p_presentacion" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_detallado_grupo_mes"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_gpo" "text", "p_rubro" "text", "p_consumo_masivo" "text", "p_version" "text", "p_presentacion" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_detallado_grupo_mes"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_gpo" "text", "p_rubro" "text", "p_consumo_masivo" "text", "p_version" "text", "p_presentacion" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_detallado_meses_2024_2025"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_dep" "text", "p_gpo" "text", "p_cat" "text", "p_ver" "text", "p_presentacion" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_detallado_meses_2024_2025"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_dep" "text", "p_gpo" "text", "p_cat" "text", "p_ver" "text", "p_presentacion" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_detallado_meses_2024_2025"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_dep" "text", "p_gpo" "text", "p_cat" "text", "p_ver" "text", "p_presentacion" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_grupo"("p_mes" "text"[], "p_aliado" "text"[], "p_sucursal" "text"[], "p_marca" "text"[], "p_rubro" "text"[], "p_portafolio_interno" "text"[], "p_consumo_masivo" "text"[], "p_version" "text"[], "p_presentacion" numeric[], "p_region" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_grupo"("p_mes" "text"[], "p_aliado" "text"[], "p_sucursal" "text"[], "p_marca" "text"[], "p_rubro" "text"[], "p_portafolio_interno" "text"[], "p_consumo_masivo" "text"[], "p_version" "text"[], "p_presentacion" numeric[], "p_region" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_grupo"("p_mes" "text"[], "p_aliado" "text"[], "p_sucursal" "text"[], "p_marca" "text"[], "p_rubro" "text"[], "p_portafolio_interno" "text"[], "p_consumo_masivo" "text"[], "p_version" "text"[], "p_presentacion" numeric[], "p_region" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_grupo_anio_data"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_gpo" "text", "p_rubro" "text", "p_consumo_masivo" "text", "p_version" "text", "p_presentacion" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_grupo_anio_data"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_gpo" "text", "p_rubro" "text", "p_consumo_masivo" "text", "p_version" "text", "p_presentacion" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_grupo_anio_data"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_gpo" "text", "p_rubro" "text", "p_consumo_masivo" "text", "p_version" "text", "p_presentacion" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_region_tipo_cliente_data"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_rubro" "text", "p_portafolio_interno" "text", "p_consumo_masivo" "text", "p_version" "text", "p_presentacion" "text", "p_region" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_region_tipo_cliente_data"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_rubro" "text", "p_portafolio_interno" "text", "p_consumo_masivo" "text", "p_version" "text", "p_presentacion" "text", "p_region" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_region_tipo_cliente_data"("p_mes" "text", "p_aliado" "text", "p_sucursal" "text", "p_marca" "text", "p_rubro" "text", "p_portafolio_interno" "text", "p_consumo_masivo" "text", "p_version" "text", "p_presentacion" "text", "p_region" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_region_tipo_cliente_detallado"("p_mes" "text"[], "p_aliado" "text"[], "p_sucursal" "text"[], "p_marca" "text"[], "p_rubro" "text"[], "p_portafolio_interno" "text"[], "p_consumo_masivo" "text"[], "p_version" "text"[], "p_presentacion" numeric[], "p_region" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_region_tipo_cliente_detallado"("p_mes" "text"[], "p_aliado" "text"[], "p_sucursal" "text"[], "p_marca" "text"[], "p_rubro" "text"[], "p_portafolio_interno" "text"[], "p_consumo_masivo" "text"[], "p_version" "text"[], "p_presentacion" numeric[], "p_region" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_region_tipo_cliente_detallado"("p_mes" "text"[], "p_aliado" "text"[], "p_sucursal" "text"[], "p_marca" "text"[], "p_rubro" "text"[], "p_portafolio_interno" "text"[], "p_consumo_masivo" "text"[], "p_version" "text"[], "p_presentacion" numeric[], "p_region" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_tipo_cliente"("p_mes" "text"[], "p_aliado" "text"[], "p_sucursal" "text"[], "p_marca" "text"[], "p_rubro" "text"[], "p_portafolio_interno" "text"[], "p_consumo_masivo" "text"[], "p_version" "text"[], "p_presentacion" numeric[], "p_region" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_tipo_cliente"("p_mes" "text"[], "p_aliado" "text"[], "p_sucursal" "text"[], "p_marca" "text"[], "p_rubro" "text"[], "p_portafolio_interno" "text"[], "p_consumo_masivo" "text"[], "p_version" "text"[], "p_presentacion" numeric[], "p_region" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_tipo_cliente"("p_mes" "text"[], "p_aliado" "text"[], "p_sucursal" "text"[], "p_marca" "text"[], "p_rubro" "text"[], "p_portafolio_interno" "text"[], "p_consumo_masivo" "text"[], "p_version" "text"[], "p_presentacion" numeric[], "p_region" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_ventas_barras_aliados"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_ventas_barras_aliados"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_ventas_barras_aliados"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_ventas_comparativo"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_ventas_comparativo"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_ventas_comparativo"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ventas_ventas_mapa_venezuela"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ventas_ventas_mapa_venezuela"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ventas_ventas_mapa_venezuela"("p_mes" "text", "p_aliado" "text", "p_marca" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."test_migration_direct"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_migration_direct"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_migration_direct"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_migration_manual"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_migration_manual"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_migration_manual"() TO "service_role";



GRANT ALL ON TABLE "public"."HOMOLOGACIONACT" TO "anon";
GRANT ALL ON TABLE "public"."HOMOLOGACIONACT" TO "authenticated";
GRANT ALL ON TABLE "public"."HOMOLOGACIONACT" TO "service_role";



GRANT ALL ON TABLE "public"."HOMOLOGACIONVTA" TO "anon";
GRANT ALL ON TABLE "public"."HOMOLOGACIONVTA" TO "authenticated";
GRANT ALL ON TABLE "public"."HOMOLOGACIONVTA" TO "service_role";



GRANT ALL ON TABLE "public"."api_enterprise" TO "anon";
GRANT ALL ON TABLE "public"."api_enterprise" TO "authenticated";
GRANT ALL ON TABLE "public"."api_enterprise" TO "service_role";



GRANT ALL ON SEQUENCE "public"."api_enterprise_etr_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."api_enterprise_etr_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."api_enterprise_etr_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."api_logjson" TO "anon";
GRANT ALL ON TABLE "public"."api_logjson" TO "authenticated";
GRANT ALL ON TABLE "public"."api_logjson" TO "service_role";



GRANT ALL ON SEQUENCE "public"."api_logjson_json_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."api_logjson_json_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."api_logjson_json_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard" TO "anon";
GRANT ALL ON TABLE "public"."dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."result" TO "anon";
GRANT ALL ON TABLE "public"."result" TO "authenticated";
GRANT ALL ON TABLE "public"."result" TO "service_role";



GRANT ALL ON TABLE "public"."user" TO "anon";
GRANT ALL ON TABLE "public"."user" TO "authenticated";
GRANT ALL ON TABLE "public"."user" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
