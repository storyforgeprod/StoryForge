import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { postPreset } from '../api/generateApi';

export type PresetDialogState = 'closed' | 'script' | 'images' | 'audio' | 'video';

export type PresetDialogsProps = {
    open: PresetDialogState;
    onClose: () => void;
    onScriptApplied: (jobId: string) => void;
    onImagesApplied: (jobId: string) => void;
    onAudioApplied: (jobId: string) => void;
};

export const PresetDialogs = ({
    open,
    onClose,
    onScriptApplied,
    onImagesApplied,
    onAudioApplied,
}: PresetDialogsProps) => {
    const [scriptContent, setScriptContent] = useState('');
    const [imagesInput, setImagesInput] = useState('');
    const [audioInput, setAudioInput] = useState('');

    const reset = () => {
        setScriptContent('');
        setImagesInput('');
        setAudioInput('');
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const applyScript = async () => {
        if (!scriptContent.trim()) {
            alert('Por favor ingresa contenido para el guión');
            return;
        }
        try {
            const result = await postPreset('script', { content: scriptContent });
            onScriptApplied(result.jobId);
            handleClose();
        } catch (error) {
            console.error('Error saving script preset:', error);
            alert('Error al guardar el preset del guión');
        }
    };

    const applyImages = async () => {
        if (!imagesInput.trim()) {
            alert('Por favor ingresa un Job ID válido o carga imágenes');
            return;
        }
        try {
            const result = await postPreset('images', { content: imagesInput });
            onImagesApplied(result.jobId);
            handleClose();
        } catch (error) {
            console.error('Error saving images preset:', error);
            alert('Error al guardar el preset de imágenes');
        }
    };

    const applyAudio = async () => {
        if (!audioInput.trim()) {
            alert('Por favor ingresa un Job ID válido');
            return;
        }
        try {
            const result = await postPreset('audio', { content: audioInput });
            onAudioApplied(result.jobId);
            handleClose();
        } catch (error) {
            console.error('Error saving audio preset:', error);
            alert('Error al guardar el preset de audio');
        }
    };

    return (
        <>
            <Dialog
                open={open === 'script'}
                onOpenChange={(next) => {
                    if (!next) handleClose();
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Usar preset - Guión</DialogTitle>
                        <DialogDescription>
                            Pega o escribe el contenido del guión que deseas usar
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <textarea
                            value={scriptContent}
                            onChange={(e) => setScriptContent(e.target.value)}
                            placeholder="Pega el guión aquí (JSON o texto)..."
                            className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder-gray-500 resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button onClick={applyScript}>Aplicar preset</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={open === 'images'}
                onOpenChange={(next) => {
                    if (!next) handleClose();
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Usar preset - Imágenes</DialogTitle>
                        <DialogDescription>
                            Ingresa el Job ID de un trabajo de imágenes existente
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={imagesInput}
                            onChange={(e) => setImagesInput(e.target.value)}
                            placeholder="ej: job_abc123xyz..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder-gray-500"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button onClick={applyImages}>Aplicar preset</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={open === 'audio'}
                onOpenChange={(next) => {
                    if (!next) handleClose();
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Usar preset - Audio</DialogTitle>
                        <DialogDescription>
                            Ingresa el Job ID de un trabajo de audio existente
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={audioInput}
                            onChange={(e) => setAudioInput(e.target.value)}
                            placeholder="ej: job_abc123xyz..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder-gray-500"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button onClick={applyAudio}>Aplicar preset</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
