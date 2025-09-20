-- Otorgar permisos para las funciones de cobranza
GRANT EXECUTE ON FUNCTION get_filtros_cobranza_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION get_cobranza_v2(text, text, text, text, integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cobranza_totales_v2(text, text, text, text) TO authenticated;
