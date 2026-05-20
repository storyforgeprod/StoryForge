---
name: sdd-spec-creator
description: >
  Transforms Azure DevOps user stories into SDD (Spec-Driven Development) specification packages.
  Use when the user pastes a user story and wants to refine it, break it into tasks, define
  architecture, or produce spec.md / plan.md / tasks.md documents. Trigger on phrases like
  "create a spec for this story", "break this into tasks", "write the SDD for this", or
  "define the architecture for this user story". If someone hands you an Azure DevOps story
  and wants a structured plan, use this skill.
---

# SDD Spec Creator

Turns an Azure DevOps user story into a structured spec package: refined story, architecture decisions, and an actionable task breakdown — ready for a developer or AI coding agent.

---

## Workflow

### Step 1: Ingest the Story

Ask the user to paste the story. Extract:

- **Story ID + Title**
- **Description** ("As a… I want… So that…")
- **Existing Acceptance Criteria** (if any)
- **Tech stack / context** (if provided)

### Step 2: Assess and Refine

Silently check for weak areas before asking questions:

| Area                | Weak signal                            |
| ------------------- | -------------------------------------- |
| Persona             | Generic ("user", "admin")              |
| Outcome             | Vague ("improve UX", "make it faster") |
| Scope               | Sprawling or no clear boundary         |
| Acceptance Criteria | Missing or untestable                  |
| Technical context   | No stack / integration info            |

Ask targeted follow-ups only for weak areas — max 3–4 questions at a time:

- **Business:** Who is the user? What problem does this solve today? What's explicitly out of scope?
- **Technical:** Stack? Existing APIs/data models touched? Non-functional requirements (perf, SLA, security)?
- **Risk:** Dependencies on other teams/stories? Known edge cases?

### Step 3: Produce the Spec Package

Generate three documents (full templates in `references/templates.md`):

**`spec.md`** — The contract:

- Refined canonical user story
- EARS acceptance criteria (see below)
- Out-of-scope declarations
- Assumptions and open questions

**`plan.md`** — The architecture:

- Component diagram (Mermaid or text)
- Architecture Decision Records (ADRs): decision + rationale + trade-offs
- Data model changes (tables, fields, migrations)
- API contracts (endpoints, request/response shapes)
- Security, performance, and observability notes

**`tasks.md`** — The build plan:

- Tasks layered in order: Data Model → Business Logic → API → Frontend → Tests
- Each task: title, description, inputs, done-criteria, size (S/M/L), dependencies

---

## EARS Acceptance Criteria

Write all ACs in EARS format — unambiguous and directly testable:

| Pattern        | Template                                                |
| -------------- | ------------------------------------------------------- |
| Always true    | `The system shall [requirement].`                       |
| Event-driven   | `When [trigger], the system shall [response].`          |
| State-driven   | `While [state], the system shall [behavior].`           |
| Error/unwanted | `If [condition], the system shall [safeguard].`         |
| Feature-gated  | `Where [feature enabled], the system shall [behavior].` |

Example:

```
AC-1: When the user submits a valid order, the system shall return a confirmation ID within 2 seconds.
AC-2: If the payment gateway is unavailable, the system shall display an error and preserve cart state.
AC-3: While processing a payment, the system shall disable the submit button.
```

---

## Task Breakdown Rules

- **Atomic** — completable in < 1 day
- **Testable** — clear "done" signal, no ambiguity
- **Ordered** — dependencies explicit, layered from data up to UI
- **Named with imperative verbs** — "Add migration", "Implement validation", "Create endpoint"

---

## Architecture Checklist

For each story, address these areas as relevant:

| Area          | Key questions                                     |
| ------------- | ------------------------------------------------- |
| Data          | Tables/fields changed? Migrations needed?         |
| API           | New or modified endpoints? Contract changes?      |
| Auth          | Who can call this? Permission changes?            |
| Events        | Emits or consumes domain events?                  |
| Errors        | Failure modes? Retry logic? User-facing messages? |
| Observability | Logs, metrics, alerts needed?                     |
| Testing       | Unit / integration / E2E / contract?              |

---

## Output Format

Present results as:

```
## 📋 Refined User Story
## ✅ Acceptance Criteria
## 🏛️ Architecture Plan (plan.md)
## 🗂️ Task Breakdown (tasks.md)
## ❓ Open Questions
```

After presenting, ask: _"Does this capture what you had in mind? Anything to adjust?"_

---

## Reference Files

- `references/templates.md` — Full markdown templates for spec.md, plan.md, tasks.md
- `references/ears-examples.md` — EARS examples by domain (auth, payments, file upload, etc.)
