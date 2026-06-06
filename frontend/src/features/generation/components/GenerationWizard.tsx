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
import { validateStory } from '../utils/validation';
import type { StoryStyle } from '../types';

type WizardStep = 'story' | 'style' | 'duration' | 'scenes' | 'voice';

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
    onGenerateScript: () => void;
    onOpenScriptPreset: () => void;
};

const STEP_COPY: Record<WizardStep, { title: string; description: string; number: number }> = {
    story: {
        title: 'Tu historia',
        description:
            'Pegá el texto que querés convertir en un Short. En los siguientes pasos elegís estilo, duración, escenas y voz.',
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
    voice: {
        title: 'Voz y narrador',
        description: 'Elegí la voz que narrará tu historia.',
        number: 5,
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
    onGenerateScript,
    onOpenScriptPreset,
}: GenerationWizardProps) => {
    const [step, setStep] = useState<WizardStep>('story');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const validation = useMemo(() => validateStory(story), [story]);
    const copy = STEP_COPY[step];

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
            setStep('voice');
        }
    };

    const handleBack = () => {
        if (step === 'style') setStep('story');
        if (step === 'duration') setStep('style');
        if (step === 'scenes') setStep('duration');
        if (step === 'voice') setStep('scenes');
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
                        <div className="font-semibold">Paso {copy.number} de 5</div>
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
                                Continuar
                            </Button>
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
                            <div className="flex gap-2">
                                {isDeveloper && (
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
                                    disabled={!voiceId}
                                    onClick={onGenerateScript}
                                >
                                    Generar guión
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
