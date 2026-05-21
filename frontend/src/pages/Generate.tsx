import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserMenu } from '@/components/auth/UserMenu';
import { StoryInput } from '@/components/Input/StoryInput';
import { StyleSelector } from '@/components/StyleSelector/StyleSelector';
import { VoiceSelector } from '@/components/VoiceSelector/VoiceSelector';
import { validateStory } from '@/utils/validation';
import { StoryStyle } from '@/types/generate';
import { useGenerateScript } from '@/hooks/useGenerateScript';
import { useAuth } from '@/contexts/AuthContext';

type WizardStep = 'story' | 'style' | 'voice';

export function Generate() {
    const { session } = useAuth();
    const token = session?.access_token ?? '';

    const [story, setStory] = useState('');
    const [style, setStyle] = useState<StoryStyle | null>(null);
    const [voiceId, setVoiceId] = useState<string | null>(null);
    const [step, setStep] = useState<WizardStep>('story');
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const validation = useMemo(() => validateStory(story), [story]);
    const { state: genState, generate, reset: resetGeneration } = useGenerateScript(token);

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

    const handleGenerateScript = () => {
        if (!style || !voiceId) return;
        generate(story, style);
    };

    const handleRetry = () => {
        resetGeneration();
        setStep('story');
    };

    const isGenerating =
        genState.phase === 'submitting' || genState.phase === 'polling';

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
                {isGenerating && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-16">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">
                                Analizando tu historia…
                            </p>
                        </CardContent>
                    </Card>
                )}

                {genState.phase === 'completed' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Guión generado</CardTitle>
                            <CardDescription>
                                Tu guión está listo. Revisalo antes de continuar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <pre className="max-h-96 overflow-y-auto rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">
                                {genState.script}
                            </pre>
                            <div className="flex justify-end">
                                <Button type="button" disabled>
                                    Continuar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {genState.phase === 'error' && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-16">
                            <p className="text-sm text-destructive">{genState.message}</p>
                            <Button type="button" variant="outline" onClick={handleRetry}>
                                Reintentar
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {genState.phase === 'idle' && (
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
                                            'Elegí la voz que narrará tu historia.'}
                                    </CardDescription>
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                    <div className="font-semibold">
                                        Paso{' '}
                                        {step === 'story' ? '1' : step === 'style' ? '2' : '3'} de 3
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
                                    <VoiceSelector value={voiceId} onChange={setVoiceId} />
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
                                            disabled={!voiceId}
                                            onClick={handleGenerateScript}
                                        >
                                            Generar guión
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
