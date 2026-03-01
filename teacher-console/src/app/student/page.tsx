import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { GraduationCap, BookOpen, Clock, User } from 'lucide-react'

const prisma = new PrismaClient()

export default async function StudentCatalogPage() {
    const courses = await prisma.course.findMany({
        include: { modules: true },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="px-8 py-6 bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Student Catalog</h1>
                        <p className="text-gray-500 font-medium">Browse available AI-generated courses</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto py-10 px-8">
                {courses.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Courses Available</h2>
                        <p>Ask your teacher to generate and publish a course first.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <Link
                                key={course.id}
                                href={`/student/course/${course.id}`}
                                className="block bg-white border border-gray-200 hover:border-indigo-400 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all group flex flex-col h-full"
                            >
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                        {course.title}
                                    </h3>
                                    <p className="text-indigo-600 text-sm font-medium mb-4">{course.topic}</p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-500">
                                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                        <User className="w-3 h-3" /> {course.targetAudience}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {course.durationWeeks} Weeks
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> {course.modules.length} Mods
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
