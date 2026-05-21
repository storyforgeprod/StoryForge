export const StoryStyle = {
    ANIME: 'anime',
    MANGA: 'manga',
    WEBTOON: 'webtoon',
    NOVEL: 'novel',
} as const;

export type StoryStyle = typeof StoryStyle[keyof typeof StoryStyle];
