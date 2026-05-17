# StoryForge — Plan de Implementación del MVP

**Versión:** 1.0  
**Fecha:** 15 de mayo de 2026  
**Estado:** En Planificación  
**Propósito:** Orquestar el desarrollo del MVP en 6 semanas con rastreamiento de progreso

---

## 📋 Resumen Ejecutivo

Este documento define **cómo** se va a construir StoryForge, cuándo, en qué orden y cómo se va a rastrear el progreso. Está alineado con la **Hoja de Ruta Sugerida** del brief final y vinculado directamente al backlog de Azure DevOps.

| Fase | Duración | Objetivo | Status |
|------|----------|----------|--------|
| **Fase 1: Setup + Pipeline de IA** | Semanas 1-2 | Backend + Integración de APIs | 🔄 Semana 1 (Iniciando HOY) |
| **Fase 2: UI + Ensamblado de Video** | Semanas 3-4 | Frontend React + Render serverless | ⏳ Pendiente |
| **Fase 3: Estabilización + Deploy** | Semanas 5-6 | Testing + Deploy a staging | ⏳ Pendiente |
| **Validación MVP** | Semana 7+ | Medición de exit criteria | ⏳ Futuro |

---

## 🎯 Fases Detalladas

### FASE 1: Setup + Pipeline de IA (Semanas 1-2)

**Épicas involucradas:**
- ✅ Épica 3: Infraestructura y Pipeline Técnico (Historias 3.1, 3.2)

**Objetivo:** Tener backend deployable con APIs de IA funcionando, listo para que el frontend las consuma.

#### Semana 1

| Tarea | Descripción | Responsable | Estimación | Status | Tipo |
|------|-------------|-------------|-----------|--------|------|
| **1.1** | Crear repositorio GitHub/ADO con estructura base (React + NestJS) | DevOps | 2h | ⏳ | Setup |
| **1.2** | Configurar Supabase: DB, Storage, Auth (Google OAuth) | Backend | 3h | ⏳ | Setup |
| **1.3** | Configurar variables de entorno y secrets | Backend | 1h | ⏳ | Setup |
| **1.4** | Setup de CI/CD: Render (frontend y backend) | DevOps | 3h | ⏳ | Setup |
| **1.5** | Implementar Historia 3.1: Setup del proyecto (5 SP) | Backend | 5h | ⏳ | Feature |
| **1.6** | Endpoint POST `/generate/script` — Integración Claude | Backend | 5h | ⏳ | Feature |
| **1.7** | Testing local del endpoint `/generate/script` | Backend | 2h | ⏳ | Testing |

**Hito:** Backend deployable con script generation funcionando.

#### Semana 2

| Tarea | Descripción | Responsable | Estimación | Status | Tipo |
|------|-------------|-------------|-----------|--------|------|
| **2.1** | Endpoint POST `/generate/images` — Integración Replicate | Backend | 5h | ⏳ | Feature |
| **2.2** | Endpoint POST `/generate/audio` — Integración ElevenLabs | Backend | 4h | ⏳ | Feature |
| **2.3** | Implementar Historia 3.2: Pipeline de IA (8 SP) | Backend | 8h | ⏳ | Feature |
| **2.4** | Rate limiting y manejo de errores en endpoints | Backend | 3h | ⏳ | Feature |
| **2.5** | Testing E2E local: texto → guión → imágenes → audio | Backend | 3h | ⏳ | Testing |
| **2.6** | Documentación de API (Swagger/OpenAPI) | Backend | 2h | ⏳ | Documentation |
| **2.7** | Deploy Stage 1 a Render | DevOps | 1h | ⏳ | Deploy |

**Hito:** Todos los endpoints de IA funcionando y testeados.

---

### FASE 2: UI + Ensamblado de Video (Semanas 3-4)

**Épicas involucradas:**
- ✅ Épica 1: Pipeline de Generación de Video (Historias 1.1-1.4)
- ✅ Épica 2: Autenticación y Gestión de Cuenta (Historias 2.1-2.2)
- ⚠️ Épica 3: Historia 3.3 (Ensamblado serverless)

**Objetivo:** Frontend funcional con flujo completo usuario → video descargable.

#### Semana 3

