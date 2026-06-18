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
    return { valid: false, error: 'Paste your story text to continue.', length };
  }
  if (length < STORY_MIN_LENGTH) {
    return {
      valid: false,
      error: `Minimum ${STORY_MIN_LENGTH} characters (${STORY_MIN_LENGTH - length} more needed).`,
      length,
    };
  }
  if (length > STORY_MAX_LENGTH) {
    return {
      valid: false,
      error: `Maximum ${STORY_MAX_LENGTH} characters (${length - STORY_MAX_LENGTH} over limit).`,
      length,
    };
  }

  return { valid: true, length };
}
