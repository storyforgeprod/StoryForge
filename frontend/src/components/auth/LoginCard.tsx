import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export function LoginCard() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión');
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>
          Usá tu cuenta de Google para guardar tus generaciones y acceder al generador.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={submitting}
          onClick={handleGoogleLogin}
        >
          <LogIn className="h-4 w-4" />
          {submitting ? 'Redirigiendo…' : 'Continuar con Google'}
        </Button>
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
