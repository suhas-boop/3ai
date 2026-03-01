import { PrismaClient } from '@prisma/client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ModuleClient from './ModuleClient'

const prisma = new PrismaClient()

export default async function ModulePage({ params }: { params: { courseId: string, moduleId: string } }) {
    const courseModule = await prisma.module.findUnique({
        where: { id: params.moduleId },
        include: {
            assets: true,
            recommendations: true
        }
    })

    if (!courseModule) return notFound()

    return (
        <div className="flex-1 overflow-auto bg-slate-50 flex flex-col h-full">
            <div className="p-4 border-b bg-white flex items-center gap-4">
                <Link href={`/teacher/course/${params.courseId}`} className="text-gray-500 hover:text-blue-600 transition-colors">
                    <ArrowLeft className="w-5 h-5 flex-shrink-0" />
                </Link>
                <div>
                    <h2 className="text-xl font-bold">{courseModule.title}</h2>
                    <p className="text-sm text-gray-500">{courseModule.subtopic}</p>
                </div>
            </div>

            <div className="flex-1 p-8">
                <div className="max-w-5xl mx-auto">
                    <ModuleClient moduleData={courseModule} />
                </div>
            </div>
        </div>
    )
}
