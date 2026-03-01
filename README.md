# Autonomous Academy

A sophisticated LLM-powered educational platform that enables educators to construct context-aware courses and provides students with an interactive, Web-Augmented Tutor.

## Features
- **Teacher Console (`/teacher`)**: Generate dynamic courses, parse external PDFs/PPTXs, and build rigorous educational modules.
- **Student View (`/student`)**: Browse available courses, view detailed slides rendered in rich Markdown/LaTeX, and interact with the AI Tutor.
- **Unified Frontend Server**: The entire user interface for both Teachers and Students is served from the `teacher-console` Next.js application (port 3000). The old `ui` folder is deprecated.
- **Web-Augmented Chat Engine**: Students can ask questions directly corresponding to the course material. If a question seeks current real-world examples or industry trends not available in the course context, the Tutor falls back to the Web, performs a search, and responds with integrated citations.

## Setup Instructions

### Environment Variables
You need the following API keys to run the application fully:
- `GEMINI_API_KEY`: Required by the Python `autonomous_academy` backend for LLM completions.
- `TAVILY_API_KEY`: Required by the Next.js frontend application (`teacher-console`) to perform Web Search resolution for the student Tutor.

Set these in your `.env` or run the servers with them exported.

### How to Run
1. **Python AI API**:
   ```bash
   uvicorn src.server:app --reload
   ```
2. **Next.js Web Frontend (Teacher & Student)**:
   ```bash
   cd teacher-console
   npm install
   npx prisma migrate dev  # or `npx prisma db push`
   npm run dev
   ```

## Web-Augmented Tutor Details
The web browsing feature dynamically augments the Tutor's course-centric knowledge with up-to-date web results via the Tavily API, ensuring grounded responses complete with explorable citations.

### How to Enable/Disable Browsing
Inside the Student Chat UI (e.g., `http://localhost:3000/student/course/...`), use the **"Web Browsing"** toggle switch in the chat header. 
- **ON (Default)**: The engine assesses the question. It will prioritize local module knowledge, but automatically performs a web query if required.
- **OFF**: The system defaults to strict `LocalTutorProvider` constraints and guarantees no external calls occur.

### Example Question That Triggers Browsing
While viewing a module on "Web Development History" or "Programming Decorators", ask:
> *"What are the latest tools released in 2024 related to this topic?"*
Since this spans beyond the scope of a static generated module, the Web-Augmented Tutor will synthesize a web search response and explicitly annotate the section with "### From the web" alongside UI click-through citations.
