import sys
import os
import requests
from autonomous_academy.schemas import Slide

# Add src to path
sys.path.append(os.path.join(os.getcwd(), "src"))

from autonomous_academy.services import slides_service

def test_pptx_generation():
    print("--- Testing PPTX Service ---")
    slides = [
        Slide(title="Test Slide 1", bullets=["Point A", "Point B"], speaker_notes="Note 1"),
        Slide(title="Test Slide 2", bullets=["Point C"], speaker_notes="Note 2")
    ]
    filename = "test_output.pptx"
    
    try:
        output = slides_service.generate_pptx(slides, filename)
        if os.path.exists(output):
            print(f"SUCCESS: Generated {output} ({os.path.getsize(output)} bytes)")
            # Cleanup
            os.remove(output)
        else:
            print("FAILURE: File not created.")
    except Exception as e:
        print(f"FAILURE: Exception during generation: {e}")

def test_endpoint():
    # This requires the server to be running and having generated content.
    # We'll just print instructions for manual verification or rely on the unit test above.
    print("\n--- Endpoint Verification ---")
    print("To verify endpoint:")
    print("1. Start server.")
    print("2. Generate a lesson.")
    print("3. Visit http://localhost:8000/api/download-slides/{module_id}")
    print("   (Ensure module_id matches the generated one)")

if __name__ == "__main__":
    test_pptx_generation()
    test_endpoint()
