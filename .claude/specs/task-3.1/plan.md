# Task 3.1 — Implementation Plan

## Approach
Scaffold with `npm create vite@latest frontend -- --template react-ts`, then add Tailwind, shadcn/ui config, Router, and service stubs. Follow STACK_INIT.md folder structure exactly.

## Files created
```
frontend/
├── src/
│   ├── components/ui/     button.tsx, card.tsx
│   ├── components/common/
│   ├── pages/             Landing.tsx, Generate.tsx, NotFound.tsx
│   ├── services/          api.ts (Axios), supabase.ts
│   ├── types/             index.ts
│   ├── hooks/
│   ├── lib/utils.ts       (cn helper)
│   ├── App.tsx            (React Router setup)
│   └── main.tsx
├── components.json        (shadcn/ui config)
├── tailwind.config.js
├── vite.config.ts         (@ alias, port 5173)
└── package.json
```

## Key config
- vite.config.ts: resolve alias `@` → `./src`, server port 5173
- tailwind.config.js: content includes `./src/**/*.{ts,tsx}`
- CSS variables for shadcn/ui theme in index.css
