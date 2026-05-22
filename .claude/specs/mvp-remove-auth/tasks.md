# Tasks: Eliminar autenticación del MVP — MVP-NOAUTH

## Summary

Total tasks: 8 | Estimated effort: 5 story points

---

## Layer: Backend

### TASK-1: Quitar guard JWT del controller de generación
**Layer:** Backend
**Size:** S
**Depends on:** none
**Description:** Modificar `generate.controller.ts` para eliminar `@UseGuards(JwtAuthGuard)` del decorador de clase, quitar el parámetro `@CurrentUser() user: any` de los 5 métodos del controller, y reemplazar todas las referencias a `user.userId` con la constante `'anonymous-user'`. Quitar los imports de `JwtAuthGuard` y `CurrentUser`.
**Inputs:**
- `backend/src/generate/generate.controller.ts` — línea 14 (`@UseGuards`), líneas 38, 54, 72, 90, 110 (`@CurrentUser` y `user.userId`)
**Output / Done when:** El controller compila sin errores TypeScript (`npm run build` en `/backend` pasa). Los endpoints `/generate/*` responden sin requerir header `Authorization`.

---

### TASK-2: Desregistrar AuthModule del módulo de generación
**Layer:** Backend
**Size:** S
**Depends on:** TASK-1
**Description:** Verificar si `AuthModule` está listado en los `imports` de `generate.module.ts` o `app.module.ts`. Si está, quitar el import. Verificar también que `app.module.ts` no falle al no tener AuthModule si JwtStrategy ya no está registrada en ningún módulo activo.
**Inputs:**
- `backend/src/generate/generate.module.ts`
- `backend/src/app.module.ts`
**Output / Done when:** `npm run build` en `/backend` pasa sin errores. No quedan imports rotos de AuthModule en los módulos de generación.

---

## Layer: Frontend — Servicios y Hooks

### TASK-3: Eliminar parámetro token de generateApi y hooks
**Layer:** Frontend
**Size:** S
**Depends on:** none
**Description:** En `generateApi.ts`, quitar el parámetro `token: string` de las 5 funciones (`postGenerateScript`, `getJobStatus`, `postGenerateImages`, `postGenerateAudio`, `postGenerateVideo`) y eliminar el header `Authorization: Bearer ${token}` de cada `fetch()`. En los hooks (`useGenerateScript.ts`, `useGenerateImages.ts`, `useGenerateAudio.ts`, `useGenerateVideo.ts`), quitar el parámetro `token: string` de la firma del hook y actualizar la llamada interna a la función de generateApi correspondiente.
**Inputs:**
- `frontend/src/services/generateApi.ts`
- `frontend/src/hooks/useGenerateScript.ts`
- `frontend/src/hooks/useGenerateImages.ts` (si existe)
- `frontend/src/hooks/useGenerateAudio.ts` (si existe)
- `frontend/src/hooks/useGenerateVideo.ts` (si existe)
**Output / Done when:** Las funciones de generateApi no aceptan ni usan `token`. Los hooks no reciben ni propagan `token`. TypeScript compila sin errores.

---

## Layer: Frontend — Páginas

### TASK-4: Simplificar Generate.tsx — quitar auth
**Layer:** Frontend
**Size:** S
**Depends on:** TASK-3
**Description:** En `Generate.tsx`, quitar el `import { useAuth }`, las líneas `const { session } = useAuth()` y `const token = session?.access_token ?? ''`, y actualizar las 4 llamadas a hooks (`useGenerateScript`, `useGenerateImages`, `useGenerateAudio`, `useGenerateVideo`) para que no reciban el argumento `token`. Quitar también el `import { UserMenu }` y el elemento `<UserMenu />` del header.
**Inputs:**
- `frontend/src/pages/Generate.tsx` — líneas 6, 20, 66-67, 79-82, 205
**Output / Done when:** `Generate.tsx` compila sin referencias a auth. El header del generador no muestra nombre de usuario ni logout.

---

### TASK-5: Simplificar Landing.tsx — mostrar CTA siempre
**Layer:** Frontend
**Size:** S
**Depends on:** none
**Description:** En `Landing.tsx`, quitar el `import { useAuth }` y las variables `user` / `loading`. Quitar `<UserMenu />` del header y `<LoginCard />` del body. El botón `<Link to="/app">Ir al generador</Link>` debe renderizarse siempre, sin condición `{user && ...}`.
**Inputs:**
- `frontend/src/pages/Landing.tsx` — líneas 7, 10, 22, 35-41, 44-52
**Output / Done when:** La landing page muestra el botón de CTA a cualquier visitante, sin verificar estado de sesión.

