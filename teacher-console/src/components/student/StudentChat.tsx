/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Globe, Link as LinkIcon, Layers, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { processTutorAction, processTutorQuestion } from '@/lib/tutors/actions';
import { ActionPayload, SuggestedAction } from '@/lib/tutors/orchestrator';

// A simple Dialog mock using standard shadcn/ui principles (simplified inline for ease)
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

type Message = {
    role: 'user' | 'assistant';
    content: string;
    citations?: any[];
};

interface StudentChatProps {
    courseId: string;
    moduleId: string;
    courseTopic: string;
    moduleLevel: string;
    moduleObjectives: string;
    slides: any[];
    currentSlideIndex: number;
    initialSession?: any;
    onSlideChange: (index: number) => void;
    onArtifactChange?: (code: string | null) => void;
    onAction?: (actionCmd: { entityId: string, action: string }) => void;
}

export function StudentChat({
    courseId, moduleId, courseTopic, moduleLevel, moduleObjectives, slides, currentSlideIndex, initialSession, onSlideChange, onArtifactChange, onAction
}: StudentChatProps) {

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionState, setSessionState] = useState(initialSession?.state || 'Intro');
    const [understandingScore, setUnderstandingScore] = useState(initialSession?.knowledge?.understandingScore || 0);
    const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
    const [processedActions, setProcessedActions] = useState<Set<string>>(new Set());

    // Preferences Dialog State
    const [isPrefsOpen, setIsPrefsOpen] = useState(false);
    const [allowWeb, setAllowWeb] = useState(true); // Should sync from DB but defaulting true for now
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initialize Chat
    useEffect(() => {
        if (initialSession && initialSession.messages && initialSession.messages.length > 0) {
            // Load history
            const loaded = initialSession.messages.map((m: any) => ({
                role: m.role,
                content: m.content,
                citations: m.citationsJson ? JSON.parse(m.citationsJson) : undefined
            }));
            setMessages(loaded);

            // Re-create actions based on state if possible, or just provide default continue
            if (initialSession.state !== 'Completed') {
                setSuggestedActions([
                    { id: 'resume', label: 'Resume flow', payload: { action: 'NEXT_SLIDE' } }
                ])
            }
        } else {
            // Trigger START_MODULE automatically on first load if no session
            handleActionFire({ action: 'START_MODULE' });
        }
    }, [initialSession]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

        // Parse Artifacts and Actions from the latest assistant message
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'assistant') {
                // Check for Artifact HTML
                const match = lastMsg.content.match(/<Artifact[^>]*>([\s\S]*?)(?:<\/Artifact>|$)/i);
                if (match && match[1]) {
                    onArtifactChange?.(match[1].trim());
                } else if (!isLoading) {
                    onArtifactChange?.(null); // Clear artifact if no match when finished
                }

                // Check for <Action> tags natively to trigger highlights on the iframe
                if (onAction) {
                    const actionMatches = Array.from(lastMsg.content.matchAll(/<Action\s+entityId=["']([^"']+)["']\s+action=["']([^"']+)["']\s*\/>/gi));
                    actionMatches.forEach(actionMatch => {
                        const [fullMatch, entityId, action] = actionMatch;
                        const actionKey = `${messages.length - 1}-${fullMatch}`;
                        if (!processedActions.has(actionKey)) {
                            setProcessedActions(prev => new Set(prev).add(actionKey));
                            onAction({ entityId, action });
                        }
                    });
                }
            } else if (!isLoading) {
                onArtifactChange?.(null);
            }
        }
    }, [messages, isLoading, suggestedActions, onArtifactChange, onAction, processedActions]);

    // Helper to strip artifact and action tags from UI display
    const stripArtifacts = (text: string) => {
        let stripped = text.replace(/<Artifact[^>]*>[\s\S]*?(?:<\/Artifact>|$)/gi, "*[Generating Visual Interactive...]*");
        stripped = stripped.replace(/<Action[^>]*\/>/gi, "");
        return stripped.trim();
    };

    const handleActionFire = async (payload: ActionPayload) => {
        setIsLoading(true);
        setSuggestedActions([]);
        try {
            const res = await processTutorAction(
                courseId, moduleId, courseTopic, moduleLevel, moduleObjectives, slides, payload
            );

            if (payload.action === 'NEXT_SLIDE' || payload.action === 'JUMP_TO_SLIDE' || payload.action === 'START_MODULE') {
                // Clear the chat completely when moving between slides
                setMessages([{
                    role: 'assistant',
                    content: res.tutorMessage,
                    citations: res.citations
                }]);
            } else if (payload.action !== 'TOGGLE_WEB_BROWSING' && payload.action !== 'SET_PACE') {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: res.tutorMessage,
                    citations: res.citations
                }]);
            }

            setSuggestedActions(res.suggestedActions);

            if (res.understandingScore !== undefined) {
                setUnderstandingScore(res.understandingScore);
            }

            if (payload.action === 'NEXT_SLIDE') {
                onSlideChange(Math.min(slides.length - 1, currentSlideIndex + 1));
            } else if (payload.action === 'JUMP_TO_SLIDE' && payload.data?.index !== undefined) {
                onSlideChange(payload.data.index);
            } else if (payload.action === 'START_MODULE') {
                onSlideChange(0);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const newMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setIsLoading(true);
        setSuggestedActions([]);

        // Insert empty assistant message to stream into
        setMessages(prev => [...prev, { role: 'assistant', content: "", citations: [] }]);

        try {
            const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
            const slideContextStr = slides[currentSlideIndex] ?
                `Slide Title: ${slides[currentSlideIndex].title}\nBullets:\n${slides[currentSlideIndex].bullets.join('\n')}\nNotes: ${slides[currentSlideIndex].speaker_notes || ''}`
                : "No specific slide open.";

            const res = await fetch('/api/student/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseTopic,
                    moduleLevel,
                    moduleObjectives,
                    slideContext: slideContextStr,
                    question: newMsg.content,
                    chatHistory,
                    allowWebBrowsing: allowWeb
                })
            });

            if (!res.ok) throw new Error("Failed to stream response");

            const contentType = res.headers.get("Content-Type");

            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                setMessages(prev => {
                    const latest = [...prev];
                    latest[latest.length - 1].content = data.tutorMessage || data.answer || "Error";
                    latest[latest.length - 1].citations = data.citations || [];
                    return latest;
                });
                if (data.suggestedActions) setSuggestedActions(data.suggestedActions);
                if (data.understandingScore) setUnderstandingScore(data.understandingScore);
            } else {
                // Read stream chunks
                const reader = res.body?.getReader();
                const decoder = new TextDecoder();

                if (reader) {
                    setIsLoading(false); // Stop bounce loader once first byte arrives
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = decoder.decode(value, { stream: true });
                        setMessages(prev => {
                            const latest = [...prev];
                            latest[latest.length - 1].content += chunk;
                            return latest;
                        });
                    }

                    // Default continue actions after free response
                    setSuggestedActions([
                        { id: 'continue', label: 'Got it, let\'s continue.', payload: { action: 'NEXT_SLIDE' } }
                    ])
                }
            }
        } catch (e) {
            setMessages(prev => {
                const latest = [...prev];
                latest[latest.length - 1].content = "I encountered an error connecting to my core.";
                return latest;
            });
            setSuggestedActions([{ id: 'resume', label: 'Try continuing', payload: { action: 'NEXT_SLIDE' } }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-800">Tutor Chat</h3>
                    <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                        {sessionState}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Understanding Meter */}
                    <div className="flex flex-col items-end" title="Calculated from Checkpoint answers">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">Mastery</span>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-700 ${understandingScore >= 80 ? 'bg-green-500' : understandingScore >= 50 ? 'bg-yellow-500' : understandingScore > 0 ? 'bg-orange-500' : 'bg-gray-300'}`}
                                style={{ width: `${Math.max(understandingScore, 5)}%` }} // Give it a tiny bit of width so it's visible even at 0
                            />
                        </div>
                    </div>

                    <Button variant="ghost" size="icon" onClick={() => setIsPrefsOpen(true)}>
                        <Settings className="w-4 h-4 text-gray-500" />
                    </Button>
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-indigo-100' : 'bg-blue-100'}`}>
                            {m.role === 'user' ? <User className="w-4 h-4 text-indigo-600" /> : <Bot className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div className={`max-w-[85%] rounded-2xl p-4 ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none shadow-sm border border-gray-100'}`}>
                            <div className={`prose prose-sm max-w-none ${m.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                                <ReactMarkdown>
                                    {stripArtifacts(m.content)}
                                </ReactMarkdown>
                            </div>

                            {/* Citations Footer */}
                            {m.citations && m.citations.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-gray-300">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Sources:</p>
                                    <ul className="space-y-1">
                                        {m.citations.map((cite, idx) => (
                                            <li key={idx}>
                                                <a href={cite.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline">
                                                    <LinkIcon className="w-3 h-3" />
                                                    {cite.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                    <div className="flex gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-blue-600 animate-pulse" />
                        </div>
                        <div className="bg-gray-100 rounded-2xl p-4 rounded-tl-none text-gray-500 text-sm flex items-center gap-2">
                            <div className="animate-bounce">●</div>
                            <div className="animate-bounce delay-75">●</div>
                            <div className="animate-bounce delay-150">●</div>
                        </div>
                    </div>
                )}

                {/* Quick Replies */}
                {!isLoading && suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 justify-end">
                        {suggestedActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleActionFire(action.payload)}
                                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full transition-colors border border-indigo-200"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full p-1 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !isLoading && handleSend()}
                        placeholder="Or type a question..."
                        className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Personalization Dialog Form */}
            <DialogPrimitive.Root open={isPrefsOpen} onOpenChange={setIsPrefsOpen}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
                    <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Tutor Personalization</h2>
                            <DialogPrimitive.Close className="rounded-full p-1 hover:bg-gray-100">
                                <X className="h-4 w-4 text-gray-500" />
                            </DialogPrimitive.Close>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="web-browse" className="font-medium">Web Browsing</Label>
                                <Switch
                                    id="web-browse"
                                    checked={allowWeb}
                                    onCheckedChange={(val) => {
                                        setAllowWeb(val);
                                        handleActionFire({ action: 'TOGGLE_WEB_BROWSING', data: { value: val } });
                                    }}
                                />
                            </div>
                            <p className="text-xs text-gray-500">Allow the bot to search the internet for current examples.</p>
                        </div>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        </div>
    );
}
