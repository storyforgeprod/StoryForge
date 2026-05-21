# Tasks: Serverless Video Assembly — Task 4.6

## Summary

Total tasks: 4 | Estimated effort: L (≤ 5h) — **DEFERRED: implement only if Task 4.5 (local FFmpeg on Render) fails.**

> ✅ Open Question 1 resolved: Task 4.6 is skipped if Task 4.5 succeeds on Render. See spec.md for details.

## Checklist

- [x] TASK-4.6-01: Add strategy switch to `VideoService.assembleVideo`
- [ ] TASK-4.6-02: Deploy Modal Labs assembly function
- [ ] TASK-4.6-03: Implement `_assembleServerless` in `VideoService`
- [ ] TASK-4.6-04: Manual smoke test of serverless path

---

## Layer: Backend — Architecture

### TASK-4.6-01: Add strategy switch to `VideoService.assembleVideo`

**Layer:** Backend — Service
**Size:** S
**Depends on:** Task 4.5 (local path must exist as the `'local'` branch)
**Description:** Refactor `assembleVideo` in `video.service.ts` to read `process.env.VIDEO_ASSEMBLY_STRATEGY`. If `'local'`, call the Task 4.5 FFmpeg implementation. If `'serverless'`, call `_assembleServerless()` (stub for now). Add `VIDEO_ASSEMBLY_STRATEGY=local` to `.env.production` template.
**Inputs:** `video.service.ts` after Task 4.5; `STACK_INIT.md` (add env var)
**Output / Done when:** With `VIDEO_ASSEMBLY_STRATEGY=local`, existing tests pass. With `=serverless`, the stub is called. `npm run build` EXIT 0.

---

### TASK-4.6-02: Deploy Modal Labs assembly function

**Layer:** Backend — Serverless
**Size:** L
**Depends on:** TASK-4.6-01; platform decision resolved
**Description:** Create a Modal Python function at `serverless/assemble_video.py`. Accepts the HTTP request shape from plan.md. Downloads images and audio, runs FFmpeg via `subprocess.run`, uploads the output to Supabase Storage using `supabase-py`, returns signed URL JSON. Deploy with `modal deploy`. Document the deployed URL.
**Inputs:** plan.md request/response contract; Modal Labs account; `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` as Modal secrets
**Output / Done when:** `curl -X POST {MODAL_URL}/assemble -d '{...}'` returns a valid Supabase signed URL. Function logs visible in Modal dashboard.

---

### TASK-4.6-03: Implement `_assembleServerless` in `VideoService`

**Layer:** Backend — Service
**Size:** S
**Depends on:** TASK-4.6-02
**Description:** Implement the `_assembleServerless(imageUrls, audioUrl, metadata)` private method in `video.service.ts`. POST to `MODAL_FUNCTION_URL` with the request body from plan.md. Handle HTTP errors: throw with the `error` field from the response. Return the `signedUrl` string.
**Inputs:** TASK-4.6-02 deployed URL; `MODAL_FUNCTION_URL` env var; plan.md API contract
**Output / Done when:** Calling `assembleVideo` with `VIDEO_ASSEMBLY_STRATEGY=serverless` returns a real signed URL from Modal. `npm run build` EXIT 0.

---

### TASK-4.6-04: Manual smoke test of serverless path

**Layer:** Testing
**Size:** S
**Depends on:** TASK-4.6-03
**Description:** Manual test: set `VIDEO_ASSEMBLY_STRATEGY=serverless` in `.env.local`, run the backend, call `POST /generate/video` with valid `imageJobId` and `audioJobId` from completed jobs. Verify a signed URL is returned and the MP4 is accessible. Document result in `instructions/TASK_4_6_COMPLETE.md`.
**Inputs:** Running backend; completed image and audio jobs
**Output / Done when:** MP4 accessible at the signed URL; file is 1080×1920; duration ≤ 60s.

---

## Task Dependency Map

```
Task 4.5 → TASK-4.6-01 → TASK-4.6-03 → TASK-4.6-04
                ↑
          TASK-4.6-02 (platform decision needed)
```
