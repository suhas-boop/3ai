
import React from 'react';
import { BookOpen } from 'lucide-react';
import { ContextSection, type ContextSectionProps } from './ContextSection';

interface CourseCreationProps {
    topic: string;
    setTopic: (t: string) => void;
    audienceLevel: string;
    setAudienceLevel: (l: string) => void;
    duration: string;
    setDuration: (d: string) => void;
    loading: boolean;
    error: string;
    generateCourse: () => void;
    contextSectionProps: ContextSectionProps;
}

export const CourseCreation: React.FC<CourseCreationProps> = ({
    topic,
    setTopic,
    audienceLevel,
    setAudienceLevel,
    duration,
    setDuration,
    loading,
    error,
    generateCourse,
    contextSectionProps
}) => {
    return (
        <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-indigo-900 mb-4">Create Your Course</h2>
                    <p className="text-gray-600 mb-8">
                        Define your topic, target audience, and duration. Upload materials to tailor the curriculum to your specific needs.
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <h2 className="font-semibold text-lg text-gray-800">Course Settings</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Python for Data Science"
                            className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Audience</label>
                            <select value={audienceLevel} onChange={(e) => setAudienceLevel(e.target.value)} className="w-full p-3 border rounded-lg bg-white">
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                            <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-3 border rounded-lg bg-white">
                                <option value="5-Session">5-Session</option>
                                <option value="Quarter">Quarter</option>
                                <option value="Semester">Semester</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    onClick={generateCourse}
                    disabled={loading || !topic}
                    className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {loading ? <span className="animate-pulse">Building your academy...</span> : <> <BookOpen className="w-5 h-5" /> Generate Course Plan </>}
                </button>
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="space-y-6">
                <ContextSection {...contextSectionProps} />
            </div>
        </div>
    );
};
