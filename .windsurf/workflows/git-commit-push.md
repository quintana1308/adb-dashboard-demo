---
description: Automatiza el proceso de git add, commit y push al repositorio remoto
auto_execution_mode: 3
---

# Git Commit and Push

Este workflow automatiza el proceso de añadir, commitear y enviar cambios al repositorio remoto. Verifica si hay cambios antes de proceder con el commit.

## Pasos a seguir

1. Asegúrate de estar en el directorio raíz del proyecto
   ```bash
   cd /Users/aleguizamon/Sites/ADN/adn-dashboard
   ```

2. Verifica si hay cambios pendientes
   ```bash
   git status --porcelain
   ```

3. Si hay cambios, procede con el add, commit y push. El mensaje del commit debe ser dinamico, debes revisar que cambios se hicieron y redactar un commit concreto que explique los cambios.
   ```bash
   if [ -n "$(git status --porcelain)" ]; then
     echo "Hay cambios pendientes. Procediendo con el commit..."
     git add .
     git commit -m "Actualización del proyecto"
     git push origin main
     echo "Cambios enviados exitosamente."
   else
     echo "No hay cambios pendientes. No se requiere commit."
   fi
   ```