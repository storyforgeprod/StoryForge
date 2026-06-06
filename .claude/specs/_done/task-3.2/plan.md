# Task 3.2 — Implementation Plan

## Approach
Create AuthContext with React context + useState. Supabase client handles session persistence and OAuth redirect. Axios interceptor reads session from context and injects Bearer token.

## Files created/modified
| File | Change |
|------|--------|
| `frontend/src/contexts/AuthContext.tsx` | AuthProvider + useAuth hook |
| `frontend/src/services/auth.ts` | signIn/signOut wrappers around Supabase |
| `frontend/src/services/api.ts` | Axios request interceptor adds access_token |
| `frontend/src/App.tsx` | +/auth/callback route |
| `backend/src/users/users.service.ts` | findOrCreateFromSupabase() — syncs Prisma User on login |
| `backend/src/common/auth/jwt.strategy.ts` | Updated to validate with SUPABASE_JWT_SECRET |
| `backend/.env.example` | +SUPABASE_JWT_SECRET |

## Supabase dashboard config required
- Authentication → Providers → Google: enabled + client credentials
- Authentication → URL Configuration: Site URL = http://localhost:5173, Redirect = http://localhost:5173/auth/callback
