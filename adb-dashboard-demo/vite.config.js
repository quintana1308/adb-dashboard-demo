import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

// Plugin personalizado para generar .htaccess
const htaccessPlugin = () => {
  return {
    name: 'htaccess-generator',
    writeBundle() {
      const htaccessContent = `# Configuración para React Router (URLs amigables)
RewriteEngine On

# Manejar rutas de React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Configuraciones de seguridad y cache
<IfModule mod_headers.c>
  # Cache para assets estáticos
  <FilesMatch "\\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "public, max-age=31536000"
  </FilesMatch>
  
  # No cache para HTML
  <FilesMatch "\\.html$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
  </FilesMatch>
</IfModule>

# Comprimir archivos
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Prevenir acceso a archivos sensibles
<Files ~ "^\\.(htaccess|htpasswd|ini|log|sh|inc|bak)$">
  Order allow,deny
  Deny from all
</Files>`

      const distPath = resolve(__dirname, 'dist', '.htaccess')
      writeFileSync(distPath, htaccessContent)
      console.log('✓ Archivo .htaccess generado en dist/')
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), htaccessPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react']
        }
      }
    },
    assetsInlineLimit: 0 // Forzar que todos los assets se copien como archivos separados
  },
  assetsInclude: ['**/*.svg'] // Asegurar que los SVG se traten como assets
})
