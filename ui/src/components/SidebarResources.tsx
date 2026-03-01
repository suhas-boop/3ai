import React from 'react';
import { BookOpen, Github, TrendingUp, ExternalLink } from 'lucide-react';
import type { SidebarResourcesResponse } from '../types';

interface SidebarResourcesProps {
    resources: SidebarResourcesResponse | null;
    loading: boolean;
    topic: string;
}

export const SidebarResources: React.FC<SidebarResourcesProps> = ({ resources, loading, topic }) => {
    if (loading) {
        return (
            <div className="p-4 space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-20 bg-gray-100 rounded"></div>
                <div className="h-20 bg-gray-100 rounded"></div>
            </div>
        );
    }

    if (!resources) {
        return (
            <div className="p-6 text-center text-gray-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a module to see relevant research.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 custom-scrollbar">
            <div className="sticky top-0 bg-gray-50 pb-2 z-10">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Research for "{topic}"
                </h3>
            </div>

            {/* Academic Papers */}
            {resources.academic?.length > 0 && (
                <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
                        <BookOpen className="w-4 h-4" /> Academic Papers
                    </h4>
                    <div className="space-y-2">
                        {resources.academic.map((paper, i) => (
                            <a
                                key={i}
                                href={paper.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-3 bg-white rounded-lg border border-indigo-100 hover:border-indigo-300 hover:shadow-sm transition-all group"
                            >
                                <h5 className="text-sm font-medium text-indigo-700 group-hover:underline line-clamp-2 leading-snug mb-1">
                                    {paper.title}
                                </h5>
                                <p className="text-xs text-gray-500 line-clamp-2">{paper.body}</p>
                                <div className="mt-2 flex justify-end">
                                    <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-indigo-400" />
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* GitHub Projects */}
            {resources.github?.length > 0 && (
                <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Github className="w-4 h-4" /> Open Source
                    </h4>
                    <div className="space-y-2">
                        {resources.github.map((repo, i) => (
                            <a
                                key={i}
                                href={repo.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-3 bg-gray-900 rounded-lg border border-gray-800 hover:ring-1 hover:ring-gray-600 transition-all group"
                            >
                                <h5 className="text-sm font-medium text-white group-hover:text-blue-300 mb-1">
                                    {repo.title}
                                </h5>
                                <p className="text-xs text-gray-400 line-clamp-2">{repo.body}</p>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Industry Trends */}
            {resources.industry?.length > 0 && (
                <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                        <TrendingUp className="w-4 h-4" /> Industry & Concepts
                    </h4>
                    <div className="space-y-2">
                        {resources.industry.map((article, i) => (
                            <a
                                key={i}
                                href={article.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-3 bg-emerald-50 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                            >
                                <h5 className="text-sm font-medium text-emerald-800 mb-1">
                                    {article.title}
                                </h5>
                                <p className="text-xs text-emerald-700/70 line-clamp-2">{article.body}</p>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {(!resources.academic?.length && !resources.github?.length && !resources.industry?.length) && (
                <p className="text-sm text-gray-500 italic">No specific resources found for this topic.</p>
            )}
        </div>
    );
};
