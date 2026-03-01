curl -sS -X POST "http://127.0.0.1:8000/api/generate-lesson" \
-H "Content-Type: application/json" \
--max-time 300 \
-d '{
  "module": {
    "id": "cmm12345",
    "title": "Module 1: Introduction to Databases",
    "objectives": ["Understand relational databases", "Learn basic SQL queries"],
    "duration_minutes": 60,
    "dependencies": [],
    "checkpoints": [],
    "references": []
  },
  "course_topic": "Database Management Systems",
  "audience": "Beginner students",
  "tone": "supportive"
}' > response.json
