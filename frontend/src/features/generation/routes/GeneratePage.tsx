import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { AppShell } from '@/components/layout/AppShell';
import { CreateStepsNav } from '../components/CreateStepsNav';
import { GenerationWizard } from '../components/GenerationWizard';
import {
    PresetDialogs,
    type PresetDialogState,
} from '../components/PresetDialogs';
import { ImagesStage } from '../components/stages/ImagesStage';
import { AudioStage } from '../components/stages/AudioStage';
import { VideoStage } from '../components/stages/VideoStage';
import { validateStory } from '../utils/validation';
import { useGenerateScript } from '../hooks/useGenerateScript';
import { useGenerateImages } from '../hooks/useGenerateImages';
import { useGenerateAudio } from '../hooks/useGenerateAudio';
import { useGenerateVideo } from '../hooks/useGenerateVideo';
import type { StoryStyle } from '../types';

export function GeneratePage() {
    const { user } = useAuth();
    const isDeveloper = user?.role === 'DEVELOPER';

    const [story, setStory] = useState('');
    const [lastScriptStory, setLastScriptStory] = useState('');
    const [style, setStyle] = useState<StoryStyle | null>(null);
    const [targetDuration, setTargetDuration] = useState(60);
    const [targetScenes, setTargetScenes] = useState(12);
    const [voiceId, setVoiceId] = useState<string | null>(null);
    const [scriptJobId, setScriptJobId] = useState<string | null>(null);
    const [imageJobId, setImageJobId] = useState<string | null>(null);
    const [audioJobId, setAudioJobId] = useState<string | null>(null);
    const [presetDialog, setPresetDialog] = useState<PresetDialogState>('closed');

    const imagesRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLDivElement>(null);

    const { state: genState, generate, reset: resetGeneration } = useGenerateScript();
    const { state: imagesState, generate: generateImages, reset: resetImages } = useGenerateImages();
    const { state: audioState, generate: generateAudio, reset: resetAudio } = useGenerateAudio();
    const { state: videoState, generate: generateVideo, reset: resetVideo } = useGenerateVideo();

    useEffect(() => {
        if (genState.phase === 'polling') setScriptJobId(genState.jobId);
    }, [genState]);

    useEffect(() => {
        if (imagesState.phase === 'polling') setImageJobId(imagesState.jobId);
    }, [imagesState]);

    useEffect(() => {
        if (audioState.phase === 'polling') setAudioJobId(audioState.jobId);
    }, [audioState]);

    const scrollSoon = (ref: React.RefObject<HTMLDivElement>) => {
        setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleGenerateScript = () => {
        if (!style) return;
        if (genState.phase === 'completed' && story === lastScriptStory) return;
        setLastScriptStory(story);
        generate(story, style, targetDuration, targetScenes);
    };

    const handleRetryScript = () => {
        resetGeneration();
        setScriptJobId(null);
    };

    const handleRegenerateScript = () => {
        if (!style) return;
        resetGeneration();
        setScriptJobId(null);
        setLastScriptStory(story);
        generate(story, style, targetDuration, targetScenes);
    };

    const handleGenerateImages = () => {
        if (!scriptJobId || !style) return;
        generateImages(scriptJobId, style);
        scrollSoon(imagesRef);
    };

    const handleGenerateAudio = () => {
        if (!scriptJobId || !voiceId) return;
        generateAudio(scriptJobId, voiceId);
        scrollSoon(audioRef);
    };

    const handleGenerateVideo = () => {
        if (!imageJobId || !audioJobId) return;
        generateVideo(imageJobId, audioJobId);
        scrollSoon(videoRef);
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
        setLastScriptStory('');
        setPresetDialog('closed');
    };

    const downstreamStarted =
        imagesState.phase !== 'idle' || audioState.phase !== 'idle' || videoState.phase !== 'idle';

    const crumb = downstreamStarted
        ? 'Create / Video'
        : genState.phase !== 'idle'
            ? 'Create / Script'
            : 'Create / Story';

    const wizardVisible = imagesState.phase === 'idle';

    return (
        <AppShell
            crumb={crumb}
            steps={
                <CreateStepsNav
                    storyValid={validateStory(story).valid}
                    style={style}
                    voiceId={voiceId}
                    scriptPhase={genState.phase}
                    imagesPhase={imagesState.phase}
                    audioPhase={audioState.phase}
                    videoPhase={videoState.phase}
                />
            }
        >
            <PresetDialogs
                open={presetDialog}
                onClose={() => setPresetDialog('closed')}
                onScriptApplied={setScriptJobId}
                onImagesApplied={setImageJobId}
                onAudioApplied={setAudioJobId}
            />

            <div className="mx-auto max-w-3xl px-6 pb-16 pt-10 sm:px-8">
                <header className="mb-8">
                    {wizardVisible ? (
                        <>
                            <div className="mb-2 flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-acc">
                                <Sparkles className="h-3.5 w-3.5" />
                                AI script studio
                            </div>
                            <h1 className="font-head text-[34px] font-extrabold leading-[1.05] tracking-[-0.04em]">
                                Convertí cualquier historia en un Short viral
                            </h1>
                        </>
                    ) : (
                        <>
                            <h1 className="font-head text-[32px] font-extrabold tracking-[-0.04em]">
                                Crear video
                            </h1>
                            <p className="mt-1.5 text-[14px] text-muted-foreground">
                                Convertí tu historia en un Short narrado, paso a paso.
                            </p>
                        </>
                    )}
                </header>

                <div className="space-y-6">
                    {wizardVisible && (
                        <GenerationWizard
                            story={story}
                            onStoryChange={setStory}
                            style={style}
                            onStyleChange={setStyle}
                            targetDuration={targetDuration}
                            onDurationChange={setTargetDuration}
                            targetScenes={targetScenes}
                            onScenesChange={setTargetScenes}
                            voiceId={voiceId}
                            onVoiceChange={setVoiceId}
                            isDeveloper={isDeveloper}
                            genState={genState}
                            onGenerateScript={handleGenerateScript}
                            onRetryScript={handleRetryScript}
                            onRegenerateScript={handleRegenerateScript}
                            onStartPipeline={handleGenerateImages}
                            onOpenScriptPreset={() => setPresetDialog('script')}
                        />
                    )}

                    <ImagesStage
                        ref={imagesRef}
                        state={imagesState}
                        audioIdle={audioState.phase === 'idle'}
                        isDeveloper={isDeveloper}
                        onGenerateAudio={handleGenerateAudio}
                        onRetry={resetImages}
                        onOpenAudioPreset={() => setPresetDialog('audio')}
                    />

                    <AudioStage
                        ref={audioRef}
                        state={audioState}
                        videoState={videoState}
                        isDeveloper={isDeveloper}
                        imageJobId={imageJobId}
                        audioJobId={audioJobId}
                        onGenerateVideo={handleGenerateVideo}
                        onRetry={resetAudio}
                        onOpenVideoPreset={() => setPresetDialog('video')}
                    />

                    <VideoStage
                        ref={videoRef}
                        state={videoState}
                        onReset={resetAll}
                        onRetry={resetVideo}
                    />
                </div>
            </div>
        </AppShell>
    );
}
