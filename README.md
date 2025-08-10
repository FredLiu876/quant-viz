# Quant-Viz

Quant-Viz is a full-stack application for visualizing stock data and running Python-based alpha strategies, with interactive result visualization. It features a FastAPI backend and a ReactJS frontend styled with Tailwind CSS.

## Features

- **Stock Visualization:** View historical price charts and data for selected stocks.
- **Alpha Strategy Runner:** Execute custom Python alpha strategies against stock data.
- **Result Visualization:** Instantly visualize alpha results and performance metrics.
- **Modern UI:** Responsive, clean interface built with ReactJS and Tailwind CSS.

## Tech Stack

- **Backend:** FastAPI (Python)
- **Frontend:** ReactJS, Tailwind CSS, Vite

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend Setup

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

### Frontend Setup

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
│   ├── api/        # FastAPI backend
│   └── web/        # ReactJS frontend
└── README.md
```

## License

MIT License