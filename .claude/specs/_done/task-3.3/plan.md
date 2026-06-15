# Task 3.3 — Implementation Plan

## Approach
Build UI components consuming the useAuth() hook from Task 3.2. ProtectedRoute is a wrapper component that checks auth state before rendering children.

## Files created/modified
| File | Change |
|------|--------|
| `frontend/src/components/auth/LoginCard.tsx` | Card with Google OAuth button, uses useAuth().signIn |
| `frontend/src/components/auth/UserMenu.tsx` | User avatar/name + sign out, uses useAuth() |
| `frontend/src/components/auth/ProtectedRoute.tsx` | Redirects to / if !user |
| `frontend/src/pages/Landing.tsx` | Conditionally renders LoginCard or CTA based on auth state |
| `frontend/src/App.tsx` | Wrap /app route with ProtectedRoute |

## Component behavior
- LoginCard: disabled button while loading auth state; calls signIn() on click
- UserMenu: shows user.email or user.user_metadata.full_name; signOut() on click
- ProtectedRoute: `if (!user && !loading) return <Navigate to="/" />`
