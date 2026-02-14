
import requests
import json
import logging

logging.basicConfig(level=logging.DEBUG)

def test_api_generation():
    url = "http://localhost:8000/api/generate-lesson"
    headers = {"Content-Type": "application/json"}
    
    # Minimal payload matching LessonGenerationRequest
    payload = {
        "course_topic": "Python 101",
        "audience": "Beginner",
        "tone": "supportive",
        "module": {
            "id": "mod-1",
            "title": "Introduction to Variables",
            "objectives": ["Define variable", "Use assignment operator"],
            "duration_minutes": 10,
            "dependencies": [],
            "checkpoints": [],
            "references": []
        }
    }
    
    print(f"Sending POST request to {url}...")
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=120)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {response.headers}")
        
        if response.status_code == 200:
            print("Success!")
            data = response.json()
            print(f"Lesson ID: {data.get('id')}")
            print(f"Content Length: {len(data.get('content_md', ''))}")
        else:
            print(f"Failed: {response.text}")
            
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    test_api_generation()
