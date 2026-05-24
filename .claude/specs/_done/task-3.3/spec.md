# Task 3.3 — Login UI (Historia 2.1)

## What was built
Login UI components: `LoginCard` (Google OAuth button), `UserMenu` (name + sign out), and `ProtectedRoute` (redirects to landing if unauthenticated). Landing page shows login if unauthenticated, CTA to generator if authenticated.

## Acceptance criteria

- The system SHALL show a LoginCard with "Continuar con Google" button when user is not authenticated
- The system SHALL show a UserMenu with user display name and sign-out option when authenticated
- The system SHALL redirect unauthenticated users from /app to / via ProtectedRoute
- The system SHALL show a CTA to /app on the Landing page when the user is authenticated
- The system SHALL not show the LoginCard when the user is already authenticated

## Dependencies
- Task 3.2 (Supabase Auth)
- Task 3.1 (shadcn/ui components)
