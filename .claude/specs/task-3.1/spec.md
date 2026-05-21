# Task 3.1 — Frontend Setup

## What was built
React 18 + Vite 5 + TypeScript 5 frontend scaffold with TailwindCSS 3, shadcn/ui component pattern, React Router, Axios API client, and Supabase client stubs. Folder structure per STACK_INIT.md.

## Acceptance criteria

- The system SHALL run `npm run build` with EXIT 0
- The system SHALL serve the dev server on port 5173 via `npm run dev`
- The system SHALL have React Router with routes for `/` (Landing) and `/app` (Generate)
- The system SHALL have TailwindCSS configured with shadcn/ui CSS variables
- The system SHALL have `components.json` for shadcn/ui CLI compatibility
- The system SHALL have Button and Card as base UI components
- The system SHALL have Axios API client configured with base URL from VITE_API_URL env var
- The system SHALL have Supabase client configured from VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- The system SHALL follow folder structure: components/ui/, components/common/, pages/, services/, hooks/, types/

## Dependencies
- Node 18+, npm
- STACK_INIT.md folder structure spec
