export default function TeacherDashboard() {
    return (
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center bg-slate-50">
            <div className="max-w-md space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Welcome to the Teacher Console</h2>
                <p className="text-gray-500">
                    Select &quot;Course Creation&quot; to build a new curriculum from scratch, or &quot;Course Updation&quot; to import and modify an existing one.
                </p>
            </div>
        </div>
    )
}
