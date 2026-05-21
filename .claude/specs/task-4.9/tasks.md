# Tasks: E2E Testing — Text to Downloadable Video — Task 4.9

## Summary

Total tasks: 3 | Estimated effort: M (≤ 4h) — requires Tasks 4.1–4.8 complete

## Checklist

- [ ] TASK-4.9-01: Verify local environment is fully operational
- [ ] TASK-4.9-02: Execute TC-1 Happy Path and document results
- [ ] TASK-4.9-03: Execute TC-2, TC-3, TC-4 and document results

---

## Layer: Environment Setup

### TASK-4.9-01: Verify local environment is fully operational

**Layer:** DevOps / Setup
**Size:** S
**Depends on:** Tasks 4.1–4.8 all complete
**Description:** Confirm: (1) `cd frontend && npm run build` EXIT 0. (2) `cd backend && npm run build` EXIT 0. (3) `npm run start:dev` (backend) starts without errors. (4) Redis is reachable (Bull queue connects). (5) Supabase connection works (check backend logs on startup). (6) All required env vars present in `.env.local` (`ANTHROPIC_API_KEY`, `REPLICATE_API_TOKEN`, `ELEVENLABS_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET`).
**Inputs:** `.env.local` file; Render env var docs
**Output / Done when:** Both servers start without errors; health check at `GET /health` returns 200.

---

## Layer: Testing — Happy Path

### TASK-4.9-02: Execute TC-1 Happy Path and document results

**Layer:** Testing — Manual E2E
**Size:** M
**Depends on:** TASK-4.9-01
**Description:** Follow TC-1 step-by-step from plan.md. Open browser DevTools network tab. Record: timestamps at each pipeline step start/end; HTTP status codes; total elapsed time. Download the MP4 and verify with `ffprobe` (resolution, duration, codec). Check that PipelineProgress indicator reflects each phase correctly. Record pass/fail for each step in the checklist.
**Inputs:** Running frontend + backend; test user credentials; plan.md TC-1 steps
**Output / Done when:** TC-1 result documented (pass/fail/blocked with notes); MP4 verified with `ffprobe`.

---

## Layer: Testing — Error Paths

### TASK-4.9-03: Execute TC-2, TC-3, TC-4 and document results

**Layer:** Testing — Manual E2E
**Size:** S
**Depends on:** TASK-4.9-01
**Description:** Execute the three error-path test cases from plan.md. For TC-3 (retry), manually set a job to `failed` status in the Supabase dashboard (or via `prisma studio`). For TC-4 (rate limit), use `curl` loop or rapid browser re-submissions. Document each result.
**Inputs:** Running frontend + backend; plan.md TC-2 through TC-4
**Output / Done when:** All three test cases documented as pass/fail/blocked.

---

## Task Dependency Map

```
[Tasks 4.1–4.8] → TASK-4.9-01 → TASK-4.9-02
                              └→ TASK-4.9-03
```
