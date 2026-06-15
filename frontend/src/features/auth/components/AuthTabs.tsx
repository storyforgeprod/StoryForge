import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type AuthTabsProps = {
  active: 'login' | 'register';
};

const tabClass = (isActive: boolean) =>
  cn(
    'flex-1 rounded-full py-2.5 text-center text-[13.5px] font-bold transition-colors',
    isActive
      ? 'bg-primary text-on-acc shadow-[0_8px_18px_-10px_var(--primary)]'
      : 'text-muted-foreground hover:text-foreground',
  );

export const AuthTabs = ({ active }: AuthTabsProps) => (
  <div className="my-6 flex gap-1 rounded-full border border-border bg-elev p-1">
    <Link to="/login" className={tabClass(active === 'login')}>
      Log in
    </Link>
    <Link to="/register" className={tabClass(active === 'register')}>
      Sign up
    </Link>
  </div>
);
