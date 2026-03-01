/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client'
import { WebAugmentedTutorProvider } from './index'

const prisma = new PrismaClient()

export type TutorActionType =
    | 'START_MODULE'
    | 'RECAP_PREVIOUS'
    | 'NEXT_SLIDE'
    | 'JUMP_TO_SLIDE'
    | 'ASK_PRACTICE'
    | 'GIVE_EXAMPLE'
    | 'EXPLAIN_SIMPLER'
    | 'GO_DEEPER'
    | 'SET_PACE'
    | 'SET_STYLE'
    | 'SET_VERBOSITY'
    | 'TOGGLE_WEB_BROWSING'
    | 'DRAW_WHITEBOARD'

export interface ActionPayload {
    action: TutorActionType
    data?: any
}

export interface SuggestedAction {
    id: string
    label: string
    payload: ActionPayload
}

export interface OrchestrationResult {
    tutorMessage: string
    suggestedActions: SuggestedAction[]
    citations?: any[]
    understandingScore?: number
}

// Orchestrator service to handle the State Machine
export class TeachingOrchestrator {

    // Core function called by the UI when the module loads or user clicks a button
    static async handleAction(
        studentId: string,
        moduleId: string,
        courseTopic: string,
        moduleLevel: string,
        moduleObjectives: string,
        slidesContext: any[], // Array of full slide objects
        payload: ActionPayload
    ): Promise<OrchestrationResult> {

        let session = await prisma.teachingSession.findUnique({
            where: { studentId_moduleId: { studentId, moduleId } }
        })

        // 1. Auto-create session if it doesn't exist
        if (!session) {
            session = await prisma.teachingSession.create({
                data: {
                    studentId,
                    moduleId,
                    state: 'Intro',
                    currentSlideIndex: 0
                }
            })
            // Ensure Progress exists too
            await prisma.progress.upsert({
                where: { studentId_moduleId: { studentId, moduleId } },
                update: {},
                create: { studentId, moduleId }
            })
        }

        let knowledge = await prisma.studentKnowledge.findUnique({
            where: { studentId_moduleId: { studentId, moduleId } }
        })
        if (!knowledge) {
            knowledge = await prisma.studentKnowledge.create({
                data: { studentId, moduleId }
            })
        }

        const prefs = await prisma.studentPreferences.findUnique({ where: { studentId } })

        // 2. State Machine Transitions based on Action
        let responseMessage = ""
        let actions: SuggestedAction[] = []
        const citations: any[] = []
        let newState = session.state
        let newSlideIndex = session.currentSlideIndex

        const tutor = new WebAugmentedTutorProvider()

        switch (payload.action) {
            case 'START_MODULE':
                newState = 'Teaching'
                newSlideIndex = 0
                responseMessage = await this.generateTeachingPrompt(
                    tutor, courseTopic, moduleLevel, moduleObjectives, slidesContext[0], prefs,
                    "Let's start this module. Please teach me the first slide in an engaging way appropriate for my preferences."
                )
                actions = this.getStandardTeachingActions(newSlideIndex, slidesContext.length)
                break;

            case 'NEXT_SLIDE':
                if (session.currentSlideIndex < slidesContext.length - 1) {
                    newState = 'Teaching'
                    newSlideIndex = session.currentSlideIndex + 1
                    responseMessage = await this.generateTeachingPrompt(
                        tutor, courseTopic, moduleLevel, moduleObjectives, slidesContext[newSlideIndex], prefs,
                        "Moving on to the next slide. Please teach me this new concept."
                    )
                    actions = this.getStandardTeachingActions(newSlideIndex, slidesContext.length)
                } else {
                    newState = 'Completed'
                    responseMessage = "We've reached the end of the slides for this module! Great job."
                    actions = [{ id: 'review', label: 'Review Module', payload: { action: 'RECAP_PREVIOUS' } }]
                    await prisma.progress.update({
                        where: { studentId_moduleId: { studentId, moduleId } },
                        data: { completed: true }
                    })
                }
                break;

            case 'RECAP_PREVIOUS':
                newState = 'Review'
                responseMessage = "Let's review the key concepts we've covered so far. Are there any parts you found difficult?"
                actions = [
                    { id: 'practice', label: 'Give me a practice question', payload: { action: 'ASK_PRACTICE' } },
                    { id: 'resume', label: 'Resume teaching', payload: { action: 'JUMP_TO_SLIDE', data: { index: newSlideIndex } } }
                ]
                break;

            case 'ASK_PRACTICE':
                newState = 'Checkpoint'
                const checkpointQ = slidesContext[newSlideIndex]?.interaction?.checkpointQuestion || "Can you summarize the main point of this slide in your own words?"
                responseMessage = await this.generateTeachingPrompt(
                    tutor, courseTopic, moduleLevel, moduleObjectives, slidesContext[newSlideIndex], prefs,
                    `Ask me the following checkpoint question to test my understanding: "${checkpointQ}". Wait for my answer. Do not answer it yourself.`
                )
                actions = [] // Wait for user free-text answer
                break;

            case 'GIVE_EXAMPLE':
                newState = 'Teaching'
                responseMessage = await this.generateTeachingPrompt(
                    tutor, courseTopic, moduleLevel, moduleObjectives, slidesContext[newSlideIndex], prefs,
                    `Provide ONE highly relatable, concrete real-world example of this slide's concept. DO NOT use generic introductory filler phrases like "Let's dive into..." or "Imagine you are...". Just give the example immediately. If my background is: ${prefs?.background || 'General'} and my goals are: ${prefs?.goals || 'Learning'}, tailor the example to me.`
                )
                actions = this.getStandardTeachingActions(newSlideIndex, slidesContext.length)
                break;

            case 'EXPLAIN_SIMPLER':
                newState = 'Teaching'
                responseMessage = await this.generateTeachingPrompt(
                    tutor, courseTopic, moduleLevel, moduleObjectives, slidesContext[newSlideIndex], prefs,
                    "I am having trouble understanding this. Break it down into one single intuitive analogy. DO NOT use generic intro filler like 'Let's break this down'. Just give me the analogy immediately."
                )
                actions = this.getStandardTeachingActions(newSlideIndex, slidesContext.length)
                break;

            case 'GO_DEEPER':
                newState = 'Teaching'
                responseMessage = await this.generateTeachingPrompt(
                    tutor, courseTopic, moduleLevel, moduleObjectives, slidesContext[newSlideIndex], prefs,
                    "Go deeper into the technical mechanics or edge cases of this slide. DO NOT use generic filler intros like 'Let's dive deeper'. Just give me raw, advanced technical insight immediately, and end with a challenging Socratic question."
                )
                actions = this.getStandardTeachingActions(newSlideIndex, slidesContext.length)
                break;

            case 'DRAW_WHITEBOARD':
                newState = 'Teaching'
                responseMessage = await this.generateTeachingPrompt(
                    tutor, courseTopic, moduleLevel, moduleObjectives, slidesContext[newSlideIndex], prefs,
                    "Please use your digital whiteboard to draw a visual explanation of this concept. You MUST generate an `<Artifact type=\"html\">` containing a high-quality SVG or diagram. Make it visually appealing."
                )
                actions = this.getStandardTeachingActions(newSlideIndex, slidesContext.length)
                break;

            case 'JUMP_TO_SLIDE':
                if (payload.data?.index !== undefined && payload.data.index < slidesContext.length) {
                    newState = 'Teaching'
                    newSlideIndex = payload.data.index
                    responseMessage = await this.generateTeachingPrompt(
                        tutor, courseTopic, moduleLevel, moduleObjectives, slidesContext[newSlideIndex], prefs,
                        "Jumping to a specific slide. Please teach me this material."
                    )
                    actions = this.getStandardTeachingActions(newSlideIndex, slidesContext.length)
                }
                break;

            case 'TOGGLE_WEB_BROWSING':
                if (payload.data?.value !== undefined) {
                    await prisma.studentPreferences.update({
                        where: { studentId },
                        data: { allowWebBrowsing: payload.data.value }
                    })
                    responseMessage = `Web browsing has been turned ${payload.data.value ? 'ON' : 'OFF'}.`
                    actions = this.getStandardTeachingActions(newSlideIndex, slidesContext.length)
                }
                break;
        }

        // 3. Persist State Changes
        if (newState !== session.state || newSlideIndex !== session.currentSlideIndex) {
            await prisma.teachingSession.update({
                where: { id: session.id },
                data: { state: newState, currentSlideIndex: newSlideIndex }
            })
            await prisma.progress.update({
                where: { studentId_moduleId: { studentId, moduleId } },
                data: { slideIndex: newSlideIndex, lastSeenAt: new Date() }
            })
        }

        // Record Assistant Message in transcript
        if (responseMessage) {
            await prisma.chatMessage.create({
                data: {
                    sessionId: session.id,
                    role: 'assistant',
                    content: responseMessage,
                    citationsJson: citations.length ? JSON.stringify(citations) : null
                }
            })
        }

        const finalKnowledge = await prisma.studentKnowledge.findUnique({
            where: { studentId_moduleId: { studentId, moduleId } }
        })

        return {
            tutorMessage: responseMessage,
            suggestedActions: actions,
            citations,
            understandingScore: finalKnowledge?.understandingScore || 0
        }
    }

