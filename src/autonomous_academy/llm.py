"""LLM client implementation using Nvidia Nemotron via OpenAI compatible API."""

from __future__ import annotations

import os
import json
import logging
import re
from typing import Dict, Optional, Any

from openai import OpenAI

logger = logging.getLogger(__name__)


class LLMClient:
    """Client for Nvidia's Nemotron models using OpenAI compatible API."""

    def __init__(self, provider: str = "nvidia", model_name: str = "meta/llama-3.1-70b-instruct"):
        self.provider = provider
        self.model_name = model_name
        self._configure_client()

    def _configure_client(self) -> None:
        api_key = os.getenv("NVIDIA_API_KEY") or "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"
        base_url = "https://integrate.api.nvidia.com/v1"
        
        if not api_key:
             logger.warning("No API key found for Nvidia. Set NVIDIA_API_KEY.")
             # We can let it fail later or set a dummy one if we want to support 'stub' mode better
        
        self.client = OpenAI(
            base_url=base_url,
            api_key=api_key
        )

    def complete(self, prompt: str, metadata: Optional[Dict[str, str]] = None) -> str:
        """
        Generate a completion for the given prompt.
        """
        if self.provider == "stub":
             return f"[{self.provider} completion placeholder]\nPrompt summary: {prompt[:200]}"

        try:
            completion = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                top_p=0.95,
                max_tokens=8192,
                frequency_penalty=0,
                presence_penalty=0,
                stream=False
            )
            content = completion.choices[0].message.content
            
            # Log raw content for debug (can be verbose)
            # logger.debug(f"Raw LLM Output: {content}")
            
            # Strip <think>...</think> blocks if present
            content = re.sub(r'<think>.*?</think>\s*', '', content, flags=re.DOTALL)
            # Also strip unclosed <think> block at the end
            content = re.sub(r'<think>.*$', '', content, flags=re.DOTALL)
            
            return content.strip()
        except Exception as e:
            logger.error(f"Error calling Nvidia API: {e}")
            return f"Error generating content: {e}"

    def stream_complete(self, prompt: str, metadata: Optional[Dict[str, str]] = None):
        """
        Generate a streaming completion for the given prompt.
        Yields chunks of text as they arrive.
        """
        if self.provider == "stub":
            yield f"[{self.provider} completion placeholder]\nPrompt summary: {prompt[:200]}"
            return

        try:
            completion = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                top_p=0.95,
                max_tokens=8192,
                frequency_penalty=0,
                presence_penalty=0,
                stream=True
            )
            
            in_think_block = False
            
            for chunk in completion:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    
                    # Very simple block stripping for stream
                    if "<think>" in content:
                        in_think_block = True
                        content = content.replace("<think>", "")
                    
                    if "</think>" in content:
                        in_think_block = False
                        content = content.split("</think>")[-1]
                        
                    if not in_think_block and content:
                        yield content

        except Exception as e:
            logger.error(f"Error streaming Nvidia API: {e}")
            yield f"Error generating content: {e}"

    def parse_json(self, text: str) -> Dict[str, Any]:
        """Helper to parse JSON from LLM output, handling markdown code blocks and loose JSON."""
        clean_text = text.strip()
        
        # Try to find JSON block in markdown
        match = re.search(r"```(?:json)?\s*(\{.*\}|\[.*\])\s*```", clean_text, re.DOTALL)
        if match:
            clean_text = match.group(1)
        else:
            # Try to find first { or [ and last } or ]
            match = re.search(r"(\{.*\}|\[.*\])", clean_text, re.DOTALL)
            if match:
                clean_text = match.group(1)
                
        try:
            return json.loads(clean_text)
        except json.JSONDecodeError as e:
            # If we have "Extra data", it might be multiple JSON objects concatenated
            # Try wrapping in a list
            if "Extra data" in str(e):
                try:
                    # Attempt to fix by comma-separating if needed, but simple wrapping first
                    # If it's {obj}{obj}, we need [{obj},{obj}]
                    # A simple regex replace of "}\s*{" with "},{" might work for simple cases
                    fixed_text = re.sub(r"\}\s*\{", "},{", clean_text)
                    return json.loads(f"[{fixed_text}]")
                except Exception:
                    pass
            
            logger.error(f"Failed to parse JSON: {e}\nContent: {text}")
            raise ValueError(f"Invalid JSON response from LLM: {e}")
