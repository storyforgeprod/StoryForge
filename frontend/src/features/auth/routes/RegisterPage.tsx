import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { AuthLayout } from '../components/AuthLayout';
import { AuthTabs } from '../components/AuthTabs';
import { AuthSocial } from '../components/AuthSocial';
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

const registerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const labelClass = 'font-mono text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground';
const inputClass = 'h-12 bg-elev';

export const RegisterPage = () => {
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: RegisterFormValues) => {
    setError('');
    try {
      await register(values.email, values.password, values.name);
      navigate('/login', { state: { registered: true } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrarse';
      setError(message);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center">
        <h1 className="font-head text-[32px] font-extrabold tracking-[-0.04em]">Create your account</h1>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
          Start turning your stories into shorts.
        </p>
      </div>

      <AuthTabs active="register" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Nombre</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Tu nombre" disabled={isLoading} className={inputClass} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    placeholder="Mínimo 6 caracteres"
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
            {isLoading ? 'Creando cuenta...' : 'Sign up'}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>
      </Form>

      <AuthSocial />
    </AuthLayout>
  );
};
