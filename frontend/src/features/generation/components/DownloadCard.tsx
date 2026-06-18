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
    return `${Math.round(seconds)} seconds`;
}

export const DownloadCard = ({ videoUrl, durationSeconds, fileSizeBytes }: DownloadCardProps) => (
    <Card>
        <CardHeader>
            <CardTitle className="font-head text-2xl tracking-[-0.03em]">Your video is ready!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
            <div className="mx-auto w-[270px] max-w-full rounded-[30px] border border-bd2 bg-black p-[7px] shadow-[0_50px_90px_-36px_rgba(0,0,0,.95)]">
                <div className="aspect-[9/16] overflow-hidden rounded-[24px]">
                    <video
                        src={videoUrl}
                        controls
                        className="h-full w-full object-cover"
                        aria-label="Video preview"
                    />
                </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-center font-mono text-xs text-mut2">
                <span>{formatFileSize(fileSizeBytes)}</span>
                <span>{formatDuration(durationSeconds)}</span>
                <span>The download link expires in 24 hours.</span>
            </div>
            <Button asChild className="w-full">
                <a href={videoUrl} download="storyforge-video.mp4">
                    <Download className="mr-2 h-4 w-4" />
                    Download MP4
                </a>
            </Button>
        </CardContent>
    </Card>
);
