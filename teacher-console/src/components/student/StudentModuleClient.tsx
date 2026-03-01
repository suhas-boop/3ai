/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, GraduationCap, Image as ImageIcon, Layers } from 'lucide-react';
import Link from 'next/link';
import { StudentChat } from './StudentChat';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { Mermaid } from '../ui/Mermaid';

export function StudentModuleClient({ course, moduleData, slides, initialSession }: any) {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSession?.currentSlideIndex || 0);
    const [artifactCode, setArtifactCode] = useState<string | null>(null);
    const slideObj = slides?.[currentSlideIndex];
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleAction = (cmd: { entityId: string, action: string }) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'narration_action',
                entityId: cmd.entityId,
                action: cmd.action
            }, '*');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Header */}
            <header className="flex-none px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Link href={`/student/course/${course.id}`} className="p-2 -ml-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
                            <p className="text-sm text-gray-500 font-medium">{moduleData.title}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Split View */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Pane - Slides or Artifact Sandbox */}
                <div className="w-2/3 h-full overflow-hidden flex flex-col p-8 bg-gray-100">
                    {artifactCode ? (
                        <div className="w-full h-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
                            <div className="bg-indigo-600 px-6 py-3 text-white flex justify-between items-center shadow-sm z-10">
                                <h2 className="text-sm font-bold tracking-wide uppercase flex items-center gap-2">
                                    <Layers className="w-4 h-4" />
                                    Interactive Visualization
                                </h2>
                                <button
                                    onClick={() => setArtifactCode(null)}
                                    className="text-indigo-100 hover:text-white text-xs font-semibold underline"
                                >
                                    Return to Slide
                                </button>
                            </div>
                            <iframe
                                ref={iframeRef}
                                title="Dynamic Artifact Sandbox"
                                srcDoc={artifactCode}
                                className="w-full h-full border-none bg-white"
                                sandbox="allow-scripts allow-same-origin"
                            />
                        </div>
                    ) : slides && slides.length > 0 && slideObj ? (
                        <div className="w-full h-full overflow-y-auto space-y-6">
                            {/* Slide Counter (Read-only) */}
                            <div className="flex items-center justify-center text-gray-500 font-medium bg-white px-6 py-2 rounded-full shadow-sm max-w-fit mx-auto sticky top-0 z-10">
                                <span className="text-sm">Slide {currentSlideIndex + 1} of {slides.length}</span>
                            </div>

                            {/* Slide Content */}
                            <div className="aspect-[16/9] w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col transition-all">
                                <div className="bg-slate-900 px-10 py-8 text-white shrink-0">
                                    <h2 className="text-3xl font-bold leading-tight">{slideObj.title}</h2>
                                </div>
                                {slideObj.website_html ? (
                                    <div className="flex-1 w-full h-full p-0 overflow-hidden bg-white">
                                        <iframe
                                            ref={iframeRef}
                                            title={slideObj.title}
                                            srcDoc={slideObj.website_html}
                                            className="w-full h-full border-none"
                                            sandbox="allow-scripts allow-same-origin"
                                        />
                                    </div>
                                ) : (
                                    <div className="p-10 flex-1 overflow-y-auto bg-white max-w-none flex flex-col gap-8">

                                        {/* Visuals Rendering Stack */}
                                        {slideObj.visuals && slideObj.visuals.length > 0 && (
                                            <div className="space-y-6">
                                                {slideObj.visuals.map((vis: any, idx: number) => (
                                                    <div key={idx} className="bg-slate-50 relative border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                                            <h3 className="text-sm font-bold text-slate-700">{vis.title}</h3>
                                                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-white px-2 py-0.5 rounded shadow-sm">{vis.kind}</span>
                                                        </div>

                                                        <div className="p-6">
                                                            {vis.kind === 'diagram' && vis.mermaid && (
                                                                <div className="bg-white rounded p-4 border border-slate-100">
                                                                    <Mermaid chart={vis.mermaid} id={`${currentSlideIndex}-${idx}`} />
                                                                </div>
                                                            )}

                                                            {vis.kind === 'code' && vis.code && (
                                                                <SyntaxHighlighter
                                                                    language={vis.code.language || 'text'}
                                                                    style={vscDarkPlus as any}
                                                                    className="rounded-lg shadow-md border border-slate-700 font-mono text-sm text-left !m-0"
                                                                >
                                                                    {vis.code.content}
                                                                </SyntaxHighlighter>
                                                            )}

                                                            {vis.kind === 'image' && (
                                                                <div className="flex justify-center bg-white rounded border border-slate-100 p-2">
                                                                    {vis.src ? (
                                                                        <img src={vis.src} alt={vis.alt} className="rounded max-w-full h-auto object-contain max-h-96" />
                                                                    ) : (
                                                                        <div className="w-full h-48 bg-slate-50 rounded border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 flex-col p-4 text-center">
                                                                            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                                                            <span className="text-sm px-4 max-w-md">{vis.alt}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {['table', 'chart'].includes(vis.kind) && (
                                                                <div className="w-full py-12 bg-white rounded border border-slate-100 flex items-center justify-center text-slate-400 font-medium text-sm">
                                                                    [ {vis.kind.toUpperCase()} Data: {vis.alt} ]
                                                                </div>
                                                            )}
                                                        </div>

                                                        {vis.caption && (
                                                            <div className="px-6 py-3 bg-white border-t border-slate-100">
                                                                <p className="text-sm text-slate-500 italic text-center">Caption: {vis.caption}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Bullets & Markdown Content */}
                                        <div className="prose-lg prose-slate max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkMath]}
                                                rehypePlugins={[rehypeKatex]}
                                                components={{
                                                    code({ node, inline, className, children, ...props }: any) {
                                                        const match = /language-(\w+)/.exec(className || '')
                                                        if (!inline) {
                                                            return (
                                                                <SyntaxHighlighter
                                                                    {...props}
                                                                    children={String(children).replace(/\n$/, '')}
                                                                    style={vscDarkPlus as any}
                                                                    language={match ? match[1] : 'text'}
                                                                    PreTag="div"
                                                                    className="rounded-lg shadow-md border border-slate-700 font-mono text-sm text-left my-4"
                                                                />
                                                            )
                                                        }
                                                        return (
                                                            <code className={`${className || ''} bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-[0.9em] break-words`} {...props}>
                                                                {children}
                                                            </code>
                                                        )
                                                    },
                                                    pre({ node, children }: any) {
                                                        return <div className="not-prose my-4 w-full">{children}</div>
                                                    },
                                                    ul({ node, children }: any) {
                                                        return <ul className="list-disc list-outside pl-6 space-y-3 mt-4 text-gray-700">{children}</ul>
                                                    },
                                                    li({ node, children }: any) {
                                                        return <li className="leading-relaxed pl-2 marker:text-indigo-400">{children}</li>
                                                    }
                                                }}
                                            >
                                                {slideObj.bullets.join('\n\n')}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            No slides generated for this module yet.
                        </div>
                    )}
                </div>

                {/* Right Pane - Chat */}
                <div className="w-1/3 h-full overflow-hidden shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20 hover:z-30 transition-shadow bg-white flex flex-col">
                    <StudentChat
                        courseId={course.id}
                        moduleId={moduleData.id}
                        courseTopic={course.topic}
                        moduleLevel={moduleData.level}
                        moduleObjectives={moduleData.learningObjectives}
                        slides={slides}
                        currentSlideIndex={currentSlideIndex}
                        initialSession={initialSession}
                        onSlideChange={(index: number) => {
                            setCurrentSlideIndex(index);
                            setArtifactCode(null); // Clear artifact on slide change
                        }}
                        onArtifactChange={setArtifactCode}
                        onAction={handleAction}
                    />
                </div>
            </div>
        </div>
    );
}
