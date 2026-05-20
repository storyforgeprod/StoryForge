# StoryForge — Stack Técnico Inicial

**Versión:** 1.0  
**Fecha:** 15 de mayo de 2026  
**Propósito:** Definir todas las tecnologías, versiones y configuraciones iniciales del MVP

---

## 📦 Stack Completo

### Frontend

| Tecnología | Versión | Propósito | Config Inicial |
|-----------|---------|----------|-----------------|
| **React** | 18+ | Framework UI | `npx create-vite@latest storyforge-frontend --template react` |
| **Vite** | 5+ | Build tool / Dev server | Incluido en Vite + React template |
| **TailwindCSS** | 3+ | Utility CSS | `npm install -D tailwindcss postcss autoprefixer` |
| **shadcn/ui** | Latest | UI components library | `npm install shadcn-ui` |
| **TypeScript** | 5+ | Type safety | `npm install -D typescript @types/react @types/react-dom` |
| **Axios** | Latest | HTTP client | `npm install axios` |
| **Zustand** o **TanStack Query** | Latest | State management | `npm install zustand` (opción: React Query) |
| **PostHog** | Latest | Product analytics | `npm install posthog-js` |
| **Sentry** | Latest | Error tracking | `npm install @sentry/react` |

**Setup inicial:**
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

---

### Backend

| Tecnología | Versión | Propósito | Config Inicial |
|-----------|---------|----------|-----------------|
| **NestJS** | 10+ | API framework | `npm i -g @nestjs/cli` → `nest new storyforge-backend` |
| **TypeScript** | 5+ | Type safety | Incluido en NestJS |
| **PostgreSQL** | 14+ | Database | Via Supabase managed |
| **Prisma** | Latest | ORM | `npm install @prisma/client` + `npm install -D prisma` |
| **Supabase SDK** | Latest | Auth + Storage | `npm install @supabase/supabase-js` |
| **Redis** | 6+ | Message queue broker | Via Upstash o local Docker |
| **BullMQ** | Latest | Job queue | `npm install bullmq` |
| **Axios** | Latest | HTTP client for external APIs | `npm install axios` |
| **dotenv** | Latest | Environment variables | `npm install dotenv` |
| **class-validator** | Latest | Input validation | `npm install class-validator class-transformer` |
| **Winston** | Latest | Structured logging | `npm install winston` |
| **Swagger** | Latest | API documentation | `npm install @nestjs/swagger swagger-ui-express` |

**Setup inicial:**
```bash
cd backend
npm install
npm run start:dev  # http://localhost:3000
```

---

### Bases de Datos

| Tecnología | Tipo | Propósito | Conexión |
|-----------|------|----------|----------|
| **Supabase (PostgreSQL)** | Relacional | Users, quotas, audit logs | `postgresql://...@db.supabase.co` |
| **Supabase Storage** | Object Storage | Imágenes, audio, videos generados | S3-compatible |
| **Supabase Auth** | Identity | OAuth (Google), sesiones | OpenID Connect |
| **Redis (Upstash)** | Cache / Queue | Job queue (BullMQ) | `redis://default:...@...upstash.io` |

**Credenciales:**
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
REDIS_URL=redis://default:xxxxx@...upstash.io
```

---

### Servicios de IA Integrados

| Servicio | Proveedor | Propósito | Modelo/Plan | Costo Estimado/Mes |
|---------|-----------|----------|------------|-------------------|
| **Script Generation** | Anthropic | Análisis narrativo | Claude 3.5 Sonnet | ~$20-50 |
| **Image Generation** | Replicate | Generación de imágenes | Flux Schnell | ~$30-80 |
| **Text-to-Speech** | ElevenLabs | Narración | Standard (6 voces) | ~$25 (11 voces) |
| **Video Rendering** | Modal / FFmpeg | Ensamblado MP4 | serverless | ~$15-40 |

**Credenciales:**
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
REPLICATE_API_TOKEN=xxxxx
ELEVENLABS_API_KEY=xxxxx
MODAL_API_TOKEN_ID=ak-xxxxx (si se usa Modal)
```

---

## 🔐 Variables de Entorno

### `.env.example` (Frontend)

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx

# API Backend
VITE_API_URL=http://localhost:3000  # Dev
# VITE_API_URL=https://backend.onrender.com  # Prod

# Sentry
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# PostHog
VITE_POSTHOG_KEY=xxxxx
VITE_POSTHOG_URL=https://app.posthog.com
```

### `.env.example` (Backend)

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Database
DATABASE_URL=postgresql://xxxxx:xxxxx@db.supabase.co:5432/postgres

# Redis / Queue
REDIS_URL=redis://default:xxxxx@...upstash.io

# IA Services
ANTHROPIC_API_KEY=sk-ant-xxxxx
REPLICATE_API_TOKEN=xxxxx
ELEVENLABS_API_KEY=xxxxx

# Sentry
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Environment
NODE_ENV=development  # development | staging | production
PORT=3000
```

---

## 🚀 Deploy Targets

### Frontend

| Entorno | Plataforma | URL | Auto-deploy |
|---------|-----------|-----|------------|
| **Development** | Local Vite | `http://localhost:5173` | Manual |
| **Staging** | Render | `staging-storyforge.onrender.com` | Push a `staging` branch |
| **Production** | Render | `storyforge.onrender.com` | Push a `main` branch |

**Setup Render:**
```
1. Conectar repo GitHub a Render
2. Configurar variables de entorno en Render
3. Auto-deploy habilitado en push
```

### Backend

