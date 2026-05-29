import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth';
import { Toaster } from '@/components/ui/sonner';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
      <Toaster richColors position="top-right" />
    </AuthProvider>
  </BrowserRouter>
);
