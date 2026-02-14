import { useState } from 'react';
import axios from 'axios';
import { BookOpen, CheckCircle, Clock, FileText, Layers, PlayCircle, GraduationCap } from 'lucide-react';
import { Markdown } from './Markdown';

interface Slide {
  title: string;
  bullets: string[];
  speaker_notes?: string;
}

interface SourceRef {
  id: string;
  title?: string;
  url?: string;
}

interface Module {
  id: string;
  title: string;
  objectives: string[];
  duration_minutes: number;
}

interface Charter {
  audience: string;
  outcomes: string[];
  time_budget_hours: number;
  tone: string;
}

interface Item {
  id: string;
  type: string;
  stem: string;
  options?: string[];
  answer?: string;
  rationale?: string;
}

interface ProjectBrief {
  title: string;
  scenario: string;
  deliverables: string[];
}

interface Lesson {
  id: string;
  module_id: string;
  outline: string[];
  content_md: string;
  reading_list: SourceRef[];
  slides: Slide[];
  quizzes: Item[];
  project?: ProjectBrief;
}

interface CourseResponse {
  charter: Charter;
  modules: Module[];
  sample_lesson: Lesson;
}

function App() {
  const [topic, setTopic] = useState('');
  const [audienceLevel, setAudienceLevel] = useState('Beginner');
  const [duration, setDuration] = useState('5-Session');
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [error, setError] = useState('');

  // Content Generation State
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [moduleContent, setModuleContent] = useState<Record<string, Lesson>>({});
  const [contentLoading, setContentLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'readings' | 'slides' | 'assignments'>('notes');

  const generateCourse = async () => {
    // ... (unchanged)
    if (!topic) return;
    setLoading(true);
    setError('');
    setCourse(null);
    setModuleContent({});
    try {
      const res = await axios.post<CourseResponse>('http://localhost:8000/api/generate-course', {
        topic,
        audience_level: audienceLevel,
        course_duration: duration,
        tone: 'supportive'
      });
      setCourse(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate course');
    } finally {
      setLoading(false);
    }
  };

  const generateModuleContent = async (module: Module) => {
    // ... (unchanged)
    if (moduleContent[module.id]) {
      setExpandedModuleId(module.id);
      return;
    }

    setContentLoading(module.id);
    try {
      const res = await axios.post<Lesson>('http://localhost:8000/api/generate-lesson', {
        module,
        course_topic: topic,
        audience: audienceLevel,
        tone: 'supportive'
      });
      setModuleContent(prev => ({ ...prev, [module.id]: res.data }));
      setExpandedModuleId(module.id);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || err.message || "Failed to generate content";
      alert(`Error: ${msg}`);
    } finally {
      setContentLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-8">
      {/* ... Header and Input Section unchanged ... */}
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center space-x-3 mb-8">
          <GraduationCap className="w-10 h-10 text-indigo-600" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Autonomous Academy
          </h1>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md space-y-4">
          {/* ... Input fields ... */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to learn today?
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Python for Data Science, Ancient History..."
              className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              onKeyDown={(e) => e.key === 'Enter' && generateCourse()}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
              <select
                value={audienceLevel}
                onChange={(e) => setAudienceLevel(e.target.value)}
                className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
              >
                <option value="5-Session">5-Session (Short)</option>
                <option value="Quarter">Quarter (Medium)</option>
                <option value="Semester">Semester (Long)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={generateCourse}
                disabled={loading || !topic}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>

          {error && <p className="mt-3 text-red-500 text-sm flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500"></span>{error}</p>}
        </div>

        {/* Results Section */}
        {course && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ... Charter Section ... */}
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

            {/* ... Syllabus Section ... */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-purple-900">Syllabus</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {course.modules.map((mod) => (
                  <div key={mod.id} className="group">
                    <div className="p-6 hover:bg-gray-50 transition-colors flex justify-between items-start cursor-pointer" onClick={() => setExpandedModuleId(expandedModuleId === mod.id ? null : mod.id)}>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{mod.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{mod.duration_minutes} min</span>
                          </div>
                        </div>
                        <ul className="space-y-1 ml-4 list-disc list-outside text-sm text-gray-600 marker:text-gray-300">
                          {mod.objectives.map((obj, i) => (
                            <li key={i}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {expandedModuleId === mod.id && (
                      <div className="px-6 pb-6 bg-gray-50 border-t border-gray-100">
                        {!moduleContent[mod.id] ? (
                          <div className="py-8 text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); generateModuleContent(mod); }}
                              disabled={contentLoading === mod.id}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                              {contentLoading === mod.id ? (
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
                        ) : (
                          <div className="mt-4">
                            <div className="flex gap-4 border-b border-gray-200 mb-4 overflow-x-auto">
                              <button
                                onClick={() => setActiveTab('notes')}
                                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'notes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                              >
                                Lecture Notes
                              </button>
                              <button
                                onClick={() => setActiveTab('readings')}
                                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'readings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                              >
                                Reading List
                              </button>
                              <button
                                onClick={() => setActiveTab('slides')}
                                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'slides' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                              >
                                Slides
                              </button>
                              <button
                                onClick={() => setActiveTab('assignments')}
                                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'assignments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                              >
                                Assignments
                              </button>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 p-4 min-h-[300px]">
                              {activeTab === 'notes' && (
                                <Markdown content={moduleContent[mod.id].content_md} className="prose prose-sm max-w-none text-gray-700" />
                              )}

                              {activeTab === 'readings' && (
                                <ul className="space-y-3">
                                  {moduleContent[mod.id].reading_list.map((source, i) => (
                                    <li key={i} className="flex gap-3">
                                      <div className="shrink-0 w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">{i + 1}</div>
                                      <div>
                                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:underline block">
                                          {source.title}
                                        </a>
                                        <p className="text-sm text-gray-600 mt-1">Recommended resource for this module.</p>
                                      </div>
                                    </li>
                                  ))}
                                  {moduleContent[mod.id].reading_list.length === 0 && <p className="text-gray-500 italic">No specific readings generated.</p>}
                                </ul>
                              )}

                              {activeTab === 'slides' && (
                                <div className="space-y-6">
                                  <div className="flex justify-end">
                                    <button
                                      onClick={() => window.open(`http://localhost:8000/api/download-slides/${mod.id}`, '_blank')}
                                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                      Download Slides (PPTX)
                                    </button>
                                  </div>
                                  {moduleContent[mod.id].slides.map((slide, i) => (
                                    <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                                      <div className="bg-gray-900 text-white p-4">
                                        <h4 className="font-bold text-lg">{slide.title}</h4>
                                      </div>
                                      <div className="p-6 bg-white">
                                        <ul className="list-disc list-inside space-y-2 text-gray-800">
                                          {slide.bullets.map((bullet, j) => (
                                            <li key={j}>{bullet}</li>
                                          ))}
                                        </ul>
                                      </div>
                                      {slide.speaker_notes && (
                                        <div className="bg-yellow-50 p-3 border-t border-yellow-100 text-sm text-yellow-900 italic">
                                          <span className="font-semibold not-italic">Speaker Notes:</span> {slide.speaker_notes}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {moduleContent[mod.id].slides.length === 0 && <p className="text-gray-500 italic">No slides generated.</p>}
                                </div>
                              )}

                              {activeTab === 'assignments' && (
                                <div className="space-y-8">
                                  {/* Quizzes & Code Challenges */}
                                  <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                      Knowledge Check
                                    </h3>
                                    <div className="space-y-4">
                                      {moduleContent[mod.id].quizzes.map((quiz, i) => (
                                        <div key={i} className={`p-4 rounded-lg border ${quiz.type === 'code' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-gray-50 border-gray-200'}`}>
                                          <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-bold uppercase tracking-wide ${quiz.type === 'code' ? 'text-gray-400' : 'text-gray-500'}`}>
                                              {quiz.type === 'code' ? 'Coding Challenge' : `Question ${i + 1}`}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${quiz.type === 'code' ? 'bg-gray-800 text-blue-400' : 'bg-gray-200 text-gray-700'}`}>{quiz.type}</span>
                                          </div>

                                          <p className={`font-medium mb-3 whitespace-pre-wrap ${quiz.type === 'code' ? 'text-gray-100 font-mono text-sm' : 'text-gray-900'}`}>{quiz.stem}</p>

                                          {/* MCQ Options */}
                                          {quiz.type === 'mcq' && quiz.options && (
                                            <ul className="space-y-2 mb-3">
                                              {quiz.options.map((opt, j) => (
                                                <li key={j} className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded border border-gray-100">
                                                  <div className="w-4 h-4 rounded-full border border-gray-300"></div>
                                                  {opt}
                                                </li>
                                              ))}
                                            </ul>
                                          )}

                                          {/* Code Challenge: Starter & Solution */}
                                          {quiz.type === 'code' && quiz.options && (
                                            <div className="space-y-3 mt-3">
                                              <div className="bg-gray-950 rounded p-3 border border-gray-800">
                                                <p className="text-xs text-gray-500 mb-1">Starter Code:</p>
                                                <pre className="text-xs font-mono text-green-400 overflow-x-auto">
                                                  <code>{quiz.options[0]}</code>
                                                </pre>
                                              </div>
                                              <div className="bg-gray-800 rounded p-3 border border-gray-700">
                                                <details>
                                                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-white">View Solution</summary>
                                                  <pre className="mt-2 text-xs font-mono text-blue-300 overflow-x-auto">
                                                    <code>{quiz.options[1]}</code>
                                                  </pre>
                                                </details>
                                              </div>
                                            </div>
                                          )}

                                          <div className={`mt-3 pt-3 border-t text-sm ${quiz.type === 'code' ? 'border-gray-800' : 'border-gray-200'}`}>
                                            {quiz.type !== 'code' && <p className="text-green-700 font-medium">Correct Answer: {quiz.answer}</p>}

                                            {quiz.rationale && <p className={`${quiz.type === 'code' ? 'text-gray-400' : 'text-gray-500'} mt-1 italic`}>{quiz.rationale}</p>}
                                          </div>
                                        </div>
                                      ))}
                                      {moduleContent[mod.id].quizzes.length === 0 && <p className="text-gray-500 italic">No quizzes generated.</p>}
                                    </div>
                                  </div>

                                  {/* Project */}
                                  {/* Project */}
                                  {moduleContent[mod.id].project ? (
                                    <div className="border-t border-gray-200 pt-6">
                                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-indigo-600" />
                                        Hands-on Project
                                      </h3>
                                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                                        <h4 className="text-xl font-bold text-indigo-900 mb-2">{moduleContent[mod.id].project?.title}</h4>
                                        <p className="text-indigo-800 mb-4">{moduleContent[mod.id].project?.scenario}</p>

                                        <h5 className="font-semibold text-indigo-900 mb-2">Deliverables:</h5>
                                        <ul className="list-disc list-inside space-y-1 text-indigo-800 mb-4">
                                          {moduleContent[mod.id].project?.deliverables.map((d, i) => (
                                            <li key={i}>{d}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="border-t border-gray-200 pt-6 text-center text-gray-500 italic">
                                      <p>No large-scale project for this module. Focus on the quizzes and coding challenges above.</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
