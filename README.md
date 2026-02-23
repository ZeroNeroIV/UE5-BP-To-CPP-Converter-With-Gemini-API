# UE5-BP2CPP

<p>
  <img src="https://img.shields.io/badge/Python-3.14+-3776AB?style=flat&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
</p>

AI-powered tool that converts Unreal Engine 5 Blueprint class definitions (JSON format) into production-ready C++ header (.h) and source (.cpp) files using Google Gemini API.

## Features

- **Dual Input Modes**: Upload a Blueprint JSON file or paste JSON content directly
- **AI-Powered Translation**: Leverages Google Gemini for intelligent Blueprint-to-C++ conversion
- **UE5 Standards**: Generates code following modern UE5 coding conventions (UFUNCTION, UPROPERTY macros, naming standards)
- **Structured Output**: Downloads a ZIP file organized in UE5's Public/Private folder structure
- **Real-time Preview**: View generated header and source files directly in the browser with syntax highlighting

## Prerequisites

- Docker & Docker Compose
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

## Quick Start with Docker

```bash
# 1. Clone the repository
git clone https://github.com/ZeroNeroIV/UE5-BP-To-CPP-Converter-With-Gemini-API.git
cd UE5-BP-To-CPP-Converter-With-Gemini-API

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 3. Build and start containers
docker-compose up --build

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# API Docs: http://localhost:8080/docs
```

## Manual Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ZeroNeroIV/UE5-BP-To-CPP-Converter-With-Gemini-API.git
cd UE5-BP-To-CPP-Converter-With-Gemini-API
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your API key
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

## Usage

### Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Manual

### 1. Start the Backend Server

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

The API will be available at `http://localhost:8080`

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

The web interface will be available at `http://localhost:3000`

### 3. Convert Blueprints

1. Open `http://localhost:3000` in your browser
2. Choose input mode:
   - **Upload File**: Select a `.json` file containing Blueprint class definition
   - **Paste JSON**: Directly paste Blueprint JSON content
3. Click **Convert**
4. Browse generated `.h` and `.cpp` files in the file explorer
5. Click **ZIP** to download all files in UE5 project structure

## API Documentation

### POST `/convert`

Converts a Blueprint JSON to C++ code.

**Request:**

- `Content-Type: multipart/form-data`
- Either `file` (UploadFile) OR `text` (string) - JSON content

**Response:**

```json
{
  "files": [
    {
      "name": "MyActor.h",
      "content": "// C++ header content...",
      "language": "cpp"
    },
    {
      "name": "MyActor.cpp",
      "content": "// C++ source content...",
      "language": "cpp"
    }
  ],
  "zip_base64": "UEsFBBQ..."
}
```

## Project Structure

```
UE5-BP2CPP/
├── backend/
│   ├── Dockerfile            # Backend container definition
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── check_models.py      # Utility script
│   ├── .env                 # API keys (not committed)
│   └── .env.example         # Environment template
├── frontend/
│   ├── Dockerfile           # Frontend container definition
│   ├── app/
│   │   ├── page.tsx         # Main converter UI
│   │   ├── layout.tsx       # Root layout
│   │   └── globals.css      # Global styles
│   ├── package.json
│   └── .env.local.example   # Environment template
├── docker-compose.yml       # Docker Compose orchestration
├── .env.example             # Docker environment template
├── LICENSE
└── .gitignore
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**ZeroNeroIV**

- GitHub: [@ZeroNeroIV](https://github.com/ZeroNeroIV)

---

<p align="center">
  Built with FastAPI, Next.js, and Google Gemini API
</p>
