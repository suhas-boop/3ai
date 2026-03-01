import Link from 'next/link'
import { GraduationCap, Users, User } from 'lucide-react'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function Home() {
    // Fetch courses for the student view quick links
    const courses = await prisma.course.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3
    })

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans items-center justify-center p-8">
            <div className="max-w-3xl w-full space-y-10">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                        <GraduationCap className="w-12 h-12 text-indigo-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Autonomous Academy</h1>
                    <p className="text-lg text-gray-500 max-w-xl mx-auto">
                        Welcome to the unified learning platform. Are you here to teach a new subject, or to learn something new?
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Teacher Portal */}
                    <Link href="/teacher" className="group relative bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Users className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Teacher Console</h2>
                        <p className="text-gray-500">Design curriculums, generate courses with AI, and define learning objectives.</p>
                    </Link>

                    {/* Student Portal */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6">
                            <User className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Student View</h2>
                        <p className="text-gray-500 mb-6">Browse and interact with generated courses alongside your AI Tutor.</p>

                        <div className="w-full text-left bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <h3 className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-wider">Available Courses</h3>
                            {courses.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">No courses created yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {courses.map(c => (
                                        <Link
                                            key={c.id}
                                            href={`/student/course/${c.id}`}
                                            className="block text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-white p-2 rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-sm"
                                        >
                                            → {c.title}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
