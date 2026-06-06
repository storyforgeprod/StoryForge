# Spec: Eliminar autenticación del MVP — MVP-NOAUTH

## User Story

**As a** evaluador o stakeholder del MVP de StoryForge,
**I want** acceder directamente al generador de videos sin necesidad de crear una cuenta ni hacer login,
**So that** pueda validar la funcionalidad principal (texto → video) sin fricciones de onboarding durante la etapa de demo.

## Context

El flujo actual obliga al usuario a autenticarse con Google OAuth antes de poder usar el generador. Esto agrega fricción innecesaria durante la fase de validación del MVP. Se quiere exponer la funcionalidad principal directamente, sin bloqueo de auth, tanto en el frontend (routing y UI) como en el backend (guard JWT). Esta decisión es temporal para el MVP; la autenticación podrá reintegrarse en fases posteriores.

## Acceptance Criteria

| ID | Criteria (EARS format) |
|----|------------------------|
| AC-1 | When a user visits `http://localhost:5173`, the system shall display a "Ir al generador" button without requiring login. |
| AC-2 | When a user clicks "Ir al generador", the system shall navigate directly to `/app` without redirecting to a login screen. |
| AC-3 | When a user submits a story with style and voice selected, the system shall call `POST /generate/script` and receive a 200 response without an Authorization header. |
| AC-4 | The system shall not display any login card, user menu, or logout button in any page. |
| AC-5 | The system shall not expose the `/auth/callback` route. |
| AC-6 | If the frontend build is run with `npm run build`, the system shall compile with zero TypeScript errors. |
| AC-7 | When the frontend test suite runs with `npm test`, the system shall pass all existing tests (with updated signatures). |

## Out of Scope

- Reimplementar autenticación en cualquier forma (JWT estático, API keys, sesiones).
- Cambiar la lógica de negocio del backend (generación de scripts, imágenes, audio, video).
- Modificar el schema de Prisma ni las tablas de la base de datos.
- Agregar un sistema de roles o permisos.
- Integrar Sentry, PostHog u otras herramientas de observabilidad.

## Assumptions

- El campo `userId` en la tabla `Job` de Prisma acepta strings arbitrarios; se usará `'anonymous-user'` como valor fijo.
- La validación `job.userId !== userId` en el service queda funcional porque todos los jobs tendrán el mismo `userId` (`'anonymous-user'`), por lo que cualquier usuario puede consultar cualquier job. Esto es aceptable para el MVP.
- No hay tests de backend (Jest) que verifiquen el guard JWT; si los hay, se actualiza su descripción pero quedan fuera del scope inmediato.
- El módulo `AuthModule` y sus archivos (`jwt.strategy.ts`, `jwt.guard.ts`, etc.) se dejan en el backend sin borrar — solo se desregistran del `generate.module.ts` si era necesario importarlos.

## Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | ¿El `AuthModule` se importa en `app.module.ts` además de en `generate.module.ts`? Si sí, ¿se lo quita también? | Dev | Open |
| 2 | ¿Los jobs existentes en la DB con `userId` real pueden generar conflictos con `anonymous-user`? | Dev | Open (no impacta demo) |

## Dependencies

- Ninguna historia de ADO bloqueante.
- `generate.controller.ts` y `generate.service.ts` deben estar en su estado actual (post Task 2.x) para que los cambios sean correctos.
