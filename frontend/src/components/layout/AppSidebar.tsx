import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, FolderOpen, Plus, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/app/providers/ThemeProvider';
import { Brand } from './Brand';
import { cn } from '@/lib/utils';

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  accent?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: '/home', label: 'Home', icon: <Home className="h-4 w-4" /> },
  { to: '/projects', label: 'Projects', icon: <FolderOpen className="h-4 w-4" /> },
  { to: '/app', label: 'New project', icon: <Plus className="h-4 w-4" />, accent: true },
];

export type AppSidebarProps = {
  /** Optional sub-step navigation rendered under "New project" (create flow). */
  steps?: ReactNode;
};

export const AppSidebar = ({ steps }: AppSidebarProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden w-[236px] flex-none flex-col border-r border-border bg-card md:flex">
      <div className="border-b border-border px-[18px] py-5">
        <Brand />
      </div>

      <nav className="flex flex-1 flex-col gap-px overflow-y-auto p-2">
        <p className="px-2.5 pb-1.5 pt-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-mut2">
          Workspace
        </p>
        {NAV_ITEMS.map((item) => (
          <div key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex w-full items-center gap-2.5 rounded-sm px-[11px] py-2.5 text-left text-[13.5px] font-semibold transition-colors',
                  isActive
                    ? 'bg-acc-soft text-foreground [&_svg]:text-primary'
                    : 'text-muted-foreground hover:bg-elev hover:text-foreground',
                  item.accent && !isActive && 'text-primary',
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
            {item.to === '/app' && steps}
          </div>
        ))}
      </nav>

      <div className="flex flex-col gap-3 p-3">
        <div className="rounded-lg border border-border bg-background p-3.5">
          <p className="text-[13px] font-bold">3 free renders left</p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            Go Pro for 4K &amp; no watermark.
          </p>
          <div className="my-2.5 h-[5px] overflow-hidden rounded-full bg-elev2">
            <span className="block h-full w-[35%] rounded-full bg-primary" />
          </div>
          <button
            type="button"
            className="w-full rounded-sm border border-acc-bd bg-acc-soft py-2 text-[13px] font-bold text-primary transition hover:brightness-110"
          >
            Upgrade
          </button>
        </div>

        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="grid h-9 w-9 place-items-center rounded-sm border border-border text-muted-foreground transition hover:border-bd2 hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="h-[17px] w-[17px]" /> : <Moon className="h-[17px] w-[17px]" />}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-[13px] font-semibold text-muted-foreground transition hover:border-bd2 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
};
