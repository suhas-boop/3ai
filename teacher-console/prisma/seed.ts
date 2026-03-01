import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const teacher = await prisma.user.upsert({
        where: { email: 'teacher@autonomous.academy' },
        update: {},
        create: {
            email: 'teacher@autonomous.academy',
            name: 'Ada Lovelace',
        },
    })

    const student = await prisma.user.upsert({
        where: { email: 'student@autonomous.academy' },
        update: {},
        create: {
            email: 'student@autonomous.academy',
            name: 'Generic Student',
        }
    })

    // Seed student preferences
    await prisma.studentPreferences.upsert({
        where: { studentId: student.id },
        update: {},
        create: {
            studentId: student.id,
            pace: 'Normal',
            style: 'Lecture',
            verbosity: 'Balanced',
            allowWebBrowsing: true
        }
    })

    // Check if course already exists to avoid duplicate seeding
    const existingCourse = await prisma.course.findFirst()
    if (!existingCourse) {
        await prisma.course.create({
            data: {
                title: 'Introduction to Artificial Intelligence',
                topic: 'AI Basics',
                targetAudience: 'Beginner',
                durationWeeks: 4,
                source: 'Generated',
                status: 'Published',
                ownerId: teacher.id,
                modules: {
                    create: [
                        {
                            orderIndex: 0,
                            title: 'What is AI?',
                            subtopic: 'History and Definitions',
                            level: 'Beginner',
                            estimatedMinutes: 45,
                            learningObjectives: JSON.stringify(['Understand the history of AI', 'Define AI']),
                            summary: 'An introductory module covering the definitions and history of Artificial Intelligence.',
                            assets: {
                                create: [
                                    {
                                        type: 'Slides',
                                        title: 'Intro Slides',
                                        content: '# Welcome to AI\n\n- Definition\n- History',
                                        metadata: JSON.stringify({}),
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        })
        console.log('course seeded')
    }

    console.log('Seed completed successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
