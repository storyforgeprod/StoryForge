export const StoryStyle = {
    ANIME: 'anime',
    MANGA: 'manga',
    WEBTOON: 'webtoon',
    NOVEL: 'novel',
} as const;

export type StoryStyle = typeof StoryStyle[keyof typeof StoryStyle];

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
