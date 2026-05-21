import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserMenu } from '@/components/auth/UserMenu';
import { StoryInput } from '@/components/Input/StoryInput';
import { StyleSelector } from '@/components/StyleSelector/StyleSelector';
import { validateStory } from '@/utils/validation';
import { StoryStyle } from '@/types/generate';

type WizardStep = 'story' | 'style' | 'voice';

export function Generate() {
  const [story, setStory] = useState('');
  const [style, setStyle] = useState<StoryStyle | null>(null);
  const [step, setStep] = useState<WizardStep>('story');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validation = useMemo(() => validateStory(story), [story]);

  const handleContinue = () => {
    if (step === 'story') {
      setSubmitAttempted(true);
      if (!validation.valid) return;
      setStep('style');
      return;
    }
    if (step === 'style') {
      if (!style) return;
      setStep('voice');
      return;
    }
  };

  const handleBack = () => {
    if (step === 'style') setStep('story');
    if (step === 'voice') setStep('style');
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {step === 'story' && 'Tu historia'}
                  {step === 'style' && 'Estilo visual'}
                  {step === 'voice' && 'Voz y narrador'}
                </CardTitle>
                <CardDescription>
                  {step === 'story' &&
                    'Pegá el texto que querés convertir en un Short. En los siguientes pasos elegís estilo y voz.'}
                  {step === 'style' &&
                    'Elegí el estilo visual que mejor refleja tu historia.'}
                  {step === 'voice' &&
                    'Configurá la voz y narración para tu video. (Proximamente)'}
                </CardDescription>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div className="font-semibold">
                  Paso {step === 'story' ? '1' : step === 'style' ? '2' : '3'} de 3
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 'story' && (
              <>
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
              </>
            )}

            {step === 'style' && (
              <>
                <StyleSelector value={style} onChange={setStyle} />

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Atrás
                  </Button>
                  <Button
                    type="button"
                    disabled={!style}
                    onClick={handleContinue}
                  >
                    Continuar
                  </Button>
                </div>
              </>
            )}

            {step === 'voice' && (
              <>
                <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Selector de voz - Próximamente (Tarea 3.7)
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Atrás
                  </Button>
                  <Button type="button" disabled>
                    Generar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
