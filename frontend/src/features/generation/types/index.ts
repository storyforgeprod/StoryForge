export const StoryStyle = {
  BOLD_COMIC:   'bold-comic',
  SOFT_CARTOON: 'soft-cartoon',
  RETRO_POP:    'retro-pop',
  MANGA_INK:    'manga-ink',
  STORYBOOK:    'storybook',
  TOON_3D:      '3d-toon',
} as const;

export type StoryStyle = typeof StoryStyle[keyof typeof StoryStyle];

export type WizardStep = 'story' | 'script' | 'style' | 'voice' | 'video';

export type VoiceOption = {
    id: string;
    name: string;
    description: string;
    previewUrl: string;
};

export type ImageGenerationResult = {
    imageUrls: string[];
    prompt: string;
    generatedAt: string;
};

export type AudioGenerationResult = {
    audioUrl: string;
    audioLength: number;
    textUsed: string;
    generatedAt: string;
};

export type VideoAssemblyResult = {
    videoUrl: string;
    duration: number;
    fileSize: number;
    format: string;
    generatedAt: string;
};

export type GenerateScriptState =
    | { phase: 'idle' }
    | { phase: 'submitting' }
    | { phase: 'polling'; jobId: string; attempts: number }
    | { phase: 'completed'; script: string }
    | { phase: 'error'; message: string };

export type GenerateImagesState =
    | { phase: 'idle' }
    | { phase: 'submitting' }
    | { phase: 'polling'; jobId: string }
    | { phase: 'completed'; imageUrls: string[] }
    | { phase: 'error'; message: string };

export type GenerateAudioState =
    | { phase: 'idle' }
    | { phase: 'submitting' }
    | { phase: 'polling'; jobId: string }
    | { phase: 'completed'; audioUrl: string; audioLength: number }
    | { phase: 'error'; message: string };

export type GenerateVideoState =
    | { phase: 'idle' }
    | { phase: 'submitting' }
    | { phase: 'polling'; jobId: string }
    | { phase: 'completed'; videoUrl: string; duration: number; fileSize: number }
    | { phase: 'error'; message: string };

export type PipelineStage = 'story' | 'script' | 'images' | 'audio' | 'video';

export type StageStatus = 'pending' | 'active' | 'done' | 'error';

export type PipelineStageView = {
    id: 'script' | 'images' | 'audio' | 'video';
    label: string;
    status: StageStatus;
};
