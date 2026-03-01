
import React from 'react';
import { FileText, X, Lightbulb } from 'lucide-react';
import { type UpdateSuggestion } from '../types';

export interface ContextSectionProps {
    uploading: boolean;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    pendingContext: {
        file: File;
        analysis: any;
        editedTopic: string;
        editedDescription: string;
    } | null;
    setPendingContext: React.Dispatch<React.SetStateAction<any>>;
    confirmContext: () => void;
    contextMaterials: string[];
    setContextMaterials: React.Dispatch<React.SetStateAction<string[]>>;
    researchQuery: string;
    setResearchQuery: (q: string) => void;
    performResearch: () => void;
    isResearching: boolean;
    researchType: 'web' | 'academic' | 'syllabus' | 'industry' | 'github';
    setResearchType: (t: 'web' | 'academic' | 'syllabus' | 'industry' | 'github') => void;
    suggestions: string[];
    additionalTopics: string[];
    addTopic: (t: string) => void;
    updateSuggestions: UpdateSuggestion[];
    loadingSuggestions: boolean;
    applySuggestion: (s: UpdateSuggestion) => void;
}

export const ContextSection: React.FC<ContextSectionProps> = ({
    uploading,
    handleFileUpload,
    pendingContext,
    setPendingContext,
    confirmContext,
    contextMaterials,
    setContextMaterials,
    researchQuery,
    setResearchQuery,
    performResearch,
    isResearching,
    researchType,
    setResearchType,
    suggestions,
    additionalTopics,
    addTopic,
    updateSuggestions,
    loadingSuggestions,
    applySuggestion
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4 h-fit">
            <h2 className="font-semibold text-lg text-gray-800">Context & Materials</h2>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
                <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} accept=".pdf,.pptx,.txt,.md" />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-1">
                    <FileText className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-indigo-600 font-medium">Upload Material (PDF, PPTX)</span>
                    <span className="text-xs text-gray-400">{uploading ? "Analyzing..." : "Drag & drop or click"}</span>
                </label>
            </div>

            {/* Context Review Modal */}
            {pendingContext && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-gray-900">Review Context</h3>
                            <button onClick={() => setPendingContext(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Topic</label>
                                <input
                                    value={pendingContext.editedTopic}
                                    onChange={(e) => setPendingContext({ ...pendingContext, editedTopic: e.target.value })}
                                    className="w-full border rounded p-2 text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                                <textarea
                                    value={pendingContext.editedDescription}
                                    onChange={(e) => setPendingContext({ ...pendingContext, editedDescription: e.target.value })}
                                    className="w-full border rounded p-2 text-sm h-24"
                                />
                            </div>
                            <div className="bg-indigo-50 p-3 rounded text-xs text-indigo-800">
                                <strong>Detected Concepts:</strong> {pendingContext.analysis?.concepts?.join(', ')}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setPendingContext(null)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded">Discard</button>
                            <button onClick={confirmContext} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700">Confirm & Add</button>
                        </div>
                    </div>
                </div>
            )}

            {contextMaterials.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {contextMaterials.map((c, i) => (
                        <div key={i} className="group relative">
                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded truncate max-w-[150px] inline-block border border-indigo-100" title={c}>
                                {c.split('\n')[0].replace('Topic: ', '')}
                            </span>
                            <button
                                onClick={() => setContextMaterials(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-2 h-2" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Research */}
            <div className="space-y-2">
                <div className="flex gap-2">
                    <select
                        value={researchType}
                        onChange={(e) => setResearchType(e.target.value as any)}
                        className="text-xs border rounded-lg px-2 py-2 bg-gray-50 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="web">Web Search</option>
                        <option value="academic">Academic Papers</option>
                        <option value="syllabus">University Syllabi</option>
                        <option value="industry">Industry Trends</option>
                        <option value="github">GitHub Projects</option>
                    </select>
                    <input
                        type="text"
                        value={researchQuery}
                        onChange={(e) => setResearchQuery(e.target.value)}
                        placeholder="Research topic..."
                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && performResearch()}
                    />
                    <button onClick={performResearch} disabled={isResearching} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                        {isResearching ? "..." : "Search"}
                    </button>
                </div>
            </div>

            {suggestions.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((s, i) => (
                            <button key={i} onClick={() => addTopic(s)} className={`text-xs px-2 py-1 rounded border transition-colors ${additionalTopics.includes(s) ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
                                + {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Suggestions Panel */}
            {(updateSuggestions.length > 0 || loadingSuggestions) && (
                <div className="mt-4 border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        Recommended Updates
                        {loadingSuggestions && <span className="text-xs font-normal text-gray-500 animate-pulse">...</span>}
                    </h3>
                    <div className="space-y-2">
                        {updateSuggestions.map((s, i) => (
                            <div key={i} className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg flex justify-between items-start gap-3">
                                <div>
                                    <h4 className="text-sm font-bold text-yellow-800">{s.title}</h4>
                                    <p className="text-xs text-yellow-700 mt-1">{s.description}</p>
                                </div>
                                <button
                                    onClick={() => applySuggestion(s)}
                                    className="shrink-0 text-xs bg-white border border-yellow-200 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-100 font-medium"
                                >
                                    Apply
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
