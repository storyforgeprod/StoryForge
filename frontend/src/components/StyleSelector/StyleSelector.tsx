import { StoryStyle } from '@/types/generate';

export type StyleSelectorProps = {
    value: StoryStyle | null;
    onChange: (style: StoryStyle) => void;
    disabled?: boolean;
};

type StyleOption = {
    value: StoryStyle;
    label: string;
    description: string;
    icon: string;
};

const STYLE_OPTIONS: StyleOption[] = [
    {
        value: 'anime',
        label: 'Anime',
        description: 'Colores vibrantes, expresión dramática',
        icon: '⚡',
    },
    {
        value: 'manga',
        label: 'Manga',
        description: 'Blanco y negro, alto contraste',
        icon: '🖤',
    },
    {
        value: 'novel',
        label: 'Novela',
        description: 'Ilustración detallada, cinematográfico',
        icon: '📖',
    },
    {
        value: 'webtoon',
        label: 'Webtoon',
        description: 'Paleta suave, scroll vertical',
        icon: '🎨',
    },
];

export const StyleSelector = ({
    value,
    onChange,
    disabled = false,
}: StyleSelectorProps) => {
    return (
        <div
            className="grid grid-cols-2 gap-4"
            role="radiogroup"
            aria-label="Select visual style"
        >
            {STYLE_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    role="radio"
                    aria-checked={value === option.value}
                    onClick={() => onChange(option.value)}
                    disabled={disabled}
                    className={`flex flex-col items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${value === option.value
                            ? 'border-primary ring-2 ring-primary ring-offset-2'
                            : 'border-border hover:border-primary/50'
                        } ${disabled
                            ? 'cursor-not-allowed opacity-50'
                            : 'cursor-pointer hover:shadow-md'
                        }`}
                >
                    <div className="text-3xl">{option.icon}</div>
                    <div>
                        <div className="font-semibold text-foreground">{option.label}</div>
                        <div className="text-sm text-muted-foreground">
                            {option.description}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};
