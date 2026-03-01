/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/providers/papers.ts

export type PaperRecommendation = {
    id: string
    title: string
    authors: string[]
    year: number
    venue: string
    url: string
    abstractSnippet: string
    tags: string[]
}

// Simple in-memory cache to reduce external API hits
const cache = new Map<string, { timestamp: number, data: PaperRecommendation[] }>()
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

export async function fetchAcademicPapers(query: string): Promise<PaperRecommendation[]> {
    const cacheKey = `papers:${query}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
    }

    try {
        // OpenAlex polite pool requires an email
        const email = process.env.OPENALEX_EMAIL || 'test@example.com'
        const encodedQuery = encodeURIComponent(query)

        // Fetch 15 papers, sort by relevance by default. We will filter in-memory for recency.
        // We add has_abstract to ensure we get an abstract.
        // "mailto" gets us into the polite pool which is faster.
        const url = `https://api.openalex.org/works?search=${encodedQuery}&per-page=15&has_abstract=true&mailto=${email}`

        const res = await fetch(url, { next: { revalidate: 3600 } }) // Next.js cache
        if (!res.ok) throw new Error(`OpenAlex API error: ${res.statusText}`)

        const data = await res.json()
        const results = data.results || []

        const papers: PaperRecommendation[] = results.map((work: any) => ({
            id: work.id || Math.random().toString(),
            title: work.title || 'Unknown Title',
            authors: (work.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean),
            year: work.publication_year || new Date().getFullYear(),
            venue: work.primary_location?.source?.display_name || 'Preprint',
            url: work.primary_location?.landing_page_url || work.id,
            abstractSnippet: (work.abstract_inverted_index
                ? reconstructAbstractSnippet(work.abstract_inverted_index)
                : 'No abstract provided.').substring(0, 250) + '...',
            tags: (work.concepts || []).slice(0, 4).map((c: any) => c.display_name)
        }))

        // Apply recency-aware logic: Ensure at least a couple are recent (last 3 years)
        const currentYear = new Date().getFullYear()
        const recent = papers.filter(p => p.year >= currentYear - 3)
        const older = papers.filter(p => !recent.includes(p))

        // Mix them: 3 recent, 2 older
        const finalSelection = [
            ...recent.slice(0, 3),
            ...older.slice(0, 2)
        ]

        // If not enough recent, fill with older and vice versa
        while (finalSelection.length < 5 && papers.length > finalSelection.length) {
            const nextPaper = papers.find(p => !finalSelection.includes(p))
            if (nextPaper) finalSelection.push(nextPaper)
            else break
        }

        cache.set(cacheKey, { timestamp: Date.now(), data: finalSelection })
        return finalSelection

    } catch (error) {
        console.error("Error fetching papers:", error)
        return [] // Graceful degradation
    }
}

// OpenAlex returns abstract as an inverted index to save space, we need to reconstruct a snippet
function reconstructAbstractSnippet(invertedIndex: Record<string, number[]>): string {
    if (!invertedIndex) return ''
    const words: string[] = []
    for (const [word, positions] of Object.entries(invertedIndex)) {
        for (const pos of positions) {
            words[pos] = word
        }
    }
    return words.filter(w => w !== undefined).join(' ')
}
