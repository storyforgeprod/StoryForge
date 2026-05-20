import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    'Usuario';

  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-[160px] truncate text-sm text-muted-foreground sm:inline">
        {displayName}
      </span>
      <Button type="button" variant="outline" size="sm" onClick={() => signOut()}>
        <LogOut className="h-4 w-4" />
        Salir
      </Button>
    </div>
  );
}
