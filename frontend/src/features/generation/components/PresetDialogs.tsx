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
            toast.error('Please enter content for the script');
            return;
        }
        try {
            const result = await postPreset('script', { content: scriptContent });
            onScriptApplied(result.jobId);
            toast.success('Script preset applied');
            handleClose();
        } catch (error) {
            console.error('Error saving script preset:', error);
            toast.error('Error saving script preset');
        }
    };

    const applyImages = async () => {
        if (!imagesInput.trim()) {
            toast.error('Please enter a valid Job ID or upload images');
            return;
        }
        try {
            const result = await postPreset('images', { content: imagesInput });
            onImagesApplied(result.jobId);
            toast.success('Images preset applied');
            handleClose();
        } catch (error) {
            console.error('Error saving images preset:', error);
            toast.error('Error saving images preset');
        }
    };

    const applyAudio = async () => {
        if (!audioInput.trim()) {
            toast.error('Please enter a valid Job ID');
            return;
        }
        try {
            const result = await postPreset('audio', { content: audioInput });
            onAudioApplied(result.jobId);
            toast.success('Audio preset applied');
            handleClose();
        } catch (error) {
            console.error('Error saving audio preset:', error);
            toast.error('Error saving audio preset');
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
                        <DialogTitle>Use preset - Script</DialogTitle>
                        <DialogDescription>
                            Paste or write the script content you want to use
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Textarea
                            value={scriptContent}
                            onChange={(e) => setScriptContent(e.target.value)}
                            placeholder="Paste the script here (JSON or text)..."
                            className="h-40 min-h-0"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={applyScript}>Apply preset</Button>
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
                        <DialogTitle>Use preset - Images</DialogTitle>
                        <DialogDescription>
                            Enter the Job ID of an existing images job
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            type="text"
                            value={imagesInput}
                            onChange={(e) => setImagesInput(e.target.value)}
                            placeholder="e.g.: job_abc123xyz..."
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={applyImages}>Apply preset</Button>
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
                        <DialogTitle>Use preset - Audio</DialogTitle>
                        <DialogDescription>
                            Enter the Job ID of an existing audio job
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            type="text"
                            value={audioInput}
                            onChange={(e) => setAudioInput(e.target.value)}
                            placeholder="e.g.: job_abc123xyz..."
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={applyAudio}>Apply preset</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
