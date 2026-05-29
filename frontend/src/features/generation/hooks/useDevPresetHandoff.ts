import { useEffect } from 'react';
import { postPreset } from '../api/generateApi';
import { StoryStyle } from '../types';

const STORAGE_KEY = 'devState';
const DEFAULT_STYLE: StoryStyle = StoryStyle.ANIME;
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

export type DevHandoffPayload = {
    story: string;
    scriptContent: string;
    imageJobId: string;
    audioJobId: string;
    devMode: boolean;
};

export type DevHandoffApplied = {
    story: string;
    scriptJobId: string | null;
    imageJobId: string | null;
    audioJobId: string | null;
    style: StoryStyle;
    voiceId: string;
    isPresetMode: boolean;
};

function readPayload(): DevHandoffPayload | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as DevHandoffPayload;
    } catch {
        return null;
    }
}

async function resolveScriptJobId(scriptContent: string): Promise<string> {
    try {
        const result = await postPreset('script', { content: scriptContent });
        return result.jobId;
    } catch (error) {
        console.error('Error saving script preset from DevMode:', error);
        return `preset_script_${Date.now()}`;
    }
}

export function useDevPresetHandoff(onApply: (applied: DevHandoffApplied) => void): void {
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            const payload = readPayload();
            if (!payload) return;

            const scriptJobId = payload.scriptContent
                ? await resolveScriptJobId(payload.scriptContent)
                : null;

            if (cancelled) return;

            const imageJobId = payload.imageJobId || null;
            const audioJobId = payload.audioJobId || null;
            const isPresetMode = Boolean(scriptJobId || imageJobId || audioJobId);

            onApply({
                story: payload.story ?? '',
                scriptJobId,
                imageJobId,
                audioJobId,
                style: DEFAULT_STYLE,
                voiceId: DEFAULT_VOICE_ID,
                isPresetMode,
            });

            sessionStorage.removeItem(STORAGE_KEY);
        };

        void load();

        return () => {
            cancelled = true;
        };
        // Run once on mount — onApply is intentionally not a dependency.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
