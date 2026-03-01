import { PrismaClient } from '@prisma/client'
import { notFound } from 'next/navigation'
import { StudentModuleClient } from '@/components/student/StudentModuleClient'
import { getSessionState } from '@/lib/tutors/actions'

const prisma = new PrismaClient()

export default async function StudentModulePage({ params }: { params: { courseId: string, moduleId: string } }) {
    const course = await prisma.course.findUnique({
        where: { id: params.courseId }
    });

    if (!course) {
        notFound()
    }

    const moduleData = await prisma.module.findUnique({
        where: { id: params.moduleId },
        include: { assets: true }
    });

    if (!moduleData) {
        notFound()
    }

    // Extract slides from assets
    const slideAsset = moduleData.assets.find(a => a.type === 'Slides')
    let slides = []
    if (slideAsset) {
        try {
            slides = JSON.parse(slideAsset.content)
        } catch (e) {
            console.error("Failed to parse slides:", e)
        }
    }

    const sessionContext = await getSessionState(params.moduleId)

    return (
        <StudentModuleClient
            course={course}
            moduleData={moduleData}
            slides={slides}
            initialSession={sessionContext}
        />
    )
}
