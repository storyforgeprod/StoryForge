import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserMenu } from '@/components/auth/UserMenu';
import { StoryInput } from '@/components/Input/StoryInput';
import { validateStory } from '@/utils/validation';

export function Generate() {
  const [story, setStory] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validation = useMemo(() => validateStory(story), [story]);

  const handleContinue = () => {
    setSubmitAttempted(true);
    if (!validation.valid) return;
    // Task 3.6–3.8: style selector, voice, POST /generate/script
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link to="/" aria-label="Volver">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">Generar video</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Tu historia</CardTitle>
            <CardDescription>
              Pegá el texto que querés convertir en un Short. En el siguiente paso elegís estilo y
              voz.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <StoryInput
              value={story}
              onChange={setStory}
              showErrors={submitAttempted}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {validation.valid
                  ? 'Texto listo para continuar.'
                  : 'Completá el texto para habilitar el siguiente paso.'}
              </p>
              <Button
                type="button"
                disabled={!validation.valid}
                onClick={handleContinue}
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
