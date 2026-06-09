import type { StoryStyle } from '@/features/generation';

export type ProjectStatus = 'draft' | 'ready' | 'exported';

export type Project = {
  id: string;
  title: string;
  style: StoryStyle;
  durationSec: number;
  status: ProjectStatus;
};
