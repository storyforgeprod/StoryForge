# StoryForge — Guía Rápida de Setup

**TL;DR — Puesta en marcha en 10 minutos**

---

## 1️⃣ Prerequisites

```bash
# Instalar (si no tenés)
- Node.js 18+ (https://nodejs.org/)
- Git
- Docker (opcional, para Redis local)
```

---

## 2️⃣ Clonar y Setup

```bash
# Clone repo
git clone https://dev.azure.com/ia-aplicada-grupo-04/StoryForge
cd StoryForge

# Setup backend
cd backend
cp .env.example .env.local
# ⚠️ LLENAR .env.local con tus keys (Supabase, Claude, Replicate, etc.)
npm install

# Setup frontend (en otra terminal)
cd frontend
cp .env.example .env.local
# ⚠️ LLENAR .env.local con tus keys
npm install
```

---

## 3️⃣ Configurar Credenciales

### Supabase
```
1. Ir a https://supabase.com
2. Crear proyecto nuevo
3. Copiar URL y ANON_KEY a .env.local
```

### Claude (Anthropic)
```
1. Ir a https://console.anthropic.com/
2. Crear API key
3. Copiar a ANTHROPIC_API_KEY en .env.local
```

### Replicate
```
1. Ir a https://replicate.com/
2. Crear API token
3. Copiar a REPLICATE_API_TOKEN en .env.local
```

### ElevenLabs
```
1. Ir a https://elevenlabs.io/
2. Crear API key
3. Copiar a ELEVENLABS_API_KEY en .env.local
```

---

## 4️⃣ Ejecutar Localmente

### Terminal 1 — Backend

```bash
cd backend
npm run start:dev
# Debe mostrar: [Nest] X - 05/15/2026... Server running on http://localhost:3000 ✓
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
# Debe mostrar: ➜  Local:   http://localhost:5173/
```

### Verificar que funciona

```bash
# En tu navegador
http://localhost:5173
# Deberías ver la landing page sin errores en console
```

---

## 5️⃣ Primeras Pruebas

### Test 1: ¿Backend responde?
```bash
curl http://localhost:3000/health
# Respuesta esperada: {"status":"ok"}
```

### Test 2: ¿Genera script?
```bash
curl -X POST http://localhost:3000/generate/script \
  -H "Content-Type: application/json" \
  -d '{"text":"Una vez había un chico que amaba los manhwas. Un día...", "style":"manhwa"}'
# Respuesta esperada: { "script": [...], "scenes": [...] }
```

### Test 3: ¿Frontend conecta?
Abrir http://localhost:5173 → Pegar texto → Debería llamar a `/generate/script`

---

## 🧪 Ejecutar Tests

```bash
# Backend
cd backend
npm run test                 # Tests unitarios
npm run test:e2e            # End-to-end
npm run test:cov            # Con coverage

# Frontend
cd frontend
npm run test                 # Tests unitarios
npm run test:ui             # UI interactivo
```

---

## 🚀 Deploy Local a Staging (Render)

### Prerequisitos
- Cuenta en Render (https://render.com/)
- Repositorio en GitHub

### Deploy Backend

```bash
# 1. Push a GitHub
git add .
git commit -m "feat: initial setup"
git push origin staging

# 2. En Render dashboard
- Crear nuevo Web Service
- Conectar repo GitHub
- Build: npm install && npm run build
- Start: npm run start:prod
- Agregar env vars (.env.local)
- Deploy

# 3. Verificar
curl https://storyforge-backend-staging.onrender.com/health
```

### Deploy Frontend

```bash
# 1. Push a GitHub (rama staging o main)
git push origin staging

# 2. En Render dashboard
- Importar repo GitHub
- Settings → Environment variables → Agregar todas de .env.local
- Deploy

# 3. Verificar
https://storyforge-staging.onrender.com
```

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| `Port 3000 already in use` | `lsof -i :3000` → `kill -9 <PID>` |
| `Cannot find module...` | `npm install` en el directorio |
| `SUPABASE_URL is not defined` | Verificar que `.env.local` esté en la raíz del backend |
| `API 500 error` | Chequear logs: `npm run start:dev` mostrará error |
| `CORS error en frontend` | Verificar que `CORS_ORIGIN` en backend `.env` incluya `localhost:5173` |
| `Rate limit exceeded` | Esperar 1 minuto, luego reintentar |

---

## 📋 Checklist antes de cada sesión

- [ ] `.env.local` en ambos directorios (backend + frontend)
- [ ] `npm install` ejecutado
- [ ] Backend corriendo en terminal 1 (`npm run start:dev`)
- [ ] Frontend corriendo en terminal 2 (`npm run dev`)
- [ ] Navegar a http://localhost:5173 y verificar sin errores
- [ ] Leer últimas actualizaciones en IMPLEMENTATION_PLAN.md

---

## 📞 Ayuda

- **Error específico:** Buscar en logs de backend → ver Sentry DSN
- **Bloqueo técnico:** Ver [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **¿Qué hacer ahora?:** Ver IMPLEMENTATION_PLAN.md → Semana actual

---

**Última actualización:** 15 de mayo de 2026
