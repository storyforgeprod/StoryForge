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
