#!/bin/bash

# Script para automatizar git add, commit y push
# Uso: ./git-commit-push.sh [mensaje] [rama] [archivos]

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración de parámetros
COMMIT_MESSAGE="${1:-Actualización del proyecto}"
BRANCH="${2:-master}"
FILES="${3:-.}"

# Función para mostrar mensajes
show_message() {
  echo -e "${2}${1}${NC}"
}

# Verificar si hay cambios para commitear
show_message "Verificando cambios en el repositorio..." "$YELLOW"
GIT_STATUS=$(git status --porcelain)

if [ -z "$GIT_STATUS" ]; then
  show_message "No hay cambios para commitear. Saliendo..." "$RED"
  exit 0
fi

# Mostrar los cambios que se van a commitear
show_message "Cambios detectados:" "$YELLOW"
git status --short

# Preguntar confirmación
read -p "¿Deseas continuar con el commit y push? (s/n): " CONFIRM
if [[ $CONFIRM != [sS] ]]; then
  show_message "Operación cancelada por el usuario." "$RED"
  exit 0
fi

# Git add
show_message "Añadiendo archivos al staging area..." "$YELLOW"
git add $FILES
if [ $? -ne 0 ]; then
  show_message "Error al añadir archivos. Saliendo..." "$RED"
  exit 1
fi

# Git commit
show_message "Creando commit con mensaje: '$COMMIT_MESSAGE'..." "$YELLOW"
git commit -m "$COMMIT_MESSAGE"
if [ $? -ne 0 ]; then
  show_message "Error al crear el commit. Saliendo..." "$RED"
  exit 1
fi

# Git push
show_message "Enviando cambios a la rama '$BRANCH'..." "$YELLOW"
git push origin $BRANCH
if [ $? -ne 0 ]; then
  show_message "Error al hacer push. Saliendo..." "$RED"
  exit 1
fi

show_message "¡Proceso completado exitosamente!" "$GREEN"
exit 0
