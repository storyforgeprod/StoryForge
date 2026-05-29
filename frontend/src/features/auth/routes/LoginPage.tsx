import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const loginSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: LoginFormValues) => {
    setError('');
    try {
      await login(values.email, values.password);
      navigate('/app');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-brand-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-brand-gradient bg-clip-text text-transparent">
              StoryForge
            </h1>
            <p className="text-muted-foreground mt-2">Transforma historias en videos</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-brand-gradient hover:bg-brand-gradient-hover"
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
