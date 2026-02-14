
from fastapi.testclient import TestClient
from autonomous_academy.api import app, slides_cache
from autonomous_academy.schemas import Slide

client = TestClient(app)

def test_download_remote_slides():
    # 1. Setup cache
    module_id = "test-mod-1"
    slides_cache[module_id] = [
        Slide(title="Test Presentation", bullets=["A", "B"]),
        Slide(title="Second Slide", bullets=["C", "D"])
    ]
    
    # 2. Call endpoint
    print(f"Testing download for module: {module_id}")
    response = client.get(f"/api/download-slides/{module_id}")
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Success! Headers:", response.headers)
        if "application/vnd.openxmlformats-officedocument.presentationml.presentation" in response.headers["content-type"]:
            print("Verified Content-Type is correct.")
            with open("verified_output.pptx", "wb") as f:
                f.write(response.content)
            print("Saved verified_output.pptx")
        else:
            print("FAILED: Incorrect Content-Type")
    else:
        print("FAILED: Error response:", response.text)

if __name__ == "__main__":
    test_download_remote_slides()
