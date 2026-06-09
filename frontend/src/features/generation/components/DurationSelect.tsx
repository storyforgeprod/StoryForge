import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const DURATION_OPTIONS = [
    { value: 30, label: '30 segundos' },
    { value: 45, label: '45 segundos' },
    { value: 60, label: '60 segundos' },
    { value: 90, label: '90 segundos' },
    { value: 120, label: '120 segundos' },
];

export type DurationSelectProps = {
    value: number;
    onChange: (value: number) => void;
};

export const DurationSelect = ({ value, onChange }: DurationSelectProps) => (
    <div className="space-y-1.5">
        <label className="text-sm font-medium">Duración</label>
        <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
            <SelectTrigger>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);
