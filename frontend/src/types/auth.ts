export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'USER';
  provider?: 'supabase' | 'google' | 'local';
  createdAt?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
