-- Otorgar permisos para las funciones de egresos
GRANT EXECUTE ON FUNCTION get_filtros_egresos_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION get_egresos_v2(text, text, text, text, text, text, text, integer, integer, text, text) TO authenticated;
