# 🎬 StoryForge — MVP Implementation Guide

**Convert long-form stories to YouTube Shorts in minutes. Powered by AI.**

---

## 📊 Project Status

| Phase | Status | Timeline |
|-------|--------|----------|
| 🎯 **Discovery** | ✅ Complete | Completado |
| 🚀 **Implementation** | ⏳ In Progress | Semanas 1-6 |
| ✨ **Validation** | ⏳ Pending | Semanas 7+ |

**Total Scope:** 66 story points across 3 epics, 9 user stories

---

## 🎯 Quick Navigation

### 👤 For New Developers

1. **First time setup?** → Read [QUICK_START.md](QUICK_START.md) (10 min)
2. **What are we building?** → Read [etapa4-brief-final.md](analisis/etapa4-brief-final.md) (5 min)
3. **How does it work?** → Read [STACK_INIT.md](STACK_INIT.md) (10 min)
4. **How do I code here?** → Read [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) (15 min)

### 📋 For Project Managers / Technical Leads

1. **What's the plan?** → [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
   - Week-by-week breakdown
   - Task tracking
   - Velocity forecast
   
2. **What's being built?** → [backlog-azure-devops.md](analisis/backlog-azure-devops.md)
   - 3 épicas
   - 9 historias con criterios de aceptación
   - 66 story points desglosados

3. **How do we track it?** → [AZURE_DEVOPS_CONFIG.md](AZURE_DEVOPS_CONFIG.md)
   - PAT token configuration
   - Workflow y estados
   - Dashboards útiles

### 🤖 For Claude / AI Assistance

1. **How can AI help?** → [MCP_INTEGRATION.md](MCP_INTEGRATION.md)
   - Tools disponibles
   - Flujos de trabajo
   - Ejemplos de uso

2. **What can I skip / change?** → [OPTIONAL_COMPONENTS.md](OPTIONAL_COMPONENTS.md)
   - Componentes reversibles (TTS, video render)
   - Arquitectura que lo permite
   - Decisiones post-MVP

---

## 🏗️ Architecture Overview

```
Frontend (React + Vite + Tailwind)
    ↓
API Gateway (NestJS backend)
    ├─ /generate/script    → Claude API
    ├─ /generate/images    → Replicate (Flux Schnell)
    ├─ /generate/audio     → ElevenLabs
    └─ /generate/video     → FFmpeg + Modal
    ↓
Storage & Database (Supabase PostgreSQL + Storage)
    ↓
Deployed to: Vercel (FE) + Render (BE)
```

**Key Technologies:**
- **Frontend:** React 18 + Vite + TailwindCSS + shadcn/ui + TypeScript
- **Backend:** NestJS + Prisma + Supabase
- **Queue:** Redis + BullMQ (async processing)
- **AI Services:** Claude (Anthropic) + Replicate + ElevenLabs
- **Deploy:** Vercel (frontend) + Render (backend)
- **Observability:** Sentry + PostHog + Vercel Analytics

---

## 🚀 Getting Started

### Prerequisitos
```bash
- Node.js 18+
- Git
- Cuenta Supabase
- API keys: Claude, Replicate, ElevenLabs
```

### Installation (5 min)

```bash
# Clone
git clone https://dev.azure.com/ia-aplicada-grupo-04/StoryForge
cd StoryForge

# Backend setup
cd backend
cp .env.example .env.local
# ⚠️ Llenar .env.local con credenciales
npm install
npm run start:dev

# Frontend setup (en otra terminal)
cd frontend
cp .env.example .env.local
# ⚠️ Llenar .env.local con credenciales
npm install
npm run dev

# Verificar
# Backend: http://localhost:3000 ✅
# Frontend: http://localhost:5173 ✅
```

