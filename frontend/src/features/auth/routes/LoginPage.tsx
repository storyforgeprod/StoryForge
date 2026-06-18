import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { AuthLayout } from '../components/AuthLayout';
import { AuthTabs } from '../components/AuthTabs';
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

const labelClass = 'font-mono text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground';
const inputClass = 'h-12 bg-elev';

export const LoginPage = () => {
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { registered?: boolean } | null;
    if (state?.registered) {
      toast.success('Cuenta creada. Iniciá sesión para continuar.');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: LoginFormValues) => {
    setError('');
    try {
      await login(values.email, values.password);
      navigate('/home');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(message);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center">
        <h1 className="font-head text-[32px] font-extrabold tracking-[-0.04em]">Welcome back</h1>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
          Log in to pick up right where you left off.
        </p>
      </div>

      <AuthTabs active="login" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="youremail@email.com"
                    disabled={isLoading}
                    className={inputClass}
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
                <FormLabel className={labelClass}>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    disabled={isLoading}
                    className={inputClass}
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

          <Button type="submit" size="lg" className="mt-5 w-full gap-2 font-bold" disabled={isLoading}>
            {isLoading ? 'Iniciando sesión...' : 'Log in'}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>
      </Form>

    </AuthLayout>
  );
};
