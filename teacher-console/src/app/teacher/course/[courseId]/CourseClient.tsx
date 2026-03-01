/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowRight, FileText, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { confirmCourseTopic } from '@/lib/module-actions'

export default function CourseClient({ initialCourse, initialModules, uploadInfo }: { initialCourse: any, initialModules: any[], uploadInfo?: any }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const showConfirmDialog = searchParams.get('confirmTopic') === 'true'

    const [course, setCourse] = useState(initialCourse)
    const [modules, setModules] = useState(initialModules)

    const [editedTopic, setEditedTopic] = useState(initialCourse.topic)
    const [isConfirming, setIsConfirming] = useState(false)

    const handleConfirmTopic = async () => {
        setIsConfirming(true)
        const updated = await confirmCourseTopic(course.id, editedTopic)
        setCourse(updated)
        setIsConfirming(false)
        router.replace(`/teacher/course/${course.id}`)
    }

    useEffect(() => {
        if (course.status !== 'Draft') return
        const interval = setInterval(async () => {
            const res = await fetch(`/api/course/${course.id}`)
            if (res.ok) {
                const data = await res.json()
                setCourse(data.course)
                setModules(data.modules)
                if (data.course.status === 'Published') {
                    clearInterval(interval)
                }
            }
        }, 2000)
        return () => clearInterval(interval)
    }, [course.status, course.id])

    return (
        <div className="flex-1 overflow-auto bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {uploadInfo && (
                    <Card className="border-green-200 bg-green-50/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                File Parsing Successful
                            </CardTitle>
                            <CardDescription>We extracted knowledge from your uploaded files to initialize this curriculum.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                {uploadInfo.files.map((f: any) => (
                                    <li key={f.id} className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">{f.fileName}</span>
                                        <span className="text-gray-500">({(f.rawText.length).toLocaleString()} characters extracted)</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">{course.title}</h1>
                        <p className="text-gray-500 mt-1">Topic: {course.topic} &bull; Audience: {course.targetAudience} &bull; {course.durationWeeks} Weeks</p>

                        {/* Level Breakdown Widget */}
                        <div className="flex items-center gap-2 mt-3 text-sm">
                            <span className="font-medium text-gray-700">Course Level Breakdown:</span>
                            {modules.length > 0 ? (
                                <>
                                    {(() => {
                                        const b = modules.filter((m: any) => m.level === 'Beginner').length;
                                        const i = modules.filter((m: any) => m.level === 'Intermediate').length;
                                        const a = modules.filter((m: any) => m.level === 'Advanced').length;
                                        const t = modules.length;
                                        return (
                                            <div className="flex gap-2">
                                                {b > 0 && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{Math.round((b / t) * 100)}% Beginner ({b})</span>}
                                                {i > 0 && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">{Math.round((i / t) * 100)}% Intermediate ({i})</span>}
                                                {a > 0 && <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">{Math.round((a / t) * 100)}% Advanced ({a})</span>}
                                            </div>
                                        );
                                    })()}
                                </>
                            ) : (
                                <span className="text-gray-400 italic">Calculating...</span>
                            )}
                        </div>
                    </div>
                    <Badge variant={course.status === 'Published' ? "default" : "secondary"}>
                        {course.status === 'Draft' && <Loader2 className="w-3 h-3 mr-1 animate-spin inline" />}
                        {course.status}
                    </Badge>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold border-b pb-2">Modules</h2>
                    <div className="grid gap-4">
                        {modules.map((mod: any) => (
                            <Link href={`/teacher/course/${course.id}/module/${mod.id}`} key={mod.id}>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="p-6 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-lg">{mod.title}</h3>
                                                <Badge variant="outline" className="text-xs">{mod.level}</Badge>
                                                {mod.assets?.length >= 3 && course.status === 'Published' && (
                                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0 text-xs shadow-none">High Quality</Badge>
                                                )}
                                            </div>
                                            <p className="text-gray-600 text-sm">{mod.subtopic}</p>
                                        </div>
                                        <ArrowRight className="text-gray-400 w-5 h-5" />
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}

                        {course.status === 'Draft' && modules.length > 0 && (
                            <div className="flex items-center justify-center p-4 text-gray-500 gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating more modules...
                            </div>
                        )}
                    </div>
                </div>

                {showConfirmDialog && (
                    <Dialog open={true} onOpenChange={() => router.replace(`/teacher/course/${course.id}`)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirm Course Topic</DialogTitle>
                                <DialogDescription>
                                    We analyzed the content and think this course is about the topic below. You can confirm or edit it.
                                </DialogDescription>
                            </DialogHeader>
                            <Input value={editedTopic} onChange={e => setEditedTopic(e.target.value)} />
                            <DialogFooter>
                                <Button onClick={handleConfirmTopic} disabled={isConfirming}>
                                    {isConfirming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Confirm Topic
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    )
}
