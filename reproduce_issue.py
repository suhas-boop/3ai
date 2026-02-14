
import requests
import json
import os

def test_presentation_service():
    url = "http://localhost:5000/api/v1/ppt/presentation/generate"
    headers = {"Content-Type": "application/json"}
    payload = {
        "content": "Make a 3-slide deck about Python Programming.",
        "n_slides": 3,
        "language": "English",
        "template": "general",
        "export_as": "pptx"
    }
    
    print(f"Sending request to {url}...")
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response JSON:", data)
            
            presentation_id = data.get("presentation_id")
            path = data.get("path")
            
            if presentation_id:
                # Try creating download URL
                download_urls = [
                    f"http://localhost:5000/api/v1/ppt/presentation/{presentation_id}/download",
                    f"http://localhost:5000/api/v1/ppt/download/{presentation_id}",
                    f"http://localhost:5000{path}",
                    f"http://localhost:5000/download?path={path}"
                ]
                
                for d_url in download_urls:
                    print(f"Trying download URL: {d_url}")
                    try:
                        d_response = requests.get(d_url, timeout=10)
                        if d_response.status_code == 200:
                            print(f"Success! Downloaded from {d_url}")
                            with open("downloaded_presentation.pptx", "wb") as f:
                                f.write(d_response.content)
                            break
                        else:
                            print(f"Failed: {d_response.status_code}")
                    except Exception as e:
                        print(f"Error connecting to {d_url}: {e}")
            
        else:
            print("Error Response:", response.text)
            
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    test_presentation_service()