    static async handleUserQuestion(
        studentId: string,
        moduleId: string,
        courseTopic: string,
        moduleLevel: string,
        moduleObjectives: string,
        slideContextObj: any,
        question: string
    ): Promise<Response | OrchestrationResult> {

        const session = await prisma.teachingSession.findUnique({
            where: { studentId_moduleId: { studentId, moduleId } }
        })
        const prefs = await prisma.studentPreferences.findUnique({ where: { studentId } })

        if (!session) throw new Error("Session not found")

        // Record User Question
        await prisma.chatMessage.create({
            data: { sessionId: session.id, role: 'user', content: question }
        })

        // Ask Tutor Provider
        const slideContextStr = `Slide Title: ${slideContextObj.title}\nBullets:\n${slideContextObj.bullets.join('\n')}\nNotes: ${slideContextObj.speaker_notes || ''}`

        const chatHistory = await prisma.chatMessage.findMany({
            where: { sessionId: session.id },
            orderBy: { createdAt: 'asc' }
        })

        const mappedHistory = chatHistory.slice(0, -1).map((msg: any) => ({
            role: msg.role, content: msg.content
        }))

        const tutor = new WebAugmentedTutorProvider()
        let res: any;
        let actions: SuggestedAction[] = [];

        if (session.state === 'Checkpoint') {
            // Evaluate Checkpoint Answer
            const augmentedQuestion = `The student is answering the checkpoint question: "${slideContextObj.interaction?.checkpointQuestion}".
Student Answer: "${question}"
Evaluate their answer for correctness and clarity. Give them brief, encouraging feedback. 
CRITICAL SECRET INSTRUCTION: At the very end of your response, secretly include a score evaluating their understanding on a scale of 0 to 100 in this exact format: [SCORE: XX]. Do not mention the score format to the user.`

            res = await tutor.answerQuestion({
                courseTopic, moduleLevel, moduleObjectives, slideContext: slideContextStr,
                question: augmentedQuestion, chatHistory: mappedHistory, allowWebBrowsing: false
            })
            // Since this involves secret score stripping, we have to fully await the stream in memory
            if (res instanceof Response) {
                const text = await res.text()
                res = { answer: text }
            } else if (res.answer) {
                // It's already parsed
            }

            // Parse score
            const scoreMatch = res.answer.match(/\[SCORE:\s*(\d+)\]/i);
            if (scoreMatch) {
                const score = parseInt(scoreMatch[1], 10);
                // Remove the secret score tag from the message shown to the user
                res.answer = res.answer.replace(/\[SCORE:\s*\d+\]/gi, '').trim();

                // Update Student Knowledge incrementally
                const currentKnowledge = await prisma.studentKnowledge.findUnique({
                    where: { studentId_moduleId: { studentId, moduleId } }
                });
                if (currentKnowledge) {
                    const newScore = Math.round((currentKnowledge.understandingScore + score) / 2); // Simple moving average
                    await prisma.studentKnowledge.update({
                        where: { id: currentKnowledge.id },
                        data: { understandingScore: newScore, lastCheckpointAt: new Date() }
                    })
                }
            }

            // Move back to Teaching state to resume normal flow
            await prisma.teachingSession.update({
                where: { id: session.id },
                data: { state: 'Teaching' }
            })
            actions = this.getStandardTeachingActions(session.currentSlideIndex, 100);

            // Record Assistant Answer for checkpoint
            await prisma.chatMessage.create({
                data: {
                    sessionId: session.id,
                    role: 'assistant',
                    content: res.answer,
                }
            })

            const finalKnowledge = await prisma.studentKnowledge.findUnique({
                where: { studentId_moduleId: { studentId, moduleId } }
            });
            return {
                tutorMessage: res.answer,
                suggestedActions: actions,
                understandingScore: finalKnowledge?.understandingScore || 0
            }

        } else {
            // Normal QnA - WE WANT TO STREAM THIS DIRECTLY TO THE CLIENT
            const augmentedQuestion = `${question}\n\n[System directive: Answer this question. Keep your verbosity '${prefs?.verbosity || 'Balanced'}' and use a '${prefs?.style || 'Lecture'}' teaching style.]`

            res = await tutor.answerQuestion({
                courseTopic, moduleLevel, moduleObjectives, slideContext: slideContextStr,
                question: augmentedQuestion, chatHistory: mappedHistory, allowWebBrowsing: prefs?.allowWebBrowsing ?? true
            })

            // Return the raw readable stream (Response) to the API route!
            return res;
        }
    }