**¿Stuck?** Ver [QUICK_START.md](QUICK_START.md#-troubleshooting)

---

## 📋 Development Workflow

### 1. Escoger una Historia
Revisar [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — Escoge una tarea no iniciada

### 2. Crear branch
```bash
git checkout -b feature/1-1-script-analysis
git push -u origin feature/1-1-script-analysis
```

### 3. Développer localmente
Seguir [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md):
- ✅ TypeScript types
- ✅ Validación de input
- ✅ Tests unitarios
- ✅ Logging + error handling

### 4. Commitear y Pushear
```bash
git commit -m "feat(generate): implement script analysis - AB#1.1"
git push origin feature/1-1-script-analysis
```

### 5. Crear Pull Request
- Referenciar historia: `Closes AB#1.1`
- Descripción clara
- Screenshots si UI
- Pasar tests CI

### 6. Code Review + Merge
- 1 dev review mínimo
- Merge a `develop` (NO a main)
- Actualizar status en ADO

### 7. Verificar en Staging
Deploy automático a Render/Vercel en push a `develop`

---

## 📊 Project Timeline

### Semana 1-2: Setup + Pipeline IA
- ✅ Repositorio base (React + NestJS)
- ✅ Integración Supabase
- ✅ APIs de Claude, Replicate, ElevenLabs
- 🎯 **Hito:** Backend deployable

### Semana 3-4: UI + Video Render
- ✅ Login con Google
- ✅ Dashboard + inputs
- ✅ Flujo completo usuario → video
- 🎯 **Hito:** MVP funcional end-to-end

### Semana 5-6: Estabilización + Deploy
- ✅ Testing exhaustivo
- ✅ Optimización de performance
- ✅ Deploy a producción
- 🎯 **Hito:** Listo para validar exit criteria

### Semana 7+: Validación MVP
- Medir: Activación, retención, publicación, NPS
- Decidir: Continuar, pivotar o cerrar

---

## 🎓 Key Principles

1. **Simplicidad sobre complejidad** — Preferir soluciones claras que escalen después
2. **Escalabilidad incorporada** — Rate limiting, async queues, modular services desde día 1
3. **Eliminable, no pegajoso** — Todo debe poder removerse sin romper nada (TTS, video render)
4. **Seguridad first** — Validar inputs, sanitizar datos, auth en cada endpoint
5. **Observabilidad** — Log todo, trackear eventos, error tracking en production
6. **Testing desde el inicio** — No esperar a fin (aunque MVP es pragmático)

---

## 🛠️ Important Documents

| Documento | Propósito | Audiencia |
|-----------|----------|-----------|
| [QUICK_START.md](QUICK_START.md) | Setup local en 10 min | Developers |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Hoja de ruta semanal | PMs + Developers |
| [STACK_INIT.md](STACK_INIT.md) | Tech stack detail | Developers |
| [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) | Código + patrones | Developers |
| [AZURE_DEVOPS_CONFIG.md](AZURE_DEVOPS_CONFIG.md) | Backlog + ADO | PMs |
| [MCP_INTEGRATION.md](MCP_INTEGRATION.md) | AI-assisted dev | Developers |
| [OPTIONAL_COMPONENTS.md](OPTIONAL_COMPONENTS.md) | Decisiones reversibles | Leads |
| [PROGRESS.md](PROGRESS.md) | Tracking semanal | Everyone |
| [HANDOFF.md](HANDOFF.md) | Para siguiente dev | Onboarding |
| [etapa4-brief-final.md](analisis/etapa4-brief-final.md) | Product Brief | Everyone |
| [backlog-azure-devops.md](analisis/backlog-azure-devops.md) | Stories detalladas | PMs |

---

## 🔐 Credenciales & Configuración

**All credentials managed in `.env.local` files (NEVER commit):**

- Frontend: `frontend/.env.example` → `frontend/.env.local`
- Backend: `backend/.env.example` → `backend/.env.local`

**Required API keys:**
- Supabase (Auth + DB + Storage)
- Claude (Anthropic)
- Replicate (Image generation)
- ElevenLabs (Text-to-speech)
- Sentry (Error tracking)
- PostHog (Analytics)

See [STACK_INIT.md](STACK_INIT.md) for full list.

---

## 🚀 Deploy

### Automático (Recomendado)

```bash
# Push a GitHub
git push origin staging  # Deploy a staging/preview
git push origin main     # Deploy a production
```

CI/CD automático con:
- Frontend: Vercel
- Backend: Render

### Manual (Si es necesario)

Ver [QUICK_START.md](QUICK_START.md#-deploy-local-a-staging-render)

---

## 📞 Support & Escalation

### Stuck?
1. Revisar [QUICK_START.md Troubleshooting](QUICK_START.md#-troubleshooting)
2. Leer error logs (backend: `npm run start:dev` output)
3. Revisar [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) para patrón similar

### Bloqueado?
- Registrar en ADO: campo "Blockers"
- Notificar al equipo async
- Cambiar de tarea si es urgente

### Decisión técnica no clara?
- Revisar [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md) para precedentes
- Si no existe precedente, crear issue de diseño

---

## 📈 Success Metrics (Exit Criteria MVP)

| Métrica | Target | Ventana |
|---------|--------|---------|
| **Activación** | 60%+ generan 1er video en Day 1 | D1 |
| **Retención** | 40%+ vuelven a usar en Week 2 | D7 |
| **Publicación** | 50%+ de videos generados se publican | D30 |
| **NPS** | 40+ Net Promoter Score | D60 |

Once alcanzamos esto, validamos si pivotar, escalar o cerrar.

---

## 🎯 Next Steps

**For the team right now (Today):**

1. ✅ Clone repo + setup local (QUICK_START.md)
2. ✅ Create Azure DevOps boards
3. ✅ Assign first sprint tasks (IMPLEMENTATION_PLAN.md Week 1)
4. ⏳ Begin development Week 1 Tasks

---

## 📝 Document Maintenance

This README is the single source of truth. Update when:
- Cambios en arquitectura → Update STACK_INIT.md
- Cambios en workflow → Update DEVELOPMENT_GUIDELINES.md
- Cambios en timeline → Update IMPLEMENTATION_PLAN.md

**Last Updated:** 15 de mayo de 2026  
**Version:** 1.0-MVP

---

**Questions? Start with [QUICK_START.md](QUICK_START.md). Everything else flows from there.**