| Tarea | Descripción | Responsable | Estimación | Status | Tipo |
|------|-------------|-------------|-----------|--------|------|
| **3.1** | Setup React + Vite + TailwindCSS + shadcn/ui | Frontend | 2h | ⏳ | Setup |
| **3.2** | Integración Supabase Auth (Google OAuth) en frontend | Frontend | 3h | ⏳ | Feature |
| **3.3** | Implementar Historia 2.1: Registro/Login (3 SP) | Frontend | 3h | ⏳ | Feature |
| **3.4** | Dashboard + Visualización de cuota (Historia 2.2 - 3 SP) | Frontend | 3h | ⏳ | Feature |
| **3.5** | Crear componente Input de texto + validación | Frontend | 2h | ⏳ | Component |
| **3.6** | Crear componente Selector de estilo visual (4 géneros) | Frontend | 2h | ⏳ | Component |
| **3.7** | Crear componente Selector de voz (biblioteca) | Frontend | 2h | ⏳ | Component |
| **3.8** | Conectar frontend a endpoint `/generate/script` | Frontend | 2h | ⏳ | Integration |

**Hito:** Frontend con autenticación y análisis narrativo funcionando.

#### Semana 4

| Tarea | Descripción | Responsable | Estimación | Status | Tipo |
|------|-------------|-------------|-----------|--------|------|
| **4.1** | Conectar frontend a endpoints `/generate/images` y `/generate/audio` | Frontend | 3h | ⏳ | Integration |
| **4.2** | Implementar Historia 1.2: Generación de imágenes (8 SP) | Frontend | 4h | ⏳ | Feature |
| **4.3** | Implementar Historia 1.3: Narración con voz (5 SP) | Frontend | 3h | ⏳ | Feature |
| **4.4** | Indicador de progreso real-time (estado del pipeline) (Historia 2.2 bonus) | Frontend | 3h | ⏳ | Feature |
| **4.5** | Backend: Endpoint POST `/generate/video` — Ensamblado FFmpeg | Backend | 8h | ⏳ | Feature |
| **4.6** | Implementar Historia 3.3: Ensamblado serverless (13 SP) | Backend | 5h | ⏳ | Feature |
| **4.7** | Conectar frontend a `/generate/video` y lógica de descarga | Frontend | 2h | ⏳ | Integration |
| **4.8** | Implementar Historia 1.4: Export MP4 (13 SP) | Frontend | 2h | ⏳ | Feature |
| **4.9** | Testing E2E completo: texto → video descargable | Both | 4h | ⏳ | Testing |

**Hito:** Flujo completo funcionando end-to-end.

---

### FASE 3: Estabilización + Deploy (Semanas 5-6)

**Objetivo:** Producto robusto, documentado y deployado a producción.

#### Semana 5

| Tarea | Descripción | Responsable | Estimación | Status | Tipo |
|------|-------------|-------------|-----------|--------|------|
| **5.1** | Testing local exhaustivo: casos de error, timeouts, edge cases | Both | 8h | ⏳ | Testing |
| **5.2** | Mejorar manejo de errores frontend (mensajes claros al usuario) | Frontend | 3h | ⏳ | Polish |
| **5.3** | Optimizar tiempos: cache de imágenes, lazy loading | Frontend | 3h | ⏳ | Optimization |
| **5.4** | Implementar retry logic y circuit breaker en backend | Backend | 3h | ⏳ | Reliability |
| **5.5** | Configurar logging estructurado (Sentry) | Backend | 2h | ⏳ | Observability |
| **5.6** | Integración con PostHog para analíticas de producto | Frontend | 2h | ⏳ | Analytics |
| **5.7** | Crear landing page de bienvenida + documentación UX | Frontend | 3h | ⏳ | Content |

**Hito:** Producto estable y observable.

#### Semana 6

| Tarea | Descripción | Responsable | Estimación | Status | Tipo |
|------|-------------|-------------|-----------|--------|------|
| **6.1** | Security review: CORS, rate limiting, sanitización de input | Security | 3h | ⏳ | Security |
| **6.2** | Performance testing y optimización de endpoints | Backend | 3h | ⏳ | Performance |
| **6.3** | Configurar backups automáticos en Supabase | DevOps | 1h | ⏳ | Ops |
| **6.4** | Preparar infraestructura de Render (deploy staging) | DevOps | 2h | ⏳ | Deploy |
| **6.5** | Deploy a staging en Render (frontend + backend) | DevOps | 2h | ⏳ | Deploy |
| **6.6** | Smoke testing en staging | QA | 2h | ⏳ | Testing |
| **6.7** | Docstring completo de API, setup y deployment | Documentation | 3h | ⏳ | Documentation |
| **6.8** | Preparar scripts de inicialización del proyecto para nuevos devs | DevOps | 2h | ⏳ | Documentation |

**Hito:** MVP listo en staging, pronto a producción.

---

## 📊 Rastreamiento de Progreso

### Por Epic (Historias de Usuario)

