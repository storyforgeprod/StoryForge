import { useId, useMemo, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  STORY_MAX_LENGTH,
  STORY_MIN_LENGTH,
  validateStory,
} from '../utils/validation';

export type StoryInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Show error after blur or when true (e.g. submit attempted) */
  showErrors?: boolean;
  className?: string;
};

export function StoryInput({
  value,
  onChange,
  disabled = false,
  showErrors = false,
  className,
}: StoryInputProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const [touched, setTouched] = useState(false);

  const validation = useMemo(() => validateStory(value), [value]);
  const displayError = (showErrors || touched) && !validation.valid;
  const charCount = value.trim().length;

  const counterTone =
    charCount > STORY_MAX_LENGTH
      ? 'text-destructive'
      : charCount >= STORY_MIN_LENGTH
        ? 'text-green-500'
        : 'text-muted-foreground';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-end justify-between gap-2">
        <Label htmlFor={id}>Story text</Label>
        <span className={cn('text-xs tabular-nums', counterTone)} aria-live="polite">
          {charCount} / {STORY_MAX_LENGTH}
        </span>
      </div>

      <Textarea
        id={id}
        value={value}
        disabled={disabled}
        placeholder="Paste here the synopsis or a chapter of your manhwa, webtoon, or novel…"
        maxLength={STORY_MAX_LENGTH + 200}
        aria-invalid={displayError}
        aria-describedby={displayError ? `${hintId} ${errorId}` : hintId}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        className={cn(displayError && 'border-destructive focus-visible:ring-destructive')}
      />

      <p id={hintId} className="text-xs text-muted-foreground">
        Between {STORY_MIN_LENGTH} and {STORY_MAX_LENGTH} characters. Ideal: a chapter or synopsis with enough context for the script.
      </p>

      {displayError && validation.error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {validation.error}
        </p>
      )}
    </div>
  );
}

export { validateStory };
