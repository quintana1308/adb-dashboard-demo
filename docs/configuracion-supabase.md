# Guía de Configuración de Supabase para el Dashboard Purolom

Esta guía te ayudará a configurar un entorno local de desarrollo con Supabase para el Dashboard Purolom. Está diseñada para usuarios que no tienen experiencia previa con Supabase.

## Requisitos previos

- Docker instalado y en ejecución
- Node.js (versión 16 o superior)
- Git
- Terminal (Bash o similar)

## 1. Instalación de Supabase CLI

La CLI (Command Line Interface) de Supabase es una herramienta que te permite interactuar con Supabase desde la línea de comandos.

### Para macOS:

```bash
# Usando Homebrew
brew install supabase/tap/supabase

# Verificar la instalación
supabase --version
```

### Para Windows:

```bash
# Usando Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Verificar la instalación
supabase --version
```

### Para Linux:

```bash
# Usando curl
curl -s https://raw.githubusercontent.com/supabase/cli/main/install.sh | bash

# Verificar la instalación
supabase --version
```

## 2. Clonar el repositorio (si aún no lo has hecho)

```bash
git clone <URL_DEL_REPOSITORIO>
cd adn-dashboard
```

## 3. Iniciar Supabase localmente

Este comando iniciará todos los servicios de Supabase en contenedores Docker:

```bash
supabase start
```

Este proceso puede tardar varios minutos la primera vez, ya que descarga todas las imágenes de Docker necesarias.

## 4. Vincular el proyecto local con el proyecto remoto de Supabase

Este paso es necesario para poder sincronizar datos y esquemas entre tu entorno local y el proyecto remoto:

```bash
supabase link --project-ref vgszusyipzoptbyvcjfo
```

Se te pedirá un token de acceso. Para obtenerlo:

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión con tu cuenta
3. Haz clic en tu perfil (esquina superior derecha) > "Account"
4. Navega a la sección "Access Tokens"
5. Genera un nuevo token o copia uno existente
6. Pega el token cuando la CLI te lo solicite

## 5. Sincronizar datos del proyecto remoto

El proyecto incluye un script que descarga todos los datos necesarios del proyecto remoto y los importa a tu base de datos local:

```bash
# Asegúrate de que el script tenga permisos de ejecución
chmod +x scripts/sync_remote_data.sh

# Ejecuta el script
./scripts/sync_remote_data.sh
```

Durante la ejecución del script:
- Se te pedirá la contraseña de la base de datos remota (solicítala al administrador del proyecto)
- El script descargará datos de los esquemas `public`, `auth` y `storage`
- Luego importará estos datos a tu base de datos local

## 6. Verificar la instalación

Para comprobar que todo está funcionando correctamente:

```bash
# Ver el estado de los servicios de Supabase
supabase status

# Obtener las URLs de acceso
supabase status
```

Deberías ver algo como:

```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 7. Acceder al panel de administración de Supabase

Abre en tu navegador la URL del Studio que aparece en el paso anterior (normalmente http://localhost:54323).

Aquí podrás:
- Explorar las tablas de la base de datos
- Ejecutar consultas SQL
- Gestionar usuarios y autenticación
- Configurar almacenamiento
- Y mucho más

## 8. Ejecutar Edge Functions localmente

Las Edge Functions son funciones serverless que se ejecutan en el borde de la red. Para ejecutarlas localmente:

```bash
# Iniciar el servidor de funciones
supabase functions serve
```

Para probar una función específica:

```bash
# Usando curl
curl -i --location --request GET 'http://localhost:54321/functions/v1/nombre-funcion' \
  --header 'Content-Type: application/json'
```

## 9. Detener Supabase cuando no lo necesites

Cuando termines de trabajar, puedes detener los servicios de Supabase para liberar recursos:

```bash
supabase stop
```

## Solución de problemas comunes

### Error al iniciar Supabase

Si encuentras errores al iniciar Supabase, prueba lo siguiente:

```bash
# Detener y reiniciar completamente
supabase stop
docker system prune -a  # ¡Cuidado! Esto eliminará todas las imágenes Docker no utilizadas
supabase start
```

### Problemas de sincronización de datos

Si el script de sincronización falla:

1. Asegúrate de que Supabase esté en ejecución (`supabase status`)
2. Verifica que tienes la contraseña correcta de la base de datos remota
3. Comprueba que el proyecto está correctamente vinculado (`supabase link --project-ref vgszusyipzoptbyvcjfo`)

### Errores de duplicación de datos

Si ves errores como "duplicate key value violates unique constraint" al sincronizar datos, es normal. Significa que esos registros ya existen en tu base de datos local.

## Comandos útiles

```bash
# Ver logs de Supabase
supabase logs

# Reiniciar la base de datos local (¡perderás todos los datos locales!)
supabase db reset

# Crear una nueva migración
supabase migration new nombre-migracion

# Aplicar migraciones pendientes sin resetear la base de datos
supabase migration up
```

## Recursos adicionales

- [Documentación oficial de Supabase](https://supabase.com/docs)
- [Guía de CLI de Supabase](https://supabase.com/docs/reference/cli)
- [Foro de la comunidad de Supabase](https://github.com/supabase/supabase/discussions)
