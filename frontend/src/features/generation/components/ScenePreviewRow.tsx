import { cn } from '@/lib/utils';

export type ScenePreviewRowProps = {
  sceneCount: number;
  imageUrls: string[];
  className?: string;
};

export const ScenePreviewRow = ({ sceneCount, imageUrls, className }: ScenePreviewRowProps) => (
  <div className={cn('flex gap-3 overflow-x-auto pb-2', className)}>
    {Array.from({ length: sceneCount }, (_, i) => {
      const url = imageUrls[i];
      return (
        <div
          key={i}
          className="relative w-[90px] shrink-0 overflow-hidden rounded-xl border border-border bg-elev"
          style={{ aspectRatio: '9 / 16' }}
        >
          {url ? (
            <img src={url} alt={`Scene ${i + 1}`} className="h-full w-full object-cover" />
          ) : (
            <div
              data-testid="scene-skeleton"
              className="h-full w-full animate-pulse bg-elev2"
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <span className="font-mono text-[9px] font-bold text-white/80">
              Scene {String(i + 1).padStart(2, '0')}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);
