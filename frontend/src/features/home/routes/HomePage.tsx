import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/features/auth";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectCard, type Project } from "@/features/projects";

const STATS = [
  { value: "4", label: "Projects" },
  { value: "3", label: "Renders left" },
  { value: "1", label: "Exported" },
];

const RECENT_PROJECTS: Project[] = [
  {
    id: "1",
    title: "The Office Plant's Revenge",
    style: "bold-comic",
    duration: 30,
    status: "draft",
    createdAt: "",
    output: null,
  },
  {
    id: "2",
    title: "Deep Sea Creatures",
    style: "manga-ink",
    duration: 45,
    status: "processing",
    createdAt: "",
    output: null,
  },
  {
    id: "3",
    title: "Coffee Shop Cat",
    style: "soft-cartoon",
    duration: 30,
    status: "completed",
    createdAt: "",
    output: null,
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.name || user?.email?.split("@")[0] || "creator";

  return (
    <AppShell crumb="Home">
      <div className="mx-auto max-w-[900px] px-6 pb-20 pt-11 sm:px-12">
        <h1 className="font-head text-[38px] font-extrabold leading-[1.05] tracking-[-0.04em]">
          Hola, <span className="text-primary">{displayName}</span>.
        </h1>
        <p className="mt-2.5 text-[15px] text-muted-foreground">
          Esto es lo que tenés en tu tablero.
        </p>

        <div className="mt-7 flex flex-wrap gap-3.5">
          {STATS.map((stat) => (
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
              Recientes
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {RECENT_PROJECTS.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isExpanded={false}
                onToggle={() => {}}
              />
            ))}
          </div>
        </section>

        <div className="mt-7">
          <button
            type="button"
            onClick={() => navigate("/app")}
            className="flex w-full items-center justify-between gap-5 rounded-xl border border-dashed border-bd2 px-6 py-5 text-left transition hover:border-primary"
          >
            <div>
              <div className="font-head text-[17px] font-extrabold">
                Crear un nuevo video
              </div>
              <div className="mt-1 text-[13px] text-muted-foreground">
                Convertí tu historia en un Short narrado, paso a paso.
              </div>
            </div>
            <ArrowRight className="h-5 w-5 flex-none text-primary" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
