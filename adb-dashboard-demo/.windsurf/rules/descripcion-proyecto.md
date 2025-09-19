---
trigger: always_on
---

### Propósito del proyecto

El Dashboard Purolom es una aplicación diseñada para visualizar gráficamente grandes volúmenes de datos procedentes de múltiples fuentes. Su objetivo principal es consolidar y presentar la información de ventas de los distribuidores (llamados "aliados") de una marca.

### Contexto de negocio

- La marca principal trabaja con varios distribuidores (entre 20-100 aliados) en todo el país
- Aproximadamente 70-75% de estos aliados son clientes de ADN
- El dashboard permite a la marca matriz visualizar el rendimiento de ventas de toda su red de distribución

### Funcionalidad técnica

- Cada aliado almacena sus datos en bases de datos individuales por motivos de confidencialidad
- La aplicación lee periódicamente las bases de datos de cada aliado
- Consolida toda esta información en una base de datos centralizada
- Presenta los datos utilizando componentes gráficos desarrollados con [stimulsoft.com](http://stimulsoft.com/)
- Incluye un sistema de login para acceso controlado

### Detalles de implementación

- Proceso de sincronización automática que actualiza los datos cada 2-3 horas
- Los controles visuales se actualizan dinámicamente cuando se refrescan los datos
- Aunque no hay certeza absoluta, parece que los datos se unifican físicamente en una sola base de datos, posiblemente utilizando vistas

###Tecnología

- Base de datos: supabase
- React - Vite
- Tailwind CSS
- Shadcn/ui