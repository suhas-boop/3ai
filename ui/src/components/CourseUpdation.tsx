import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Clock, CheckCircle, Layers } from 'lucide-react';
import type { CourseResponse, Module, Lesson, SourceRef, SidebarResourcesResponse } from '../types';
import { ContextSection, type ContextSectionProps } from './ContextSection';
import { LessonContent } from './LessonContent';
import { SidebarResources } from './SidebarResources';

interface CourseUpdationProps {
    course: CourseResponse;
    isEditing: boolean;
    setIsEditing: (e: boolean) => void;
    editedModules: Module[];
    setEditedModules: React.Dispatch<React.SetStateAction<Module[]>>;
    saveCourseChanges: () => void;
    expandedModuleId: string | null;
    setExpandedModuleId: (id: string | null) => void;
    moduleContent: Record<string, Lesson>;
    generateModuleContent: (mod: Module) => void;
    contentLoading: string | null;
    activeTab: 'notes' | 'readings' | 'slides' | 'assignments';
    setActiveTab: (tab: 'notes' | 'readings' | 'slides' | 'assignments') => void;
    startQuizForLink: (moduleId: string, link: SourceRef) => void;
    contextSectionProps: ContextSectionProps;
}

export const CourseUpdation: React.FC<CourseUpdationProps> = ({
    course,
    isEditing,
    setIsEditing,
    editedModules,
    setEditedModules,
    saveCourseChanges,
    expandedModuleId,
    setExpandedModuleId,
    moduleContent,
    generateModuleContent,
    contentLoading,
    activeTab,
    setActiveTab,
    startQuizForLink,
    contextSectionProps
}) => {
    // Sidebar State
    const [sidebarResources, setSidebarResources] = useState<SidebarResourcesResponse | null>(null);
    const [sidebarLoading, setSidebarLoading] = useState(false);

    // Fetch resources when module expands
    useEffect(() => {
        if (!expandedModuleId) {
            setSidebarResources(null);
            return;
        }

        const fetchSidebar = async () => {
            const module = (isEditing ? editedModules : course.modules).find(m => m.id === expandedModuleId);
            if (!module) return;

            setSidebarLoading(true);
            try {
                const res = await axios.post<SidebarResourcesResponse>('http://127.0.0.1:8000/api/sidebar-resources', {
                    topic: module.title
                });
                setSidebarResources(res.data);
            } catch (err) {
                console.error("Failed to fetch sidebar resources:", err);
            } finally {
                setSidebarLoading(false);
            }
        };

        fetchSidebar();
    }, [expandedModuleId, isEditing, editedModules, course.modules]);

    const activeModuleTitle = expandedModuleId
        ? (isEditing ? editedModules : course.modules).find(m => m.id === expandedModuleId)?.title || "Module"
        : "";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Charter Section - Full Width */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-indigo-900">Course Charter</h2>
                </div>
                <div className="p-6 grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Audience</h3>
                        <p className="text-gray-800">{course.charter.audience}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Time Budget</h3>
                        <div className="flex items-center gap-2 text-gray-800">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{course.charter.time_budget_hours} hours</span>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Learning Outcomes</h3>
                        <ul className="grid sm:grid-cols-2 gap-2">
                            {course.charter.outcomes.map((outcome, i) => (
                                <li key={i} className="flex items-start gap-2 bg-gray-50 p-2 rounded">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                    <span className="text-sm text-gray-700">{outcome}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <div className="grid lg:grid-cols-12 gap-6">
                {/* Left Sidebar: Context (2 cols) */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="sticky top-6">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Research & Inputs</h3>
                        <ContextSection {...contextSectionProps} />
                    </div>
                </div>

                {/* Main Content: Syllabus (6 cols) */}
                <div className="lg:col-span-6 space-y-6">
                    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
                        <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="w-5 h-5 text-purple-600" />
                                <h2 className="text-lg font-semibold text-purple-900">Syllabus</h2>
                            </div>
                            <button
                                onClick={() => isEditing ? saveCourseChanges() : setIsEditing(true)}
                                className="text-sm font-medium text-purple-700 hover:text-purple-900"
                            >
                                {isEditing ? "Save Changes" : "Edit Plan"}
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {(isEditing ? editedModules : course.modules).map((mod, idx) => (
                                <div key={mod.id} className="group">
                                    {isEditing ? (
                                        <div className="p-6 bg-purple-50/30">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-sm font-bold text-gray-400">#{idx + 1}</span>
                                                <input
                                                    type="text"
                                                    value={mod.title}
                                                    onChange={(e) => {
                                                        const newModules = [...editedModules];
                                                        newModules[idx] = { ...newModules[idx], title: e.target.value };
                                                        setEditedModules(newModules);
                                                    }}
                                                    className="flex-1 font-semibold text-gray-900 border rounded px-2 py-1"
                                                />
                                                <input
                                                    type="number"
                                                    value={mod.duration_minutes}
                                                    onChange={(e) => {
                                                        const newModules = [...editedModules];
                                                        newModules[idx] = { ...newModules[idx], duration_minutes: parseInt(e.target.value) || 0 };
                                                        setEditedModules(newModules);
                                                    }}
                                                    className="w-20 text-xs font-medium bg-white border rounded px-2 py-1"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={`p-6 hover:bg-gray-50 transition-colors flex justify-between items-start cursor-pointer ${expandedModuleId === mod.id ? 'bg-purple-50/50' : ''}`}
                                            onClick={() => setExpandedModuleId(expandedModuleId === mod.id ? null : mod.id)}
                                        >
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className={`font-semibold transition-colors ${expandedModuleId === mod.id ? 'text-purple-700' : 'text-gray-900 group-hover:text-indigo-600'}`}>{mod.title}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{mod.duration_minutes} min</span>
                                                    </div>
                                                </div>
                                                <ul className="space-y-1 ml-4 list-disc list-outside text-sm text-gray-600 marker:text-gray-300">
                                                    {mod.objectives.slice(0, 2).map((obj, i) => (
                                                        <li key={i}>{obj}</li>
                                                    ))}
                                                    {mod.objectives.length > 2 && <li>...</li>}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {!isEditing && expandedModuleId === mod.id && (
                                        <div className="px-6 pb-6 bg-gray-50 border-t border-gray-100">
                                            <LessonContent
                                                module={mod}
                                                lesson={moduleContent[mod.id]}
                                                loading={contentLoading === mod.id}
                                                onGenerate={() => generateModuleContent(mod)}
                                                activeTab={activeTab}
                                                setActiveTab={setActiveTab}
                                                onStartQuiz={(source) => startQuizForLink(mod.id, source)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {isEditing && (
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                                <button
                                    onClick={() => {
                                        const newModule: Module = {
                                            id: `new-mod-${Date.now()}`,
                                            title: "New Module",
                                            duration_minutes: 45,
                                            objectives: ["New Objective"],
                                            dependencies: [],
                                            checkpoints: [],
                                            references: []
                                        };
                                        setEditedModules([...editedModules, newModule]);
                                    }}
                                    className="px-4 py-2 bg-white border border-dashed border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 font-medium flex items-center gap-2"
                                >
                                    <Layers className="w-4 h-4" /> Add Module
                                </button>
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Sidebar: Module Resources (3 cols) */}
                <div className="lg:col-span-3 space-y-6">
                    <SidebarResources
                        resources={sidebarResources}
                        loading={sidebarLoading}
                        topic={activeModuleTitle}
                    />
                </div>
            </div>
        </div>
    );
};
