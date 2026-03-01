import { PrismaClient } from '@prisma/client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, PlayCircle, Clock, BookOpen, User, CheckCircle2, FileText } from 'lucide-react'
import DiagnosticAssessment from '@/components/DiagnosticAssessment'

const prisma = new PrismaClient()

export default async function StudentCoursePage({ params }: { params: { courseId: string } }) {
    const course = await prisma.course.findUnique({
        where: { id: params.courseId },
        include: {
            modules: {
                orderBy: { orderIndex: 'asc' }
            }
        }
    });

    if (!course) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="px-8 py-6 bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <GraduationCap className="w-7 h-7 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                            <p className="text-gray-500 font-medium">Topic: {course.topic}</p>
                        </div>
                    </div>
                    <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        Back to Home
                    </Link>
                </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto py-10 px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Content: Syllabus */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Pre-Assessment Section */}
                        <DiagnosticAssessment
                            courseId={course.id}
                            courseTopic={course.topic}
                            moduleLevel={course.targetAudience}
                        />

                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 pt-4">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                            Course Modules
                        </h2>

                        <div className="space-y-4">
                            {course.modules.length === 0 ? (
                                <p className="text-gray-500">No modules generated yet.</p>
                            ) : (
                                course.modules.map((m, i) => (
                                    <Link
                                        key={m.id}
                                        href={`/student/course/${course.id}/module/${m.id}`}
                                        className="block bg-white border border-gray-200 hover:border-indigo-400 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                Module {i + 1}: {m.title}
                                            </h3>
                                            <span className="shrink-0 bg-indigo-50 text-indigo-700 font-medium px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                                <PlayCircle className="w-4 h-4" /> Start
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{m.summary}</p>
                                        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                            <span className="bg-gray-100 px-2 py-1 rounded">{m.level}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {m.estimatedMinutes} mins</span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Column: Metadata */}
                    <div className="space-y-6">
                        {/* Prerequisites Card */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-amber-500" />
                                Prerequisites
                            </h3>
                            <div className="text-sm text-gray-600">
                                {course.prerequisites ? (
                                    <ul className="space-y-2">
                                        {JSON.parse(course.prerequisites).map((req: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                <span>{req}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No explicit prerequisites.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4">Course Info</h3>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-center justify-between border-b pb-2">
                                    <span className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> Audience</span>
                                    <span className="font-medium text-gray-900">{course.targetAudience}</span>
                                </li>
                                <li className="flex items-center justify-between border-b pb-2">
                                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /> Duration</span>
                                    <span className="font-medium text-gray-900">{course.durationWeeks} weeks</span>
                                </li>
                                <li className="flex items-center justify-between pb-2">
                                    <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-gray-400" /> Modules</span>
                                    <span className="font-medium text-gray-900">{course.modules.length} lessons</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
