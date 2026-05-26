import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StoryInput } from '@/components/Input/StoryInput';
import { StyleSelector } from '@/components/StyleSelector/StyleSelector';
import { VoiceSelector } from '@/components/VoiceSelector/VoiceSelector';
import { AudioPlayer } from '@/components/AudioPlayer/AudioPlayer';
import { ImageGrid } from '@/components/ImageGrid/ImageGrid';
import { DownloadCard } from '@/components/DownloadCard/DownloadCard';
import { PipelineProgress, type PipelineStage } from '@/components/PipelineProgress/PipelineProgress';
import { PipelineNavigation } from '@/components/PipelineNavigation';
import { validateStory } from '@/utils/validation';
import { StoryStyle } from '@/types/generate';
import { useGenerateScript } from '@/hooks/useGenerateScript';
import { useGenerateImages } from '@/hooks/useGenerateImages';
import { useGenerateAudio } from '@/hooks/useGenerateAudio';
import { useGenerateVideo } from '@/hooks/useGenerateVideo';

type WizardStep = 'story' | 'style' | 'voice';

function deriveStages(
    genPhase: string,
    imagesPhase: string,
    audioPhase: string,
    videoPhase: string,
): PipelineStage[] {
    const scriptStatus =
        genPhase === 'completed' ? 'done' : genPhase === 'error' ? 'error' : 'pending';
    const imagesStatus =
        imagesPhase === 'completed'
            ? 'done'
            : imagesPhase === 'error'
                ? 'error'
                : imagesPhase === 'idle'
                    ? 'pending'
                    : 'active';
    const audioStatus =
        audioPhase === 'completed'
            ? 'done'
            : audioPhase === 'error'
                ? 'error'
                : audioPhase === 'idle'
                    ? 'pending'
                    : 'active';
    const videoStatus =
        videoPhase === 'completed'
            ? 'done'
            : videoPhase === 'error'
                ? 'error'
                : videoPhase === 'idle'
                    ? 'pending'
                    : 'active';

    return [
        { id: 'script', label: 'Guión', status: scriptStatus },
        { id: 'images', label: 'Imágenes', status: imagesStatus },
        { id: 'audio', label: 'Audio', status: audioStatus },
        { id: 'video', label: 'Video', status: videoStatus },
    ];
}

