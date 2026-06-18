import { Link } from 'react-router-dom';
import {
  Sun, Moon, FileText, Wand2, Mic, Download,
  Palette, Globe, Zap, ChevronDown, ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/layout/Brand';

// ── Decorative Visuals ────────────────────────────────────────────────────────

const ScriptVisual = () => (
  <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
    <div className="space-y-2.5">
      {[90, 75, 82, 65, 88, 70].map((w, i) => (
        <div key={i} className="h-2.5 rounded-full bg-elev" style={{ width: `${w}%` }} />
      ))}
    </div>
    <div className="mt-5 flex gap-2">
      <div className="h-7 w-20 rounded-lg bg-primary/80" />
      <div className="h-7 flex-1 rounded-lg bg-elev2" />
    </div>
  </div>
);

const ImageVisual = () => (
  <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-lg">
    <div className="grid grid-cols-2 gap-2">
      <div className="aspect-square rounded-lg bg-primary/20" />
      <div className="aspect-square rounded-lg bg-elev" />
      <div className="aspect-square rounded-lg bg-elev2" />
      <div className="aspect-square rounded-lg bg-primary/10" />
    </div>
  </div>
);

const VoiceVisual = () => (
  <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
    <div className="flex h-14 items-center justify-center gap-1">
      {[20, 45, 70, 55, 85, 60, 40, 75, 50, 30, 65, 80, 45, 55, 35].map((h, i) => (
        <div
          key={i}
          className="w-2 rounded-full bg-primary"
          style={{ height: `${h}%`, opacity: 0.4 + (h / 100) * 0.6 }}
        />
      ))}
    </div>
    <div className="mt-4 h-1.5 rounded-full bg-elev2">
      <div className="h-full w-2/3 rounded-full bg-primary" />
    </div>
  </div>
);

const VideoVisual = () => (
  <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-lg">
    <div className="relative aspect-video overflow-hidden rounded-lg bg-elev">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary bg-primary/20">
          <div className="ml-0.5 border-y-[8px] border-l-[14px] border-y-transparent border-l-primary" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-elev to-transparent" />
    </div>
    <div className="mt-3 flex gap-1.5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-8 flex-1 rounded bg-elev2" />
      ))}
    </div>
  </div>
);

const PhoneMockup = () => (
  <div className="relative w-[200px] sm:w-[240px]">
    <div
      className="relative overflow-hidden rounded-[32px] border-4 border-border bg-card shadow-2xl"
      style={{ aspectRatio: '9/18' }}
    >
      <div
        className="absolute inset-0 flex flex-col"
        style={{ background: 'linear-gradient(to bottom, var(--acc-soft), var(--card))' }}
      >
        <div className="m-3 flex-1 rounded-xl bg-elev" />
        <div className="mx-3 mb-2 space-y-1.5">
          <div className="h-2 w-3/4 rounded-full bg-bd2" />
          <div className="h-2 w-1/2 rounded-full bg-bd2" />
          <div className="h-2 w-2/3 rounded-full bg-bd2" />
        </div>
        <div className="mx-3 mb-3 flex gap-2">
          <div className="h-6 w-14 rounded-md bg-primary/70" />
          <div className="h-6 flex-1 rounded-md bg-elev2" />
        </div>
      </div>
    </div>
    <div className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-primary/10 blur-3xl" />
  </div>
);

// ── Data ─────────────────────────────────────────────────────────────────────

type Step = { n: string; Icon: LucideIcon; title: string; desc: string };

const STEPS: Step[] = [
  { n: '01', Icon: FileText, title: 'Paste your story',     desc: 'Drop any excerpt from your webtoon or novel.' },
  { n: '02', Icon: Wand2,    title: 'AI writes the script', desc: 'GPT-4.1 turns your text into punchy short-form narration.' },
  { n: '03', Icon: Mic,      title: 'Pick style & voice',   desc: 'Choose a visual style and an ElevenLabs narrator.' },
  { n: '04', Icon: Download, title: 'Download your Short',  desc: 'A vertical video, ready to upload.' },
];

const FEATURE_BLOCKS = [
  {
    tag: 'Script AI',
    headline: 'Your story, rewritten for video',
    desc: 'Azure GPT-4.1 adapts long-form text into tight, engaging narration optimized for short-form video.',
    Visual: ScriptVisual,
  },
  {
    tag: 'Image generation',
    headline: 'Scenes that match your story',
    desc: 'Azure Foundry generates scene images from your content, bringing panels to life without manual work.',
    Visual: ImageVisual,
  },
  {
    tag: 'Voice synthesis',
    headline: 'Professional narration, no microphone',
    desc: 'ElevenLabs voices deliver natural, expressive narration in multiple styles and languages.',
    Visual: VoiceVisual,
  },
  {
    tag: 'Video assembly',
    headline: 'From script to Short, automatically',
    desc: 'FFmpeg stitches images, narration, and captions into a vertical video ready to upload — no editing software needed.',
    Visual: VideoVisual,
  },
];

