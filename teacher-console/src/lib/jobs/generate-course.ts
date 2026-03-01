import { PrismaClient } from '@prisma/client'
import { determineModulesCount, determineClassLength, getLevelPlan } from './generator-rules'
import { fetchReadingLinks } from '../providers/reading'
import { fetchAcademicPapers } from '../providers/papers'
import { fetchGitHubProjects } from '../providers/github'

const prisma = new PrismaClient()

// Simple async sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function generateModuleTitle(topic: string, level: string, index: number): string {
    const bTitles = [
        `Introduction to ${topic}`,
        `Core Fundamentals of ${topic}`,
        `Setting Up and Basics`,
        `Essential Tools and Environment`,
        `Building Your First Project`,
        `Basic Patterns and Syntax`
    ];
    const iTitles = [
        `Intermediate Features in ${topic}`,
        `Data Flow and State Management`,
        `Building Robust Components`,
        `Real-world Application Architecture`,
        `Testing and Quality Assurance`,
        `Performance and Optimization`
    ];
    const aTitles = [
        `Advanced System Design for ${topic}`,
        `Scaling and High Availability`,
        `Security Deep Dive`,
        `Custom Extensions and Internals`,
        `Enterprise Level Architecture`,
        `Deploying to Production`
    ];

    if (level === 'Beginner') return bTitles[index % bTitles.length];
    if (level === 'Intermediate') return iTitles[index % iTitles.length];
    return aTitles[index % aTitles.length];
}

function generateModuleObjectives(topic: string, subtopic: string, level: string, index: number): string[] {
    if (level === 'Beginner') {
        return [
            `Define the core tenets of ${subtopic}`,
            `Identify basic use cases for ${topic} in standard environments`,
            `Differentiate between ${subtopic} and related foundational concepts`
        ];
    } else if (level === 'Intermediate') {
        return [
            `Implement standard workflows utilizing ${subtopic}`,
            `Analyze performance tradeoffs in ${topic} system design`,
            `Integrate ${subtopic} securely within existing architecture`
        ];
    } else {
        return [
            `Design globally scalable systems incorporating ${subtopic}`,
            `Evaluate edge-case vulnerabilities and mitigate risks in ${topic}`,
            `Orchestrate complex deployments and migrations involving ${subtopic}`
        ];
    }
}

export async function generateCourseBackground(courseId: string, topic: string, targetAudience: string, durationWeeks: number, strictBeginner: boolean = false) {
    // Use timeout to let the request complete and this runs in background
    setTimeout(async () => {
        try {
            const numModules = determineModulesCount(durationWeeks)
            const estimatedMinutes = determineClassLength(durationWeeks)
            const levelPlan = getLevelPlan(targetAudience, durationWeeks, numModules, strictBeginner)

            for (let i = 0; i < numModules; i++) {
                const level = levelPlan[i]

                await sleep(2000) // simulate time taken

                const subtopic = generateModuleTitle(topic, level, i)
                const moduleTitle = `Module ${i + 1}: ${subtopic}`

                const dbObjectives = generateModuleObjectives(topic, subtopic, level, i)

                const courseModule = await prisma.module.create({
                    data: {
                        courseId,
                        orderIndex: i,
                        title: moduleTitle,
                        subtopic: subtopic,
                        level,
                        estimatedMinutes,
                        learningObjectives: JSON.stringify(dbObjectives),
                        summary: `Comprehensive dive into ${subtopic} focusing on ${level.toLowerCase()} techniques.`
                    }
                })

                // Fetch external recommendations
                const papers = await fetchAcademicPapers(subtopic || topic)
                const repos = await fetchGitHubProjects(subtopic || topic)

                // Combine recommendations
                const recsToCreate = []
                for (const paper of papers) {
                    recsToCreate.push({
                        type: 'Paper',
                        title: paper.title,
                        summary: `${paper.year} | ${paper.venue}\n\n${paper.abstractSnippet}`,
                        tags: JSON.stringify(paper.tags),
                        url: paper.url,
                        publishedDate: new Date(paper.year, 0, 1),
                        savedByTeacher: false
                    })
                }
                for (const repo of repos) {
                    recsToCreate.push({
                        type: 'GitHubProject',
                        title: repo.name,
                        summary: `⭐ ${repo.stars} | Updated: ${repo.lastUpdated}\n\n${repo.description}`,
                        tags: JSON.stringify([]),
                        url: repo.url,
                        publishedDate: new Date(repo.lastUpdated),
                        savedByTeacher: false
                    })
                }

                // Call Python LLM backend for real content generation
                console.log(`Generating real LLC content for Module ${i + 1}...`)
                const llmPayload = {
                    module: {
                        id: courseModule.id,
                        title: courseModule.title,
                        objectives: JSON.parse(courseModule.learningObjectives),
                        duration_minutes: courseModule.estimatedMinutes,
                    },
                    course_topic: topic,
                    audience: targetAudience,
                    tone: 'supportive'
                };

                let slidesRaw = '[]';
                let readingRaw = '[]';
                let assignmentRaw = '{"parts":[]}';
                let markdownContent = '';

                try {
                    const res = await fetch('http://127.0.0.1:8000/api/generate-lesson', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(llmPayload)
                    });

                    if (res.ok) {
                        const lessonData = await res.json();
                        console.log("RECEIVED LESSON DATA FROM PYTHON:", JSON.stringify(lessonData, null, 2));
                        // serialize the returned parts
                        slidesRaw = JSON.stringify(lessonData.slides || []);
                        readingRaw = JSON.stringify(lessonData.reading_list || []);

                        // the python api returns project + quizzes, wrap it in a mock assignment spec for backward compat or just store raw
                        const assignmentSpec = {
                            quizzes: lessonData.quizzes || [],
                            project: lessonData.project || null
                        };
                        assignmentRaw = JSON.stringify(assignmentSpec);
                        markdownContent = lessonData.content_md || '';
                    } else {
                        console.error("LLM Generation failed for module", courseModule.id, await res.text());
                    }
                } catch (err) {
                    console.error("Failed to reach Python LLM backend:", err);
                }

                // Generate assets and recommendations
                await prisma.module.update({
                    where: { id: courseModule.id },
                    data: {
                        assets: {
                            create: [
                                { type: 'Slides', title: 'Lecture Presentation', content: slidesRaw, metadata: JSON.stringify({ md: markdownContent }) },
                                { type: 'Reading', title: 'Required Reading Links', content: readingRaw, metadata: JSON.stringify({}) },
                                { type: 'Assignment', title: `Module ${i + 1} Assessment`, content: assignmentRaw, metadata: JSON.stringify({}) }
                            ]
                        },
                        recommendations: {
                            create: recsToCreate
                        }
                    }
                })
            }

            await prisma.course.update({
                where: { id: courseId },
                data: { status: 'Published' }
            })

        } catch (e) {
            console.error("Generator job failed", e)
        }
    }, 0)
}