    private static getStandardTeachingActions(currentIndex: number, totalSlides: number): SuggestedAction[] {
        const actions: SuggestedAction[] = []
        if (currentIndex < totalSlides - 1) {
            actions.push({ id: 'next', label: 'Next Slide', payload: { action: 'NEXT_SLIDE' } })
        }
        actions.push({ id: 'practice', label: 'Quiz me', payload: { action: 'ASK_PRACTICE' } })
        actions.push({ id: 'example', label: 'Give me an example', payload: { action: 'GIVE_EXAMPLE' } })
        actions.push({ id: 'simpler', label: 'Explain simpler', payload: { action: 'EXPLAIN_SIMPLER' } })
        actions.push({ id: 'deeper', label: 'Go deeper', payload: { action: 'GO_DEEPER' } })
        actions.push({ id: 'whiteboard', label: 'Draw on whiteboard', payload: { action: 'DRAW_WHITEBOARD' } })
        return actions
    }

    private static async generateTeachingPrompt(
        tutor: WebAugmentedTutorProvider,
        courseTopic: string,
        moduleLevel: string,
        moduleObjectives: string,
        slideObj: any,
        prefs: any,
        directive: string
    ): Promise<string> {
        const slideContextStr = slideObj ? `Slide Title: ${slideObj.title}\nBullets:\n${slideObj.bullets.join('\n')}\nNotes: ${slideObj.speaker_notes || ''}\nVisuals: ${JSON.stringify(slideObj.visuals || [])}\nInteractions: ${JSON.stringify(slideObj.interaction || {})}` : "No specific slide open."

        // We bypass the chat engine explicitly for "teaching" prompts so it proactively acts as a teacher rather than a QA bot.
        // We instruct the backend to generate a narrative.
        // For simplicity in integration, we route this through the same qa endpoint but with a strong system prompt.

        const hasWebsite = !!slideObj?.website_html;
        const websiteInstruct = hasWebsite ? "CRITICAL: The current slide features an interactive mini-website. You MUST NOT generate any `<Artifact type=\"html\">`. Instead, you MUST use inline `<Action entityId=\"<id>\" action=\"highlight\"/>` tags to trigger animations on the website while you narrate. Do this at least 1-2 times." : "";

        const question = `[SYSTEM INSTRUCTION: You are guiding the student through this slide. ${directive} 
The context provided is the current slide you are on. 
CRITICAL RULES FOR TONE AND STYLE: 
1. Speak completely naturally, like a knowledgeable peer. Do NOT adopt a cheesy "teacher persona". 
2. NEVER use generic intro phrases like "Let's dive into...", "Welcome to...", or "Imagine you are...". Just start talking about the core concept immediately.
3. Introduce ONLY ONE core concept at a time. Do NOT just read the slide and summarize it.
4. IMMEDIATELY ask the student a thought-provoking, intuitive question to check their understanding or connect it to their experience before moving on to the next bullet point. Wait for their response.
5. Keep your messages extremely conversational and punchy.
Adapt to student preferences: Pace=${prefs?.pace}, Style=${prefs?.style}, Verbosity=${prefs?.verbosity}.
${websiteInstruct}]`

        const res = await tutor.answerQuestion({
            courseTopic,
            moduleLevel,
            moduleObjectives,
            slideContext: slideContextStr,
            question: question,
            chatHistory: [],
            allowWebBrowsing: false // Don't web-surf to narrate a slide
        })

        if (res instanceof Response) {
            return await res.text()
        }

        return res.answer || ""
    }
}
