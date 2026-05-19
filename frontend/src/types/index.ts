export type StoryStyle = 'anime' | 'manga' | 'webtoon' | 'novel';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface GenerateJobResponse {
  jobId: string;
  status: JobStatus;
  message?: string;
  createdAt: string;
}

export interface JobStatusResponse {
  id: string;
  status: JobStatus;
  progress: number;
  result: Record<string, unknown> | null;
  error: string | null;
  completedAt: string | null;
  processingTimeMs: number | null;
}
