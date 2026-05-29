import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { PipelineStage } from '@/features/generation/types';

const STAGES_ORDER: PipelineStage[] = ['story', 'script', 'images', 'audio', 'video'];

interface PipelineNavigationProps {
  currentStage: PipelineStage;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
}

export function PipelineNavigation({
  currentStage,
  onPrevious,
  onNext,
  canGoNext = true,
  canGoPrevious = true,
}: PipelineNavigationProps) {
  const navigate = useNavigate();
  const currentIndex = STAGES_ORDER.indexOf(currentStage);

  const handlePrevious = () => {
    if (currentIndex === 0) {
      navigate('/home');
    } else if (onPrevious) {
      onPrevious();
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    }
  };

  const stageLabels: Record<PipelineStage, string> = {
    story: 'Historia',
    script: 'Guión',
    images: 'Imágenes',
    audio: 'Audio',
    video: 'Video',
  };

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <Button
        onClick={handlePrevious}
        variant="outline"
        disabled={!canGoPrevious}
        className="flex-1"
      >
        ← Anterior
      </Button>

      <div className="text-center flex-2">
        <p className="text-sm text-gray-600">Etapa {currentIndex + 1} de 5</p>
        <p className="font-semibold text-gray-900">{stageLabels[currentStage]}</p>
      </div>

      <Button
        onClick={handleNext}
        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        disabled={!canGoNext}
      >
        Siguiente →
      </Button>
    </div>
  );
}
