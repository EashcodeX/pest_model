# 🍃 AI-Powered Pest Detection System

> A Hybrid Edge-AI Solution for Real-Time Agricultural Pest Management

![Project Banner](https://img.shields.io/badge/Status-Live-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![Python](https://img.shields.io/badge/Python-3.10-blue) ![React](https://img.shields.io/badge/React-18-blue)

## 📌 Project Overview
This project is an advanced agricultural tool capable of detecting **102 distinct pest species** in real-time. It leverages a hybrid architecture combining **YOLOv11** for computer vision and a **Custom Fine-Tuned Large Language Model (LLM)** to provide actionable pest control advice (Chemical & Organic) instantly.

It is designed to work in two modes:
1.  **Rover Mode**: Integrated with an autonomous robot (Raspberry Pi/Laptop) for field scanning.
2.  **Scanner Mode (Client-Side)**: Instantly turns any smartphone into a pest detection tool via a web browser.

## 🚀 Key Features
*   **Real-Time Detection**: < 50ms inference time using YOLOv11.
*   **102 Pest Classes**: Comprehensive coverage of major agricultural pests.
*   **AI Pest Advisor**: Generates instant "Control Methods" using a local LLM (Ollama).
*   **Hybrid Architecture**: Works on Edge (Rover) and Cloud (Web App).
*   **Scan Reports**: Generates detailed PDF-style summaries of field health.
*   **Worldwide Access**: Securely exposed via Cloudflare Tunnels (No port forwarding needed).

## 📂 Project Structure

```bash
📦 pest-detection-system
├── 📂 pest_detection_system  # Backend (Python/Flask)
│   ├── laptop_client.py      # Main Server (Inference + API)
│   ├── model.pt              # Trained YOLOv11 Model
│   ├── yolov8n.pt            # Fallback Model
│   └── requirements.txt      # Python Dependencies
├── 📂 pages                  # Frontend Pages (React)
│   ├── LiveFeed.tsx          # Main Dashboard & Camera Logic
│   └── ...
├── 📂 components             # Reusable UI Components
├── 📂 services               # API Communication Services
├── Dockerfile                # Frontend Container Config
├── docker-compose.yml        # Full Stack Orchestration
└── README.md                 # Documentation
```

## 🛠️ Setup Instructions

### Prerequisites
*   **Docker** & **Docker Compose**
*   **NVIDIA GPU** (Optional, for faster inference)
*   **Webcam** (for Rover mode)

### Quick Start (Docker)
The easiest way to run the full system (Frontend + Backend + LLM):

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/EashcodeX/pest_model.git
    cd pest_model
    ```

2.  **Start Services**
    ```bash
    docker-compose up -d
    ```

3.  **Access the App**
    *   **Web Dashboard**: `http://localhost:3000`
    *   **Backend API**: `http://localhost:5002`

### Manual Setup (Dev Mode)

#### Backend
```bash
cd pest_detection_system
pip install -r requirements.txt
python laptop_client.py
```

#### Frontend
```bash
npm install
npm run dev
```

## 🎮 Usage Guide

1.  **Open the Web App**.
2.  **Select Camera Mode**:
    *   **"My Camera"**: Uses your phone/laptop webcam. Grant permissions when asked.
    *   **"Rover"**: Connects to the host robot's camera feed.
3.  **Start Scan**: Click the "Start Scan" button.
4.  **View Detections**: Green boxes will appear around recognized pests.
5.  **Get Advice**: The "AI Pest Advisor" panel will show control methods for detected pests.
6.  **Stop Scan**: Click "Stop Scan" to generate a full report.

## 🤝 Contact
**Team EashcodeX**
*   **GitHub**: [EashcodeX](https://github.com/EashcodeX)

---
*Built for the [AI IGNITE] 2026*
