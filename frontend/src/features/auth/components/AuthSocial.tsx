import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Decorative social sign-in row from the prototype. Disabled for now: the
 * frontend has no OAuth handler wired, so these are visual placeholders.
 */
export const AuthSocial = () => (
  <>
    <div className="my-6 flex items-center gap-3 text-xs lowercase text-mut2">
      <span className="h-px flex-1 bg-border" />
      or continue with
      <span className="h-px flex-1 bg-border" />
    </div>
    <div className="grid grid-cols-2 gap-2.5">
      <Button type="button" variant="outline" disabled className="gap-2">
        <span className="grid h-[19px] w-[19px] place-items-center rounded-full bg-foreground font-head text-[13px] font-extrabold text-background">
          G
        </span>
        Google
      </Button>
      <Button type="button" variant="outline" disabled className="gap-2">
        <KeyRound className="h-[17px] w-[17px]" />
        SSO
      </Button>
    </div>
  </>
);
