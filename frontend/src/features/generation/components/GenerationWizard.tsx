import { useMemo, useState } from 'react';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { StoryInput } from './StoryInput';
import { StyleSelector } from './StyleSelector';
import { VoiceSelector } from './VoiceSelector';
import { validateStory } from '../utils/validation';
import type { StoryStyle } from '../types';

type WizardStep = 'story' | 'style' | 'voice';

export type GenerationWizardProps = {
    story: string;
    onStoryChange: (story: string) => void;
    style: StoryStyle | null;
    onStyleChange: (style: StoryStyle) => void;
    voiceId: string | null;
    onVoiceChange: (voiceId: string) => void;
    isDeveloper: boolean;
    onGenerateScript: () => void;
    onOpenScriptPreset: () => void;
};

const STEP_COPY: Record<WizardStep, { title: string; description: string }> = {
    story: {
        title: 'Tu historia',
        description:
            'Pegá el texto que querés convertir en un Short. En los siguientes pasos elegís estilo y voz.',
    },
    style: {
        title: 'Estilo visual',
        description: 'Elegí el estilo visual que mejor refleja tu historia.',
    },
    voice: {
        title: 'Voz y narrador',
        description: 'Elegí la voz que narrará tu historia.',
    },
};

const TONE_OPTIONS = ['Narrativo', 'Dramático', 'Divertido', 'Épico', 'Misterioso'];
const LENGTH_OPTIONS = ['15s', '30s', '60s'];

/** Ejemplos para el chip "Probá:" — el label se muestra corto, el texto rellena el campo. */
const EXAMPLE_STORIES: { label: string; text: string }[] = [
    {
        label: 'Un gato que dirige una cafetería…',
        text: 'Un gato callejero descubre una cafetería abandonada y, en secreto, empieza a atenderla de noche para los animales del barrio, hasta que una niña lo descubre.',
    },
    {
        label: '3 criaturas de las profundidades…',
        text: 'Tres criaturas de las profundidades del océano emprenden un viaje hacia la superficie para ver la luz del sol por primera vez, enfrentando peligros desconocidos.',
    },
    {
        label: 'El día que la planta de la oficina…',
        text: 'El día que la planta de la oficina cobró conciencia, decidió reorganizar la vida de los empleados que la habían ignorado durante años, una maceta a la vez.',
    },
];

export const GenerationWizard = ({
    story,
    onStoryChange,
    style,
    onStyleChange,
    voiceId,
    onVoiceChange,
    isDeveloper,
    onGenerateScript,
    onOpenScriptPreset,
}: GenerationWizardProps) => {
    const [step, setStep] = useState<WizardStep>('story');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [tone, setTone] = useState(TONE_OPTIONS[0]);
    const [length, setLength] = useState('30s');
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
            setStep('voice');
        }
    };

    const handleBack = () => {
        if (step === 'style') setStep('story');
        if (step === 'voice') setStep('style');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-head text-2xl tracking-[-0.03em]">{copy.title}</CardTitle>
                <CardDescription>{copy.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {step === 'story' && (
                    <>
                        <StoryInput
                            value={story}
                            onChange={onStoryChange}
                            showErrors={submitAttempted}
                        />

                        <div className="flex flex-col gap-3 border-t border-bd pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="font-mono text-[11px] uppercase tracking-[0.06em] text-mut2">
                                        Tono
                                    </Label>
                                    <Select value={tone} onValueChange={setTone}>
                                        <SelectTrigger className="h-9 w-[150px] rounded-full bg-elev text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TONE_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="font-mono text-[11px] uppercase tracking-[0.06em] text-mut2">
                                        Duración
                                    </Label>
                                    <Select value={length} onValueChange={setLength}>
                                        <SelectTrigger className="h-9 w-[110px] rounded-full bg-elev text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LENGTH_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button
                                type="button"
                                disabled={!validation.valid}
                                onClick={handleContinue}
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Continuar
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-mut2">
                                Probá:
                            </span>
                            {EXAMPLE_STORIES.map((example) => (
                                <Button
                                    key={example.label}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-auto rounded-full px-3.5 py-1.5 text-xs font-normal text-mut"
                                    onClick={() => onStoryChange(example.text)}
                                >
                                    {example.label}
                                </Button>
                            ))}
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
