// Simple english stopwords list
const STOPWORDS = new Set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
    'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
    'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
    'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as',
    'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off',
    'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
])

export function extractKeywords(text: string, count: number = 5): string[] {
    // Simple word frequency extraction (poor man's TF-IDF for single document)
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !STOPWORDS.has(word) && !/^\d+$/.test(word))

    const frequencies = new Map<string, number>()
    for (const word of words) {
        frequencies.set(word, (frequencies.get(word) || 0) + 1)
    }

    return Array.from(frequencies.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(entry => entry[0])
}

export function inferTopicFromText(text: string): string {
    if (!text || text.trim() === '') return "Unknown Topic"

    // Priority 1: Check beginning for Title-like structure
    const firstLines = text.substring(0, 1000).split('\n').map(l => l.trim()).filter(l => l.length > 0)
    for (const line of firstLines) {
        if (line.toLowerCase().includes('course on') || line.toLowerCase().includes('introduction to')) {
            return line.substring(0, 60)
        }
    }

    // Priority 2: Extract top keywords
    const topKeywords = extractKeywords(text.substring(0, 5000), 3)
    if (topKeywords.length > 0) {
        // Return capitalized keywords
        return topKeywords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }

    return "General Curriculum"
}

