import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/features/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ProjectCard, useProjects } from "@/features/projects";

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, refresh } = useProjects();
  const displayName = user?.name || user?.email?.split("@")[0] || "creator";

  const projects = state.phase === "success" ? state.projects : null;
  const totalStr = projects !== null ? String(projects.length) : "—";
  const exportedStr =
    projects !== null
      ? String(projects.filter((p) => p.status === "completed").length)
      : "—";
  const recentProjects = projects !== null ? projects.slice(0, 3) : [];

  const statsItems = [
    { value: totalStr, label: "Projects" },
    { value: exportedStr, label: "Exported" },
  ];

  return (
    <AppShell crumb="Home">
      <div className="mx-auto max-w-[900px] px-6 pb-20 pt-11 sm:px-12">
        <h1 className="font-head text-[38px] font-extrabold leading-[1.05] tracking-[-0.04em]">
          Hello, <span className="text-primary">{displayName}</span>.
        </h1>
        <p className="mt-2.5 text-[15px] text-muted-foreground">
          Here is what you have on your dashboard.
        </p>

        <div className="mt-7 flex flex-wrap gap-3.5">
          {statsItems.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-card px-5 py-3.5"
            >
              <div className="font-head text-[30px] font-extrabold tracking-[-0.04em]">
                {stat.value}
              </div>
              <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.07em] text-mut2">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <section className="mt-11">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-head text-[20px] font-extrabold tracking-[-0.025em]">
              Recent
            </h2>
          </div>

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

          {state.phase === "success" && recentProjects.length > 0 && (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {recentProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isExpanded={false}
                  onToggle={() => {}}
                />
              ))}
            </div>
          )}
        </section>

        <div className="mt-7">
          <button
            type="button"
            onClick={() => navigate("/app")}
            className="flex w-full items-center justify-between gap-5 rounded-xl border border-dashed border-bd2 px-6 py-5 text-left transition hover:border-primary"
          >
            <div>
              <div className="font-head text-[17px] font-extrabold">
                Create a new video
              </div>
              <div className="mt-1 text-[13px] text-muted-foreground">
                Turn your story into a narrated Short, step by step.
              </div>
            </div>
            <ArrowRight className="h-5 w-5 flex-none text-primary" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
