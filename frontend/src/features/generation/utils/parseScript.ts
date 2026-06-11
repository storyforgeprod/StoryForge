export type ParsedScene = {
  index: number;
  narration: string;
  onScreen: string;
  duration: number;
};

export function parseScenes(script: string): ParsedScene[] {
  const scenes: ParsedScene[] = [];
  const blocks = script.split(/(?=^Scene\s+\d+:)/mi);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const headerMatch = trimmed.match(/^Scene\s+(\d+):\s*(.+?)(?:\s*\((\d+)s\))?$/im);
    if (!headerMatch) continue;
    const index = parseInt(headerMatch[1], 10);
    const narration = headerMatch[2].trim().replace(/^\[|\]$/g, '').trim();
    const duration = headerMatch[3] ? parseInt(headerMatch[3], 10) : 0;
    const soundMatch = trimmed.match(/\[Sound:\s*(.+?)\]/i);
    const onScreen = soundMatch ? soundMatch[1].trim() : '';
    scenes.push({ index, narration, onScreen, duration });
  }

  if (scenes.length === 0) {
    const paragraphs = script.split(/\n{2,}/).filter((p) => p.trim());
    return paragraphs.slice(0, 12).map((p, i) => ({
      index: i + 1,
      narration: p.trim().split('\n')[0].slice(0, 200),
      onScreen: '',
      duration: 0,
    }));
  }

  return scenes;
}
