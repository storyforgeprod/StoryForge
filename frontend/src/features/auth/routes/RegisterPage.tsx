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

const registerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

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
      navigate('/app');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrarse';
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
            <p className="text-muted-foreground mt-2">Crea tu cuenta</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Tu nombre"
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
                        placeholder="Mínimo 6 caracteres"
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
                {isLoading ? 'Creando cuenta...' : 'Registrarse'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
