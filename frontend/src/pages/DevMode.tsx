import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PipelineStage } from '@/types/pipeline';

const STAGES: { value: PipelineStage; label: string }[] = [
  { value: 'story', label: 'Historia' },
  { value: 'script', label: 'Guión' },
  { value: 'images', label: 'Imágenes' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
];

export function DevMode() {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState<PipelineStage>('story');
  const [content, setContent] = useState('');
  const [jobId, setJobId] = useState('');

  const handleJumpToStage = () => {
    if (!content && selectedStage !== 'story') {
      alert('Por favor ingresa contenido o un Job ID');
      return;
    }

    // Guardar en session storage para que Generate.tsx lo lea
    const devState = {
      stage: selectedStage,
      story: selectedStage === 'story' ? content : '',
      scriptContent: selectedStage === 'script' ? content : '',
      imageJobId: selectedStage === 'images' ? jobId : '',
      audioJobId: selectedStage === 'audio' ? jobId : '',
      videoJobId: selectedStage === 'video' ? jobId : '',
      devMode: true,
    };

    sessionStorage.setItem('devState', JSON.stringify(devState));
    navigate('/app');
  };

  const handleBack = () => {
    sessionStorage.removeItem('devState');
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={handleBack} className="text-indigo-600 hover:text-indigo-700">
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-indigo-900">Modo Desarrollador</h1>
          <span className="bg-indigo-200 text-indigo-900 px-3 py-1 rounded-full text-sm font-semibold">
            Beta
          </span>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Saltar a Etapa del Pipeline</h2>

          {/* Stage Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecciona la etapa
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {STAGES.map((stage) => (
                <button
                  key={stage.value}
                  onClick={() => {
                    setSelectedStage(stage.value);
                    setContent('');
                    setJobId('');
                  }}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedStage === stage.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Section */}
          {selectedStage === 'story' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingresa tu historia
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe la historia aquí..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          )}

          {selectedStage === 'script' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingresa el guión (JSON o texto)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Pega el guión aquí..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          )}

          {['images', 'audio', 'video'].includes(selectedStage) && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingresa el Job ID {selectedStage === 'images' && '(de imágenes)'}
                {selectedStage === 'audio' && '(de audio)'}
                {selectedStage === 'video' && '(de video)'}
              </label>
              <Input
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="ej: job_abc123xyz..."
                type="text"
              />
            </div>
          )}

          {/* Preset Info */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-indigo-900">
              <strong>Usar Preset:</strong> Después de ingresar el contenido, presiona "Saltar a Etapa". 
              El sistema validará que el contenido sea válido.
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleJumpToStage}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Saltar a {STAGES.find((s) => s.value === selectedStage)?.label}
          </Button>
        </div>

        {/* Safety Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-900">
            <strong>⚠️ Modo Dev:</strong> Esta funcionalidad es exclusiva para desarrolladores. 
            Los cambios aquí no se guardan en la base de datos automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
