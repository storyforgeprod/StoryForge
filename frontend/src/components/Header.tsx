import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/home')}
            className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            StoryForge
          </button>
        </div>
        <Button
          onClick={() => navigate('/home')}
          variant="outline"
          className="text-purple-600 border-purple-200"
        >
          Inicio
        </Button>
      </div>
    </header>
  );
}
