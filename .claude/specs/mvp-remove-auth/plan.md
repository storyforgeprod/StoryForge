# Technical Plan: Eliminar autenticación del MVP — MVP-NOAUTH

## High-Level Architecture

```mermaid
graph LR
  subgraph "ANTES"
    U1[Usuario] --> L1[Landing\n login requerido]
    L1 --> O1[Google OAuth]
    O1 --> CB1[/auth/callback]
    CB1 --> G1[/app\nProtectedRoute]
    G1 --> API1[Backend\n@UseGuards JWT]
  end

  subgraph "DESPUÉS"
    U2[Usuario] --> L2[Landing\n CTA directo]
    L2 --> G2[/app\nsin guard]
    G2 --> API2[Backend\nsin @UseGuards]
  end
```

## Components Affected

| Component | Change Type | Notes |
|-----------|-------------|-------|
| `frontend/src/App.tsx` | Modified | Quitar AuthProvider, ProtectedRoute, ruta /auth/callback |
| `frontend/src/pages/Landing.tsx` | Modified | Quitar auth checks, mostrar CTA siempre |
| `frontend/src/pages/Generate.tsx` | Modified | Quitar useAuth, token, UserMenu |
| `frontend/src/services/generateApi.ts` | Modified | Quitar parámetro token de 5 funciones |
| `frontend/src/hooks/useGenerateScript.ts` | Modified | Quitar parámetro token |
| `frontend/src/hooks/useGenerateImages.ts` | Modified | Quitar parámetro token |
| `frontend/src/hooks/useGenerateAudio.ts` | Modified | Quitar parámetro token |
| `frontend/src/hooks/useGenerateVideo.ts` | Modified | Quitar parámetro token |
| `frontend/src/contexts/AuthContext.tsx` | Deleted | Ya no se necesita |
| `frontend/src/services/auth.ts` | Deleted | Ya no se necesita |
| `frontend/src/services/supabase.ts` | Deleted | Ya no se necesita |
| `frontend/src/services/api.ts` | Deleted | Dead code, ya no se necesita |
| `frontend/src/components/auth/LoginCard.tsx` | Deleted | Ya no se necesita |
| `frontend/src/components/auth/UserMenu.tsx` | Deleted | Ya no se necesita |
| `frontend/src/components/auth/ProtectedRoute.tsx` | Deleted | Ya no se necesita |
| `frontend/src/pages/AuthCallback.tsx` | Deleted | Ya no se necesita |
| `backend/src/generate/generate.controller.ts` | Modified | Quitar @UseGuards, @CurrentUser, pasar 'anonymous-user' |
| `backend/src/generate/generate.module.ts` | Modified | Quitar import de AuthModule si existe |

## Architecture Decision Records (ADRs)

### ADR-1: Eliminar archivos de auth en lugar de comentarlos
- **Context:** Los archivos de auth (AuthContext, ProtectedRoute, LoginCard, etc.) son código muerto una vez removida la autenticación.
- **Decision:** Eliminar los archivos completamente del repositorio.
- **Rationale:** Código comentado o muerto genera confusión y mantenimiento innecesario. Si la auth vuelve, se puede recuperar desde git history.
- **Trade-offs:** Requiere un commit de borrado explícito; el historial git sigue siendo el único respaldo.

### ADR-2: Usar 'anonymous-user' como userId fijo en el backend
- **Context:** El backend usa `userId` para crear jobs y para validar que un usuario accede solo a sus propios jobs.
- **Decision:** Hardcodear `'anonymous-user'` como constante en el controller en lugar de eliminar el campo userId del schema.
- **Rationale:** Evita migraciones de base de datos (campo `userId` puede volverse NOT NULL con valor real cuando se reintegre auth). La validación `job.userId !== userId` sigue funcionando correctamente (todos los jobs tendrán el mismo userId).
- **Trade-offs:** Todos los jobs quedan asociados a un único usuario falso; cualquier instancia del MVP puede ver jobs de otra instancia si comparten DB.

### ADR-3: No eliminar los archivos de auth del backend
- **Context:** `src/common/auth/` contiene JwtStrategy, JwtGuard, AuthModule, etc.
- **Decision:** Dejar los archivos en el backend, solo desregistrar el guard del controller.
- **Rationale:** El backend tiene más inercia de configuración (Passport, módulos NestJS). Dejar los archivos evita romper imports no detectados y facilita la reintegración futura.
- **Trade-offs:** Código no utilizado permanece en el repositorio del backend.

## API Contracts

Los endpoints no cambian su contrato público. Solo se elimina el requisito del header `Authorization`:

### POST /generate/script
**Request (sin cambios):**
```json
{ "story": "string", "style": "anime | manga | webtoon | novel" }
```
**Response 200 (sin cambios):**
```json
{ "jobId": "string", "status": "string", "createdAt": "string" }
```
**Cambio:** Ya no requiere `Authorization: Bearer <token>`. Sin el guard, el endpoint es público.

### GET /generate/job/:jobId
**Cambio:** Ya no requiere Authorization header.

### POST /generate/images, /generate/audio, /generate/video
**Cambio:** Ya no requieren Authorization header.

## Security Considerations

- **Auth:** Los endpoints quedan públicos. Aceptable para demo MVP en entorno local/staging.
- **Rate limiting:** El `ThrottlerGuard` global del backend sigue activo — protección básica contra abuso.
- **Riesgo:** Sin auth, cualquier persona con acceso a la URL del backend puede disparar generaciones. Mitigación: no exponer la URL del backend en producción real.

## Performance Considerations

- Sin impacto. La eliminación de auth reduce una validación JWT por request, lo que es marginalmente positivo.

## Observability

- Sin cambios. Los logs del servicio de generación siguen funcionando igual.
- El campo `userId: 'anonymous-user'` en los logs permite identificar jobs del MVP fácilmente.
