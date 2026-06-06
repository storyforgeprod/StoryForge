import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui/button';
import { PipelineProgress } from '../components/PipelineProgress';
import { GenerationWizard } from '../components/GenerationWizard';
import {
    PresetDialogs,
    type PresetDialogState,
} from '../components/PresetDialogs';
import { ScriptStage } from '../components/stages/ScriptStage';
import { ImagesStage } from '../components/stages/ImagesStage';
import { AudioStage } from '../components/stages/AudioStage';
import { VideoStage } from '../components/stages/VideoStage';
import { deriveStages } from '../utils/deriveStages';
import { useGenerateScript } from '../hooks/useGenerateScript';
import { useGenerateImages } from '../hooks/useGenerateImages';
import { useGenerateAudio } from '../hooks/useGenerateAudio';
import { useGenerateVideo } from '../hooks/useGenerateVideo';
import { useDevPresetHandoff } from '../hooks/useDevPresetHandoff';
import { StoryStyle } from '../types';

export function GeneratePage() {
    const navigate = useNavigate();
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
    const [isPresetMode, setIsPresetMode] = useState(false);
    const [presetDialog, setPresetDialog] = useState<PresetDialogState>('closed');

    const imagesRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLDivElement>(null);

    const { state: genState, generate, reset: resetGeneration } = useGenerateScript();
    const { state: imagesState, generate: generateImages, reset: resetImages } = useGenerateImages();
    const { state: audioState, generate: generateAudio, reset: resetAudio } = useGenerateAudio();
    const { state: videoState, generate: generateVideo, reset: resetVideo } = useGenerateVideo();

    useDevPresetHandoff(
        useCallback(
            (applied) => {
                setStory(applied.story);
                if (applied.scriptJobId) setScriptJobId(applied.scriptJobId);
                if (applied.imageJobId) setImageJobId(applied.imageJobId);
                if (applied.audioJobId) setAudioJobId(applied.audioJobId);
                setIsPresetMode(applied.isPresetMode);
                if (applied.isPresetMode) {
                    setStyle((prev) => prev ?? applied.style);
                    setVoiceId((prev) => prev ?? applied.voiceId);
                    resetGeneration();
                    resetImages();
                    resetAudio();
                    resetVideo();
                }
            },
            [resetGeneration, resetImages, resetAudio, resetVideo],
        ),
    );

    useEffect(() => {
        if (genState.phase === 'polling') setScriptJobId(genState.jobId);
    }, [genState]);

    useEffect(() => {
        if (imagesState.phase === 'polling') setImageJobId(imagesState.jobId);
    }, [imagesState]);

    useEffect(() => {
        if (audioState.phase === 'polling') setAudioJobId(audioState.jobId);
    }, [audioState]);

    const stages = useMemo(
        () => deriveStages(genState.phase, imagesState.phase, audioState.phase, videoState.phase),
        [genState.phase, imagesState.phase, audioState.phase, videoState.phase],
    );

    const scrollSoon = (ref: React.RefObject<HTMLDivElement>) => {
        setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleGenerateScript = () => {
        if (!style || !voiceId) return;
        if (genState.phase === 'completed' && story === lastScriptStory) return;
        setLastScriptStory(story);
        generate(story, style, targetDuration, targetScenes);
    };

    const handleGenerateImages = () => {
        if (!scriptJobId) return;
        const styleToUse = style ?? (isPresetMode ? StoryStyle.ANIME : null);
        if (!styleToUse) return;
        generateImages(scriptJobId, styleToUse);
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
        setIsPresetMode(false);
        setPresetDialog('closed');
    };

    const handleBackToHome = () => {
        resetAll();
        navigate('/home');
    };

    const handleScriptRetry = () => {
        resetGeneration();
        resetImages();
        resetAudio();
        resetVideo();
        setScriptJobId(null);
        setImageJobId(null);
        setAudioJobId(null);
    };

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

            <PresetDialogs
                open={presetDialog}
                onClose={() => setPresetDialog('closed')}
                onScriptApplied={setScriptJobId}
                onImagesApplied={setImageJobId}
                onAudioApplied={setAudioJobId}
            />

            <main className="mx-auto max-w-3xl px-4 py-8">
                <ScriptStage
                    state={genState}
                    isPresetMode={isPresetMode}
                    isDeveloper={isDeveloper}
                    imagesIdle={imagesState.phase === 'idle'}
                    scriptJobId={scriptJobId}
                    style={style}
                    onGenerateImages={handleGenerateImages}
                    onRetry={handleScriptRetry}
                    onOpenImagesPreset={() => setPresetDialog('images')}
                />

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

                {!isPresetMode && genState.phase === 'idle' && (
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
                        onGenerateScript={handleGenerateScript}
                        onOpenScriptPreset={() => setPresetDialog('script')}
                    />
                )}
            </main>
        </div>
    );
}