---

### TASK-6: Simplificar App.tsx — quitar routing de auth
**Layer:** Frontend
**Size:** S
**Depends on:** TASK-4, TASK-5
**Description:** En `App.tsx`, quitar el wrapper `<AuthProvider>`, la ruta `/auth/callback`, y el wrapper `<ProtectedRoute>` alrededor de `<Generate />`. Renderizar `<Generate />` directamente en la ruta `/app`. Quitar los imports de `AuthProvider`, `ProtectedRoute`, `AuthCallback`.
**Inputs:**
- `frontend/src/App.tsx` — líneas 2-3, 11, 15, 18-23
**Output / Done when:** El router no tiene rutas ni providers relacionados a auth. `npm run build` pasa sin errores.

---

## Layer: Frontend — Limpieza de archivos

### TASK-7: Eliminar archivos de auth del frontend
**Layer:** Frontend
**Size:** S
**Depends on:** TASK-4, TASK-5, TASK-6
**Description:** Eliminar los siguientes 8 archivos que ya no son referenciados por ningún componente activo:
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/services/auth.ts`
- `frontend/src/services/supabase.ts`
- `frontend/src/services/api.ts`
- `frontend/src/components/auth/LoginCard.tsx`
- `frontend/src/components/auth/UserMenu.tsx`
- `frontend/src/components/auth/ProtectedRoute.tsx`
- `frontend/src/pages/AuthCallback.tsx`
**Inputs:** Confirmación de que ningún archivo restante importa estos módulos (verificar con grep o build).
**Output / Done when:** Los 8 archivos no existen en el repositorio. `npm run build` pasa sin errores de módulo no encontrado.

---

## Layer: Testing

### TASK-8: Actualizar tests del frontend para firmas sin token
**Layer:** Testing
**Size:** S
**Depends on:** TASK-3, TASK-7
**Description:** Actualizar los tests que pasaban `token` como argumento a funciones que ya no lo aceptan:
- `frontend/src/hooks/useGenerateScript.test.ts` — quitar argumento `token` del `renderHook` y de las llamadas a `generate()`.
- `frontend/src/services/generateApi.test.ts` — quitar parámetro `token` de llamadas a `postGenerateScript` y `getJobStatus`; quitar la aserción que verifica el header `Authorization`.
Si existen tests de VoiceSelector u otros componentes de auth (`LoginCard`, etc.), eliminarlos.
**Inputs:**
- `frontend/src/hooks/useGenerateScript.test.ts`
- `frontend/src/services/generateApi.test.ts`
**Output / Done when:** `npm test` en `/frontend` pasa al 100% sin tests fallando por firmas incorrectas o imports rotos.

---

## Checklist

- [x] TASK-1: Quitar guard JWT del controller de generación
- [x] TASK-2: Desregistrar AuthModule del módulo de generación
- [x] TASK-3: Eliminar parámetro token de generateApi y hooks
- [x] TASK-4: Simplificar Generate.tsx — quitar auth
- [x] TASK-5: Simplificar Landing.tsx — mostrar CTA siempre
- [x] TASK-6: Simplificar App.tsx — quitar routing de auth
- [x] TASK-7: Eliminar archivos de auth del frontend
- [x] TASK-8: Actualizar tests del frontend para firmas sin token

---

## Task Dependency Map

```
TASK-1 (backend guard)
TASK-2 (backend module)   ← depende de TASK-1

TASK-3 (api + hooks)
TASK-4 (Generate.tsx)     ← depende de TASK-3
TASK-5 (Landing.tsx)
TASK-6 (App.tsx)          ← depende de TASK-4, TASK-5
TASK-7 (borrar archivos)  ← depende de TASK-4, TASK-5, TASK-6
TASK-8 (tests)            ← depende de TASK-3, TASK-7
```

## Verificación Final

```bash
# 1. Build frontend sin errores TS
cd frontend && npm run build

# 2. Tests frontend todos en verde
cd frontend && npm test

# 3. Build backend sin errores
cd backend && npm run build

# 4. Smoke test manual
# - Levantar: cd frontend && npm run dev
# - Levantar: cd backend && npm run start:dev
# - Navegar a http://localhost:5173
# - Verificar: botón "Ir al generador" visible sin login
# - Click → /app sin redirect a login
# - Pegar texto 50+ chars → elegir estilo → elegir voz → generar
# - Verificar: llamada a POST /generate/script responde 200
```
