import { useCallback, useEffect, useState } from 'react';
import { StoryStep } from './StoryStep';
import { ScriptStep } from './ScriptStep';
import { StyleStep } from './StyleStep';
import { VoiceStep } from './VoiceStep';
import { VideoStep } from './VideoStep';
import { parseScenes } from '../utils/parseScript';
import { useGenerateScript } from '../hooks/useGenerateScript';
import { useGenerateImages } from '../hooks/useGenerateImages';
import { useGenerateAudio } from '../hooks/useGenerateAudio';
import { useGenerateVideo } from '../hooks/useGenerateVideo';
import type { StoryStyle, WizardStep } from '../types';

export type GenerationFlowProps = {
  onStepChange: (step: WizardStep) => void;
};

export const GenerationFlow = ({ onStepChange }: GenerationFlowProps) => {
  const [step, setStep] = useState<WizardStep>('story');
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [tone, setTone] = useState('playful');
  const [language, setLanguage] = useState('en');
  const [targetDuration, setTargetDuration] = useState(30);
  const [sceneCountTarget, setSceneCountTarget] = useState(5);
  const [style, setStyle] = useState<StoryStyle | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [scriptJobId, setScriptJobId] = useState<string | null>(null);
  const [imageJobId, setImageJobId] = useState<string | null>(null);
  const [audioJobId, setAudioJobId] = useState<string | null>(null);

  const { state: scriptState, generate: generateScript, reset: resetScript } = useGenerateScript();
  const { state: imagesState, generate: generateImages, reset: resetImages } = useGenerateImages();
  const { state: audioState, generate: generateAudio, reset: resetAudio } = useGenerateAudio();
  const { state: videoState, generate: generateVideo, reset: resetVideo } = useGenerateVideo();

  const navigate = useCallback((next: WizardStep) => {
    setStep(next);
    onStepChange(next);
  }, [onStepChange]);

  // Sync job IDs from polling states
  useEffect(() => { if (scriptState.phase === 'polling') setScriptJobId(scriptState.jobId); }, [scriptState]);
  useEffect(() => { if (imagesState.phase === 'polling') setImageJobId(imagesState.jobId); }, [imagesState]);
  useEffect(() => { if (audioState.phase === 'polling') setAudioJobId(audioState.jobId); }, [audioState]);

  // Auto-trigger images when style is selected (on style step)
  const handleStyleChange = (next: StoryStyle) => {
    setStyle(next);
    if (scriptJobId) {
      resetImages();
      generateImages(scriptJobId, next);
    }
  };

  // Auto-trigger audio when video step mounts
  useEffect(() => {
    if (step === 'video' && scriptJobId && voiceId && audioState.phase === 'idle') {
      generateAudio(scriptJobId, language, voiceId);
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-trigger video when audio completes
  useEffect(() => {
    if (audioState.phase === 'completed' && imageJobId && audioJobId && videoState.phase === 'idle') {
      generateVideo(imageJobId, audioJobId);
    }
  }, [audioState.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerateScript = () => {
    navigate('script');
    generateScript(title, story, targetDuration, sceneCountTarget, tone, language);
  };

  const handleRetryScript = () => { resetScript(); setScriptJobId(null); };

  const handleReset = () => {
    resetScript(); resetImages(); resetAudio(); resetVideo();
    setTitle(''); setStory(''); setStyle(null); setVoiceId(null);
    setScriptJobId(null); setImageJobId(null); setAudioJobId(null);
    navigate('story');
  };

  const sceneCount = scriptState.phase === 'completed' ? parseScenes(scriptState.script).length : targetDuration / 6;
  const artStyleLabel = style
    ? style.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';
  const voiceName = voiceId ? voiceId.charAt(0).toUpperCase() + voiceId.slice(1) : '';
  const firstImageUrl = imagesState.phase === 'completed' ? imagesState.imageUrls[0] : undefined;

  return (
    <div className="mx-auto max-w-3xl px-6 pb-16 pt-10 sm:px-8">
      {step === 'story' && (
        <StoryStep
          title={title} onTitleChange={setTitle}
          story={story} onStoryChange={setStory}
          tone={tone} onToneChange={setTone}
          targetDuration={targetDuration} onDurationChange={setTargetDuration}
          sceneCount={sceneCountTarget} onSceneCountChange={setSceneCountTarget}
          language={language} onLanguageChange={setLanguage}
          onGenerate={handleGenerateScript}
          isGenerating={scriptState.phase === 'submitting' || scriptState.phase === 'polling'}
        />
      )}

      {step === 'script' && (
        <ScriptStep
          state={scriptState}
          onRegenerate={() => { handleRetryScript(); handleGenerateScript(); }}
          onContinue={() => navigate('style')}
        />
      )}

      {step === 'style' && (
        <StyleStep
          value={style}
          onChange={handleStyleChange}
          imagesState={imagesState}
          sceneCount={Math.round(sceneCount)}
          onContinue={() => navigate('voice')}
        />
      )}

      {step === 'voice' && (
        <VoiceStep
          value={voiceId}
          language={language}
          onChange={setVoiceId}
          onContinue={() => navigate('video')}
        />
      )}

      {step === 'video' && (
        <VideoStep
          artStyleLabel={artStyleLabel}
          voiceName={voiceName}
          sceneCount={Math.round(sceneCount)}
          targetDuration={targetDuration}
          firstImageUrl={firstImageUrl}
          audioState={audioState}
          videoState={videoState}
          onRetryAudio={() => { resetAudio(); if (scriptJobId && voiceId) generateAudio(scriptJobId, language, voiceId); }}
          onRetryVideo={() => { resetVideo(); if (imageJobId && audioJobId) generateVideo(imageJobId, audioJobId); }}
          onReset={handleReset}
        />
      )}
    </div>
  );
};
