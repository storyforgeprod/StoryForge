import { describe, it, expect } from 'vitest';
import { deriveStages } from './deriveStages';

describe('deriveStages', () => {
    it('returns all four stages in canonical order', () => {
        const stages = deriveStages('idle', 'idle', 'idle', 'idle');
        expect(stages.map((s) => s.id)).toEqual(['script', 'images', 'audio', 'video']);
        expect(stages.map((s) => s.label)).toEqual(['Guión', 'Imágenes', 'Audio', 'Video']);
    });

    it('marks the script stage as pending while idle, submitting, or polling', () => {
        expect(deriveStages('idle', 'idle', 'idle', 'idle')[0].status).toBe('pending');
        expect(deriveStages('submitting', 'idle', 'idle', 'idle')[0].status).toBe('pending');
        expect(deriveStages('polling', 'idle', 'idle', 'idle')[0].status).toBe('pending');
    });

    it('marks the script stage done on completed, error on error', () => {
        expect(deriveStages('completed', 'idle', 'idle', 'idle')[0].status).toBe('done');
        expect(deriveStages('error', 'idle', 'idle', 'idle')[0].status).toBe('error');
    });

    it('marks downstream stages active while submitting or polling', () => {
        const stages = deriveStages('completed', 'submitting', 'polling', 'idle');
        expect(stages[1].status).toBe('active');
        expect(stages[2].status).toBe('active');
        expect(stages[3].status).toBe('pending');
    });

    it('marks downstream stages done on completed, error on error', () => {
        const stages = deriveStages('completed', 'completed', 'error', 'idle');
        expect(stages[1].status).toBe('done');
        expect(stages[2].status).toBe('error');
        expect(stages[3].status).toBe('pending');
    });

    it('treats unknown downstream phases as active (fall-through)', () => {
        const stages = deriveStages('completed', 'queued', 'idle', 'idle');
        expect(stages[1].status).toBe('active');
    });
});
