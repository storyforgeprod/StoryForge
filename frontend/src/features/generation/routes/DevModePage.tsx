import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PipelineStage } from '../types';
import type { DevHandoffPayload } from '../hooks/useDevPresetHandoff';

const DEV_HANDOFF_STORAGE_KEY = 'devState';

type DevStage = PipelineStage | 'wizard';

const STAGES: { value: DevStage; label: string }[] = [
  { value: 'wizard', label: 'Wizard Completo' },
  { value: 'story', label: 'Historia' },
  { value: 'script', label: 'Guión' },
  { value: 'images', label: 'Imágenes' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
];

export const DevModePage = () => {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState<DevStage>('wizard');
  const [storyContent, setStoryContent] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const [imagesJobId, setImagesJobId] = useState('');
  const [audioJobId, setAudioJobId] = useState('');

  const handleJumpToStage = () => {
    if ((selectedStage === 'story' || selectedStage === 'video') && !storyContent.trim()) {
      toast.error('Por favor ingresa una historia');
      return;
    }
    if ((selectedStage === 'script' || selectedStage === 'video') && !scriptContent.trim()) {
      toast.error('Por favor ingresa contenido para el guión');
      return;
    }
    if ((selectedStage === 'images' || selectedStage === 'video') && !imagesJobId.trim()) {
      toast.error('Por favor ingresa un Job ID válido para imágenes');
      return;
    }
    if ((selectedStage === 'audio' || selectedStage === 'video') && !audioJobId.trim()) {
      toast.error('Por favor ingresa un Job ID válido para audio');
      return;
    }

    const payload: DevHandoffPayload = {
      story: storyContent,
      scriptContent:
        selectedStage === 'script' || selectedStage === 'video' ? scriptContent : '',
      imageJobId: selectedStage === 'images' || selectedStage === 'video' ? imagesJobId : '',
      audioJobId: selectedStage === 'audio' || selectedStage === 'video' ? audioJobId : '',
      devMode: true,
    };

    sessionStorage.setItem(DEV_HANDOFF_STORAGE_KEY, JSON.stringify(payload));
    navigate('/app');
  };

  const handleBack = () => {
    sessionStorage.removeItem(DEV_HANDOFF_STORAGE_KEY);
    navigate('/home');
  };

  const showStoryInput =
    selectedStage === 'story' ||
    selectedStage === 'wizard' ||
    selectedStage === 'script' ||
    selectedStage === 'video';
  const showScriptInput =
    selectedStage === 'script' || selectedStage === 'wizard' || selectedStage === 'video';
  const showImagesInput =
    selectedStage === 'images' || selectedStage === 'wizard' || selectedStage === 'video';
  const showAudioInput =
    selectedStage === 'audio' || selectedStage === 'wizard' || selectedStage === 'video';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={handleBack} className="text-primary">
            ← Volver
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Modo Desarrollador</h1>
          <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-semibold">
            Beta
          </span>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Saltar a Etapa del Pipeline
          </h2>

          <div className="mb-6 space-y-2">
            <Label htmlFor="dev-stage-select">Selecciona la etapa</Label>
            <Select
              value={selectedStage}
              onValueChange={(value) => setSelectedStage(value as DevStage)}
            >
              <SelectTrigger id="dev-stage-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showStoryInput && (
            <div className="mb-6 space-y-2">
              <Label htmlFor="dev-story">Historia</Label>
              <Textarea
                id="dev-story"
                value={storyContent}
                onChange={(e) => setStoryContent(e.target.value)}
                placeholder="Pega la historia aquí..."
                className="h-24 min-h-0"
              />
              <p className="text-xs text-muted-foreground">Mínimo 50 caracteres</p>
            </div>
          )}

          {showScriptInput && (
            <div className="mb-6 space-y-2">
              <Label htmlFor="dev-script">Guión (opcional para wizard)</Label>
              <Textarea
                id="dev-script"
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                placeholder="Pega el guión aquí (JSON o texto)..."
                className="h-24 min-h-0"
              />
              <p className="text-xs text-muted-foreground">
                Si lo dejas vacío, se generará automáticamente
              </p>
            </div>
          )}

          {showImagesInput && (
            <div className="mb-6 space-y-2">
              <Label htmlFor="dev-images-job">Job ID de Imágenes (opcional para wizard)</Label>
              <Input
                id="dev-images-job"
                value={imagesJobId}
                onChange={(e) => setImagesJobId(e.target.value)}
                placeholder="ej: job_abc123xyz..."
                type="text"
              />
              <p className="text-xs text-muted-foreground">
                Si lo dejas vacío, se generarán automáticamente
              </p>
            </div>
          )}

          {showAudioInput && (
            <div className="mb-6 space-y-2">
              <Label htmlFor="dev-audio-job">Job ID de Audio (opcional para wizard)</Label>
              <Input
                id="dev-audio-job"
                value={audioJobId}
                onChange={(e) => setAudioJobId(e.target.value)}
                placeholder="ej: job_abc123xyz..."
                type="text"
              />
              <p className="text-xs text-muted-foreground">
                Si lo dejas vacío, se generará automáticamente
              </p>
            </div>
          )}

          <div className="bg-secondary border border-border rounded-lg p-4 mb-6">
            <p className="text-sm text-secondary-foreground">
              <strong>ℹ️ Instrucciones:</strong>
              <br />
              • <strong>Wizard Completo:</strong> Ingresa historia y sigue todo el flujo normal
              <br />
              • <strong>Historia:</strong> Salta directamente al paso 1 (Historia)
              <br />
              • <strong>Guión:</strong> Completa historia y luego salta al guión (con o sin
              contenido preestablecido)
              <br />
              • <strong>Imágenes/Audio:</strong> Ingresa un Job ID para reutilizar trabajos
              existentes
            </p>
          </div>

          <Button onClick={handleJumpToStage} className="w-full">
            {selectedStage === 'wizard'
              ? 'Ir al Wizard'
              : `Saltar a ${STAGES.find((s) => s.value === selectedStage)?.label}`}
          </Button>
        </div>

        <div className="bg-secondary border border-border rounded-lg p-4">
          <p className="text-sm text-secondary-foreground">
            <strong>⚠️ Modo Dev:</strong> Esta funcionalidad es exclusiva para desarrolladores. Los
            cambios aquí no se guardan en la base de datos automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
};
