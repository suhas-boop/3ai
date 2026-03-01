'use client'

import Link from "next/link"
import { Book, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { deleteCourse } from "@/lib/actions"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CourseSidebarItemProps {
    course: {
        id: string;
        title: string;
    }
}

export function CourseSidebarItem({ course }: CourseSidebarItemProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await deleteCourse(course.id)
            if (res.success) {
                toast.success('Course deleted')
            } else {
                toast.error(res.error || 'Failed to delete course')
            }
        } catch (e) {
            toast.error('Failed to delete course')
        } finally {
            setIsDeleting(false)
            setShowConfirm(false)
        }
    }

    return (
        <>
            <div className="group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors">
                <Link href={`/teacher/course/${course.id}`} className="flex items-center gap-2 flex-1 min-w-0 pr-2 overflow-hidden text-gray-700">
                    <Book className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{course.title}</span>
                </Link>
                <button
                    onClick={() => setShowConfirm(true)}
                    disabled={isDeleting}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all disabled:opacity-50 flex-shrink-0"
                    title="Delete course"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the course "{course.title}" and all of its modules, assets, and recommendations. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
