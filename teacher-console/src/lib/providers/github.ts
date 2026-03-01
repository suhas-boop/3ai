/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/providers/github.ts

export type GitHubRecommendation = {
    id: string
    name: string
    url: string
    description: string
    stars: number
    lastUpdated: string
}

const cache = new Map<string, { timestamp: number, data: GitHubRecommendation[] }>()
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

export async function fetchGitHubProjects(query: string): Promise<GitHubRecommendation[]> {
    const cacheKey = `github:${query}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
    }

    try {
        const token = process.env.GITHUB_TOKEN
        const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json'
        }
        if (token) {
            headers['Authorization'] = `token ${token}`
        }

        // Search for repositories matching the query, prefer well-starred ones
        const encodedQuery = encodeURIComponent(`${query} in:readme,description`)
        const url = `https://api.github.com/search/repositories?q=${encodedQuery}&sort=stars&order=desc&per_page=10`

        const res = await fetch(url, { headers, next: { revalidate: 3600 } })
        if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`)

        const data = await res.json()
        const items = data.items || []

        const repos: GitHubRecommendation[] = items
            // Filter out repos lacking a description or with very few stars
            .filter((repo: any) => repo.description && repo.stargazers_count >= 5)
            .map((repo: any) => ({
                id: repo.id.toString(),
                name: repo.full_name,
                url: repo.html_url,
                description: repo.description.substring(0, 200) + (repo.description.length > 200 ? '...' : ''),
                stars: repo.stargazers_count,
                lastUpdated: new Date(repo.updated_at).toISOString().split('T')[0]
            }))

        // Return top 5
        const finalSelection = repos.slice(0, 5)

        cache.set(cacheKey, { timestamp: Date.now(), data: finalSelection })
        return finalSelection

    } catch (error) {
        console.error("Error fetching GitHub projects:", error)
        return [] // Graceful degradation
    }
}
