import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
            toast.error('Por favor ingresa contenido para el guión');
            return;
        }
        try {
            const result = await postPreset('script', { content: scriptContent });
            onScriptApplied(result.jobId);
            toast.success('Preset de guión aplicado');
            handleClose();
        } catch (error) {
            console.error('Error saving script preset:', error);
            toast.error('Error al guardar el preset del guión');
        }
    };

    const applyImages = async () => {
        if (!imagesInput.trim()) {
            toast.error('Por favor ingresa un Job ID válido o carga imágenes');
            return;
        }
        try {
            const result = await postPreset('images', { content: imagesInput });
            onImagesApplied(result.jobId);
            toast.success('Preset de imágenes aplicado');
            handleClose();
        } catch (error) {
            console.error('Error saving images preset:', error);
            toast.error('Error al guardar el preset de imágenes');
        }
    };

    const applyAudio = async () => {
        if (!audioInput.trim()) {
            toast.error('Por favor ingresa un Job ID válido');
            return;
        }
        try {
            const result = await postPreset('audio', { content: audioInput });
            onAudioApplied(result.jobId);
            toast.success('Preset de audio aplicado');
            handleClose();
        } catch (error) {
            console.error('Error saving audio preset:', error);
            toast.error('Error al guardar el preset de audio');
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
                        <Textarea
                            value={scriptContent}
                            onChange={(e) => setScriptContent(e.target.value)}
                            placeholder="Pega el guión aquí (JSON o texto)..."
                            className="h-40 min-h-0"
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
                        <Input
                            type="text"
                            value={imagesInput}
                            onChange={(e) => setImagesInput(e.target.value)}
                            placeholder="ej: job_abc123xyz..."
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
                        <Input
                            type="text"
                            value={audioInput}
                            onChange={(e) => setAudioInput(e.target.value)}
                            placeholder="ej: job_abc123xyz..."
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
