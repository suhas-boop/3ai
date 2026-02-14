
import React from 'react';

interface MarkdownProps {
    content: string;
    className?: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ content, className }) => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Code Block Handling
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                // End of code block
                elements.push(
                    <pre key={`code-${i}`} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono">
                        <code>{codeBlockContent.join('\n')}</code>
                    </pre>
                );
                codeBlockContent = [];
                inCodeBlock = false;
            } else {
                // Start of code block
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
        }

        // Headers
        if (line.startsWith('# ')) {
            elements.push(<h1 key={i} className="text-3xl font-bold text-gray-900 mt-6 mb-4">{parseInline(line.substring(2))}</h1>);
        } else if (line.startsWith('## ')) {
            elements.push(<h2 key={i} className="text-2xl font-bold text-gray-800 mt-5 mb-3">{parseInline(line.substring(3))}</h2>);
        } else if (line.startsWith('### ')) {
            elements.push(<h3 key={i} className="text-xl font-semibold text-gray-800 mt-4 mb-2">{parseInline(line.substring(4))}</h3>);
        }
        // Lists
        else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            elements.push(<li key={i} className="ml-4 list-disc text-gray-700 mb-1">{parseInline(line.trim().substring(2))}</li>);
        }
        // Blockquotes
        else if (line.startsWith('> ')) {
            elements.push(<blockquote key={i} className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">{parseInline(line.substring(2))}</blockquote>);
        }
        // Empty lines
        else if (line.trim() === '') {
            // Optional: add spacer?
        }
        // Paragraphs
        else {
            elements.push(<p key={i} className="mb-2 text-gray-700 leading-relaxed">{parseInline(line)}</p>);
        }
    }

    return <div className={className}>{elements}</div>;
};

// Helper to parse bold/italic inline
const parseInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*)/g); // Split by bold
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};
