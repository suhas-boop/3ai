'use client'

import { createCourse } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"

export default function CreateCoursePage() {
    const [audience, setAudience] = useState('Beginner')

    return (
        <div className="flex-1 p-8 overflow-auto bg-slate-50">
            <div className="max-w-xl mx-auto">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl">Create a New Course</CardTitle>
                        <CardDescription>Fill out the parameters and our AI background task will generate the curriculum.</CardDescription>
                    </CardHeader>
                    <form action={createCourse}>
                        <CardContent className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="topic" className="font-semibold">Course Topic</Label>
                                <Input id="topic" name="topic" placeholder="e.g. Quantum Computing" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="targetAudience" className="font-semibold">Target Audience</Label>
                                <input type="hidden" name="targetAudience" value={audience} />
                                <Select required value={audience} onValueChange={setAudience}>
                                    <SelectTrigger id="targetAudience" className="w-full">
                                        <SelectValue placeholder="Select Audience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Beginner">Beginner</SelectItem>
                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        <SelectItem value="Advanced">Advanced</SelectItem>
                                        <SelectItem value="Mixed">Mixed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="durationWeeks" className="font-semibold">Duration (Weeks)</Label>
                                <Input id="durationWeeks" name="durationWeeks" type="number" min={1} max={52} defaultValue={4} required className="w-full" />
                            </div>

                            {audience === 'Beginner' && (
                                <div className="flex items-center space-x-2 pt-2 border-t mt-4">
                                    <Checkbox id="strictBeginner" name="strictBeginner" value="on" defaultChecked={true} />
                                    <Label htmlFor="strictBeginner" className="font-medium">
                                        Strict Beginner Focus
                                    </Label>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">Generate Curriculum</Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}
