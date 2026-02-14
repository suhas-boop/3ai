import os
import google.generativeai as genai
from rich import print

def list_models():
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("[bold red]No API key found. Set GEMINI_API_KEY or GOOGLE_API_KEY.[/bold red]")
        return

    genai.configure(api_key=api_key)
    
    print("[bold blue]Listing available models...[/bold blue]")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"- [green]{m.name}[/green] ({m.display_name})")
    except Exception as e:
        print(f"[bold red]Error listing models: {e}[/bold red]")

if __name__ == "__main__":
    list_models()
