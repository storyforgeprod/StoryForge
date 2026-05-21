---
name: spec-runner
description: "Implements tasks from a spec's tasks.md file one by one, checking them off as they complete. Activate when the user says 'implement task X.X', 'run the tasks for task X.X', 'implement spec X.X', 'implement the tasks', 'build task X.X', or any phrase that asks to execute or implement tasks defined in a .claude/specs/ folder. Also activate when the user points at a tasks.md file and asks to implement it."
---

# Spec Runner — Task Implementation Protocol

## Purpose

This skill implements tasks defined in `.claude/specs/<task-id>/tasks.md` one by one, updates the checklist after each task, and runs final build + test validation when all tasks are done.

---

## Step 1 — Load the spec

Before writing any code:

1. Read `.claude/specs/<task-id>/tasks.md` — identify all unchecked tasks (`- [ ]`) in the Checklist section and their dependency order from the Task Dependency Map.
2. Read `.claude/specs/<task-id>/spec.md` — understand acceptance criteria and decisions (all Open Questions must be Resolved; if any are still Open, stop and ask the user).
3. Read `.claude/specs/<task-id>/plan.md` — understand file paths, types, and code contracts.
4. Activate `storyforge-frontend` or `storyforge-backend` skill depending on the task layer. Most tasks require both — activate both.

---

## Step 2 — Implement tasks in order

Work through unchecked tasks in dependency order (from the Task Dependency Map). For each task:

### On success
1. Implement the task fully as described.
2. Verify: TypeScript compiles (`npm run build` or `tsc --noEmit`) for the affected workspace — frontend or backend.
3. If the task includes unit tests, run them: `npm run test -- --testPathPattern=<file>` (backend) or `npx vitest run <file>` (frontend).
4. Only if all checks pass: mark the task as done in `tasks.md` by replacing `- [ ]` with `- [x]` for that specific task line.
5. Announce: "✅ TASK-X.X-NN complete."

### On error
1. Report the error clearly.
2. Leave the checkbox **unchecked** (`- [ ]`).
3. **Do not skip ahead** to tasks that depend on the failed task.
4. Tasks with no dependency on the failed task may still proceed.
5. Announce: "❌ TASK-X.X-NN failed — [brief reason]. Skipping dependent tasks."

---

## Step 3 — Final validation (only when all tasks are checked)

Run this sequence only after every task in the checklist is `[x]`:

### Frontend checks (if any frontend task was implemented)
```
cd frontend
npm run build        ← must exit 0
npx vitest run       ← must exit 0, no failing tests
```

### Backend checks (if any backend task was implemented)
```
cd backend
npm run build        ← must exit 0
npm run test         ← must exit 0, no failing tests
```

### Report
- If all pass: announce "🏁 All tasks complete and builds passing."
- If any fail: report which check failed, leave the affected task(s) unchecked, do not mark the spec as done.

---

## Checklist update format

When marking a task done, update **only the Checklist section** of `tasks.md`. Do not edit task descriptions or the dependency map.

```markdown
## Checklist

- [x] TASK-X.X-01: Task title   ← done
- [x] TASK-X.X-02: Task title   ← done
- [ ] TASK-X.X-03: Task title   ← failed or not yet run
```

---

## Rules

- Never mark a task `[x]` before its implementation is verified (build + tests pass).
- Never skip a task silently — always report its status.
- Never implement tasks out of dependency order unless they are explicitly parallel (no dependency arrow between them in the map).
- If a task says "Depends on: Task X.Y" (a different spec), verify that spec's checklist is fully checked before proceeding. If not, stop and tell the user.
- Do not create new files in `instructions/`. All output lives in the code and in `tasks.md`.
- After completing a task that modifies shared types or interfaces, re-check that dependent files still compile before marking it done.