| Entorno | Plataforma | URL | Auto-deploy |
|---------|-----------|-----|------------|
| **Development** | Local NestJS | `http://localhost:3000` | Manual |
| **Staging** | Render | `https://storyforge-backend-staging.onrender.com` | Push a `staging` branch |
| **Production** | Render | `https://storyforge-backend.onrender.com` | Push a `main` branch |

**Setup Render:**
```
1. Crear Render account
2. Conectar repo GitHub
3. Configurar servicio Web:
   - Build: npm install && npm run build
   - Start: npm run start:prod
   - Variables de entorno
4. Auto-deploy habilitado
```

---

## 📁 Estructura de Directorios

```
storyforge/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Input/           (textarea, estilo selector, voz selector)
│   │   │   ├── Preview/         (visualización de resultado)
│   │   │   ├── Dashboard/       (cuota, historial)
│   │   │   └── common/          (botones, modales, etc.)
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Generate.tsx
│   │   │   └── NotFound.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useGenerate.ts
│   │   │   └── useQuota.ts
│   │   ├── services/
│   │   │   ├── api.ts            (Axios instance + endpoints)
│   │   │   ├── supabase.ts       (Supabase client)
│   │   │   └── analytics.ts      (PostHog)
│   │   ├── types/
│   │   │   └── index.ts          (TypeScript interfaces)
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   └── format.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── .env.example
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/             (Google OAuth)
│   │   │   ├── users/            (cuota, datos)
│   │   │   ├── generate/
│   │   │   │   ├── script.controller.ts
│   │   │   │   ├── script.service.ts
│   │   │   │   ├── images.controller.ts
│   │   │   │   ├── images.service.ts
│   │   │   │   ├── audio.controller.ts
│   │   │   │   ├── audio.service.ts
│   │   │   │   ├── video.controller.ts
│   │   │   │   └── video.service.ts
│   │   │   ├── queue/            (BullMQ jobs)
│   │   │   ├── storage/          (Supabase + local abstractions)
│   │   │   └── analytics/        (PostHog events)
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── filters/          (error handling)
│   │   │   ├── middleware/       (auth, logging)
│   │   │   └── utils/
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   ├── env.validation.ts
│   │   │   └── ai-clients.config.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── main.ts
│   ├── .env.example
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── package.json
│
├── docs/
│   ├── API.md               (Swagger export)
│   ├── ARCHITECTURE.md
│   └── SETUP.md
│
├── .github/
│   └── workflows/           (CI/CD - GitHub Actions)
│       ├── frontend-deploy.yml
│       └── backend-deploy.yml
│
├── docker-compose.yml       (Local dev: PostgreSQL + Redis opcional)
├── IMPLEMENTATION_PLAN.md
├── STACK_INIT.md            (este archivo)
├── DEVELOPMENT_GUIDELINES.md
├── MCP_INTEGRATION.md
└── README.md
```

---

## 🐳 Docker Compose (Desarrollo Local)

**`docker-compose.yml`:**
```yaml
version: '3.8'
services:
  # PostgreSQL local (opcional; preferimos Supabase)
  # postgres:
  #   image: postgres:15
  #   environment:
  #     POSTGRES_PASSWORD: dev
  #   ports:
  #     - "5432:5432"

  # Redis local para queue
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes

  # Backend NestJS
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      REDIS_URL: redis://redis:6379
      DATABASE_URL: postgresql://...  # Supabase
    depends_on:
      - redis
    volumes:
      - ./backend/src:/app/src

  # Frontend Vite (opcional; normalmente npm run dev local)
  # frontend:
  #   build: ./frontend
  #   ports:
  #     - "5173:5173"
  #   volumes:
  #     - ./frontend/src:/app/src
```

**Iniciar dev local:**
```bash
docker-compose up -d
cd frontend && npm run dev  # en otra terminal
```

---

## 📊 Monitoreo y Observabilidad

| Herramienta | Propósito | Plan MVP |
|-----------|----------|---------|
| **Sentry** | Error tracking | Free tier (~5k events/mes) |
| **PostHog** | Product analytics | Free tier (~1M events/mes) |
| **Render Analytics** | Frontend perf | Incluido |
| **Render Metrics** | Backend health | Incluido |

**Credenciales a configurar:**
```
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
POSTHOG_API_KEY=xxxxx
POSTHOG_URL=https://app.posthog.com
```

---

## ✅ Checklist de Setup Inicial (Semana 1.1)

```
[ ] Crear repositorio en Azure DevOps
[ ] Clone local
[ ] Crear frontend con Vite
[ ] Crear backend con NestJS
[ ] Instalar dependencias (npm install both)
[ ] Copiar .env.example → .env.local
[ ] Llenar credenciales en .env.local
[ ] Conectar Supabase
[ ] Conectar Redis (Upstash)
[ ] Conectar servicios de IA (API keys)
[ ] Verificar npm run dev (ambos) local
[ ] Crear CI/CD en GitHub Actions / Azure Pipelines
[ ] Deploy a Render (frontend)
[ ] Deploy a Render (backend)
[ ] Verificar staging funciona
[ ] Documentar en SETUP.md paso a paso
```

---

## 🔗 Referencias

- **React + Vite:** https://vitejs.dev/guide/#scaffolding-your-first-vite-project
- **NestJS:** https://docs.nestjs.com/
- **TailwindCSS:** https://tailwindcss.com/docs/installation
- **shadcn/ui:** https://ui.shadcn.com/docs
- **Supabase:** https://supabase.com/docs
- **Prisma:** https://www.prisma.io/docs/
- **BullMQ:** https://docs.bullmq.io/
- **Render:** https://render.com/docs

---

**Última actualización:** 15 de mayo de 2026
