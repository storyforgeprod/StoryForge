import type { ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { StyleThumb, type StoryStyle } from '@/features/generation';
import { Brand } from '@/components/layout/Brand';
import { useTheme } from '@/app/providers/ThemeProvider';

const SHOWCASE_SCENES: { style: StoryStyle; caption: string }[] = [
  { style: 'bold-comic',   caption: 'Wait for it...' },
  { style: 'soft-cartoon', caption: 'The reason' },
  { style: 'storybook',    caption: 'Do this' },
];

type AuthLayoutProps = {
  children: ReactNode;
};

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* Showcase */}
      <aside className="relative hidden w-[46%] max-w-[560px] flex-none flex-col justify-between overflow-hidden border-r border-border bg-card px-12 py-12 lg:flex">
        <div
          className="pointer-events-none absolute -right-40 -top-44 h-[520px] w-[520px] rounded-full opacity-[0.18]"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 64%)' }}
        />
        <div className="relative">
          <Brand />
        </div>
        <div className="relative">
          <h2 className="font-head text-[48px] font-extrabold leading-[1.04] tracking-[-0.04em]">
            Every idea
            <br />
            deserves a<br />
            <span className="text-primary">spotlight.</span>
          </h2>
          <div className="mt-8 flex gap-3">
            {SHOWCASE_SCENES.map((scene, i) => (
              <div
                key={scene.caption}
                className="relative aspect-[9/16] max-w-[104px] flex-1 overflow-hidden rounded-lg border border-border"
              >
                <StyleThumb style={scene.style} n={i} caption={scene.caption} className="h-full w-full" />
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-[13px] text-muted-foreground">
          <span className="font-semibold text-foreground">40,000+</span> creators making shorts faster.
        </p>
      </aside>

      {/* Form */}
      <main className="flex min-w-0 flex-1 items-center justify-center overflow-y-auto px-7 py-10">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          className="absolute right-6 top-5 grid h-9 w-9 place-items-center rounded-sm border border-border text-muted-foreground transition hover:border-bd2 hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-[17px] w-[17px]" /> : <Moon className="h-[17px] w-[17px]" />}
        </button>
        <div className="w-full max-w-[392px]">{children}</div>
      </main>
    </div>
  );
};
