# Task 3.2 — Supabase Auth

## What was built
AuthProvider + useAuth hook backed by Supabase. Google OAuth sign-in via `signInWithOAuth`. Axios interceptor that sends the Supabase access_token as Bearer on all API requests. Callback route `/auth/callback` to handle OAuth redirect. Backend JwtStrategy updated to validate Supabase JWTs.

## Acceptance criteria

- The system SHALL expose `useAuth()` hook returning `{ user, session, signIn, signOut, loading }`
- The system SHALL authenticate users via Supabase Google OAuth (`signInWithOAuth({ provider: 'google' })`)
- The system SHALL handle the OAuth callback at `/auth/callback` and redirect to `/app`
- The system SHALL attach `Authorization: Bearer <access_token>` to all Axios API requests automatically
- The system SHALL persist the session across page reloads (persistSession: true)
- The system SHALL sync the Supabase user with a Prisma User record on login via UsersService
- The backend JwtStrategy SHALL validate tokens using SUPABASE_JWT_SECRET

## Dependencies
- Task 3.1 (Frontend scaffold)
- Supabase project with Google OAuth provider enabled
- SUPABASE_JWT_SECRET configured in backend
