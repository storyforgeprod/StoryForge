import type { StoryStyle } from '@/features/generation';

export type ProjectStatus = "draft" | "processing" | "completed" | "failed";

export type ProjectOutput = {
  videoUrl: string;
  audioUrl: string | null;
  images: string[];
  script: string | null;
  duration: number | null;
};

export type Project = {
  id: string;
  title: string;
  style: StoryStyle;
  duration: number;
  status: ProjectStatus;
  createdAt: string;
  output: ProjectOutput | null;
};
