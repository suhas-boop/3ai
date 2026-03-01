import { NextRequest, NextResponse } from 'next/server';
import { LocalTutorProvider, WebAugmentedTutorProvider } from '@/lib/tutors';
import { TeachingOrchestrator } from '@/lib/tutors/orchestrator';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            courseTopic,
            moduleLevel,
            moduleObjectives,
            slideContext,
            question,
            chatHistory,
            allowWebBrowsing,
            mode
        } = body;

        const tutor = allowWebBrowsing
            ? new WebAugmentedTutorProvider()
            : new LocalTutorProvider();

        const result = await tutor.answerQuestion({
            courseTopic,
            moduleLevel,
            moduleObjectives,
            slideContext,
            question,
            chatHistory,
            mode
        });

        if (result instanceof Response) {
            // It's a stream from Python!
            // We just proxy the stream straight back to the client
            return new Response(result.body, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        // Fallback or checkpoint JSON response
        return NextResponse.json(result);
    } catch (e: any) {
        console.error("Chat API Error:", e);
        return NextResponse.json(
            { answer: "I encountered a technical error processing your request." },
            { status: 500 }
        );
    }
}
