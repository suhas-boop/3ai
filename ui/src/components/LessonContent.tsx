
import React from 'react';
import { PlayCircle, CheckCircle } from 'lucide-react';
import { Markdown } from '../Markdown';
import type { Module, Lesson, SourceRef } from '../types';

interface LessonContentProps {
    module: Module;
    lesson?: Lesson;
    loading: boolean;
    onGenerate: () => void;
    activeTab: 'notes' | 'readings' | 'slides' | 'assignments';
    setActiveTab: (tab: 'notes' | 'readings' | 'slides' | 'assignments') => void;
    onStartQuiz: (source: SourceRef) => void;
}

export const LessonContent: React.FC<LessonContentProps> = ({
    module,
    lesson,
    loading,
    onGenerate,
    activeTab,
    setActiveTab,
    onStartQuiz
}) => {
    if (!lesson) {
        return (
            <div className="py-8 text-center" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={(e) => { e.stopPropagation(); onGenerate(); }}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Generating Content...
                        </>
                    ) : (
                        <>
                            <PlayCircle className="w-4 h-4" />
                            Generate Lesson Content
                        </>
                    )}
                </button>
                <p className="mt-2 text-xs text-gray-500">Includes Readings, Lecture Notes, Slides, and Assignments.</p>
            </div>
        );
    }

    return (
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-gray-200 mb-4 pb-2">
                <div className="flex gap-4 overflow-x-auto">
                    {['notes', 'readings', 'slides', 'assignments'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('s', '') + (tab === 'notes' ? 's' : 's')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 min-h-[300px]">
                {activeTab === 'notes' && (
                    <Markdown content={lesson.content_md} className="prose prose-sm max-w-none text-gray-700" />
                )}

                {activeTab === 'readings' && (
                    <ul className="space-y-3">
                        {lesson.reading_list.map((source, i) => (
                            <li key={i} className="flex gap-3 items-start justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div className="flex gap-3">
                                    <div className="shrink-0 w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">{i + 1}</div>
                                    <div>
                                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:underline block break-all">
                                            {source.title}
                                        </a>
                                        <p className="text-sm text-gray-600 mt-1">Recommended resource.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onStartQuiz(source)}
                                    className="shrink-0 px-3 py-1.5 text-xs font-medium bg-white border border-green-600 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1 min-w-[80px] justify-center"
                                >
                                    <CheckCircle className="w-3 h-3" /> Quiz
                                </button>
                            </li>
                        ))}
                        {lesson.reading_list.length === 0 && <p className="text-gray-500 italic">No specific readings.</p>}
                    </ul>
                )}

                {activeTab === 'slides' && (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={() => window.open(`http://127.0.0.1:8000/api/download-slides/${module.id}`, '_blank')}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                            >
                                Download Slides
                            </button>
                        </div>
                        {lesson.slides.map((slide, i) => (
                            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-900 text-white p-4">
                                    <h4 className="font-bold text-lg">{slide.title}</h4>
                                </div>
                                <div className="p-6 bg-white">
                                    <ul className="list-disc list-inside space-y-2 text-gray-800">
                                        {slide.bullets.map((bullet, j) => <li key={j}>{bullet}</li>)}
                                    </ul>
                                </div>
                                {slide.speaker_notes && (
                                    <div className="bg-yellow-50 p-3 border-t border-yellow-100 text-sm text-yellow-900 italic">
                                        <span className="font-semibold not-italic">Speaker Notes:</span> {slide.speaker_notes}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'assignments' && (
                    <div className="space-y-8">
                        {/* Quizzes */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" /> Knowledge Check
                            </h3>
                            <div className="space-y-4">
                                {lesson.quizzes.map((quiz, i) => (
                                    <div key={i} className={`p-4 rounded-lg border ${quiz.type === 'code' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-gray-50 border-gray-200'}`}>
                                        <p className="font-medium mb-3 whitespace-pre-wrap">{quiz.stem}</p>
                                        {quiz.type === 'mcq' && quiz.options && (
                                            <ul className="space-y-2 mb-3">
                                                {quiz.options.map((opt, j) => <li key={j} className="text-sm bg-white p-2 rounded text-gray-700">{opt}</li>)}
                                            </ul>
                                        )}
                                        <p className="text-sm text-green-600">Answer: {quiz.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Project */}
                        {lesson.project && (
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Hands-on Project</h3>
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                                    <h4 className="text-xl font-bold text-indigo-900 mb-2">{lesson.project?.title}</h4>
                                    <p className="text-indigo-800 mb-4">{lesson.project?.scenario}</p>
                                    <ul className="list-disc list-inside text-indigo-800">
                                        {lesson.project?.deliverables.map((d, i) => <li key={i}>{d}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
