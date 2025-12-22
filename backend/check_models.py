import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load your .env file so we use the real key
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: API Key not found in .env")
else:
    genai.configure(api_key=api_key)
    print("Checking available models for your API key...\n")
    try:
        # List all models that support content generation
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"✅ Available: {m.name}")
                # Print the input/output limits if you need them
                # print(f"   - Input Limit: {m.input_token_limit}")
    except Exception as e:
        print(f"Error connecting to Google: {e}")