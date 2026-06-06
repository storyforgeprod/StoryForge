import type { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

export type AppShellProps = {
  children: ReactNode;
  /** Mono breadcrumb shown at the bottom of the main area, e.g. "CREATE / VIDEO". */
  crumb?: string;
  /** Optional create-flow step navigation injected into the sidebar. */
  steps?: ReactNode;
};

export const AppShell = ({ children, crumb, steps }: AppShellProps) => (
  <div className="flex h-screen overflow-hidden bg-background">
    <AppSidebar steps={steps} />
    <div className="flex min-w-0 flex-1 flex-col">
      <main className="flex-1 overflow-y-auto">{children}</main>
      {crumb && (
        <div className="flex-none px-8 py-3 font-mono text-[11px] uppercase tracking-[0.06em] text-mut2">
          {crumb}
        </div>
      )}
    </div>
  </div>
);
