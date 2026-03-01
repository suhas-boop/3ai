/* eslint-disable @typescript-eslint/no-explicit-any */
import { Citation, performWebSearch } from './search'

export interface TutorProvider {
    narrateSlide(input: {
        courseTopic: string,
        moduleLevel: string,
        moduleObjectives: string,
        slideTitle: string,
        slideBullets: string[],
        slideNotes?: string
    }): Promise<{ answer: string; citations?: Citation[] }>

    answerQuestion(input: {
        courseTopic: string,
        moduleLevel: string,
        moduleObjectives: string,
        slideContext: string,
        question: string,
        chatHistory: any[]
    }): Promise<{ answer: string; citations?: Citation[] }>
}

export class LocalTutorProvider implements TutorProvider {
    async narrateSlide(input: any) {
        // Calls Python backend -> /api/tutor/narrate (assuming this remains non-streaming JSON block or we can update later)
        try {
            const res = await fetch('http://127.0.0.1:8000/api/tutor/narrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input)
            })
            if (!res.ok) throw new Error('Failed to narrate slide')
            const data = await res.json()
            return { answer: data.answer, citations: [] }
        } catch (e) {
            console.error("[LocalTutor] Narrate Error:", e)
            return { answer: "I'm having trouble connecting to my teaching core. Let's try again in a moment." }
        }
    }

    async answerQuestion(input: any): Promise<any> {
        // Calls Python backend -> /api/tutor/qa/stream
        try {
            const res = await fetch('http://127.0.0.1:8000/api/tutor/qa/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...input, mode: input.mode || 'local' })
            })
            if (!res.ok) throw new Error('Failed to answer question locally')

            // Return the raw stream response, let the route handler pipe it
            return res;
        } catch (e) {
            console.error("[LocalTutor] QA Error:", e)
            return { answer: "I'm having trouble connecting right now." }
        }
    }
}

export class WebAugmentedTutorProvider implements TutorProvider {
    private localTutor = new LocalTutorProvider()

    async narrateSlide(input: any) {
        return this.localTutor.narrateSlide(input)
    }

    async answerQuestion(input: any): Promise<any> {
        if (input.allowWebBrowsing === false || input.mode === 'diagnostic') {
            return this.localTutor.answerQuestion(input)
        }

        console.log("[WebTutor] Assessing question for web search inclusion...")

        try {
            const initialRes = await fetch('http://127.0.0.1:8000/api/tutor/qa/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...input, mode: 'assess_or_answer' })
            })

            if (!initialRes.ok) return this.localTutor.answerQuestion(input)

            // Assess mode streams back a single stringified JSON object
            const rawOutput = await initialRes.text()
            let data;
            try {
                data = JSON.parse(rawOutput)
            } catch (e) {
                return this.localTutor.answerQuestion(input)
            }

            if (data.needs_web_search === false) {
                console.log("[WebTutor] Backend says Local Context is sufficient. Yielding to LocalTutor...")
                return await this.localTutor.answerQuestion(input)
            }

            const searchQuery = data.search_query || input.question
            console.log(`[WebTutor] Backend requested web search. Query: "${searchQuery}"`)

            const webResults = await performWebSearch(searchQuery)

            if (!webResults || webResults.length === 0) {
                console.log("[WebTutor] Web search failed. Falling back to local.")
                return await fetch('http://127.0.0.1:8000/api/tutor/qa/stream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...input, mode: 'local_fallback', web_context: "Search failed. Do not fabricate sources." })
                })
            }

            console.log("[WebTutor] Synthesizing final answer with Web Context...")
            const synthRes = await fetch('http://127.0.0.1:8000/api/tutor/qa/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...input,
                    mode: 'synthesize',
                    web_context: JSON.stringify(webResults)
                })
            })

            if (!synthRes.ok) return { answer: "I encountered an error synthesizing the web search results." }

            // Return the raw stream response
            return synthRes;

        } catch (e) {
            console.error("[WebTutor] Orchestration Error:", e)
            return this.localTutor.answerQuestion(input)
        }
    }
}
