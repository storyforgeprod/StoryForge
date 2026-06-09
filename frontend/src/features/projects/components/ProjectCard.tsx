import { StyleThumb } from '@/features/generation';
import { cn } from '@/lib/utils';
import type { Project, ProjectStatus } from '../types';

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: 'Draft',
  ready: 'Ready',
  exported: 'Exported',
};

const STATUS_CLASS: Record<ProjectStatus, string> = {
  draft: 'bg-elev text-mut2 border-border',
  ready: 'bg-acc-soft text-primary border-acc-bd',
  exported: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
};

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
};

export type ProjectCardProps = {
  project: Project;
};

export const ProjectCard = ({ project }: ProjectCardProps) => (
  <button
    type="button"
    className="w-full overflow-hidden rounded-xl border border-border bg-card text-left transition hover:-translate-y-[3px] hover:border-bd2"
  >
    <div className="relative aspect-[9/16] max-h-[180px] overflow-hidden">
      <StyleThumb style={project.style} className="h-full w-full object-cover" />
    </div>
    <div className="px-4 py-3.5">
      <p className="text-sm font-bold leading-tight">{project.title}</p>
      <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-mut2">
        {project.style}
      </p>
      <div className="mt-2.5 flex items-center justify-between">
        <span
          className={cn(
            'rounded-full border px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.06em]',
            STATUS_CLASS[project.status],
          )}
        >
          {STATUS_LABEL[project.status]}
        </span>
        <span className="text-[11.5px] text-mut2">{formatDuration(project.durationSec)}</span>
      </div>
    </div>
  </button>
);
