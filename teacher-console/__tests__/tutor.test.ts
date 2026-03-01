import { describe, expect, it, vi, beforeEach } from 'vitest'
import { LocalTutorProvider, WebAugmentedTutorProvider } from '../src/lib/tutors/index'
import * as searchModule from '../src/lib/tutors/search'

// Mock the performWebSearch function
vi.mock('../src/lib/tutors/search', () => ({
    performWebSearch: vi.fn(),
}))

// Mock global fetch to simulate Python backend responses
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Tutor Providers', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('LocalTutorProvider', () => {
        it('should correctly call Python backend and NEVER trigger web search', async () => {
            const provider = new LocalTutorProvider()
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ answer: 'This is a local answer.' })
            })

            const result = await provider.answerQuestion({
                courseTopic: 'AI Basics',
                moduleLevel: 'Beginner',
                moduleObjectives: 'Learn AI',
                slideContext: 'Slide 1',
                question: 'What is AI?',
                chatHistory: []
            })

            expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/tutor/qa', expect.objectContaining({
                body: expect.stringContaining('"mode":"local"')
            }))
            expect(result.answer).toBe('This is a local answer.')
            expect(result.citations).toEqual([])
            expect(searchModule.performWebSearch).not.toHaveBeenCalled()
        })
    })

    describe('WebAugmentedTutorProvider', () => {
        it('should use local context when backend says web search is unnecessary', async () => {
            const provider = new WebAugmentedTutorProvider()

            // Mock the assess_or_answer response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ needs_web_search: false, answer: 'Local context answer here.' })
            })

            const result = await provider.answerQuestion({
                courseTopic: 'AI',
                moduleLevel: 'Advanced',
                moduleObjectives: 'Deep Learning',
                slideContext: 'Context',
                question: 'Explain this concept.',
                chatHistory: []
            })

            expect(mockFetch).toHaveBeenCalledTimes(1)
            expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                body: expect.stringContaining('"mode":"assess_or_answer"')
            }))
            expect(result.answer).toBe('Local context answer here.')
            expect(searchModule.performWebSearch).not.toHaveBeenCalled()
        })

        it('should trigger web search and synthesize when required (e.g. "latest news")', async () => {
            const provider = new WebAugmentedTutorProvider()

            // 1. Mock assessment saying web search IS needed
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ needs_web_search: true, search_query: 'latest AI news' })
            })

            // 2. Mock the performWebSearch returning results
            const mockCitations = [{ title: 'AI News 2026', url: 'https://ai-news.com' }]
            vi.mocked(searchModule.performWebSearch).mockResolvedValueOnce(mockCitations)

            // 3. Mock the synthesize backend call
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    answer: 'From the web: AI is advancing.',
                    citations: mockCitations
                })
            })

            const result = await provider.answerQuestion({
                courseTopic: 'AI',
                moduleLevel: 'Beginner',
                moduleObjectives: 'Intro',
                slideContext: 'None',
                question: 'What is the latest news in AI?',
                chatHistory: []
            })

            // Verify Assessment occurred
            expect(mockFetch).toHaveBeenNthCalledWith(1, expect.any(String), expect.objectContaining({
                body: expect.stringContaining('"mode":"assess_or_answer"')
            }))

            // Verify Web Search occurred
            expect(searchModule.performWebSearch).toHaveBeenCalledWith('latest AI news')

            // Verify Synthesis occurred with web context
            expect(mockFetch).toHaveBeenNthCalledWith(2, expect.any(String), expect.objectContaining({
                body: expect.stringContaining('"mode":"synthesize"')
            }))

            expect(result.answer).toBe('From the web: AI is advancing.')
            expect(result.citations).toEqual(mockCitations)
        })
    })
})
