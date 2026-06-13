import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StyleThumb } from "@/features/generation";
import { cn } from "@/lib/utils";
import type { Project, ProjectStatus } from "../types";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "Draft",
  processing: "Processing…",
  completed: "Completed",
  failed: "Failed",
};

const STATUS_CLASS: Record<ProjectStatus, string> = {
  draft: "bg-elev text-mut2 border-border",
  processing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
};

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
};

export type ProjectCardProps = {
  project: Project;
  isExpanded: boolean;
  onToggle: () => void;
};

export const ProjectCard = ({
  project,
  isExpanded,
  onToggle,
}: ProjectCardProps) => {
  const canExpand = project.status === "completed" && project.output !== null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        canExpand && "transition hover:-translate-y-[3px] hover:border-bd2",
      )}
    >
      <button
        type="button"
        onClick={canExpand ? onToggle : undefined}
        tabIndex={canExpand ? undefined : -1}
        className={cn(
          "w-full text-left",
          canExpand ? "cursor-pointer" : "cursor-default",
        )}
        aria-expanded={canExpand ? isExpanded : undefined}
        aria-label={
          canExpand
            ? isExpanded
              ? "Collapse video panel"
              : "Expand video panel"
            : undefined
        }
      >
        <div className="relative aspect-[9/16] max-h-[180px] overflow-hidden">
          <StyleThumb
            style={project.style}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="px-4 py-3.5">
          <p className="text-sm font-bold leading-tight">{project.title}</p>
          <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-mut2">
            {project.style}
          </p>
          <div className="mt-2.5 flex items-center justify-between">
            <span
              className={cn(
                "rounded-full border px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.06em]",
                STATUS_CLASS[project.status],
              )}
            >
              {STATUS_LABEL[project.status]}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] text-mut2">
                {formatDuration(project.duration)}
              </span>
              {canExpand &&
                (isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-mut2" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-mut2" />
                ))}
            </div>
          </div>
        </div>
      </button>

      {isExpanded && project.output && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <video
            controls
            src={project.output.videoUrl}
            className="w-full rounded-lg max-h-[400px]"
          />
          <a href={project.output.videoUrl} download className="mt-3 block">
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Download className="h-3.5 w-3.5" />
              Download video
            </Button>
          </a>
          {project.output.duration !== null && (
            <p className="mt-2 text-center font-mono text-[10.5px] text-mut2">
              {formatDuration(project.output.duration)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
