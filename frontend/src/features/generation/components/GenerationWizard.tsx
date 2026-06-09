import { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { StoryInput } from './StoryInput';
import { StyleSelector } from './StyleSelector';
import { VoiceSelector } from './VoiceSelector';
import { DurationSelector } from './DurationSelector';
import { ScenesSelector } from './ScenesSelector';
import { ScriptReviewStep } from './ScriptReviewStep';
import { validateStory } from '../utils/validation';
import type { GenerateScriptState, StoryStyle } from '../types';

type WizardStep = 'story' | 'style' | 'duration' | 'scenes' | 'script' | 'voice';

export type GenerationWizardProps = {
    story: string;
    onStoryChange: (story: string) => void;
    style: StoryStyle | null;
    onStyleChange: (style: StoryStyle) => void;
    targetDuration: number;
    onDurationChange: (duration: number) => void;
    targetScenes: number;
    onScenesChange: (scenes: number) => void;
    voiceId: string | null;
    onVoiceChange: (voiceId: string) => void;
    isDeveloper: boolean;
    genState: GenerateScriptState;
    onGenerateScript: () => void;
    onRetryScript: () => void;
    onRegenerateScript: () => void;
    onStartPipeline: () => void;
    onOpenScriptPreset: () => void;
};

const STEP_COPY: Record<WizardStep, { title: string; description: string; number: number }> = {
    story: {
        title: 'Tu historia',
        description:
            'Pegá el texto que querés convertir en un Short. En los siguientes pasos elegís estilo, duración y escenas.',
        number: 1,
    },
    style: {
        title: 'Estilo visual',
        description: 'Elegí el estilo visual que mejor refleja tu historia.',
        number: 2,
    },
    duration: {
        title: 'Duración del video',
        description: 'Definí la duración total del video (30-120 segundos).',
        number: 3,
    },
    scenes: {
        title: 'Cantidad de escenas',
        description: 'Elegí cuántas escenas deseas. La duración por escena se calculará automáticamente.',
        number: 4,
    },
    script: {
        title: 'Tu guión',
        description: 'Revisá las escenas generadas. Podés regenerar si algo no quedó bien.',
        number: 5,
    },
    voice: {
        title: 'Voz y narrador',
        description: 'Elegí la voz que narrará tu historia.',
        number: 6,
    },
};

export const GenerationWizard = ({
    story,
    onStoryChange,
    style,
    onStyleChange,
    targetDuration,
    onDurationChange,
    targetScenes,
    onScenesChange,
    voiceId,
    onVoiceChange,
    isDeveloper,
    genState,
    onGenerateScript,
    onRetryScript,
    onRegenerateScript,
    onStartPipeline,
    onOpenScriptPreset,
}: GenerationWizardProps) => {
    const [step, setStep] = useState<WizardStep>('story');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const validation = useMemo(() => validateStory(story), [story]);
    const copy = STEP_COPY[step];
    const isScriptGenerating = genState.phase === 'submitting' || genState.phase === 'polling';

    const handleContinue = () => {
        if (step === 'story') {
            setSubmitAttempted(true);
            if (!validation.valid) return;
            setStep('style');
            return;
        }
        if (step === 'style') {
            if (!style) return;
            setStep('duration');
            return;
        }
        if (step === 'duration') {
            setStep('scenes');
            return;
        }
        if (step === 'scenes') {
            onGenerateScript();
            setStep('script');
            return;
        }
        if (step === 'script') {
            if (genState.phase !== 'completed') return;
            setStep('voice');
        }
    };

    const handleBack = () => {
        if (step === 'style') setStep('story');
        if (step === 'duration') setStep('style');
        if (step === 'scenes') setStep('duration');
        if (step === 'script') {
            onRetryScript();
            setStep('scenes');
        }
        if (step === 'voice') setStep('script');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{copy.title}</CardTitle>
                        <CardDescription>{copy.description}</CardDescription>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                        <div className="font-semibold">Paso {copy.number} de 6</div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {step === 'story' && (
                    <>
                        <StoryInput
                            value={story}
                            onChange={onStoryChange}
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
                        <StyleSelector value={style} onChange={onStyleChange} />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Button type="button" variant="outline" onClick={handleBack}>
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Atrás
                            </Button>
                            <Button type="button" disabled={!style} onClick={handleContinue}>
                                Continuar
                            </Button>
                        </div>
                    </>
                )}

                {step === 'duration' && (
                    <>
                        <DurationSelector
                            targetDuration={targetDuration}
                            onDurationChange={onDurationChange}
                        />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Button type="button" variant="outline" onClick={handleBack}>
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Atrás
                            </Button>
                            <Button type="button" onClick={handleContinue}>
                                Continuar
                            </Button>
                        </div>
                    </>
                )}

                {step === 'scenes' && (
                    <>
                        <ScenesSelector
                            targetScenes={targetScenes}
                            onScenesChange={onScenesChange}
                            targetDuration={targetDuration}
                        />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Button type="button" variant="outline" onClick={handleBack}>
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Atrás
                            </Button>
                            <Button type="button" onClick={handleContinue}>
                                Generar guión
                            </Button>
                        </div>
                    </>
                )}

                {step === 'script' && (
                    <>
                        <ScriptReviewStep
                            state={genState}
                            onRegenerate={onRegenerateScript}
                        />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isScriptGenerating}
                                onClick={handleBack}
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Atrás
                            </Button>
                            <div className="flex gap-2">
                                {isDeveloper && genState.phase !== 'completed' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onOpenScriptPreset}
                                    >
                                        Usar preset
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    disabled={genState.phase !== 'completed'}
                                    onClick={handleContinue}
                                >
                                    Continuar
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {step === 'voice' && (
                    <>
                        <VoiceSelector value={voiceId} onChange={onVoiceChange} />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Button type="button" variant="outline" onClick={handleBack}>
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Atrás
                            </Button>
                            <Button
                                type="button"
                                disabled={!voiceId}
                                onClick={onStartPipeline}
                            >
                                Generar video
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
