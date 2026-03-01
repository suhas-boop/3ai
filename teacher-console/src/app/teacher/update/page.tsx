import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadCourseFiles } from '@/lib/upload-action'

const prisma = new PrismaClient()

export default async function UpdateCoursePage() {
    const courses = await prisma.course.findMany({
        orderBy: { updatedAt: 'desc' }
    })

    return (
        <div className="flex-1 p-8 overflow-auto bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-8">

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl">Upload Existing Course Material</CardTitle>
                        <CardDescription>Upload files into categories to automatically parse and generate a course structure.</CardDescription>
                    </CardHeader>
                    <form action={uploadCourseFiles}>
                        <CardContent className="space-y-6">
                            <div className="space-y-2 border rounded-lg p-4 bg-white">
                                <Label htmlFor="slides" className="text-md font-semibold text-indigo-700">1. Course Slides & Lectures (<span className="text-gray-500 font-normal">Optional</span>)</Label>
                                <p className="text-xs text-gray-500 pb-2">PPTX, PDF, or Markdown files containing lecture content.</p>
                                <Input
                                    id="slides"
                                    name="slides"
                                    type="file"
                                    multiple
                                    accept=".pdf,.pptx,.md"
                                />
                            </div>

                            <div className="space-y-2 border rounded-lg p-4 bg-white">
                                <Label htmlFor="assignments" className="text-md font-semibold text-blue-700">2. Assignments & Quizzes (<span className="text-gray-500 font-normal">Optional</span>)</Label>
                                <p className="text-xs text-gray-500 pb-2">DOCX, PDF, or TXT files containing homework or tests.</p>
                                <Input
                                    id="assignments"
                                    name="assignments"
                                    type="file"
                                    multiple
                                    accept=".pdf,.docx,.txt,.md"
                                />
                            </div>

                            <div className="space-y-2 border rounded-lg p-4 bg-white">
                                <Label htmlFor="readings" className="text-md font-semibold text-emerald-700">3. Reading Materials (<span className="text-gray-500 font-normal">Optional</span>)</Label>
                                <p className="text-xs text-gray-500 pb-2">PDF, DOCX, or TXT containing textbook excerpts or articles.</p>
                                <Input
                                    id="readings"
                                    name="readings"
                                    type="file"
                                    multiple
                                    accept=".pdf,.docx,.txt,.md"
                                />
                            </div>

                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded italic mt-2">
                                Note: You must select at least one file across any of the categories above to proceed.
                            </p>

                            <Button type="submit" className="w-full">Parse & Upload Material</Button>
                        </CardContent>
                    </form>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl">Select an Existing Course</CardTitle>
                        <CardDescription>Choose a previously generated or uploaded course to edit and update.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {courses.length === 0 ? (
                                <p className="text-gray-500 italic">No courses available.</p>
                            ) : (
                                courses.map(course => (
                                    <Card key={course.id} className="hover:border-blue-300 transition-colors">
                                        <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
                                            <div>
                                                <h3 className="font-semibold text-lg line-clamp-1">{course.title}</h3>
                                                <p className="text-sm text-gray-500 mt-1">Topic: {course.topic}</p>
                                                <p className="text-sm text-gray-500">Source: {course.source}</p>
                                            </div>
                                            <Link href={`/teacher/course/${course.id}?confirmTopic=true`}>
                                                <Button variant="outline" className="w-full">Edit Course</Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
