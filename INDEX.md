# 📋 ÍNDICE Y GUÍA DE LECTURA

**Documento maestro que te dice CUÁNDO leer QUÉ**

---

## 🎯 TÚ ERES... (elige tu rol)

### 👤 Developer Backend Nuevo en el Proyecto

**En este orden:**
1. [QUICK_START.md](QUICK_START.md) — Setup local (10 min)
2. [STACK_INIT.md](STACK_INIT.md) — Section "Backend" (5 min)
3. [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) — NestJS + arquitectura (20 min)
4. [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — Tu semana actual (5 min)
5. Escoger una historia de Semana 1 → `feature/X-Y-description`

**Repo a clonar:**
```bash
git clone https://dev.azure.com/ia-aplicada-grupo-04/StoryForge
```

**Primeras 30 min:**
- Setup .env.local backend
- `npm install` + `npm run start:dev`
- Ver http://localhost:3000/health responda

---

### 👤 Developer Frontend Nuevo en el Proyecto

**En este orden:**
1. [QUICK_START.md](QUICK_START.md) — Setup local (10 min)
2. [STACK_INIT.md](STACK_INIT.md) — Section "Frontend" (5 min)
3. [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) — React + componentes (20 min)
4. [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — Tu semana actual (5 min)
5. Escoger una historia de Semana 3+ (UI viene después)

**Primeras 30 min:**
- Setup .env.local frontend
- `npm install` + `npm run dev`
- Ver http://localhost:5173 cargue sin errores

---

### 📊 Project Manager / Technical Lead

**En este orden:**
1. [README.md](README.md) — Overview (5 min)
2. [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — Hoja de ruta completa + rastreamiento (20 min)
3. [backlog-azure-devops.md](analisis/backlog-azure-devops.md) — 9 historias detalladas (15 min)
4. [AZURE_DEVOPS_CONFIG.md](AZURE_DEVOPS_CONFIG.md) — Setup + workflow (10 min)
5. [etapa4-brief-final.md](analisis/etapa4-brief-final.md) — Context completo (10 min)

**Acciones este viernes:**
- [ ] Configurar PAT token de Azure DevOps
- [ ] Importar épicas + historias a ADO
- [ ] Crear 2 sprints (Semana 1-2, Semana 3-4)
- [ ] Asignar devs a historias Semana 1

---

### 🔍 Code Reviewer / QA

**En este orden:**
1. [README.md](README.md) — Overview (5 min)
2. [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) — Checklist (10 min)
3. [OPTIONAL_COMPONENTS.md](OPTIONAL_COMPONENTS.md) — Decisiones reversibles (5 min)

**Cuando reviewes un PR:**
- [ ] Tipos TypeScript correctos
- [ ] Validación de input presente
- [ ] Tests incluidos (>70% coverage)
- [ ] Logging estructurado
- [ ] Referencia a historia ADO en commit

---

### 🤖 Claude / AI Copilot

**Acceso a MCP Tools:**
- Leer: [MCP_INTEGRATION.md](MCP_INTEGRATION.md)
- Tools disponibles: get_project_structure, read_api_schema, execute_test, deploy_to_staging

**Generando código:**
1. Claude lee DEVELOPMENT_GUIDELINES.md automáticamente
2. Genera código siguiendo patterns
3. Referencia historias (ej: "Historia 1.1")
4. Propone PR + descripción

---

## � Tracking & Handoffs

| Archivo | Para Quién | Qué Contiene |
|---------|-----------|------------|
| [PROGRESS.md](PROGRESS.md) | Everyone | Semana actual: qué se completó, qué falta |
| [HANDOFF.md](HANDOFF.md) | Siguiente dev | Info para retomar: status, próximo step, checklist |

---

## �📂 Estructura de Directorios

```
StoryForge/
├── README.md ⭐                    ← EMPEZÁ AQUÍ
├── QUICK_START.md                  ← Setup rápido (10 min)
├── IMPLEMENTATION_PLAN.md           ← Hoja de ruta + rastreamiento
├── STACK_INIT.md                   ← Tech stack definido
├── DEVELOPMENT_GUIDELINES.md        ← Cómo programar acá
├── AZURE_DEVOPS_CONFIG.md           ← Backlog + workflow
├── MCP_INTEGRATION.md               ← AI-assisted development
├── OPTIONAL_COMPONENTS.md           ← Qué se puede sacar
├── INDEX.md                         ← Este archivo
│
├── analisis/
│   ├── etapa4-brief-final.md        ← Product brief (context)
│   ├── backlog-azure-devops.md      ← 9 historias detalladas
│   └── etapa1-3*.md                 ← Análisis previos (read-only)
│
├── frontend/
│   ├── .env.example                 ← Copiar a .env.local
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── .env.example                 ← Copiar a .env.local
│   ├── src/
│   ├── package.json
│   └── nest-cli.json
│
├── docs/                            ← (Crear en Semana 1)
│   ├── API.md                       ← Swagger export
│   └── ARCHITECTURE.md              ← Diagramas
│
├── .github/
│   └── workflows/
│       ├── frontend-deploy.yml      ← CI/CD Vercel
│       └── backend-deploy.yml       ← CI/CD Render
│
└── docker-compose.yml               ← Dev local con Docker (opcional)
```

---

## ⏰ Timeline de Lectura

### Día 1 (Onboarding)
- [ ] Lee README.md (5 min)
- [ ] Lee QUICK_START.md (10 min)
- [ ] Setup local (30 min)
- [ ] Verifica que backend + frontend corren

### Días 2-3 (Contexto)
- [ ] Lee etapa4-brief-final.md (10 min)
- [ ] Lee STACK_INIT.md relevante a tu rol (10 min)
- [ ] Lee DEVELOPMENT_GUIDELINES.md (20 min)

### Día 4 (Planning)
- [ ] Lee IMPLEMENTATION_PLAN.md (15 min)
- [ ] Identifica tu historia asignada
- [ ] Setup Azure DevOps

### Día 5 (Desarrollo)
- [ ] Comienza feature en `feature/X-Y-description`
- [ ] Sigue DEVELOPMENT_GUIDELINES.md
- [ ] Referencia historia en commits

---

## 🔑 Conceptos Clave

### Exit Criteria del MVP (No escales hasta alcanzar)

| Métrica | Target |
|---------|--------|
| Activación (gen 1er video en D1) | 60%+ |
| Retención (vuelven en D7) | 40%+ |
| Publicación (video → redes) | 50%+ |
| NPS | 40+ |

### 3 Épicas del Proyecto

```
Épica 1: Pipeline de Generación de Video (34 SP)
  └─ Análisis narrativo → Imágenes → Audio → Video

Épica 2: Autenticación y Gestión de Cuenta (6 SP)
  └─ Login OAuth → Control de cuota

Épica 3: Infraestructura y Pipeline Técnico (26 SP)
  └─ Setup → APIs IA → Ensamblado serverless
```

### Componentes Eliminables Post-MVP

- ✅ **Text-to-Speech** (ElevenLabs) — Puede desactivarse fácilmente
- ✅ **Video Render** (FFmpeg) — Alternativa: descargar assets + renderear localmente

---

## 🚨 Decisiones Críticas (No cambiar sin consenso)

- ❌ **NO cambiar** frontend framework (React)
- ❌ **NO cambiar** DB principal (PostgreSQL via Supabase)
- ❌ **NO cambiar** backend framework (NestJS)
- ✅ **SÍ se puede** cambiar storage (Supabase ↔ S3)
- ✅ **SÍ se puede** cambiar deploy targets (Vercel/Render)
- ✅ **SÍ se puede** cambiar IA providers (Claude ↔ OpenAI)

---

## 🤝 Workflow Principal

```
1. Escoger Historia no iniciada
   ↓
2. Create branch: feature/X-Y-description
   ↓
3. Develop localmente, seguir DEVELOPMENT_GUIDELINES
   ↓
4. Commit: "feat(...): description - AB#X.Y"
   ↓
5. Push + PR a develop (NOT main)
   ↓
6. Code review (1 dev mínimo)
   ↓
7. Auto-deploy a staging (Vercel + Render)
   ↓
8. Verify en staging
   ↓
9. Merge a develop
   ↓
10. Actualizar status en ADO (Resolved → Closed)
```

---

## 📞 Cuando Estés Bloqueado

| Bloqueo | Dónde buscar |
|---------|-------------|
| Setup no funciona | QUICK_START.md Troubleshooting |
| Pattern de código | DEVELOPMENT_GUIDELINES.md |
| ¿Qué hacer ahora? | IMPLEMENTATION_PLAN.md Semana actual |
| Decisión arquitectónica | OPTIONAL_COMPONENTS.md |
| Integración MCP? | MCP_INTEGRATION.md |
| Context del producto | etapa4-brief-final.md |

---

## 📋 Checklist Semanal (Viernes)

### PM/Lead
- [ ] Revisar IMPLEMENTATION_PLAN.md y actualizar status
- [ ] Verificar velocidad (¿20-25 SP completados?)
- [ ] Sincronizar con Azure DevOps
- [ ] Documentar blockers
- [ ] Preparar sprint próxima semana

### Devs (Todos)
- [ ] Todos los commits referenciaban historias? (AB#X.Y)
- [ ] Tests pasando? (CI verde)
- [ ] Staging funciona? (Smoke test)
- [ ] Documentar aprendizajes > DEVELOPMENT_GUIDELINES.md

### Lead Técnico
- [ ] Performance metrics (Vercel + Render)
- [ ] Sentry: ¿nuevos errores?
- [ ] PostHog: ¿métricas de uso?
- [ ] PRs revieweadas dentro de 24h?

---

## 🎓 Recursos Externos

- **NestJS Docs:** https://docs.nestjs.com/
- **React Docs:** https://react.dev/reference
- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/

---

## 🔄 Cómo Actualizar Este Índice

Si agregas nuevo documento:
1. Crear archivo `.md` en raíz
2. Agregar sección aquí con descripción
3. Actualizar lista de Estructura de Directorios

---

**Última actualización:** 15 de mayo de 2026  
**Próxima revisión:** Viernes, Semana 1 (cierre de sprint)

---

## ✅ Completaste la lectura inicial?

**Checklist:**
- [ ] Leí los docs de mi rol
- [ ] Setup local funcionando
- [ ] Puedo clonar y hacer `npm install`
- [ ] Backend y frontend corren
- [ ] Entiendo la arquitectura (README + STACK_INIT)
- [ ] Sé cómo commitear y hace PR (DEVELOPMENT_GUIDELINES)
- [ ] Entiendo timeline (IMPLEMENTATION_PLAN)

**Si completaste TODO → Ready para comenzar desarrollo Week 1** 🚀
