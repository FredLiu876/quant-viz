# Quant‑Viz

Quant‑Viz is a full‑stack application for visualizing stock data and running Python‑based alpha strategies, with interactive result visualization. It features a FastAPI backend and a ReactJS frontend styled with Tailwind CSS.

## Features

* **Stock Visualization:** View historical price charts and data for selected stocks.
* **Alpha Strategy Runner:** Execute custom Python alpha strategies against stock data.
* **Result Visualization:** Instantly visualize alpha results and performance metrics.
* **Sandboxed Execution:** Run untrusted Python code inside a locked‑down Docker container.

## Tech Stack

* **Backend:** FastAPI (Python) + Docker‑based sandbox runner
* **Frontend:** ReactJS, Tailwind CSS, Vite

## Getting Started

### Prerequisites

* Python 3.10+
* Node.js 18+
* **Docker 24+** (required for the sandboxed runner)

## Backend Setup

### 1) API Server

1. Navigate to the backend folder:

   ```bash
   cd apps/api
   ```
2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server:

   ```bash
   uvicorn main:app --reload
   ```

### 2) Sandboxed Runner (`apps/run_safe_container`)

This component builds a minimal Docker image that executes user‑provided Python safely in an isolated environment. The FastAPI `/run` endpoint launches this image, mounting user code at `/code` and collecting structured results from `/output/result.json`.

**Build the image**

```bash
cd apps/run_safe_container
docker build -t sandbox .
```

**How the runner works**

* The image bakes a stable runner at `/app/main.py` (not overwritten).
* User code (e.g., `alpha.py`) is bind‑mounted at **`/code`**.
* The runner imports user modules from `/code` (via `PYTHONPATH="/code:/app"`).
* The user script writes a structured JSON result to **`/output/result.json`**.
* The API reads that file after the container exits and returns it to the frontend.

## Frontend Setup

1. Navigate to the frontend folder:

   ```bash
   cd apps/web
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Start the development server:

   ```bash
   npm run dev
   ```

## Usage

1. Open the frontend in your browser (default: [http://localhost:5173](http://localhost:5173)).
2. Select stocks to visualize price data.
3. Run Python alpha strategies via the backend and view results in the UI.

## Project Structure

```
quant-viz/
├── apps/
│   ├── api/                 # FastAPI backend (HTTP API)
│   ├── run_safe_container/  # Backend sandbox runner (Docker image & runner code)
│   └── web/                 # ReactJS frontend
└── README.md
```

## License

MIT License
