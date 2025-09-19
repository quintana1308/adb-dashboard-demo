#!/bin/bash

# Script para sincronizar datos de Supabase remoto a local
# Incluye datos de autenticación (auth schema)

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directorio para almacenar dumps temporales
DUMP_DIR="$(pwd)/temp_dumps"

# ID del proyecto Supabase
PROJECT_ID="vgszusyipzoptbyvcjfo"

echo -e "${YELLOW}Iniciando sincronización de datos desde Supabase remoto...${NC}"

# Función para manejar errores
handle_error() {
  echo -e "${RED}Error: $1${NC}"
  # Limpiar archivos temporales en caso de error
  if [ -d "$DUMP_DIR" ]; then
    rm -rf "$DUMP_DIR"
  fi
  exit 1
}

# Crear directorio para dumps si no existe
if [ ! -d "$DUMP_DIR" ]; then
  mkdir -p "$DUMP_DIR" || handle_error "No se pudo crear el directorio para dumps"
fi

# Verificar que Supabase está iniciado localmente
echo -e "${YELLOW}Verificando que Supabase esté en ejecución localmente...${NC}"
supabase status > /dev/null 2>&1 || handle_error "Supabase no está en ejecución. Ejecuta 'supabase start' primero."

# Verificar que Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
  handle_error "Supabase CLI no está instalado. Por favor instálalo primero."
fi

# Verificar si los archivos de dump ya existen
if [ -f "$DUMP_DIR/public_data.sql" ] && [ -f "$DUMP_DIR/auth_data.sql" ] && [ -f "$DUMP_DIR/storage_data.sql" ]; then
  echo -e "${GREEN}Los archivos de dump ya existen. Procediendo directamente a la importación...${NC}"
else
  # Obtener la contraseña de la base de datos remota
  echo -e "${YELLOW}Ingresa la contraseña de la base de datos remota cuando se solicite${NC}"

  # 1. Dump de datos del esquema public
  echo -e "${YELLOW}Descargando datos del esquema public...${NC}"
  supabase db dump --data-only -f "$DUMP_DIR/public_data.sql" --schema public || handle_error "Error al descargar datos del esquema public"

  # 2. Dump de datos del esquema auth
  echo -e "${YELLOW}Descargando datos del esquema auth...${NC}"
  supabase db dump --data-only -f "$DUMP_DIR/auth_data.sql" --schema auth || handle_error "Error al descargar datos del esquema auth"

  # 3. Dump de datos del esquema storage
  echo -e "${YELLOW}Descargando datos del esquema storage...${NC}"
  supabase db dump --data-only -f "$DUMP_DIR/storage_data.sql" --schema storage || handle_error "Error al descargar datos del esquema storage"
fi

# Aplicar los dumps a la base de datos local
echo -e "${YELLOW}Aplicando datos a la base de datos local...${NC}"

# Conexión a la base de datos local
DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Copiar archivos SQL al contenedor Docker
echo -e "${YELLOW}Copiando archivos SQL al contenedor Docker...${NC}"
docker cp "$DUMP_DIR/public_data.sql" supabase_db_adn-dashboard:/tmp/public_data.sql || handle_error "Error al copiar archivo public_data.sql"
docker cp "$DUMP_DIR/auth_data.sql" supabase_db_adn-dashboard:/tmp/auth_data.sql || handle_error "Error al copiar archivo auth_data.sql"
docker cp "$DUMP_DIR/storage_data.sql" supabase_db_adn-dashboard:/tmp/storage_data.sql || handle_error "Error al copiar archivo storage_data.sql"

# Aplicar datos del esquema public
echo -e "${YELLOW}Aplicando datos del esquema public...${NC}"
docker exec -i supabase_db_adn-dashboard psql -U postgres -d postgres -f /tmp/public_data.sql || handle_error "Error al aplicar datos del esquema public"

# Aplicar datos del esquema auth
echo -e "${YELLOW}Aplicando datos del esquema auth...${NC}"
docker exec -i supabase_db_adn-dashboard psql -U postgres -d postgres -f /tmp/auth_data.sql || handle_error "Error al aplicar datos del esquema auth"

# Aplicar datos del esquema storage
echo -e "${YELLOW}Aplicando datos del esquema storage...${NC}"
docker exec -i supabase_db_adn-dashboard psql -U postgres -d postgres -f /tmp/storage_data.sql || handle_error "Error al aplicar datos del esquema storage"

# Limpiar archivos temporales
echo -e "${YELLOW}Limpiando archivos temporales...${NC}"
rm -rf $DUMP_DIR

echo -e "${GREEN}¡Sincronización completada con éxito!${NC}"
echo -e "${GREEN}Todos los datos (public, auth y storage) han sido importados a la base de datos local.${NC}"
