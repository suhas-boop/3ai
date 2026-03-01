'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function saveAssetContent(assetId: string, content: string) {
    const asset = await prisma.asset.update({
        where: { id: assetId },
        data: { content }
    })

    // Revalidate the module page
    revalidatePath(`/teacher/course/[courseId]/module/[moduleId]`, 'page')
    return asset
}

export async function toggleRecommendation(recommendationId: string, savedByTeacher: boolean) {
    const rec = await prisma.recommendation.update({
        where: { id: recommendationId },
        data: { savedByTeacher }
    })

    revalidatePath(`/teacher/course/[courseId]/module/[moduleId]`, 'page')
    return rec
}

export async function confirmCourseTopic(courseId: string, topic: string) {
    const course = await prisma.course.update({
        where: { id: courseId },
        data: { topic }
    })

    revalidatePath(`/teacher/course/${courseId}`)
    return course
}
