/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export type Citation = {
    title: string
    url: string
    snippet?: string
}

// Simple in-memory token bucket for rate limiting
const RATE_LIMIT_TOKENS = 50
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
let tokens = RATE_LIMIT_TOKENS
let lastRefill = Date.now()

function checkRateLimit(): boolean {
    const now = Date.now()
    if (now - lastRefill > RATE_LIMIT_WINDOW_MS) {
        tokens = RATE_LIMIT_TOKENS
        lastRefill = now
    }
    if (tokens > 0) {
        tokens--
        return true
    }
    return false
}

export async function performWebSearch(query: string): Promise<Citation[] | null> {
    const normalizedQuery = query.trim().toLowerCase()

    // 1. Check Cache
    try {
        const cached = await prisma.searchCache.findUnique({
            where: { query: normalizedQuery }
        })

        if (cached) {
            if (cached.expiresAt > new Date()) {
                console.log(`[WebSearch] Cache hit for "${normalizedQuery}"`)
                return JSON.parse(cached.resultsJson) as Citation[]
            } else {
                // Expired, clean up
                await prisma.searchCache.delete({ where: { id: cached.id } })
            }
        }
    } catch (e) {
        console.error("[WebSearch] Cache read error:", e)
    }

    // 2. Check Rate Limit
    if (!checkRateLimit()) {
        console.warn("[WebSearch] Rate limit exceeded. Falling back to simple response.")
        return null
    }

    // 3. Fetch from API (Tavily)
    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
        console.warn("[WebSearch] TAVILY_API_KEY not set. Cannot perform search.")
        return null
    }

    try {
        console.log(`[WebSearch] Calling Tavily API for "${normalizedQuery}"...`)
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: "basic",
                include_answer: false,
                include_images: false,
                include_raw_content: false,
                max_results: 5,
                include_domains: [],
                exclude_domains: []
            })
        })

        if (!response.ok) {
            console.error(`[WebSearch] Tavily API error: ${response.status} ${response.statusText}`)
            return null
        }

        const data = await response.json()

        if (!data.results || !Array.isArray(data.results)) {
            console.error("[WebSearch] Invalid Tavily response format.")
            return null
        }

        const citations: Citation[] = data.results.map((r: any) => ({
            title: r.title || "External Source",
            url: r.url,
            snippet: r.content
        }))

        // 4. Save to Cache
        try {
            const expiresAt = new Date()
            expiresAt.setHours(expiresAt.getHours() + 24) // 24h TTL

            await prisma.searchCache.create({
                data: {
                    query: normalizedQuery,
                    resultsJson: JSON.stringify(citations),
                    expiresAt: expiresAt
                }
            })
        } catch (e) {
            console.error("[WebSearch] Cache write error:", e)
        }

        return citations
    } catch (e) {
        console.error("[WebSearch] External API failure:", e)
        return null
    }
}
