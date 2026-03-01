export interface UpdateSuggestionRequest {
    current_course: any;
    new_context: string;
    research_type: 'web' | 'academic' | 'syllabus' | 'industry';
}

export interface UpdateSuggestion {
    type: 'add_module' | 'update_content' | 'add_topic';
    title: string;
    description: string;
    suggested_module_data?: Partial<Module>;
}

export interface Slide {
    title: string;
    bullets: string[];
    speaker_notes?: string;
}

export interface SourceRef {
    id: string;
    title?: string;
    url?: string;
    quiz?: Item[];
}

export interface Module {
    id: string;
    title: string;
    objectives: string[];
    duration_minutes: number;
    dependencies?: string[];
    checkpoints?: string[];
    references?: SourceRef[];
}

export interface Charter {
    audience: string;
    outcomes: string[];
    time_budget_hours: number;
    tone: string;
}

export interface Item {
    id: string;
    type: string;
    stem: string;
    options?: string[];
    answer?: string;
    rationale?: string;
}

export interface ProjectBrief {
    title: string;
    scenario: string;
    deliverables: string[];
}

export interface Lesson {
    id: string;
    module_id: string;
    outline: string[];
    content_md: string;
    reading_list: SourceRef[];
    slides: Slide[];
    quizzes: Item[];
    project?: ProjectBrief;
}

export interface CourseResponse {
    charter: Charter;
    modules: Module[];
    sample_lesson: Lesson;
}

export interface QuizResult {
    score: number;
    total: number;
    answers: Record<string, string>; // itemId -> selectedOption
}

export interface SidebarResourcesResponse {
    academic: Array<{ title: string; href: string; body: string }>;
    github: Array<{ title: string; href: string; body: string }>;
    industry: Array<{ title: string; href: string; body: string }>;
}
