# TASK 3.2 + 3.3 COMPLETE — Supabase Auth & Login UI

**Status:** ✅ COMPLETED  
**Date:** 19 May 2026  
**Skipped:** Task 3.4 (Dashboard + cuota) — ⏳ PENDING

---

## Task 3.2 — Supabase Auth

- `AuthProvider` + `useAuth` (`src/contexts/AuthContext.tsx`)
- Google OAuth via `signInWithOAuth` (`src/services/auth.ts`)
- Callback route `/auth/callback`
- Axios interceptor sends `access_token` (already in `api.ts`)
- Supabase client: `persistSession`, `detectSessionInUrl`

## Task 3.3 — Login UI (Historia 2.1)

- `LoginCard` — botón "Continuar con Google"
- `UserMenu` — nombre + cerrar sesión
- `ProtectedRoute` — `/app` requiere sesión
- Landing: login si no autenticado; CTA al generador si sí

## Backend fixes (required for auth to work)

- `UsersService.findOrCreateFromSupabase` — sync Prisma `User` on login
- `JwtStrategy` — valida con `SUPABASE_JWT_SECRET`; `userId` = Prisma id (no Supabase uuid)
- `SUPABASE_JWT_SECRET` en `backend/.env.example`

---

## Configuración Supabase (manual)

1. **Authentication → Providers → Google** — habilitar y credenciales OAuth
2. **Authentication → URL Configuration**
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/auth/callback`
3. **Settings → API → JWT Secret** → copiar a `SUPABASE_JWT_SECRET` en backend `.env.local`

Frontend `.env.local`:

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:3000
```

Backend `.env.local` (añadir):

```env
SUPABASE_JWT_SECRET=<jwt-secret-from-supabase-dashboard>
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Task 3.4 — PENDIENTE

Dashboard + visualización de cuota (Historia 2.2). No implementado por decisión de producto.

---

## Next: Task 3.5

Input de texto + validación → [NEXT_STEPS.md](../NEXT_STEPS.md)
