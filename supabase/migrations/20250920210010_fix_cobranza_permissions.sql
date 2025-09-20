-- Corregir permisos para las funciones de cobranza
-- Primero revocar los permisos incorrectos
REVOKE EXECUTE ON FUNCTION get_cobranza_v2(text, text, text, text, integer, integer, text, text) FROM authenticated;

-- Otorgar permisos correctos
GRANT EXECUTE ON FUNCTION get_cobranza_v2(text, text, text, text, integer, integer, text, text) TO authenticated;
