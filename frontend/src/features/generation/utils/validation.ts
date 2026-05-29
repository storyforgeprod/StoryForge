/** Aligned with backend GenerateScriptDto (generate-script.dto.ts) */
export const STORY_MIN_LENGTH = 50;
export const STORY_MAX_LENGTH = 5000;

export type StoryValidationResult = {
  valid: boolean;
  error?: string;
  length: number;
};

export function validateStory(raw: string): StoryValidationResult {
  const story = raw.trim();
  const length = story.length;

  if (length === 0) {
    return { valid: false, error: 'Pegá el texto de tu historia para continuar.', length };
  }
  if (length < STORY_MIN_LENGTH) {
    return {
      valid: false,
      error: `Mínimo ${STORY_MIN_LENGTH} caracteres (faltan ${STORY_MIN_LENGTH - length}).`,
      length,
    };
  }
  if (length > STORY_MAX_LENGTH) {
    return {
      valid: false,
      error: `Máximo ${STORY_MAX_LENGTH} caracteres (${length - STORY_MAX_LENGTH} de más).`,
      length,
    };
  }

  return { valid: true, length };
}
