// Public API for the auth feature. Consumers outside this folder import only
// what's listed below — never deep paths like '@/features/auth/providers/...'.

export { AuthProvider, useAuth } from './providers/AuthProvider';
export { ProtectedRoute } from './components/ProtectedRoute';
export { LoginPage } from './routes/LoginPage';
export { RegisterPage } from './routes/RegisterPage';
export {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
} from './api/tokenStore';
export type { User, AuthResponse, AuthContextType } from './types';
