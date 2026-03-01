'use server'
import { PrismaClient } from '@prisma/client'
import { processUploadBatch } from '@/lib/extraction'
import { inferTopicFromText } from '@/lib/inference'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

/* eslint-disable @typescript-eslint/no-explicit-any */
// Server action for handling multipart form data (the new approach)
export async function uploadCourseFiles(formData: FormData) {
    const teacher = await prisma.user.findFirst()
    if (!teacher) throw new Error("No teacher found in DB.")

    // Gather files from each section
    const slideFiles = formData.getAll('slides') as File[]
    const assignmentFiles = formData.getAll('assignments') as File[]
    const readingFiles = formData.getAll('readings') as File[]

    const allUploadedFields = [
        ...slideFiles.map(f => ({ file: f, category: 'Slides' })),
        ...assignmentFiles.map(f => ({ file: f, category: 'Assignment' })),
        ...readingFiles.map(f => ({ file: f, category: 'Reading' }))
    ].filter(item => item.file && item.file.size > 0);

    if (allUploadedFields.length === 0) {
        throw new Error("You must upload at least one file across any category.");
    }

    const processedFiles: any[] = [];
    const formattedAssets: any[] = [];
    let combinedTextForInference = "";

    // Iterate safely through each uploaded file based on category
    for (const item of allUploadedFields) {
        const buffer = Buffer.from(await item.file.arrayBuffer());

        // This processUploadBatch can return multiple if it's a ZIP. Flatten them.
        const extracted = await processUploadBatch(buffer, item.file.type || 'application/octet-stream', item.file.name);

        for (const extFile of extracted) {
            processedFiles.push(extFile);
            combinedTextForInference += `\n\n--- [${item.category}: ${extFile.fileName}] ---\n${extFile.text.substring(0, 1500)}`; // Only use first 1500 chars per file for topic inference to save LLM tokens.

            formattedAssets.push({
                type: item.category,
                title: extFile.fileName,
                content: extFile.text,
                metadata: JSON.stringify({ originalType: extFile.mimeType })
            });
        }
    }

    if (processedFiles.length === 0) {
        throw new Error("No readable text could be extracted from any of the uploaded files. They may be corrupted or completely image-based.");
    }

    // Combine sampled text for heuristic topic inference
    const parsedTopic = inferTopicFromText(combinedTextForInference);

    // Save the main upload record and its nested raw files
    const upload = await prisma.upload.create({
        data: {
            ownerId: teacher.id,
            fileName: `${allUploadedFields.length} Categorized Files`,
            mimeType: 'multipart/mixed',
            parsedTopic,
            files: {
                create: processedFiles.map(f => ({
                    fileName: f.fileName,
                    mimeType: f.mimeType,
                    rawText: f.text
                }))
            }
        }
    });

    // Scaffold the initial course based on the extracted texts
    const course = await prisma.course.create({
        data: {
            title: `Uploaded Course: ${parsedTopic}`,
            topic: parsedTopic,
            targetAudience: 'Mixed',
            durationWeeks: 4,
            source: 'Uploaded Categories',
            status: 'Published',
            ownerId: teacher.id,
            modules: {
                create: [
                    {
                        orderIndex: 0,
                        title: 'Extracted Material',
                        subtopic: parsedTopic,
                        level: 'Beginner',
                        estimatedMinutes: 60,
                        learningObjectives: JSON.stringify(['Understand uploaded materials']),
                        summary: 'A compilation of the slides, assignments, and reading materials you uploaded.',
                        assets: {
                            create: formattedAssets // the correctly categorized array dynamically built above! 
                        }
                    }
                ]
            }
        }
    });

    redirect(`/teacher/course/${course.id}?confirmTopic=true&uploadId=${upload.id}`)
}
