import { AppShell } from '@/components/layout/AppShell';
import { ProjectCard } from '../components/ProjectCard';
import type { Project } from '../types';

const PROJECTS_PLACEHOLDER: Project[] = [
  { id: '1', title: "The Office Plant's Revenge", style: 'bold-comic',   durationSec: 30, status: 'draft' },
  { id: '2', title: 'Deep Sea Creatures',          style: 'manga-ink',    durationSec: 45, status: 'ready' },
  { id: '3', title: 'Coffee Shop Cat',             style: 'soft-cartoon', durationSec: 30, status: 'exported' },
  { id: '4', title: 'The Weather Baker',           style: 'storybook',    durationSec: 60, status: 'draft' },
];

export const ProjectsPage = () => (
  <AppShell crumb="Projects">
    <div className="mx-auto max-w-[900px] px-6 pb-20 pt-11 sm:px-12">
      <header className="mb-7 flex items-end justify-between">
        <div>
          <h1 className="font-head text-[34px] font-extrabold tracking-tight">Projects</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            Todos tus shorts en un solo lugar.
          </p>
        </div>
      </header>

      {PROJECTS_PLACEHOLDER.length === 0 ? (
        <div className="rounded-xl border border-dashed border-bd2 py-16 text-center text-muted-foreground">
          Todavía no tenés proyectos. ¡Creá uno!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS_PLACEHOLDER.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  </AppShell>
);
