import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const SCENES_OPTIONS = [
    { value: 3, label: '3 escenas' },
    { value: 5, label: '5 escenas' },
    { value: 7, label: '7 escenas' },
    { value: 10, label: '10 escenas' },
    { value: 12, label: '12 escenas' },
];

export type ScenesSelectProps = {
    value: number;
    onChange: (value: number) => void;
};

export const ScenesSelect = ({ value, onChange }: ScenesSelectProps) => (
    <div className="space-y-1.5">
        <label className="text-sm font-medium">Escenas</label>
        <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
            <SelectTrigger>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {SCENES_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);
