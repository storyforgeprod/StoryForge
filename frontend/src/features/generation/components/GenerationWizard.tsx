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
import { DurationSelect } from './DurationSelect';
import { ScenesSelect } from './ScenesSelect';
import { ScriptReviewStep } from './ScriptReviewStep';
import { validateStory } from '../utils/validation';
import type { GenerateScriptState, StoryStyle } from '../types';

type WizardStep = 'story' | 'script' | 'style' | 'voice';

export type GenerationWizardProps = {
    story: string;
    onStoryChange: (story: string) => void;
    style: StoryStyle | null;
    onStyleChange: (style: StoryStyle) => void;
    voiceId: string | null;
    onVoiceChange: (voiceId: string) => void;
    isDeveloper: boolean;
    genState: GenerateScriptState;
    onGenerateScript: (duration: number, scenes: number) => void;
    onRetryScript: () => void;
    onStartPipeline: () => void;
    onOpenScriptPreset: () => void;
};

const STEP_COPY: Record<WizardStep, { title: string; description: string; number: number }> = {
    story: {
        title: 'Tu historia',
        description: 'Pegá el texto que querés convertir en un Short y configurá la duración y escenas.',
        number: 1,
    },
    script: {
        title: 'Tu guión',
        description: 'Revisá las escenas generadas. Podés regenerar si algo no quedó bien.',
        number: 2,
    },
    style: {
        title: 'Estilo visual',
        description: 'Elegí el estilo visual que mejor refleja tu historia.',
        number: 3,
    },
    voice: {
        title: 'Voz y narrador',
        description: 'Elegí la voz que narrará tu historia.',
        number: 4,
    },
};

export const GenerationWizard = ({
    story,
    onStoryChange,
    style,
    onStyleChange,
    voiceId,
    onVoiceChange,
    isDeveloper,
    genState,
    onGenerateScript,
    onRetryScript,
    onStartPipeline,
    onOpenScriptPreset,
}: GenerationWizardProps) => {
    const [step, setStep] = useState<WizardStep>('story');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [targetDuration, setTargetDuration] = useState(60);
    const [targetScenes, setTargetScenes] = useState(12);
    const validation = useMemo(() => validateStory(story), [story]);
    const copy = STEP_COPY[step];
    const isScriptGenerating = genState.phase === 'submitting' || genState.phase === 'polling';

    const handleGenerateScript = () => {
        setSubmitAttempted(true);
        if (!validation.valid) return;
        onGenerateScript(targetDuration, targetScenes);
        setStep('script');
    };

    const handleRegenerate = () => {
        onRetryScript();
        onGenerateScript(targetDuration, targetScenes);
    };

    const handleBack = () => {
        if (step === 'script') {
            onRetryScript();
            setStep('story');
        }
        if (step === 'style') setStep('script');
        if (step === 'voice') setStep('style');
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
                        <div className="font-semibold">Paso {copy.number} de 4</div>
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
                        <div className="grid grid-cols-2 gap-4">
                            <DurationSelect value={targetDuration} onChange={setTargetDuration} />
                            <ScenesSelect value={targetScenes} onChange={setTargetScenes} />
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-muted-foreground">
                                {validation.valid
                                    ? 'Texto listo para continuar.'
                                    : 'Completá el texto para habilitar el siguiente paso.'}
                            </p>
                            <Button
                                type="button"
                                disabled={!validation.valid}
                                onClick={handleGenerateScript}
                            >
                                Generar guión
                            </Button>
                        </div>
                    </>
                )}

                {step === 'script' && (
                    <>
                        <ScriptReviewStep
                            state={genState}
                            onRegenerate={handleRegenerate}
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
                                    onClick={() => setStep('style')}
                                >
                                    Continuar
                                </Button>
                            </div>
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
                            <Button
                                type="button"
                                disabled={!style}
                                onClick={() => setStep('voice')}
                            >
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
