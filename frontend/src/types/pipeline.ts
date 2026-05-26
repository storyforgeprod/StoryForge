export type PipelineStage = 'story' | 'script' | 'images' | 'audio' | 'video';

export interface GenerationState {
  stage: PipelineStage;
  story: string;
  style: string;
  scriptJobId?: string;
  scriptContent?: string;
  imageJobId?: string;
  audioJobId?: string;
  videoJobId?: string;
  devMode?: boolean;
}
