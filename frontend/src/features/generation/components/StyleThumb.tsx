import type { StoryStyle } from '../types';
import boldComic from '@/assets/styles/bold-comic.png';
import softCartoon from '@/assets/styles/soft-cartoon.png';
import retroPop from '@/assets/styles/retro-pop.png';
import mangaInk from '@/assets/styles/manga-ink.png';
import storybook from '@/assets/styles/storybook.png';
import toon3d from '@/assets/styles/3D-toon.png';

const STYLE_IMAGE: Record<StoryStyle, string> = {
  'bold-comic':   boldComic,
  'soft-cartoon': softCartoon,
  'retro-pop':    retroPop,
  'manga-ink':    mangaInk,
  'storybook':    storybook,
  '3d-toon':      toon3d,
};

export type StyleThumbProps = {
  style: StoryStyle;
  n?: number;
  caption?: string;
  className?: string;
};

export const StyleThumb = ({ style, caption, className }: StyleThumbProps) => (
  <div className="relative h-full w-full">
    <img
      src={STYLE_IMAGE[style]}
      alt={style}
      className={className ?? 'h-full w-full object-cover'}
    />
    {caption && (
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
        <span className="block truncate text-center text-[7.5px] font-bold text-white">{caption}</span>
      </div>
    )}
  </div>
);
