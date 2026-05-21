# 🤝 HANDOFF.md — Info para Siguiente Dev/Agente

**Actualizado:** 19 de mayo de 2026 | **Status:** Week 3 — Auth done, 3.4 deferred

---

## TL;DR

- ✅ Tasks **3.2** (Supabase Auth) + **3.3** (Login UI) completadas
- ⏳ Task **3.4** (Dashboard + cuota) **diferida** — no bloquea 3.5+
- ⏳ **Siguiente:** Task **3.6** — selector de estilo visual

---

## Auth flow

1. Landing → "Continuar con Google"
2. Redirect → `/auth/callback` → `/app`
3. `api.ts` envía `Bearer <supabase_access_token>`
4. Backend crea/actualiza `User` en Prisma y usa `user.id` en jobs

---

## Env requerido

**Frontend** `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

**Backend** `.env.local`: añadir `SUPABASE_JWT_SECRET` (Supabase → Settings → API → JWT Secret) y Azure AI vars:
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_DEPLOYMENT_GPT41`
- `AZURE_OPENAI_API_VERSION`
- `AZURE_FOUNDRY_IMAGE_ENDPOINT`
- `AZURE_FOUNDRY_IMAGE_API_KEY`
- `AZURE_FOUNDRY_FLUX_DEPLOYMENT`

**Supabase Dashboard:** Google provider + redirect `http://localhost:5173/auth/callback`

Ver [instructions/TASK_3_2_3_COMPLETE.md](instructions/TASK_3_2_3_COMPLETE.md)

---

## Run

```powershell
cd backend; npm run start:dev
cd frontend; npm run dev
```

---

## Docs

- [NEXT_STEPS.md](NEXT_STEPS.md) — Task 3.5

