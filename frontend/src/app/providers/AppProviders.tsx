import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider, useTheme } from './ThemeProvider';

interface AppProvidersProps {
  children: ReactNode;
}

const ThemedToaster = () => {
  const { theme } = useTheme();
  return <Toaster richColors position="top-right" theme={theme} />;
};

export const AppProviders = ({ children }: AppProvidersProps) => (
  <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        {children}
        <ThemedToaster />
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
);
