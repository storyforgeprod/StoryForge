import type { PipelineStageView, StageStatus } from '../types';

type StagePhase = string;

function scriptStatus(phase: StagePhase): StageStatus {
    if (phase === 'completed') return 'done';
    if (phase === 'error') return 'error';
    return 'pending';
}

function downstreamStatus(phase: StagePhase): StageStatus {
    if (phase === 'completed') return 'done';
    if (phase === 'error') return 'error';
    if (phase === 'idle') return 'pending';
    return 'active';
}

export function deriveStages(
    genPhase: StagePhase,
    imagesPhase: StagePhase,
    audioPhase: StagePhase,
    videoPhase: StagePhase,
): PipelineStageView[] {
    return [
        { id: 'script', label: 'Guión', status: scriptStatus(genPhase) },
        { id: 'images', label: 'Imágenes', status: downstreamStatus(imagesPhase) },
        { id: 'audio', label: 'Audio', status: downstreamStatus(audioPhase) },
        { id: 'video', label: 'Video', status: downstreamStatus(videoPhase) },
    ];
}
