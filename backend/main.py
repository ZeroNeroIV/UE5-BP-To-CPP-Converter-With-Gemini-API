import os
import io
import logging
import zipfile
import re
import base64
import json
from typing import List, Dict
from fastapi import FastAPI, UploadFile, File, Form, HTTPException # Added Form 
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- LOGGING SETUP ---
# Configure logging to print to console with timestamps and log levels
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# --- CONFIGURATION ---
# Replace with your actual API key or set environment variable GEMINI_API_KEY
GENAI_API_KEY = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=GENAI_API_KEY)

app = FastAPI()

# Allow CORS for Next.js frontend
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SYSTEM PROMPT ---
SYSTEM_PROMPT = """
You are a highly specialized and expert Unreal Engine 5 (UE5) Blueprint-to-C++ Translator and Code Generator. Your sole task is to take a provided JSON representation of a UE5 Blueprint Class and generate the functionally equivalent, idiomatic C++ header (.h) and source (.cpp) files, formatted according to modern UE5 coding standards.

**A. Core Translation Rules:**
1.  **Class Structure:** The output must consist of two files: a `.h` header file and a corresponding `.cpp` source file.
2.  **Naming Convention:** The C++ class name must follow the UE5 standard: `A` for Actors (e.g., `AMyNewActor`), `U` for UObjects, `F` for structs, and the filenames must match (e.g., `MyNewActor.h`, `MyNewActor.cpp`). Infer the class name from the input JSON's root object name.
3.  **Inheritance:** Determine the most appropriate base C++ class (e.g., `AActor`, `UUserWidget`, `APawn`, `ACharacter`) based on the Blueprint type. Use the appropriate `GENERATED_BODY()` macro.
4.  **UFUNCTION/UPROPERTY Macros:** All converted Blueprint variables (Properties) and custom events (Functions) MUST be marked with the appropriate reflection macros (`UPROPERTY()`, `UFUNCTION()`).
5.  **Blueprint Purity/Access:**
    * Variables that were Blueprint-editable must use `UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="BlueprintGenerated")`.
    * Functions that were callable from Blueprint must use `UFUNCTION(BlueprintCallable, Category="BlueprintGenerated")`.
    * Implement equivalent logic in the `.cpp` file.

**B. UE5 C++ Standards and Idioms:**
1.  **Includes:** Include necessary headers (e.g., `"GameFramework/Actor.h"`, `"Components/StaticMeshComponent.h"`) in the `.cpp` file, and only forward declarations in the `.h` file where possible.
2.  **Constructors:** Implement a proper constructor in the `.cpp` file to initialize components and set default values, using the `CreateDefaultSubobject` pattern.
3.  **Tick and BeginPlay:** If the Blueprint overrides `Event Tick` or `Event BeginPlay`, generate the corresponding C++ overrides (`virtual void Tick(float DeltaTime) override;`, `virtual void BeginPlay() override;`).
4.  **Pointers:** Use raw pointers for `UObject`s and `AActor`s. Pointers to components should be prefixed with `*`.

**C. Output Format Constraint (Crucial):**
The final output **must be a single, structured markdown block** containing the contents of all generated files. Do not add any conversational text, explanations, or analysis. The format must be as follows:

---
File: [FILENAME_A].h
---
// Content of [FILENAME_A].h
...

---
File: [FILENAME_B].cpp
---
// Content of [FILENAME_B].cpp
...
"""

class ConversionResponse(BaseModel):
    files: List[Dict[str, str]]  # List of {name: "MyActor.h", content: "..."}
    zip_base64: str              # Base64 encoded ZIP file

def parse_gemini_response(text: str) -> List[Dict[str, str]]:
    """
    Parses the custom markdown format to extract filenames and content.
    """
    # Regex to find "--- File: filename ---" and capture content until next match or end
    pattern = r"---\s*File:\s*(.*?)\s*---\n(.*?)(?=\n---\s*File:|\Z)"
    matches = re.findall(pattern, text, re.DOTALL)
    
    files = []
    for filename, content in matches:
        files.append({
            "name": filename.strip(),
            "content": content.strip(),
            "language": "cpp" if filename.endswith(".cpp") else "cpp" # For syntax highlighting
        })
    return files

@app.post("/convert", response_model=ConversionResponse)
async def convert_blueprint(
    file: UploadFile = File(None), 
    text: str = Form(None)
):
    logger.info("Received request at /convert endpoint.")
    
    try:
        # 1. Read JSON Content
        json_content = ""

        # Logic to determine source: File vs Text
        if file:
            logger.info(f"Input source: File upload detected (Filename: {file.filename}).")
            content = await file.read()
            json_content = content.decode("utf-8")
            logger.info(f"File read successfully. Size: {len(json_content)} characters.")
            
        elif text:
            logger.info("Input source: Pasted text detected.")
            json_content = text
            logger.info(f"Text read successfully. Size: {len(json_content)} characters.")
            
        else:
            logger.warning("Validation Error: No file or text provided in request.")
            raise HTTPException(status_code=400, detail="No JSON provided. Please upload a file or paste text.")
        
        # 2. Construct Prompt
        logger.info("Constructing prompt for Gemini API...")
        user_prompt = f"""
        Translate the following UE5 Blueprint Class JSON into the equivalent C++ header and source files. 
        
        [JSON DATA START]
        {json_content}
        [JSON DATA END]
        """
        
        # 3. Call Gemini
        logger.info("Calling Gemini API...")
        model = genai.GenerativeModel(model_name="models/gemini-flash-latest")
        
        try:
            response = model.generate_content([SYSTEM_PROMPT, user_prompt])
            generated_text = response.text
            logger.info(f"Gemini API response received. Response length: {len(generated_text)} characters.")
        except Exception as api_error:
            logger.error(f"Gemini API Call Failed: {str(api_error)}")
            raise HTTPException(status_code=502, detail=f"AI Provider Error: {str(api_error)}")

        # 4. Parse Response
        logger.info("Parsing generated markdown for file structures...")
        parsed_files = parse_gemini_response(generated_text)
        
        if not parsed_files:
            logger.error("Parsing Failed: Regex found no '--- File: ...' markers in the AI response.")
            # Optional: Log the raw response to debug why it failed
            logger.debug(f"Raw AI Response: {generated_text[:500]}...") 
            raise HTTPException(status_code=500, detail="Failed to parse valid code from AI response.")
            
        logger.info(f"Successfully parsed {len(parsed_files)} files: {[f['name'] for f in parsed_files]}")

        # 5. Create ZIP in Memory
        logger.info("Compressing files into ZIP archive...")
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for f in parsed_files:
                # Determine folder based on extension (UE5 Structure)
                folder = "Private" if f["name"].endswith(".cpp") else "Public"
                zip_path = os.path.join("Source", "GeneratedModule", folder, f["name"])
                zip_file.writestr(zip_path, f["content"])
        
        zip_buffer.seek(0)
        zip_b64 = base64.b64encode(zip_buffer.read()).decode("utf-8")
        logger.info("ZIP archive created and encoded to Base64.")

        logger.info("Request processed successfully. Returning response.")
        return {
            "files": parsed_files,
            "zip_base64": zip_b64
        }

    except HTTPException as he:
        # Re-raise HTTP exceptions so FastAPI handles the status code correctly
        raise he
    except Exception as e:
        logger.error(f"Unexpected Internal Server Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)