import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: Request, { params }: { params: { courseId: string } }) {
    const course = await prisma.course.findUnique({
        where: { id: params.courseId },
        include: {
            modules: {
                orderBy: { orderIndex: 'asc' }
            }
        }
    })

    if (!course) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ course, modules: course.modules })
}
