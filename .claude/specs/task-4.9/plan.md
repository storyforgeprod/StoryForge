# Technical Plan: E2E Testing — Text to Downloadable Video — Task 4.9

## Test Strategy

Manual E2E run in local development environment. Browser DevTools open to monitor network requests and console logs. Results recorded directly in the task-4.9 checklist (`tasks.md`).

## Test Environments

| Layer | URL | Notes |
|-------|-----|-------|
| Frontend | http://localhost:5173 | `npm run dev` in `frontend/` |
| Backend | http://localhost:3000 | `npm run start:dev` in `backend/` |
| Redis | localhost:6379 | Docker or Upstash local proxy |
| Supabase | local or remote | `.env.local` connection |

## Test Cases

### TC-1: Happy Path — Full Pipeline

**Preconditions:** Logged in as test user. All API keys set.

**Steps:**
1. Navigate to `/app`.
2. Paste a 300+ word story text.
3. Confirm "Texto listo para continuar." message.
4. Click "Continuar" → step 2 (StyleSelector visible, Continue disabled).
5. Select "Anime" style → Continue enabled.
6. Click "Continuar" → step 3 (VoiceSelector visible, Generar disabled).
7. Select a voice → "Generar guión" enabled.
8. Click "Generar guión" → loading state visible, pipeline progress shows Script=active.
9. Wait for script → script text appears, pipeline progress Script=done.
10. Click "Generar imágenes" → Images=active.
11. Wait for images → image grid appears (≥1 image). Images=done.
12. Click "Generar narración" → Audio=active.
13. Wait for audio → AudioPlayer appears. Audio=done.
14. Click "Generar video" → Video=active.
15. Wait for video → DownloadCard appears with file size and duration. Video=done.
16. Click "Descargar MP4" → browser downloads a file.
17. Open file in VLC: confirm 1080×1920, ≤60s, playable audio+video.

**Expected result:** AC-1, AC-2, AC-3 all pass.

---

### TC-2: Validation Error Path

**Steps:**
1. Navigate to `/app`.
2. Paste < 50 characters.
3. Click "Continuar".

**Expected result:** "Continuar" disabled OR validation error visible. Wizard does not advance. (AC-4)

---

### TC-3: Retry Path

**Steps:**
1. Complete steps 1–9 (script done).
2. Simulate image job failure (manually update job status to `failed` in Supabase or wait for a real failure).
3. Observe error message and "Reintentar" button.
4. Click "Reintentar".

**Expected result:** Wizard returns to images-idle phase. User can trigger images again. (AC-5)

---

### TC-4: Rate Limit

**Steps:**
1. Submit 6 script generation requests in under 60 seconds from the same user account (or test directly via `curl`).

**Expected result:** 6th request returns HTTP 429; frontend shows "Límite alcanzado. Intentá en un minuto."

---

## Validation Checklist

After the happy-path run, verify:

- [ ] Pipeline progress indicator shows correct state at each phase
- [ ] Downloaded MP4 is 1080×1920 (check with `ffprobe output.mp4`)
- [ ] Duration ≤ 60 seconds
- [ ] Audio and video are in sync
- [ ] Signed URL expires (test after 24h — optional)
- [ ] Temp files cleaned from server `/tmp` after video assembly
- [ ] No TypeScript errors in browser console
- [ ] Network tab: all requests return expected status codes

## Documentation Output

Record results directly in the task-4.9 checklist (`tasks.md`):
- Pass / fail / blocked per test case
- Any issues found with repro steps
- Week 5 blockers identified
