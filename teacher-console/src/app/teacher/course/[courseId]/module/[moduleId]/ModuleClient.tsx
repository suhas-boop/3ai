/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { saveAssetContent, toggleRecommendation } from '@/lib/module-actions'
import { FileText, Save, ExternalLink } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function ModuleClient({ moduleData }: { moduleData: any }) {
    const [assets, setAssets] = useState<any[]>(moduleData.assets)
    const [recommendations, setRecommendations] = useState<any[]>(moduleData.recommendations)
    const [isSaving, setIsSaving] = useState(false)
    const [showSavedOnly, setShowSavedOnly] = useState(false)

    const handleAssetChange = (id: string, newContent: string) => {
        setAssets(assets.map(a => a.id === id ? { ...a, content: newContent } : a))
    }

    const saveAsset = async (id: string, content: string) => {
        setIsSaving(true)
        try {
            await saveAssetContent(id, content)
            toast.success('Asset saved successfully')
        } catch (e) {
            toast.error('Failed to save asset')
        } finally {
            setIsSaving(false)
        }
    }

    const toggleRec = async (id: string, currentStatus: boolean) => {
        try {
            const newStatus = !currentStatus
            setRecommendations(recommendations.map(r => r.id === id ? { ...r, savedByTeacher: newStatus } : r))
            await toggleRecommendation(id, newStatus)
            if (newStatus) toast.success('Recommendation saved')
        } catch (e) {
            toast.error('Failed to update recommendation')
        }
    }

    const getAsset = (type: string) => assets.find(a => a.type === type)

    const displayedRecs = showSavedOnly ? recommendations.filter(r => r.savedByTeacher) : recommendations

    const parseJSON = (str: string) => {
        try { return JSON.parse(str) } catch (e) { return null }
    }

    const downloadPPTX = async (slidesJsonString: string) => {
        setIsSaving(true);
        try {
            const slides = parseJSON(slidesJsonString);
            if (!slides || !Array.isArray(slides)) throw new Error("Invalid slides format");

            const res = await fetch('http://127.0.0.1:8000/api/build-pptx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(slides)
            });

            if (!res.ok) throw new Error("Failed to generate PPTX");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `module_${moduleData.id}_slides.pptx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success("PPTX downloaded");
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Failed to download PPTX");
        } finally {
            setIsSaving(false);
        }
    }

    const renderAssetEditor = (type: string, placeholder: string) => {
        const asset = getAsset(type)
        if (!asset) return <p className="text-gray-500 italic">No {type} asset generated yet.</p>

        const isEditingRaw = asset.editMode || false;

        const toggleEditMode = () => {
            setAssets(assets.map(a => a.id === asset.id ? { ...a, editMode: !isEditingRaw } : a))
        }

        const data = parseJSON(asset.content);

        return (
            <div className="space-y-4">
                <div className="flex justify-end gap-2 mb-2">
                    <Button variant="outline" size="sm" onClick={toggleEditMode}>
                        {isEditingRaw ? 'Show Preview' : 'Edit Raw JSON'}
                    </Button>
                    {type === 'Slides' && !isEditingRaw && (
                        <Button size="sm" variant="secondary" onClick={() => downloadPPTX(asset.content)} disabled={isSaving}>
                            Download PPTX
                        </Button>
                    )}
                </div>

                {!isEditingRaw && data ? (
                    <div className="bg-gray-50 p-4 rounded-lg border max-h-[600px] overflow-y-auto w-full">
                        {type === 'Slides' && Array.isArray(data) && (
                            <div className="space-y-6">
                                {data.map((slide: any, i: number) => (
                                    <div key={i} className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                                        <div className="bg-slate-900 px-6 py-4 text-white">
                                            <h4 className="text-xl font-bold">{slide.title}</h4>
                                        </div>
                                        <div className="p-6">
                                            <ul className="list-disc list-inside space-y-3 text-slate-800 text-lg">
                                                {(slide.bullets || []).map((b: string, idx: number) => (
                                                    <li key={idx} className="leading-relaxed">
                                                        <div className="inline-block align-top prose-sm prose-slate max-w-none">
                                                            <ReactMarkdown
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
                                                                                    className="rounded-lg shadow-md border border-slate-700 font-mono text-sm text-left"
                                                                                />
                                                                            )
                                                                        }
                                                                        return (
                                                                            <code className={`${className || ''} bg-slate-100 px-1.5 py-0.5 rounded text-red-600 font-mono text-sm break-words whitespace-pre-wrap`} {...props}>
                                                                                {children}
                                                                            </code>
                                                                        )
                                                                    },
                                                                    pre({ node, children }: any) {
                                                                        return <div className="not-prose my-4 w-full">{children}</div>
                                                                    },
                                                                    p({ node, children }: any) {
                                                                        return <span className="inline">{children}</span>
                                                                    }
                                                                }}
                                                                remarkPlugins={[remarkMath]}
                                                                rehypePlugins={[rehypeKatex]}
                                                            >
                                                                {b}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        {slide.speaker_notes && (
                                            <div className="bg-yellow-50/50 p-4 border-t border-yellow-100 text-sm italic text-yellow-900">
                                                <strong>Speaker Notes: </strong> {slide.speaker_notes}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {type === 'Reading' && Array.isArray(data) && (
                            <div className="space-y-4">
                                {data.map((ref: any, i: number) => (
                                    <Card key={i}>
                                        <CardContent className="p-4 flex flex-col gap-2">
                                            <a href={ref.url} target="_blank" rel="noreferrer" className="text-lg font-semibold text-blue-600 hover:underline">{ref.title}</a>
                                            <span className="text-sm text-gray-500 truncate">{ref.url}</span>
                                        </CardContent>
                                    </Card>
                                ))}
                                {data.length === 0 && <p className="italic text-gray-500">No reading links.</p>}
                            </div>
                        )}
                        {type === 'Assignment' && data && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Knowledge Check</h3>
                                    <div className="space-y-4">
                                        {(data.quizzes || []).map((q: any, i: number) => (
                                            <div key={i} className="bg-white p-4 border rounded shadow-sm">
                                                <p className="font-semibold mb-2">{i + 1}. {q.stem}</p>
                                                {q.options && q.options.length > 0 && (
                                                    <ul className="pl-6 list-disc text-sm text-gray-700 mb-2">
                                                        {q.options.map((opt: string, idx: number) => <li key={idx}>{opt}</li>)}
                                                    </ul>
                                                )}
                                                <p className="text-sm text-green-700 font-medium bg-green-50 p-2 inline-block rounded">Answer: {q.answer}</p>
                                                {q.rationale && <p className="text-xs text-gray-500 mt-2">{q.rationale}</p>}
                                            </div>
                                        ))}
                                        {(!data.quizzes || data.quizzes.length === 0) && <p className="text-sm italic text-gray-500">No quizzes generated.</p>}
                                    </div>
                                </div>
                                {data.project && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Hands-on Project</h3>
                                        <div className="bg-indigo-50/50 p-6 border rounded-xl shadow-sm">
                                            <h4 className="text-xl font-bold text-indigo-900 mb-2">{data.project.title}</h4>
                                            <p className="whitespace-pre-wrap text-indigo-800 mb-4">{data.project.scenario}</p>
                                            <h5 className="font-semibold text-indigo-900 mb-2">Deliverables:</h5>
                                            <ul className="list-disc list-inside text-sm text-indigo-800 space-y-1">
                                                {(data.project.deliverables || []).map((d: string, idx: number) => <li key={idx}>{d}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <Textarea
                            value={asset.content}
                            onChange={(e) => handleAssetChange(asset.id, e.target.value)}
                            className="min-h-[400px] font-mono text-sm leading-relaxed"
                            placeholder={placeholder}
                        />
                        <div className="flex justify-end">
                            <Button onClick={() => saveAsset(asset.id, asset.content)} disabled={isSaving} className="gap-2">
                                <Save className="w-4 h-4" /> Save {type} Database
                            </Button>
                        </div>
                    </>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                <Badge variant="outline" className="bg-white">{moduleData.level}</Badge>
                <Badge variant="outline" className="bg-white">{moduleData.estimatedMinutes} Mins</Badge>
            </div>

            <Card className="bg-white shadow-sm border-0">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        Learning Objectives
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        {JSON.parse(moduleData.learningObjectives).map((obj: string, i: number) => (
                            <li key={i}>{obj}</li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Tabs defaultValue="Slides" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="Slides">Lecture Slides</TabsTrigger>
                    <TabsTrigger value="Reading">Reading Material</TabsTrigger>
                    <TabsTrigger value="Assignment">Assignment</TabsTrigger>
                    <TabsTrigger value="Recommendations">Recommendations</TabsTrigger>
                </TabsList>

                <div className="mt-4 p-4 bg-white border rounded-lg shadow-sm">
                    <TabsContent value="Slides" className="mt-0">
                        <h3 className="font-semibold mb-4 text-lg">Edit Slides (Markdown)</h3>
                        {renderAssetEditor('Slides', 'Add slide markdown here')}
                    </TabsContent>

                    <TabsContent value="Reading" className="mt-0">
                        <h3 className="font-semibold mb-4 text-lg">Edit Reading Materials</h3>
                        {renderAssetEditor('Reading', 'Add reading links and summaries')}
                    </TabsContent>

                    <TabsContent value="Assignment" className="mt-0">
                        <h3 className="font-semibold mb-4 text-lg">Edit Assignment & Rubric</h3>
                        {renderAssetEditor('Assignment', 'Provide details and grading rubric')}
                    </TabsContent>

                    <TabsContent value="Recommendations" className="mt-0">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-semibold text-lg">Curated Materials & Projects</h3>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="saved-mode"
                                    checked={showSavedOnly}
                                    onCheckedChange={setShowSavedOnly}
                                />
                                <Label htmlFor="saved-mode">Show Saved Only</Label>
                            </div>
                        </div>

                        {displayedRecs.length === 0 ? (
                            <p className="text-center italic text-gray-500 py-8">No recommendations match your current filter.</p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {displayedRecs.map(rec => {
                                    const tags = JSON.parse(rec.tags)
                                    return (
                                        <Card key={rec.id} className={rec.savedByTeacher ? "border-blue-300 bg-blue-50/30" : ""}>
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <CardDescription>{rec.type}</CardDescription>
                                                        <CardTitle className="text-base break-words mt-1 leading-snug">{rec.title}</CardTitle>
                                                    </div>
                                                    <Switch
                                                        checked={rec.savedByTeacher}
                                                        onCheckedChange={() => toggleRec(rec.id, rec.savedByTeacher)}
                                                        aria-label="Save for review later"
                                                    />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{rec.summary}</p>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {tags.map((tag: string, idx: number) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                                                    ))}
                                                </div>
                                                {rec.url && (
                                                    <a href={rec.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                                        View Resource <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
