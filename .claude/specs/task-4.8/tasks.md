# Tasks: MP4 Export and Download UI — Task 4.8

## Summary

Total tasks: 3 | Estimated effort: S (≤ 2h)

## Checklist

- [ ] TASK-4.8-01: Build `DownloadCard` component
- [ ] TASK-4.8-02: Wire video assembly phase into `Generate.tsx`
- [ ] TASK-4.8-03: Unit tests for `DownloadCard`

---

## Layer: Frontend — Component

### TASK-4.8-01: Build `DownloadCard` component

**Layer:** Frontend — Component
**Size:** S
**Depends on:** none
**Description:** Create `frontend/src/components/DownloadCard/DownloadCard.tsx`. Renders inside a shadcn/ui `Card`: (1) formatted file size ("12.3 MB"); (2) video duration ("45 segundos"); (3) expiry notice: "El enlace de descarga expira en 24 horas."; (4) prominent `<a href={videoUrl} download="storyforge-video.mp4">` button styled as a primary `Button`. Implement `formatFileSize(bytes)` and `formatDuration(seconds)` as local helper functions.
**Inputs:** shadcn/ui `Card`, `Button`; `DownloadCardProps` from plan.md
**Output / Done when:** Component renders with correct formatted text; clicking the anchor triggers a browser download; `npm run build` EXIT 0.

---

## Layer: Frontend — Integration

### TASK-4.8-02: Wire video assembly phase into `Generate.tsx`

**Layer:** Frontend — Integration
**Size:** S
**Depends on:** TASK-4.8-01, Task 4.7, Task 4.4
**Description:** In `Generate.tsx`, after audio-done, transition `wizardPhase` to `'video-idle'`. Render: (idle) "Generar video" button + estimated time note ("Puede tardar hasta 3 minutos"); (loading) spinner + "Ensamblando tu video…" + `PipelineProgress` video=active; (done) `DownloadCard` + "Generar otro video" link that calls `resetAll()` (resets all hooks and returns to step 1); (error) error message + "Reintentar". On "Generar video" click, call `generateVideo(imageJobId, audioJobId)`.
**Inputs:** `useGenerateVideo` from Task 4.7; `DownloadCard` from TASK-4.8-01; `imageJobId` and `audioJobId` from state
**Output / Done when:** Full pipeline from story input to download button works end-to-end in browser. "Descargar MP4" button triggers a real file download. `npm run build` EXIT 0.

---

## Layer: Testing

### TASK-4.8-03: Unit tests for `DownloadCard`

**Layer:** Testing
**Size:** S
**Depends on:** TASK-4.8-01
**Description:** Vitest + RTL. Cover: renders formatted file size correctly (1048576 bytes → "1.0 MB"); duration formatted (45 → "45 segundos"); expiry notice present; anchor has `href` equal to `videoUrl` and `download` attribute set.
**Inputs:** `DownloadCard` component
**Output / Done when:** All tests pass; covers AC-3, AC-4, AC-5, AC-6.

---

## Task Dependency Map

```
TASK-4.7-02 → TASK-4.8-02
TASK-4.8-01 ────────────↗
TASK-4.4-01 ────────────↗
                ↓
          TASK-4.8-03
```
