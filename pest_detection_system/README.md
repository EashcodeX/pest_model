# Local Pest Detection System

This project runs a YOLO pest detection model locally on your laptop and displays the results in a React Dashboard.

## Prerequisites

- **Python 3.8+**
- **Node.js** (for React Dashboard)
- **Webcam**

## Setup Instructions

### 1. Python Backend Setup

1.  **Install Dependencies**:
    ```bash
    cd pest_detection_system
    pip install -r requirements.txt
    ```
2.  **Start Inference Server**:
    ```bash
    python laptop_client.py
    ```
    *This starts a local Flask server at `http://localhost:5000`. It will automatically download `yolov8n.pt` if no custom model is found.*

### 2. React Dashboard Setup

1.  **Install Node Dependencies** (if not already done):
    ```bash
    npm install
    ```
2.  **Start React App**:
    ```bash
    npm run dev
    ```
3.  **View Dashboard**:
    Open your browser to `http://localhost:5173`.
    Navigate to the **Live Feed** page to see the video stream and detection data.

## Custom Model

To use your own trained model:
1.  Place your `.pt` file in the `pest_detection_system` folder.
2.  Rename it to `model.pt`.
3.  Restart the Python server.

## Troubleshooting

- **Camera Error**: Ensure no other app is using your webcam.
- **Port In Use**: If port 5000 is busy, kill the process using it or change `PORT` in `laptop_client.py`.
