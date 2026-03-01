import { useState } from 'react';
import axios from 'axios';
import { GraduationCap, Plus, X, CheckCircle } from 'lucide-react';
import type { CourseResponse, Module, Lesson, Item, SourceRef, QuizResult, UpdateSuggestion } from './types';
import { CourseCreation } from './components/CourseCreation';
import { CourseUpdation } from './components/CourseUpdation';
import type { ContextSectionProps } from './components/ContextSection';

function App() {
  // Navigation State
  const [view, setView] = useState<'creation' | 'updation'>('creation');

  // Core State
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

  // Quiz State
  const [showQuiz, setShowQuiz] = useState<string | null>(null); // moduleId
  const [quizQuestions, setQuizQuestions] = useState<Item[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Research & Context State
  const [researchQuery, setResearchQuery] = useState('');
  const [researchType, setResearchType] = useState<'web' | 'academic' | 'syllabus' | 'industry' | 'github'>('web');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [contextMaterials, setContextMaterials] = useState<string[]>([]);
  const [additionalTopics, setAdditionalTopics] = useState<string[]>([]);
  const [isResearching, setIsResearching] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Context Review State
  const [pendingContext, setPendingContext] = useState<{
    file: File;
    analysis: any;
    editedTopic: string;
    editedDescription: string;
  } | null>(null);

  // Update Suggestions State
  const [updateSuggestions, setUpdateSuggestions] = useState<UpdateSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editedModules, setEditedModules] = useState<Module[]>([]);

  // Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/upload-material', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.text_preview) {
        setPendingContext({
          file,
          analysis: res.data.analysis,
          editedTopic: res.data.analysis?.main_topic || "New Context",
          editedDescription: res.data.analysis?.description || "Uploaded material"
        });
      }
    } catch (err) {
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const confirmContext = async () => {
    if (!pendingContext) return;
    const newContextString = `Topic: ${pendingContext.editedTopic}\nDescription: ${pendingContext.editedDescription}\nSummary: ${pendingContext.analysis?.summary}`;
    setContextMaterials(prev => [...prev, newContextString]);

    if (course) {
      setLoadingSuggestions(true);
      try {
        const res = await axios.post('http://127.0.0.1:8000/api/suggest-updates', {
          current_course: course,
          new_context: newContextString,
          research_type: researchType
        });
        setUpdateSuggestions(res.data);
      } catch (e) {
        console.error("Failed to get suggestions", e);
      } finally {
        setLoadingSuggestions(false);
      }
    }
    setPendingContext(null);
  };

  const performResearch = async (overrideQuery?: string) => {
    const queryToUse = overrideQuery || researchQuery;
    if (!queryToUse) return;

    setIsResearching(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/research-content', {
        query: queryToUse,
        research_type: researchType
      });
      setSuggestions(res.data.suggestions);
    } catch (err) {
      alert("Research failed");
    } finally {
      setIsResearching(false);
    }
  };

  const addTopic = (topic: string) => {
    if (!additionalTopics.includes(topic)) {
      setAdditionalTopics(prev => [...prev, topic]);
    }
  };

  const applySuggestion = (suggestion: UpdateSuggestion) => {
    if (!course) return;
    let newModules = [...(isEditing ? editedModules : course.modules)];

    if (suggestion.type === 'add_module' && suggestion.suggested_module_data) {
      const newModule: Module = {
        id: `new-mod-${Date.now()}`,
        title: suggestion.suggested_module_data.title || suggestion.title,
        duration_minutes: suggestion.suggested_module_data.duration_minutes || 45,
        objectives: suggestion.suggested_module_data.objectives || ["New Objective"]
      };
      newModules.push(newModule);
    } else {
      alert(`Applied: ${suggestion.title}. You may see a new module or check the syllabus.`);
    }

    setEditedModules(newModules);
    setIsEditing(true);
    setCourse({ ...course, modules: newModules });
    setUpdateSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const generateCourse = async () => {
    if (!topic) return;
    setLoading(true);
    setError('');
    setCourse(null);
    setModuleContent({});
    try {
      const res = await axios.post<CourseResponse>('http://127.0.0.1:8000/api/generate-course', {
        topic,
        audience_level: audienceLevel,
        course_duration: duration,
        tone: 'supportive',
        context_materials: contextMaterials,
        additional_topics: additionalTopics
      });
      setCourse(res.data);
      setEditedModules(res.data.modules);
      setView('updation');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate course');
    } finally {
      setLoading(false);
    }
  };

  const resetCourse = () => {
    setCourse(null);
    setTopic('');
    setContextMaterials([]);
    setSuggestions([]);
    setUpdateSuggestions([]);
    setPendingContext(null);
    setView('creation');
  };

  const handleModuleExpand = (moduleId: string | null) => {
    setExpandedModuleId(moduleId);
    if (moduleId && course) {
      const module = course.modules.find(m => m.id === moduleId);
      if (module) {
        setResearchQuery(module.title);
        performResearch(module.title);
      }
    }
  };

  const generateModuleContent = async (module: Module) => {
    if (moduleContent[module.id]) {
      setExpandedModuleId(module.id);
      return;
    }
    setContentLoading(module.id);
    try {
      const res = await axios.post<Lesson>('http://127.0.0.1:8000/api/generate-lesson', {
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

  const saveCourseChanges = () => {
    if (course) {
      setCourse({ ...course, modules: editedModules });
      setIsEditing(false);
    }
  };

  // Quiz Logic
  const startQuizForLink = (moduleId: string, link: SourceRef) => {
    if (link.quiz && link.quiz.length > 0) {
      setQuizQuestions(link.quiz);
      setShowQuiz(moduleId);
      setCurrentQuizIndex(0);
      setQuizAnswers({});
      setQuizCompleted(false);
    } else {
      alert("No quiz available for this link.");
    }
  };

  const handleQuizAnswer = (itemId: string, answer: string) => {
    setQuizAnswers(prev => ({ ...prev, [itemId]: answer }));
  };

  const nextQuestion = () => setCurrentQuizIndex(prev => prev + 1);
  const finishQuiz = () => setQuizCompleted(true);
  const closeQuiz = () => {
    setShowQuiz(null);
    setQuizCompleted(false);
    setQuizAnswers({});
    setCurrentQuizIndex(0);
  };

  const calculateScore = (): QuizResult => {
    if (!quizQuestions.length) return { score: 0, total: 0, answers: {} };
    let correct = 0;
    quizQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.answer) correct++;
    });
    return { score: correct, total: quizQuestions.length, answers: quizAnswers };
  };

  const contextSectionProps: ContextSectionProps = {
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
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Navigation */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <GraduationCap className="w-10 h-10 text-indigo-600" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Autonomous Academy
            </h1>
          </div>

          <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setView('creation')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${view === 'creation' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Course Creator
            </button>
            <button
              onClick={() => setView('updation')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${view === 'updation' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Course Editor
            </button>
          </div>

          {course && (
            <button onClick={resetCourse} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-indigo-300 shadow-sm">
              <Plus className="w-4 h-4" /> New Course
            </button>
          )}
        </header>

        {/* Main Content View Switcher */}
        {view === 'creation' ? (
          <CourseCreation
            topic={topic}
            setTopic={setTopic}
            audienceLevel={audienceLevel}
            setAudienceLevel={setAudienceLevel}
            duration={duration}
            setDuration={setDuration}
            loading={loading}
            error={error}
            generateCourse={generateCourse}
            contextSectionProps={contextSectionProps}
          />
        ) : course ? (
          <CourseUpdation
            course={course}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editedModules={editedModules}
            setEditedModules={setEditedModules}
            saveCourseChanges={saveCourseChanges}
            expandedModuleId={expandedModuleId}
            setExpandedModuleId={handleModuleExpand}
            moduleContent={moduleContent}
            generateModuleContent={generateModuleContent}
            contentLoading={contentLoading}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            startQuizForLink={startQuizForLink}
            contextSectionProps={contextSectionProps}
          />
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p>No course generated yet. Go to "Course Creator" to start.</p>
          </div>
        )}

        {/* Quiz Modal */}
        {showQuiz && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
              <button onClick={closeQuiz} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>

              {!quizCompleted ? (
                <div>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Pop Quiz</h3>
                    <p className="text-sm text-gray-500">Question {currentQuizIndex + 1} of {quizQuestions.length}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%` }}></div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">{quizQuestions[currentQuizIndex]?.stem}</h4>
                    <div className="space-y-3">
                      {quizQuestions[currentQuizIndex]?.options?.map((opt, idx) => (
                        <label key={idx} className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${quizAnswers[quizQuestions[currentQuizIndex].id] === (quizQuestions[currentQuizIndex].type === 'mcq' ? ['A', 'B', 'C', 'D'][idx] : opt) ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200 hover:border-indigo-300'}`}>
                          <input
                            type="radio"
                            name="quiz-option"
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                            checked={quizAnswers[quizQuestions[currentQuizIndex].id] === (quizQuestions[currentQuizIndex].type === 'mcq' ? ['A', 'B', 'C', 'D'][idx] : opt)}
                            onChange={() => handleQuizAnswer(quizQuestions[currentQuizIndex].id, quizQuestions[currentQuizIndex].type === 'mcq' ? ['A', 'B', 'C', 'D'][idx] : opt)}
                          />
                          <span className="text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    {currentQuizIndex < quizQuestions.length - 1 ? (
                      <button
                        onClick={nextQuestion}
                        disabled={!quizAnswers[quizQuestions[currentQuizIndex].id]}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        Next Question
                      </button>
                    ) : (
                      <button
                        onClick={finishQuiz}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        Submit Quiz
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h3>
                  <p className="text-gray-500 mb-8">You scored {calculateScore().score} out of {calculateScore().total}</p>

                  <div className="space-y-4 text-left max-h-[400px] overflow-y-auto mb-8 pr-2">
                    {quizQuestions.map((q, i) => (
                      <div key={i} className={`p-4 rounded-lg border ${quizAnswers[q.id] === q.answer ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className="font-medium text-gray-900 mb-2">{i + 1}. {q.stem}</p>
                        <p className="text-sm">
                          <span className="font-semibold">Your Answer:</span> {quizAnswers[q.id]}
                        </p>
                        {quizAnswers[q.id] !== q.answer && (
                          <p className="text-sm text-green-700 mt-1">
                            <span className="font-semibold">Correct Answer:</span> {q.answer}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2 italic">{q.rationale}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={closeQuiz}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
