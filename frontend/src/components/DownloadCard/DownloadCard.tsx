import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface DownloadCardProps {
    videoUrl: string;
    durationSeconds: number;
    fileSizeBytes: number;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
    return `${Math.round(seconds)} segundos`;
}

export const DownloadCard = ({ videoUrl, durationSeconds, fileSizeBytes }: DownloadCardProps) => (
    <Card>
        <CardHeader>
            <CardTitle>¡Tu video está listo!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <video
                src={videoUrl}
                controls
                className="w-full rounded-lg"
                aria-label="Vista previa del video"
            />
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <span>{formatFileSize(fileSizeBytes)}</span>
                <span>{formatDuration(durationSeconds)}</span>
                <span>El enlace de descarga expira en 24 horas.</span>
            </div>
            <Button asChild className="w-full">
                <a href={videoUrl} download="storyforge-video.mp4">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar MP4
                </a>
            </Button>
        </CardContent>
    </Card>
);
