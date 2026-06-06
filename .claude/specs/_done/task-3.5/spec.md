# Task 3.5 — Story Input + Validation

## What was built
`StoryInput` component with textarea, character counter, and validation. Validation rules (50–5000 chars) aligned with backend GenerateScriptDto. Integrated into Generate.tsx as step 1 of the generation form.

## Acceptance criteria

- The system SHALL accept story text between 50 and 5000 characters (after trim)
- The system SHALL display a real-time character counter
- The system SHALL show validation errors after the field loses focus (blur) or when "Continuar" is submitted
- The system SHALL disable the "Continuar" button until the story text is valid
- The system SHALL use the same 50–5000 char rule as the backend GenerateScriptDto

## Dependencies
- Task 3.1 (Frontend scaffold + shadcn/ui textarea)
- Task 3.3 (Generate.tsx page exists)
