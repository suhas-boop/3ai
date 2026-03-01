import requests
import json

payload = {
    "module": {
        "id": "test-1",
        "title": "Module 1: Intro to Python",
        "objectives": ["Learn syntax", "Write a loop"],
        "duration_minutes": 60,
        "references": [],
        "dependencies": [],
        "checkpoints": []
    },
    "course_topic": "Python Programming",
    "audience": "Beginner students",
    "tone": "supportive"
}

try:
    res = requests.post("http://127.0.0.1:8000/api/generate-lesson", json=payload)
    print("Status Code:", res.status_code)
    print("Response JSON length:", len(res.text))
    data = res.json()
    print("Slides length:", len(data.get("slides", [])))
    print("Project exists:", data.get("project") is not None)
    if res.status_code != 200:
        print("Error:", res.text)
except Exception as e:
    print(e)
