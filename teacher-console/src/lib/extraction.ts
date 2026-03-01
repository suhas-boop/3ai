// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParseRaw = require('pdf-parse')
const pdfParse = pdfParseRaw.default || pdfParseRaw
import mammoth from 'mammoth'
import JSZip from 'jszip'

async function extractTextFromFile(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
    const ext = filename.split('.').pop()?.toLowerCase() || ''

    try {
        if (mimeType === 'application/pdf' || ext === 'pdf') {
            try {
                const data = await pdfParse(buffer)
                if (!data.text || data.text.trim().length === 0) {
                    return `[This document appears to be a scanned image or contains no machine-readable text. PDF parsing yielded 0 characters.]`
                }
                return data.text
            } catch (pdfErr) {
                console.warn(`[PDF PARSE ERROR] Failed to parse ${filename}:`, pdfErr);
                return `[This PDF could not be parsed. It may be encrypted, corrupted, or an unsupported version. filename: ${filename}]`
            }
        }

        if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx') {
            const result = await mammoth.extractRawText({ buffer })
            return result.value
        }

        if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || ext === 'pptx') {
            return await extractTextFromPptx(buffer)
        }

        if (mimeType.startsWith('text/') || ext === 'txt' || ext === 'md' || ext === 'csv') {
            return buffer.toString('utf-8')
        }

        return '' // Unsupported or unrecognized
    } catch (error) {
        console.error(`Error extracting text from ${filename}:`, error)
        return `[Error extracting text from ${filename}]`
    }
}

async function extractTextFromPptx(buffer: Buffer): Promise<string> {
    const zip = new JSZip()
    const loadedZip = await zip.loadAsync(buffer)

    const slideRegex = /^ppt\/slides\/slide\d+\.xml$/
    const slideFiles = Object.keys(loadedZip.files).filter(name => slideRegex.test(name))

    let fullText = ''

    for (const file of slideFiles) {
        const content = await loadedZip.file(file)?.async('string')
        if (content) {
            // Basic extraction of <a:t>...</a:t> nodes
            const matches = content.match(/<a:t[^>]*>(.*?)<\/a:t>/g)
            if (matches) {
                const slideText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ')
                fullText += slideText + '\n\n'
            }
        }
    }

    return fullText
}

type ExtractedFile = {
    fileName: string
    mimeType: string
    text: string
}

export async function processUploadBatch(buffer: Buffer, mimeType: string, filename: string): Promise<ExtractedFile[]> {
    const ext = filename.split('.').pop()?.toLowerCase() || ''

    // If it's a zip archive itself containing multiple files
    if (mimeType === 'application/zip' || ext === 'zip') {
        const zip = new JSZip()
        const loadedZip = await zip.loadAsync(buffer)
        const files: ExtractedFile[] = []

        for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
            if (!zipEntry.dir && !relativePath.startsWith('__MACOSX') && !relativePath.includes('/.')) {
                const fileData = await zipEntry.async('nodebuffer')
                const fileExt = relativePath.split('.').pop()?.toLowerCase() || ''

                let fileMime = 'application/octet-stream'
                if (fileExt === 'pdf') fileMime = 'application/pdf'
                else if (fileExt === 'docx') fileMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                else if (fileExt === 'pptx') fileMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                else if (fileExt === 'txt') fileMime = 'text/plain'
                else if (fileExt === 'md') fileMime = 'text/markdown'

                const text = await extractTextFromFile(fileData, fileMime, relativePath)
                if (text.trim().length > 0) {
                    files.push({ fileName: relativePath, mimeType: fileMime, text: text.trim() })
                }
            }
        }
        return files
    } else {
        // Single file upload
        const text = await extractTextFromFile(buffer, mimeType, filename)
        if (text.trim().length > 0) {
            return [{ fileName: filename, mimeType, text: text.trim() }]
        }
        return []
    }
}