```
Épica 1: Pipeline de Generación de Video (34 SP)
├─ 1.1 Análisis narrativo (8 SP) ────────────────── ⏳ No iniciado
├─ 1.2 Generación de imágenes (8 SP) ────────────── ⏳ No iniciado
├─ 1.3 Narración con voz (5 SP) ─────────────────── ⏳ No iniciado
└─ 1.4 Export MP4 (13 SP) ───────────────────────── ⏳ No iniciado
   Progreso Fase 1: 0% | Fase 2: 0% | Fase 3: 0%

Épica 2: Autenticación y Gestión de Cuenta (6 SP)
├─ 2.1 Registro OAuth (3 SP) ────────────────────── ⏳ No iniciado
└─ 2.2 Control de cuota (3 SP) ──────────────────── ⏳ No iniciado
   Progreso Fase 2: 0% | Fase 3: 0%

Épica 3: Infraestructura y Pipeline Técnico (26 SP)
├─ 3.1 Setup proyecto (5 SP) ────────────────────── ⏳ No iniciado
├─ 3.2 Pipeline IA (8 SP) ───────────────────────── ⏳ No iniciado
└─ 3.3 Ensamblado serverless (13 SP) ────────────── ⏳ No iniciado
   Progreso Fase 1: 0% | Fase 2: 0% | Fase 3: 0%
```

### Velocidad y Forecast

- **Velocidad esperada:** 20-25 SP/semana (equipo de 2 devs)
- **Total MVP:** 66 SP
- **Forecast completación:** Semana 3-4 (si todo va según plan)
- **Buffer:** Semanas 5-6 para polish, testing y deploy

---

## 🔄 Proceso de Actualización

Cada semana (al cierre de viernes):

1. **Revisar tareas completadas** y marcar como ✅
2. **Actualizar tabla de status** (⏳ → 🔄 → ✅)
3. **Registrar bloqueos** (❌ si algo está stuck)
4. **Ajustar estimaciones** si es necesario
5. **Confirmar hito de semana** antes de pasar a la siguiente

### Ejemplo de Actualización (Ficticio)

```
Semana 1 - Cierre de viernes:
├─ 1.1 Crear repo ✅ 2h actual
├─ 1.2 Configurar Supabase ✅ 3h actual
├─ 1.3 Env vars ✅ 1h actual
├─ 1.4 CI/CD 🔄 2h de 3h (bloquea 1.5)
└─ Hito S1: 75% completado, 1.4 continúa S2
```

---

## 🚨 Consideraciones Especiales

### Decisiones Técnicas Reversibles

Algunos componentes pueden sacarse post-MVP sin grandes cambios arquitectónicos:

| Componente | MVP | ¿Puede Sacarse? | Impacto |
|-----------|-----|-----------------|--------|
| Text-to-Speech (ElevenLabs) | Incluido | ✅ Sí | Opcional; usuarios sin audio |
| Render de Video (FFmpeg) | Incluido | ⚠️ Parcial | Crítico; necesario workaround |
| Google OAuth | Incluido | ❌ No | Fundamental para MVP |
| Supabase Storage | Incluido | ⚠️ Parcial | Cambiar a S3/CloudFlare |

### Escalabilidad Incorporada Desde Día 1

- **Rate limiting** implementado desde Semana 2 (preparado para freemium)
- **Async processing** con queues (Redis + BullMQ) desde inicio
- **Modular architecture** en NestJS: fácil agregar nuevos servicios de IA
- **Storage agnóstico** (abstracción en Supabase): fácil migrar a S3 si es necesario

### Proceso Local Antes de Deploy

```
1. Crear archivo .env.local con keys de desarrollo
2. Ejecutar docker-compose (backend + Supabase local opcional)
3. npm install + setup DB schema
4. npm run dev (ambos frontend y backend)
5. Ejecutar suite de tests
6. Manual smoke testing
7. Deploy a staging (Render)
8. Validar en staging
9. Deploy a producción
```

---

## 📎 Vinculación a Azure DevOps

Este plan se vincula con el backlog así:

- **Cada "Historia de Usuario" en ADO** tiene un número (1.1, 1.2, etc.)
- **Cada "Tarea" en este plan** referencia la Historia (ej. "Historia 3.1: Setup del proyecto (5 SP)")
- **El status aquí coincide con ADO:** ⏳ New → 🔄 Active → ✅ Closed

Al completar tareas en ADO, actualizar el status aquí también para mantener sincronización.

---

## 📝 Próximos Pasos

1. ✅ Crear este plan (hecho)
2. ⏳ Crear repositorio base con estructura (Semana 1.1)
3. ⏳ Comenzar Sprint 1 (Semana 1)
4. ⏳ Revisar semanalmente y actualizar este documento

---

**Última actualización:** 15 de mayo de 2026  
**Próxima revisión:** Viernes, Semana 1 (cierre de sprint)
