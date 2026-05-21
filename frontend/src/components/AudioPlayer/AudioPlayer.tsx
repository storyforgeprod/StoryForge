import { Card, CardContent } from '@/components/ui/card';

export type AudioPlayerProps = {
    src: string;
    durationSeconds?: number;
    className?: string;
};

export const AudioPlayer = ({
    src,
    durationSeconds,
    className = '',
}: AudioPlayerProps) => {
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) {
            return `${secs}s`;
        }
        return `${mins}m ${secs}s`;
    };

    return (
        <Card className={className}>
            <CardContent className="space-y-4 py-6">
                <audio
                    src={src}
                    controls
                    className="w-full"
                    data-testid="audio-element"
                />
                {durationSeconds !== undefined && (
                    <p className="text-sm text-muted-foreground">
                        Duración estimada: {formatDuration(durationSeconds)}
                    </p>
                )}
            </CardContent>
        </Card>
    );
};
