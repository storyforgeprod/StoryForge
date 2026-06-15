import { Check, X, Loader2 } from 'lucide-react';
import type { StageStatus, PipelineStageView } from '../types';

export type PipelineProgressProps = {
    stages: PipelineStageView[];
};

export const PipelineProgress = ({ stages }: PipelineProgressProps) => {
    const getStageColor = (status: StageStatus): string => {
        switch (status) {
            case 'done':
                return 'bg-green-500';
            case 'active':
                return 'bg-blue-500';
            case 'error':
                return 'bg-destructive';
            case 'pending':
            default:
                return 'bg-muted';
        }
    };

    const getStageIcon = (status: StageStatus) => {
        switch (status) {
            case 'done':
                return <Check className="h-5 w-5 text-white" />;
            case 'active':
                return <Loader2 className="h-5 w-5 text-white animate-spin" />;
            case 'error':
                return <X className="h-5 w-5 text-white" />;
            case 'pending':
            default:
                return null;
        }
    };

    const isStageComplete = (index: number): boolean => {
        return stages[index]?.status === 'done';
    };

    return (
        <div className="w-full bg-background px-4 py-4 border-b border-border/60">
            <div className="mx-auto max-w-3xl">
                <div className="flex items-center justify-between gap-0">
                    {stages.map((stage, index) => (
                        <div key={stage.id} className="flex items-center flex-1">
                            {/* Stage circle */}
                            <div className="flex flex-col items-center relative z-10">
                                <div
                                    className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${getStageColor(
                                        stage.status,
                                    )}`}
                                    role="img"
                                    aria-label={`${stage.label}: ${stage.status}`}
                                    data-testid={`stage-${stage.id}`}
                                >
                                    {getStageIcon(stage.status)}
                                </div>
                                {/* Label — hidden on mobile, visible on sm and above */}
                                <span className="hidden sm:block text-xs font-medium text-muted-foreground mt-2 text-center whitespace-nowrap">
                                    {stage.label}
                                </span>
                                {/* Mobile label fallback — show initials or abbreviated */}
                                <span className="sm:hidden text-xs font-medium text-muted-foreground mt-1 text-center">
                                    {stage.label.substring(0, 1)}
                                </span>
                            </div>

                            {/* Connecting line between stages */}
                            {index < stages.length - 1 && (
                                <div
                                    className={`flex-1 h-1 mx-1 rounded transition-colors ${isStageComplete(index)
                                            ? 'bg-green-500'
                                            : 'bg-muted'
                                        }`}
                                    data-testid={`connector-${stage.id}`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
