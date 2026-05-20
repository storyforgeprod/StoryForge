---
name: storyforge-frontend
description: "Frontend development standards for StoryForge. Always activate when the user asks to create or modify frontend code: React components, pages, custom hooks, Tailwind styles, forms, loading/error states, or any .tsx file. Also activate if the user says 'build the X component', 'create the Y screen', 'add the hook for Z', 'show the loading state', or any UI task even if React or TypeScript are not explicitly mentioned."
---

# StoryForge — Frontend Code Standards

## Folder structure

```
src/
├── pages/          ← Component composition only (no business logic)
├── components/
│   ├── Input/
│   ├── Selectors/
│   └── common/     ← Button, Modal, Loader
└── hooks/          ← Custom hooks with reusable logic
```

---

## File naming

- Components: `ComponentName.tsx` (PascalCase)
- Hooks: `useHookName.ts` (camelCase, `use` prefix mandatory)
- Types: `name.types.ts` or `types.ts`
- Utils: `utilName.util.ts`
- Pages: `PageName.tsx` (PascalCase, lives in `pages/`)

---

## Typed component (mandatory pattern)

Do **not** use `FC` — type props inline and return JSX directly.

```typescript
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
}

export const TextInput = ({
  value,
  onChange,
  maxLength = 5000,
  placeholder = 'Paste your story here...',
}: TextInputProps) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    maxLength={maxLength}
    placeholder={placeholder}
    className="w-full h-64 p-4 border rounded-lg resize-none"
    aria-label={placeholder}
  />
);
```

---

## Custom Hook (mandatory pattern for API calls)

```typescript
type State = 'idle' | 'loading' | 'success' | 'error';

export const useGenerate = () => {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  const generate = async (text: string, style: string) => {
    if (!text || text.trim().length < 300) {
      setError('Minimum 300 characters required');
      return;
    }
    try {
      setState('loading');
      setError(null);
      const result = await api.post('/generate/script', { text, style });
      setState('success');
      return result;
    } catch (err) {
      setError(err.message);
      setState('error');
    }
  };

  return { state, error, generate };
};
```

---

## Mandatory UI states

Every component that calls the API must handle all 4 states:

```tsx
const { state, error, generate } = useGenerate();

{state === 'loading' && <Loader />}
{state === 'error' && <ErrorMessage message={error} />}
{state === 'success' && <ResultView />}
{state === 'idle' && <Form onSubmit={generate} />}
```

---

## Testing (Vitest + React Testing Library)

```typescript
// ComponentName.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextInput } from './TextInput';

describe('TextInput', () => {
  it('calls onChange when user types', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<TextInput value="" onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'test');

    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('respects maxLength', () => {
    render(<TextInput value="" onChange={vi.fn()} maxLength={10} />);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).maxLength).toBe(10);
  });
});
```

One test file per component. Cover: happy path + edge case minimum.

---

## Checklist before submitting frontend code

- [ ] Props typed with a dedicated `interface`, destructured in the function signature
- [ ] No `FC` — components are plain typed functions
- [ ] Local validation before calling the API
- [ ] `idle / loading / error / success` states implemented
- [ ] Tailwind classes (no inline styles)
- [ ] Responsive with `md:` or `lg:` classes where needed
- [ ] `aria-label` on inputs without a visible label
- [ ] Logic in custom hooks, not inside the component
- [ ] Named export (`export const X`), no default export on components

---

## Event tracking (PostHog)

```typescript
import posthog from 'posthog-js';

posthog.capture('video_generated', {
  style: 'manhwa',
  duration_ms: elapsed,
  user_id: user.id,
});
```

---

## Never do

- ❌ `FC` or `React.FC` — use plain typed functions instead
- ❌ Untyped props: `const Component = (props) => ...`
- ❌ Default export on components
- ❌ Calling the API directly inside the component (use a hook)
- ❌ Inline styles: `style={{ color: 'red' }}`
- ❌ API keys or tokens in code: always use `import.meta.env.VITE_X`
- ❌ `console.log(user)` — may expose tokens or sensitive data
- ❌ Skipping the error state