export function Generate() {
    const navigate = useNavigate();
    const [story, setStory] = useState('');
    const [lastScriptStory, setLastScriptStory] = useState('');
    const [style, setStyle] = useState<StoryStyle | null>(null);
    const [voiceId, setVoiceId] = useState<string | null>(null);
    const [step, setStep] = useState<WizardStep>('story');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [scriptJobId, setScriptJobId] = useState<string | null>(null);
    const [imageJobId, setImageJobId] = useState<string | null>(null);
    const [audioJobId, setAudioJobId] = useState<string | null>(null);

    const validation = useMemo(() => validateStory(story), [story]);
    const { state: genState, generate, reset: resetGeneration } = useGenerateScript();
    const { state: imagesState, generate: generateImages, reset: resetImages } = useGenerateImages();
    const { state: audioState, generate: generateAudio, reset: resetAudio } = useGenerateAudio();
    const { state: videoState, generate: generateVideo, reset: resetVideo } = useGenerateVideo();

    // Load dev state if coming from dev mode
    useEffect(() => {
        const devState = sessionStorage.getItem('devState');
        if (devState) {
            const state = JSON.parse(devState);
            setStory(state.story || '');
            if (state.imageJobId) {
                setImageJobId(state.imageJobId);
            }
            if (state.audioJobId) {
                setAudioJobId(state.audioJobId);
            }
            // Note: scriptContent would be set through the generate hook's completion
            // Dev mode can inject content via setting the initial state
            sessionStorage.removeItem('devState');
        }
    }, []);

    const stages = useMemo(
        () => deriveStages(genState.phase, imagesState.phase, audioState.phase, videoState.phase),
        [genState.phase, imagesState.phase, audioState.phase, videoState.phase],
    );

    useEffect(() => {
        if (genState.phase === 'polling') {
            setScriptJobId(genState.jobId);
        }
    }, [genState]);

    useEffect(() => {
        if (imagesState.phase === 'polling') {
            setImageJobId(imagesState.jobId);
        }
    }, [imagesState]);

    useEffect(() => {
        if (audioState.phase === 'polling') {
            setAudioJobId(audioState.jobId);
        }
    }, [audioState]);

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

    const handleBackToHome = () => {
        resetAll();
        navigate('/home');
    };

    const handleGenerateScript = () => {
        if (!style || !voiceId) return;
        // Check if story changed from last script generation
        if (genState.phase === 'completed' && story === lastScriptStory) {
            // Story hasn't changed, skip regeneration
            return;
        }
        setLastScriptStory(story);
        generate(story, style);
    };

    const handleGenerateImages = () => {
        if (!scriptJobId || !style) return;
        generateImages(scriptJobId, style);
    };

    const handleImagesRetry = () => {
        resetImages();
    };

    const handleGenerateAudio = () => {
        if (!scriptJobId || !voiceId) return;
        generateAudio(scriptJobId, voiceId);
    };

    const handleAudioRetry = () => {
        resetAudio();
    };

    const handleGenerateVideo = () => {
        if (!imageJobId || !audioJobId) return;
        generateVideo(imageJobId, audioJobId);
    };

    const handleVideoRetry = () => {
        resetVideo();
    };

    const handleRetry = () => {
        resetGeneration();
        resetImages();
        resetAudio();
        resetVideo();
        setScriptJobId(null);
        setImageJobId(null);
        setAudioJobId(null);
        setStep('story');
    };

    const resetAll = () => {
        resetGeneration();
        resetImages();
        resetAudio();
        resetVideo();
        setScriptJobId(null);
        setImageJobId(null);
        setAudioJobId(null);
        setStory('');
        setStyle(null);
        setVoiceId(null);
        setStep('story');
        setSubmitAttempted(false);
    };

    const isGeneratingScript =
        genState.phase === 'submitting' || genState.phase === 'polling';
    const isGeneratingImages =
        imagesState.phase === 'submitting' || imagesState.phase === 'polling';
    const isGeneratingAudio =
        audioState.phase === 'submitting' || audioState.phase === 'polling';
    const isGeneratingVideo =
        videoState.phase === 'submitting' || videoState.phase === 'polling';

    // Determine current pipeline stage
    const currentStage: 'story' | 'script' | 'images' | 'audio' | 'video' = useMemo(() => {
        if (videoState.phase !== 'idle') return 'video';
        if (audioState.phase !== 'idle') return 'audio';
        if (imagesState.phase !== 'idle') return 'images';
        if (genState.phase !== 'idle') return 'script';
        return 'story';
    }, [genState.phase, imagesState.phase, audioState.phase, videoState.phase]);

    // Handle navigation between stages
    const handlePreviousStage = () => {
        // Move back one stage
        if (currentStage === 'video') {
            // Go back to audio - reset video
            resetVideo();
        } else if (currentStage === 'audio') {
            // Go back to images - reset audio
            resetAudio();
        } else if (currentStage === 'images') {
            // Go back to script - reset images
            resetImages();
        } else if (currentStage === 'script') {
            // Go back to story - reset script
            resetGeneration();
        }
    };

    const handleNextStage = () => {
        // Move forward one stage
        if (currentStage === 'story') {
            handleGenerateScript();
        } else if (currentStage === 'script' && genState.phase === 'completed') {
            handleGenerateImages();
        } else if (currentStage === 'images' && imagesState.phase === 'completed') {
            handleGenerateAudio();
        } else if (currentStage === 'audio' && audioState.phase === 'completed') {
            handleGenerateVideo();
        }
    };

    const canGoNext = useMemo(() => {
        if (currentStage === 'story') return !!(validation.valid && style && voiceId);
        if (currentStage === 'script') return genState.phase === 'completed';
        if (currentStage === 'images') return imagesState.phase === 'completed';
        if (currentStage === 'audio') return audioState.phase === 'completed';
        if (currentStage === 'video') return videoState.phase === 'completed';
        return false;
    }, [currentStage, validation.valid, style, voiceId, genState.phase, imagesState.phase, audioState.phase, videoState.phase]);

    const canGoPrevious = currentStage !== 'story';

    return (
        <div className="min-h-screen">
            <header className="border-b border-border/60">
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={handleBackToHome}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-lg font-semibold">Generar video</h1>
                    </div>
                </div>
            </header>

            <PipelineProgress stages={stages} />

            <PipelineNavigation
                currentStage={currentStage}
                onPrevious={handlePreviousStage}
                onNext={handleNextStage}
                canGoNext={canGoNext}
                canGoPrevious={canGoPrevious}
            />

            <main className="mx-auto max-w-3xl px-4 py-8">
                {/* Script generation — loading */}
                {isGeneratingScript && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-16">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">
                                Analizando tu historia…
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Script generation — error */}
                {genState.phase === 'error' && imagesState.phase === 'idle' && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-16">
                            <p className="text-sm text-destructive">{genState.message}</p>
                            <Button type="button" variant="outline" onClick={handleRetry}>
                                Reintentar
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Script done — prompt to start image generation */}
                {genState.phase === 'completed' && imagesState.phase === 'idle' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Guión generado</CardTitle>
                            <CardDescription>
                                Revisá el guión y generá las imágenes para tu historia.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <pre className="max-h-64 overflow-y-auto rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">
                                {genState.script}
                            </pre>
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    disabled={!scriptJobId || !style}
                                    onClick={handleGenerateImages}
                                >
                                    Generar imágenes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Image generation — loading */}
                {isGeneratingImages && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-16">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">
                                Generando imágenes…
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Image generation — done */}
                {imagesState.phase === 'completed' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Imágenes generadas</CardTitle>
                            <CardDescription>
                                Revisá las imágenes antes de continuar al audio.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ImageGrid imageUrls={imagesState.imageUrls} />
                        </CardContent>
                    </Card>
                )}

                {/* Audio generation — loading */}
                {isGeneratingAudio && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-16">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">
                                Generando narración…
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Audio generation — done; video not yet started */}
                {audioState.phase === 'completed' && videoState.phase === 'idle' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Narración generada</CardTitle>
                            <CardDescription>
                                Escuchá la narración y generá el video final.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {'audioUrl' in audioState && audioState.audioUrl && (
                                <AudioPlayer
                                    src={audioState.audioUrl}
                                    durationSeconds={'audioLength' in audioState ? audioState.audioLength : undefined}
                                />
                            )}
                            <p className="text-sm text-muted-foreground">
                                Puede tardar hasta 3 minutos.
                            </p>
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    disabled={!imageJobId || !audioJobId}
                                    onClick={handleGenerateVideo}
                                >
                                    Generar video
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Audio generation — error */}
                {audioState.phase === 'error' && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-16">
                            <p className="text-sm text-destructive">{audioState.message}</p>
                            <Button type="button" variant="outline" onClick={handleAudioRetry}>
                                Reintentar
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Audio generation — idle (show button to start) */}
                {imagesState.phase === 'completed' && audioState.phase === 'idle' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Listo para generar narración</CardTitle>
                            <CardDescription>
                                Haz clic para generar el audio con la voz que seleccionaste.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-end">
                                <Button type="button" onClick={handleGenerateAudio}>
                                    Generar narración
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Image generation — error */}
                {imagesState.phase === 'error' && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-16">
                            <p className="text-sm text-destructive">{imagesState.message}</p>
                            <Button type="button" variant="outline" onClick={handleImagesRetry}>
                                Reintentar
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Video generation — loading */}
                {isGeneratingVideo && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-16">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">
                                Ensamblando tu video…
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Video generation — done */}
                {videoState.phase === 'completed' && (
                    <div className="space-y-4">
                        <DownloadCard
                            videoUrl={videoState.videoUrl}
                            durationSeconds={videoState.duration}
                            fileSizeBytes={videoState.fileSize}
                        />
                        <div className="flex justify-center">
                            <Button type="button" variant="outline" onClick={resetAll}>
                                Nueva historia
                            </Button>
                        </div>
                    </div>
                )}

                {/* Video generation — error */}
                {videoState.phase === 'error' && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 py-16">
                            <p className="text-sm text-destructive">{videoState.message}</p>
                            <Button type="button" variant="outline" onClick={handleVideoRetry}>
                                Reintentar
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Wizard — story / style / voice steps */}
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
