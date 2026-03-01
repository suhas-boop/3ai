'use server'

import { PrismaClient } from '@prisma/client'
import { redirect } from 'next/navigation'
import { generateCourseBackground } from './jobs/generate-course'

const prisma = new PrismaClient()

export async function createCourse(formData: FormData) {
    const topic = formData.get('topic') as string
    const targetAudience = (formData.get('targetAudience') as string) || 'Mixed'
    const durationWeeks = parseInt(formData.get('durationWeeks') as string, 10)
    const strictBeginner = formData.get('strictBeginner') === 'on'

    console.log("--- CREATE COURSE ACTION ---")
    console.log("FormData targetAudience:", formData.getAll('targetAudience'))
    console.log("Parsed targetAudience:", targetAudience)
    console.log("Topic:", topic)

    // Assuming teacher at index 0 for MVP
    const teacher = await prisma.user.findFirst()
    if (!teacher) throw new Error("No teacher found in DB. Run seed script.")

    // Fetch prerequisites from LLM backend
    let prerequisitesStr = '[]';
    try {
        const preReqRes = await fetch('http://127.0.0.1:8000/api/generate-prerequisites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: topic,
                audience_level: targetAudience
            })
        });
        if (preReqRes.ok) {
            const prereqs = await preReqRes.json();
            prerequisitesStr = JSON.stringify(prereqs);
        } else {
            console.error("Failed to generate prerequisites:", await preReqRes.text());
        }
    } catch (e) {
        console.error("Failed to reach LLM backend for prerequisites:", e);
    }

    const course = await prisma.course.create({
        data: {
            title: `Generated Course: ${topic}`,
            topic,
            targetAudience,
            durationWeeks,
            source: 'Generated',
            status: 'Draft',
            ownerId: teacher.id,
            prerequisites: prerequisitesStr
        }
    })

    // Start background job
    generateCourseBackground(course.id, topic, targetAudience, durationWeeks, strictBeginner)

    redirect(`/teacher/course/${course.id}`)
}

import { revalidatePath } from 'next/cache'

export async function deleteCourse(courseId: string) {
    try {
        await prisma.course.delete({
            where: { id: courseId }
        })
        revalidatePath('/teacher')
        return { success: true }
    } catch (e) {
        console.error("Failed to delete course:", e)
        return { success: false, error: "Failed to delete course" }
    }
}
