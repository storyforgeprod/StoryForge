import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type BrandProps = {
  className?: string;
};

export const Brand = ({ className }: BrandProps) => (
  <span className={cn('flex items-center gap-2.5', className)}>
    <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-primary text-on-acc">
      <Sparkles className="h-4 w-4" />
    </span>
    <span className="font-head text-[17px] font-extrabold tracking-tight">storyForge</span>
  </span>
);
