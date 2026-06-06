import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { StyleThumb } from './StyleThumb';
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
};

const STYLE_OPTIONS: StyleOption[] = [
    {
        value: 'anime',
        label: 'Anime',
        description: 'Colores vibrantes, expresión dramática',
    },
    {
        value: 'manga',
        label: 'Manga',
        description: 'Blanco y negro, alto contraste',
    },
    {
        value: 'novel',
        label: 'Novela',
        description: 'Ilustración detallada, cinematográfico',
    },
    {
        value: 'webtoon',
        label: 'Webtoon',
        description: 'Paleta suave, scroll vertical',
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
        className="grid grid-cols-2 gap-4 sm:grid-cols-3"
    >
        {STYLE_OPTIONS.map((option) => {
            const id = `style-${option.value}`;
            const checked = value === option.value;
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
                            'block cursor-pointer overflow-hidden rounded-xl border bg-card transition-all',
                            'hover:-translate-y-0.5 hover:border-bd2',
                            checked
                                ? 'border-primary shadow-[0_0_0_1px_var(--primary)]'
                                : 'border-border',
                            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                        )}
                    >
                        <div className="relative aspect-[4/3] overflow-hidden">
                            <StyleThumb style={option.value} className="h-full w-full object-cover" />
                            <span
                                className={cn(
                                    'absolute right-2.5 top-2.5 grid h-[26px] w-[26px] place-items-center rounded-full bg-primary text-on-acc transition-all',
                                    checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
                                )}
                            >
                                <Check className="h-[15px] w-[15px]" />
                            </span>
                        </div>
                        <div className="px-4 py-3">
                            <div className="text-[14.5px] font-bold text-foreground">{option.label}</div>
                            <div className="mt-0.5 text-[12.5px] text-mut2">{option.description}</div>
                        </div>
                    </Label>
                </div>
            );
        })}
    </RadioGroup>
);
