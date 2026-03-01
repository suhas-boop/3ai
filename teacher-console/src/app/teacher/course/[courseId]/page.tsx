import { PrismaClient } from '@prisma/client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation'
import CourseClient from './CourseClient'

const prisma = new PrismaClient()

export default async function CoursePage({ params, searchParams }: { params: { courseId: string }, searchParams: { uploadId?: string } }) {
    const course = await prisma.course.findUnique({
        where: { id: params.courseId }
    })

    if (!course) return notFound()

    const modules = await prisma.module.findMany({
        where: { courseId: course.id },
        orderBy: { orderIndex: 'asc' },
        include: { assets: true }
    })

    let uploadInfo = null
    if (searchParams.uploadId) {
        uploadInfo = await prisma.upload.findUnique({
            where: { id: searchParams.uploadId },
            include: { files: true } as any
        })
    }

    return <CourseClient initialCourse={course} initialModules={modules} uploadInfo={uploadInfo} />
}
