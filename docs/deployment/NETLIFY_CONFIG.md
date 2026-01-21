# ⚙️ Configuración Manual de Netlify

Si Netlify sigue detectando el proyecto incorrecto, configura manualmente:

## En el Dashboard de Netlify:

1. Ve a **Site settings** → **Build & deploy** → **Build settings**

2. Configura manualmente:

   **Base directory:** `.` (raíz del proyecto)
   
   **Build command:** `npm install && npm run build:pwa`
   
   **Publish directory:** `apps/pwa/dist`
   
   **Nota**: El comando `build:pwa` compila automáticamente los packages locales (`@la-caja/domain`, `@la-caja/sync`) antes de compilar el PWA.

3. Guarda los cambios

## O desde la UI inicial:

Cuando Netlify te muestre "We've detected multiple projects":

1. **NO selecciones** "vite" o "apps/desktop"
2. En su lugar, haz click en **"Set up build"** o **"Configure build"**
3. Configura manualmente:
   - **Base directory:** `.` (raíz del proyecto)
   - **Build command:** `npm install && npm run build:pwa`
   - **Publish directory:** `apps/pwa/dist`

## Verificación:

Después de configurar, el build debería:
- ✅ Instalar dependencias desde la raíz del proyecto (monorepo)
- ✅ Compilar los packages locales (`@la-caja/domain`, `@la-caja/sync`, `@la-caja/application`)
- ✅ Compilar el PWA con los packages ya disponibles
- ✅ Publicar desde `apps/pwa/dist`

