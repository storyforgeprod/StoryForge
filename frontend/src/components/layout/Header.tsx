import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/home')}
            className="text-xl font-bold bg-brand-gradient bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            StoryForge
          </button>
        </div>
        <Button onClick={() => navigate('/home')} variant="outline" className="text-primary">
          Inicio
        </Button>
      </div>
    </header>
  );
};
