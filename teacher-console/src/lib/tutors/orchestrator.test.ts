import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeachingOrchestrator } from './orchestrator';

// Mock dependencies
vi.mock('@prisma/client', () => {
    const mPrisma = {
        teachingSession: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        progress: {
            upsert: vi.fn(),
            update: vi.fn(),
        },
        studentPreferences: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        chatMessage: {
            create: vi.fn(),
            findMany: vi.fn(),
        },
        studentKnowledge: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        }
    };
    return {
        PrismaClient: class {
            constructor() { return mPrisma; }
        }
    };
});

vi.mock('./index', () => {
    return {
        WebAugmentedTutorProvider: class {
            answerQuestion = vi.fn().mockResolvedValue({
                answer: "Mocked tutor answer",
                citations: []
            })
        }
    }
});

import { PrismaClient } from '@prisma/client';
const prismaMock = new PrismaClient() as any;

describe('TeachingOrchestrator State Transitions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('START_MODULE -> transitions to Teaching state', async () => {
        prismaMock.teachingSession.findUnique.mockResolvedValue(null);
        prismaMock.teachingSession.create.mockResolvedValue({
            id: 'session-1',
            state: 'Intro',
            currentSlideIndex: 0
        });
        prismaMock.studentPreferences.findUnique.mockResolvedValue({
            verbosity: 'Balanced'
        });
        prismaMock.studentKnowledge.findUnique.mockResolvedValue(null);
        prismaMock.studentKnowledge.create.mockResolvedValue({
            id: 'sk-1', understandingScore: 0, studentId: 'student-1', moduleId: 'module-1'
        });

        const slidesContext = [{ title: 'Slide 1', bullets: [] }, { title: 'Slide 2', bullets: [] }];

        const res = await TeachingOrchestrator.handleAction(
            'student-1', 'module-1', 'Topic', 'Beginner', 'Objectives',
            slidesContext,
            { action: 'START_MODULE' }
        );

        expect(prismaMock.teachingSession.update).toHaveBeenCalledWith({
            where: { id: 'session-1' },
            data: { state: 'Teaching', currentSlideIndex: 0 }
        });

        expect(res.suggestedActions.some(a => a.id === 'next')).toBeTruthy();
        expect(res.tutorMessage).toBe("Mocked tutor answer");
    });

    it('NEXT_SLIDE -> advances index and maintains Teaching state', async () => {
        prismaMock.teachingSession.findUnique.mockResolvedValue({
            id: 'session-1',
            state: 'Teaching',
            currentSlideIndex: 0
        });
        prismaMock.studentKnowledge.findUnique.mockResolvedValue({
            id: 'sk-1', understandingScore: 50
        });

        const slidesContext = [{ title: 'Slide 1', bullets: [] }, { title: 'Slide 2', bullets: [] }];

        await TeachingOrchestrator.handleAction(
            'student-1', 'module-1', 'Topic', 'Beginner', 'Objectives',
            slidesContext,
            { action: 'NEXT_SLIDE' }
        );

        expect(prismaMock.teachingSession.update).toHaveBeenCalledWith({
            where: { id: 'session-1' },
            data: { state: 'Teaching', currentSlideIndex: 1 }
        });
    });

    it('NEXT_SLIDE at end -> transitions to Completed state', async () => {
        prismaMock.teachingSession.findUnique.mockResolvedValue({
            id: 'session-1',
            state: 'Teaching',
            currentSlideIndex: 1
        });
        prismaMock.studentKnowledge.findUnique.mockResolvedValue({
            id: 'sk-1', understandingScore: 50
        });

        const slidesContext = [{ title: 'Slide 1', bullets: [] }, { title: 'Slide 2', bullets: [] }];

        const res = await TeachingOrchestrator.handleAction(
            'student-1', 'module-1', 'Topic', 'Beginner', 'Objectives',
            slidesContext,
            { action: 'NEXT_SLIDE' }
        );

        expect(prismaMock.progress.update).toHaveBeenCalledWith({
            where: { studentId_moduleId: { studentId: 'student-1', moduleId: 'module-1' } },
            data: { completed: true }
        });

        expect(res.tutorMessage).toContain("We've reached the end");
    });
});
