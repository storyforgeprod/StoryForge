import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PipelineStage } from '../types';

const STAGES: { value: PipelineStage | 'wizard'; label: string }[] = [
  { value: 'wizard', label: 'Wizard Completo' },
  { value: 'story', label: 'Historia' },
  { value: 'script', label: 'Guión' },
  { value: 'images', label: 'Imágenes' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
];

export function DevModePage() {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState<PipelineStage | 'wizard'>('wizard');
  const [storyContent, setStoryContent] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const [imagesJobId, setImagesJobId] = useState('');
  const [audioJobId, setAudioJobId] = useState('');

  const handleJumpToStage = () => {
    // Validate based on stage
    if ((selectedStage === 'story' || selectedStage === 'video') && !storyContent.trim()) {
      alert('Por favor ingresa una historia');
      return;
    }
    
    if ((selectedStage === 'script' || selectedStage === 'video') && !scriptContent.trim()) {
      alert('Por favor ingresa contenido para el guión');
      return;
    }
    
    if ((selectedStage === 'images' || selectedStage === 'video') && !imagesJobId.trim()) {
      alert('Por favor ingresa un Job ID válido para imágenes');
      return;
    }
    
    if ((selectedStage === 'audio' || selectedStage === 'video') && !audioJobId.trim()) {
      alert('Por favor ingresa un Job ID válido para audio');
      return;
    }

    // Guardar en session storage para que Generate.tsx lo lea
    const devState = {
      story: storyContent,
      scriptContent: (selectedStage === 'script' || selectedStage === 'video') ? scriptContent : '',
      imageJobId: (selectedStage === 'images' || selectedStage === 'video') ? imagesJobId : '',
      audioJobId: (selectedStage === 'audio' || selectedStage === 'video') ? audioJobId : '',
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {STAGES.map((stage) => (
                <button
                  key={stage.value}
                  onClick={() => {
                    setSelectedStage(stage.value as any);
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

          {/* Story Input */}
          {(selectedStage === 'story' || selectedStage === 'wizard' || selectedStage === 'script' || selectedStage === 'video') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Historia
              </label>
              <textarea
                value={storyContent}
                onChange={(e) => setStoryContent(e.target.value)}
                placeholder="Pega la historia aquí..."
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder-gray-400 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 50 caracteres</p>
            </div>
          )}

          {/* Script Input */}
          {(selectedStage === 'script' || selectedStage === 'wizard' || selectedStage === 'video') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guión (opcional para wizard)
              </label>
              <textarea
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                placeholder="Pega el guión aquí (JSON o texto)..."
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder-gray-400 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">Si lo dejas vacío, se generará automáticamente</p>
            </div>
          )}

          {/* Images Job ID */}
          {(selectedStage === 'images' || selectedStage === 'wizard' || selectedStage === 'video') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job ID de Imágenes (opcional para wizard)
              </label>
              <Input
                value={imagesJobId}
                onChange={(e) => setImagesJobId(e.target.value)}
                placeholder="ej: job_abc123xyz..."
                type="text"
                className="text-gray-900 placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 mt-1">Si lo dejas vacío, se generarán automáticamente</p>
            </div>
          )}

          {/* Audio Job ID */}
          {(selectedStage === 'audio' || selectedStage === 'wizard' || selectedStage === 'video') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job ID de Audio (opcional para wizard)
              </label>
              <Input
                value={audioJobId}
                onChange={(e) => setAudioJobId(e.target.value)}
                placeholder="ej: job_abc123xyz..."
                type="text"
                className="text-gray-900 placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 mt-1">Si lo dejas vacío, se generará automáticamente</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>ℹ️ Instrucciones:</strong>
              <br />
              • <strong>Wizard Completo:</strong> Ingresa historia y sigue todo el flujo normal
              <br />
              • <strong>Historia:</strong> Salta directamente al paso 1 (Historia)
              <br />
              • <strong>Guión:</strong> Completa historia y luego salta al guión (con o sin contenido preestablecido)
              <br />
              • <strong>Imágenes/Audio:</strong> Ingresa un Job ID para reutilizar trabajos existentes
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleJumpToStage}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2"
          >
            {selectedStage === 'wizard' ? 'Ir al Wizard' : `Saltar a ${STAGES.find((s) => s.value === selectedStage)?.label}`}
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
