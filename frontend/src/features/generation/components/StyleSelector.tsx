import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { StoryStyle } from '../types';

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
}: StyleSelectorProps) => (
    <RadioGroup
        value={value ?? undefined}
        onValueChange={(next) => onChange(next as StoryStyle)}
        disabled={disabled}
        aria-label="Select visual style"
        className="grid grid-cols-2 gap-4"
    >
        {STYLE_OPTIONS.map((option) => {
            const id = `style-${option.value}`;
            return (
                <div key={option.value} className="relative">
                    <RadioGroupItem
                        id={id}
                        value={option.value}
                        aria-label={option.label}
                        className="peer sr-only"
                    />
                    <Label
                        htmlFor={id}
                        className={cn(
                            'flex flex-col items-start gap-3 rounded-lg border-2 border-border p-4 transition-all cursor-pointer',
                            'hover:border-primary/50 hover:shadow-md',
                            'peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary peer-data-[state=checked]:ring-offset-2',
                            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                        )}
                    >
                        <div className="text-3xl">{option.icon}</div>
                        <div>
                            <div className="font-semibold text-foreground">{option.label}</div>
                            <div className="text-sm text-muted-foreground">
                                {option.description}
                            </div>
                        </div>
                    </Label>
                </div>
            );
        })}
    </RadioGroup>
);
