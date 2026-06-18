export type ImageGridProps = {
    imageUrls: string[];
    className?: string;
};

export function ImageGrid({ imageUrls, className }: ImageGridProps) {
    if (imageUrls.length === 0) return null;

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className ?? ''}`.trim()}>
            {imageUrls.map((url, index) => (
                <div
                    key={url}
                    className="relative aspect-[9/16] overflow-hidden rounded-lg bg-muted"
                >
                    <img
                        src={url}
                        alt={`Scene ${index + 1}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                    />
                </div>
            ))}
        </div>
    );
}
