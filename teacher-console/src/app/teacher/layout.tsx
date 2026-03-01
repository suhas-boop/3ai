import Link from "next/link"
import { BookOpen, PlusCircle, Edit } from "lucide-react"
import { PrismaClient } from "@prisma/client"
import { CourseSidebarItem } from "@/components/CourseSidebarItem"

const prisma = new PrismaClient()

export default async function TeacherLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const courses = await prisma.course.findMany({
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="flex min-h-screen bg-gray-50/50 text-slate-900">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 border-r bg-white flex flex-col">
                <div className="p-4 border-b">
                    <Link href="/teacher" className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <h1 className="text-xl font-bold">Auto Academy</h1>
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">Teacher Console</p>
                </div>

                <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
                    <div>
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Workflows</h2>
                        <Link href="/teacher/create" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700 transition-colors">
                            <PlusCircle className="w-4 h-4" />
                            Course Creation
                        </Link>
                        <Link href="/teacher/update" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700 transition-colors">
                            <Edit className="w-4 h-4" />
                            Course Updation
                        </Link>
                    </div>

                    <div>
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">My Courses</h2>
                        <div className="space-y-1">
                            {courses.length === 0 ? (
                                <div className="px-3 text-sm text-gray-500 italic">No courses yet</div>
                            ) : (
                                courses.map((course: { id: string, title: string }) => (
                                    <CourseSidebarItem key={course.id} course={course} />
                                ))
                            )}
                        </div>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {children}
            </main>
        </div>
    )
}
