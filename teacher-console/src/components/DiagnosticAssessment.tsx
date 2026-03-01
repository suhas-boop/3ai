"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, CheckCircle, RefreshCcw } from 'lucide-react'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
}

export default function DiagnosticAssessment({ courseId, courseTopic, moduleLevel }: { courseId: string, courseTopic: string, moduleLevel: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const startAssessment = async () => {
        setIsOpen(true)
        if (messages.length === 0) {
            // Initial greeting prompt
            const initialMsg: Message = { id: Date.now().toString(), role: 'assistant', content: 'Starting diagnostic assessment...' }
            setMessages([initialMsg])

            setIsLoading(true)
            try {
                // We send a generic hello to trigger the first diagnostic question
                const res = await fetch('/api/student/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        courseId,
                        courseTopic,
                        moduleLevel,
                        moduleObjectives: "Assess prior knowledge",
                        slideContext: "Pre-assessment phase",
                        question: "Hello! I am ready for the diagnostic assessment.",
                        chatHistory: [],
                        mode: 'diagnostic'
                    })
                })

                if (!res.ok) throw new Error("API failed")
                if (!res.body) return

                const reader = res.body.getReader()
                const dec = new TextDecoder()
                let currentText = ''

                // Replace the starting message
                setMessages([{ id: Date.now().toString(), role: 'assistant', content: '' }])

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    currentText += dec.decode(value, { stream: true })
                    setMessages(prev => {
                        const newMsgs = [...prev]
                        newMsgs[newMsgs.length - 1].content = currentText
                        return newMsgs
                    })
                }
            } catch (e) {
                console.error(e)
            } finally {
                setIsLoading(false)
            }
        }
    }

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        const chatHistoryForApi = messages.map(m => ({
            role: m.role,
            content: m.content
        }))

        // Add empty assistant message
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: '' }])

        try {
            const res = await fetch('/api/student/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId,
                    courseTopic,
                    moduleLevel,
                    moduleObjectives: "Assess prior knowledge",
                    slideContext: "Pre-assessment phase",
                    question: userMsg.content,
                    chatHistory: chatHistoryForApi,
                    mode: 'diagnostic'
                })
            })

            if (!res.ok) throw new Error("API failed")
            if (!res.body) return

            const reader = res.body.getReader()
            const dec = new TextDecoder()
            let currentText = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                currentText += dec.decode(value, { stream: true })
                setMessages(prev => {
                    const newMsgs = [...prev]
                    newMsgs[newMsgs.length - 1].content = currentText
                    return newMsgs
                })
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-indigo-600" />
                        Diagnostic Pre-Assessment
                    </h3>
                    <p className="text-sm text-indigo-700 mt-1">
                        Take a quick interactive chat assessment to gauge your existing knowledge. We'll personalize your journey based on it!
                    </p>
                </div>
                <button
                    onClick={startAssessment}
                    className="shrink-0 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow transition-colors"
                >
                    Start Assessment
                </button>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-[500px]">
            <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Diagnostic Tutor
                </h3>
                <button
                    onClick={() => { setIsOpen(false); setMessages([]); }}
                    className="p-1.5 hover:bg-indigo-500 rounded-lg text-white transition-colors"
                    title="Restart"
                >
                    <RefreshCcw className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
                {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${m.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 text-sm shadow-sm text-gray-500 flex items-center gap-2">
                            <Bot className="w-4 h-4 animate-bounce" /> Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={sendMessage} className="flex gap-2 relative">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Type your answer..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    )
}
