/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { TeachingOrchestrator, ActionPayload, OrchestrationResult } from './orchestrator'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function processTutorAction(
    courseId: string,
    moduleId: string,
    courseTopic: string,
    moduleLevel: string,
    moduleObjectives: string,
    slidesContext: any[], // Expected to be the full array
    payload: ActionPayload
): Promise<OrchestrationResult> {

    // Simulate getting logged-in student (use our generic one)
    const student = await prisma.user.findFirst({ where: { email: 'student@autonomous.academy' } })
    if (!student) throw new Error("Student not found")

    return TeachingOrchestrator.handleAction(
        student.id,
        moduleId,
        courseTopic,
        moduleLevel,
        moduleObjectives,
        slidesContext,
        payload
    )
}

export async function processTutorQuestion(
    courseId: string,
    moduleId: string,
    courseTopic: string,
    moduleLevel: string,
    moduleObjectives: string,
    slideContextObj: any, // The current slide object
    question: string
): Promise<any> {
    const student = await prisma.user.findFirst({ where: { email: 'student@autonomous.academy' } })
    if (!student) throw new Error("Student not found")

    // For questions, we actually want to stream back to the UI, 
    // so returning Orchestrator from a Server Action isn't ideal because server actions 
    // can't easily return raw readable streams to the client without complex React integrations.
    // Instead we will have the client hit the API route directly for pure questions.
    // BUT we still need this for legacy compat if needed.

    const res = await TeachingOrchestrator.handleUserQuestion(
        student.id,
        moduleId,
        courseTopic,
        moduleLevel,
        moduleObjectives,
        slideContextObj,
        question
    )

    // Unpack if it's a response (edge case for server action)
    if (res instanceof Response) {
        return { tutorMessage: await res.text(), suggestedActions: [] }
    }
    return res;
}

export async function getSessionState(moduleId: string) {
    const student = await prisma.user.findFirst({ where: { email: 'student@autonomous.academy' } })
    if (!student) return null

    const session = await prisma.teachingSession.findUnique({
        where: { studentId_moduleId: { studentId: student.id, moduleId } },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' }
            }
        }
    })

    if (!session) return null;

    const knowledge = await prisma.studentKnowledge.findUnique({
        where: { studentId_moduleId: { studentId: student.id, moduleId } }
    })

    return { ...session, knowledge }
}