type Secondary = { Icon: LucideIcon; title: string; desc: string };

const SECONDARIES: Secondary[] = [
  { Icon: Palette, title: 'Multiple styles',    desc: 'Anime, manhwa, cinematic, sketch — pick the look that fits your story.' },
  { Icon: Globe,   title: 'Multiple languages', desc: 'Narration in English, Spanish, and more.' },
  { Icon: Zap,     title: 'Instant export',     desc: 'MP4 ready for YouTube Shorts, TikTok, and Reels.' },
];

const TECH_PILLS = ['Azure OpenAI', 'ElevenLabs', 'Azure Foundry', 'FFmpeg'] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* 1. Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Brand />
          <div className="hidden gap-6 md:flex">
            <a href="#features"     className="text-sm text-muted-foreground transition-colors hover:text-foreground">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How it works</a>
            <a href="#pricing"      className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {isAuthenticated ? (
              <Link
                to="/home"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-acc transition-opacity hover:opacity-90"
              >
                Go to app
              </Link>
            ) : (
              <Link
                to="/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-acc transition-opacity hover:opacity-90"
              >
                Get started
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* 2. Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, var(--acc-soft), transparent)' }}
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-acc-bd bg-acc-soft px-3 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span className="font-mono text-xs text-primary">AI-powered story videos</span>
            </div>
            <h1 className="font-head text-5xl font-extrabold leading-[1.05] tracking-[-0.04em] text-foreground md:text-6xl">
              Turn any story into a{' '}
              <span className="text-primary">viral Short.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              StoryForge uses AI to transform your webtoon, manhwa, or web novel into a narrated YouTube Short — in minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-acc transition-opacity hover:opacity-90"
              >
                Start for free <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-bd2 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-elev"
              >
                See how it works <ChevronDown className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* 3. Social Proof Bar */}
      <div className="border-y border-border bg-card py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-6">
          <span className="font-mono text-xs uppercase tracking-widest text-mut2">Powered by</span>
          {TECH_PILLS.map((name) => (
            <span key={name} className="text-sm font-medium text-muted-foreground">{name}</span>
          ))}
        </div>
      </div>

      {/* 4. Problem */}
      <section className="py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-head text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">
            Great stories deserve great reach.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Millions of readers love manga, manhwa, and web novels — but creators are stuck publishing text while video dominates feeds. StoryForge closes the gap.
          </p>
        </div>
      </section>

      {/* 5. How It Works */}
      <section id="how-it-works" className="bg-card py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-16 text-center font-head text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">
            From text to Short in 4 steps
          </h2>
          <div className="grid gap-6 md:grid-cols-4">
            {STEPS.map((step, idx) => (
              <div key={step.n} className="relative">
                {idx < STEPS.length - 1 && (
                  <div className="absolute left-[60%] right-0 top-8 hidden h-px bg-border md:block" />
                )}
                <div className="rounded-xl border border-border bg-background p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="font-head text-3xl font-extrabold text-primary">{step.n}</span>
                    <step.Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 font-head text-base font-bold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Features Deep-Dive */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-16 text-center font-head text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">
            Everything you need to go from page to feed
          </h2>
          <div className="space-y-24">
            {FEATURE_BLOCKS.map(({ tag, headline, desc, Visual }, idx) => (
              <div key={tag} className="grid items-center gap-12 lg:grid-cols-2">
                <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                  <span className="font-mono text-xs uppercase tracking-widest text-primary">{tag}</span>
                  <h3 className="mt-3 font-head text-2xl font-extrabold tracking-[-0.04em] text-foreground md:text-3xl">
                    {headline}
                  </h3>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{desc}</p>
                </div>
                <div className={`flex justify-center ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <Visual />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Feature Grid */}
      <section className="bg-card py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {SECONDARIES.map(({ Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-background p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-acc-soft">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-head text-lg font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA Banner */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-2xl border border-acc-bd bg-acc-soft p-12 text-center">
            <h2 className="font-head text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-4xl">
              Start converting your stories today.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join creators who are turning pages into plays.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-on-acc transition-opacity hover:opacity-90"
            >
              Create your first Short <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <Brand />
              <p className="mt-2 text-xs text-mut2">AI-powered story videos</p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <a href="#features"     className="transition-colors hover:text-foreground">Features</a>
              <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
              <Link to="/login"       className="transition-colors hover:text-foreground">Login</Link>
              <Link to="/register"    className="transition-colors hover:text-foreground">Register</Link>
            </div>
            <p className="text-xs text-mut2">© 2026 StoryForge</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
