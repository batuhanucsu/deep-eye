# 👁 DeepEye

AI-powered **face recognition** and **image description** platform built as a graduation project.

## Tech Stack

| Layer      | Technology                              |
|------------|----------------------------------------|
| Frontend   | Next.js 14, TypeScript, TailwindCSS    |
| Backend    | Python, FastAPI, Pydantic              |
| AI / ML    | DeepFace (face recognition), vLLM (image description) |
| Database   | ChromaDB (vector database)             |

---

## Project Structure

```
deepeye/
├── frontend/                    # Next.js application
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Landing page
│   │   ├── register/page.tsx   # Register a person
│   │   ├── search/page.tsx     # Search by face
│   │   ├── describe/page.tsx   # Describe an image
│   │   └── persons/page.tsx    # List all persons
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── ImageUploader.tsx
│   ├── lib/
│   │   └── api.ts              # API client helpers
│   └── .env.local              # NEXT_PUBLIC_API_URL
│
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── routes/
│   │   ├── person.py           # /api/person endpoints
│   │   └── describe.py         # /api/describe endpoint
│   ├── services/
│   │   ├── deepface_service.py # Face embedding & search
│   │   └── vision_service.py   # vLLM image description
│   ├── db/
│   │   └── chroma_client.py    # ChromaDB wrapper
│   ├── models/
│   │   └── person_model.py     # Pydantic models
│   ├── requirements.txt
│   └── .env.example
│
└── README.md
```

---

## Quick Start

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Copy env file and edit values
copy .env.example .env

# Start the API server
uvicorn main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

### 2. vLLM Server (Vision Model)

```bash
pip install vllm
python -m vllm.entrypoints.openai.api_server \
  --model llava-hf/llava-1.5-7b-hf \
  --port 8080
```

> Adjust `VLLM_MODEL` in `backend/.env` to match your preferred model.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

---

## API Endpoints

### Person

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/person/` | List all registered persons |
| `POST` | `/api/person/register` | Register person (name + image) |
| `POST` | `/api/person/search` | Search by face image |
| `POST` | `/api/person/analyze` | Analyze face attributes |
| `DELETE` | `/api/person/{id}` | Delete a person |

### Describe

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/describe/` | Describe image (with optional face enrichment) |

---

## Environment Variables

### Backend (`backend/.env`)

```env
VLLM_BASE_URL=http://localhost:8080
VLLM_MODEL=llava-hf/llava-1.5-7b-hf
DEEPFACE_MODEL=ArcFace
DEEPFACE_DETECTOR=retinaface
SIMILARITY_THRESHOLD=0.40
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Features

- 🔐 **Face Registration** – Upload a photo to register a person with their face embedding stored in ChromaDB
- 🔍 **Face Search** – Query the database with a face photo and get ranked matches with confidence scores
- 🧠 **Face Analysis** – Detect age, gender, emotion, and race from a face image
- 🖼️ **Image Description** – Generate natural language descriptions using a vLLM-powered vision model
- 🔗 **Context-Aware Description** – Automatically identifies known faces and injects their names into the vision prompt

---

## License

MIT
