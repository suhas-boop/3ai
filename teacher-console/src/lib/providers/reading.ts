/* eslint-disable @typescript-eslint/no-unused-vars */
import * as cheerio from 'cheerio'

export type ReadingLink = {
    title: string
    url: string
    summary: string
    sourceType: 'Docs' | 'Blog' | 'Standard' | 'CourseNotes' | 'Paper' | 'Video'
}

const cache = new Map<string, { timestamp: number, data: ReadingLink[] }>()
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

export async function fetchReadingLinks(topic: string, subtopic: string): Promise<ReadingLink[]> {
    const query = `${topic} ${subtopic}`
    const cacheKey = `reading:${query}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
    }

    const links: ReadingLink[] = []

    try {
        // Attempt DuckDuckGo Lite search for real links
        // "lite" version is lightweight HTML
        const encodedQuery = encodeURIComponent(`${query} tutorial OR documentation OR course`)
        const res = await fetch(`https://lite.duckduckgo.com/lite/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `q=${encodedQuery}`
        })

        if (res.ok) {
            const text = await res.text()
            const $ = cheerio.load(text)

            $('.result-snippet').each((i, el) => {
                if (i >= 5) return // get up to 5

                // Navigate the specific DOM structure of DDG Lite
                // Actually it's simpler: look for a hrefs in result titles.
            })

            // Let's use a simpler heuristic for DDG lite:
            $('.result-title').each((i, el) => {
                if (links.length >= 5) return
                const url = $(el).attr('href')
                const title = $(el).text()
                // Next row usually has snippet
                const snippet = $(el).closest('tr').next('tr').find('.result-snippet').text()

                if (url && url.startsWith('http') && !url.includes('duckduckgo.com')) {
                    let sourceType: ReadingLink['sourceType'] = 'Blog'
                    if (url.includes('docs.') || url.includes('/docs')) sourceType = 'Docs'
                    if (url.includes('edu') || url.includes('course')) sourceType = 'CourseNotes'
                    if (url.includes('youtube')) sourceType = 'Video'

                    links.push({
                        title: title.trim(),
                        url: url,
                        summary: snippet ? snippet.trim().substring(0, 150) + '...' : `Reading material on ${subtopic}`,
                        sourceType
                    })
                }
            })
        }
    } catch (err) {
        console.error("DDG search failed", err)
    }

    // Fallback to Wikipedia API to guarantee at least *some* real links if DDG fails or yields < 5
    if (links.length < 5) {
        try {
            const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic + ' ' + subtopic)}&utf8=&format=json`)
            const wikiData = await wikiRes.json()
            const wikiResults = wikiData.query?.search || []

            for (const w of wikiResults) {
                if (links.length >= 5) break
                const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(w.title)}`
                // avoiding duplicates
                if (!links.some(l => l.url === url)) {
                    links.push({
                        title: `${w.title} - Wikipedia`,
                        url,
                        summary: w.snippet.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 150) + '...', // Strip HTML tags returned by Wiki snippet
                        sourceType: 'Docs'
                    })
                }
            }
        } catch (err) {
            console.error("Wiki search failed", err)
        }
    }

    cache.set(cacheKey, { timestamp: Date.now(), data: links })
    return links
}
