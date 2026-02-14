from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from autonomous_academy.llm import LLMClient
from autonomous_academy.schemas import Charter, Module, Lesson, SourceRef
from autonomous_academy.services import content

app = FastAPI(title="Autonomous Academy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = LLMClient()

from enum import Enum

class AudienceLevel(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"

class CourseDuration(str, Enum):
    FIVE_SESSION = "5-Session"
    QUARTER = "Quarter"
    SEMESTER = "Semester"

class CourseRequest(BaseModel):
    topic: str
    audience_level: AudienceLevel = AudienceLevel.BEGINNER
    course_duration: CourseDuration = CourseDuration.FIVE_SESSION
    tone: str = "supportive"

class CourseResponse(BaseModel):
    charter: Charter
    modules: List[Module]
    sample_lesson: Lesson

def get_sample_sources(topic: str) -> List[SourceRef]:
    # In a real app, we'd search for this
    return [
        SourceRef(id="doc-1", title=f"{topic} Overview", url=f"https://example.com/{topic.lower()}"),
        SourceRef(id="doc-2", title="Advanced Concepts", url=f"https://example.com/{topic.lower()}-advanced"),
    ]

@app.post("/api/generate-course", response_model=CourseResponse)
async def generate_course(request: CourseRequest):
    try:
        sources = get_sample_sources(request.topic)
        
        # Map duration to hours and module count
        duration_map = {
            CourseDuration.FIVE_SESSION: {"hours": 10, "modules": 5},
            CourseDuration.QUARTER: {"hours": 100, "modules": 24},
            CourseDuration.SEMESTER: {"hours": 160, "modules": 48},
        }
        config = duration_map[request.course_duration]
        time_budget = config["hours"]
        module_count = config["modules"]
        
        # Construct specific audience string
        audience_str = f"{request.audience_level.value} students interested in {request.topic}"
        
        # 1. Generate Charter
        charter = content.generate_charter(
            audience=audience_str,
            outcomes=[f"Master {request.topic} at a {request.audience_level.value} level", "Apply core concepts"],
            prerequisites=["Basic knowledge"] if request.audience_level == AudienceLevel.BEGINNER else ["Prior experience"],
            time_budget_hours=time_budget,
            tone=request.tone,
            constraints=[f"{request.course_duration.value} structure", f"Exactly {module_count} modules", "Practical focus"],
            sources=sources,
            llm=llm
        )
        
        # 2. Generate Syllabus
        modules = content.generate_syllabus(charter, sources, module_count, llm)
        
        # 3. Generate Sample Lesson (first module)
        if modules:
            lesson = content.generate_lesson(modules[0], tone=request.tone, llm=llm)
        else:
            raise HTTPException(status_code=500, detail="Failed to generate syllabus modules")
            
        return CourseResponse(
            charter=charter,
            modules=modules,
            sample_lesson=lesson
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class LessonGenerationRequest(BaseModel):
    module: Module
    course_topic: str
    audience: str
    tone: str = "supportive"

from fastapi.responses import FileResponse
from autonomous_academy.services import slides_service
import os

# Simple in-memory cache for slides to avoid re-generation
# Map module_id -> List[Slide]
slides_cache = {}

@app.post("/api/generate-lesson", response_model=Lesson)
async def generate_lesson_endpoint(request: LessonGenerationRequest):
    try:
        lesson = content.generate_module_content(
            module=request.module,
            course_topic=request.course_topic,
            audience=request.audience,
            tone=request.tone,
            llm=llm
        )
        # Cache slides for download
        if lesson.slides:
            slides_cache[request.module.id] = lesson.slides
            
        return lesson
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/download-slides/{module_id}")
async def download_slides(module_id: str):
    if module_id not in slides_cache:
        raise HTTPException(status_code=404, detail="Slides not found. Please generate lesson content first.")
    
    slides = slides_cache[module_id]
    filename = f"slides_{module_id}.pptx"
    filepath = os.path.join("/tmp", filename)
    
    try:
        # slides_service.generate_pptx(slides, filepath)
        
        # Use remote service for better quality
        # We need a topic/prompt. We'll use the title of the first slide or a fallback.
        topic = "Presentation"
        if slides and hasattr(slides[0], 'title'):
            topic = slides[0].title
            
        slides_service.generate_remote_pptx(topic, len(slides), filepath, slides_content=slides)
        
        return FileResponse(filepath, filename=filename, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation")
    except Exception as e:
        print(f"Remote generation failed: {e}. Falling back to local.")
        try:
             slides_service.generate_pptx(slides, filepath)
             return FileResponse(filepath, filename=filename, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation")
        except Exception as local_e:
             raise HTTPException(status_code=500, detail=f"Failed to generate PPTX: {str(e)} -> {str(local_e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate PPTX: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
