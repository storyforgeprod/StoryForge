import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectCard } from "../components/ProjectCard";
import { useProjects } from "../hooks/useProjects";

export const ProjectsPage = () => {
  const { state, refresh } = useProjects();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <AppShell crumb="Projects">
      <div className="mx-auto max-w-[900px] px-6 pb-20 pt-11 sm:px-12">
        <header className="mb-7 flex items-end justify-between">
          <div>
            <h1 className="font-head text-[34px] font-extrabold tracking-tight">
              Projects
            </h1>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground">
              Todos tus shorts en un solo lugar.
            </p>
          </div>
        </header>

        {state.phase === "loading" && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {state.phase === "error" && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-10 text-center">
            <p className="mb-4 text-sm text-destructive">{state.message}</p>
            <Button variant="outline" size="sm" onClick={refresh}>
              Retry
            </Button>
          </div>
        )}

        {state.phase === "success" && state.projects.length === 0 && (
          <div className="rounded-xl border border-dashed border-bd2 py-16 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              Todavía no tenés proyectos. ¡Creá uno!
            </p>
            <Button size="sm" onClick={() => navigate("/app")}>
              Create your first story
            </Button>
          </div>
        )}

        {state.phase === "success" && state.projects.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isExpanded={expandedId === project.id}
                onToggle={() => handleToggle(project.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
