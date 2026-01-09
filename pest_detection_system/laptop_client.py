"""
Pest Detection System - Backend Server
======================================

This module acts as the central processing unit for the Pest Detection System.
It handles computer vision inference, LLM-based pest advice generation, and serves
video telemetry to the frontend.

Key Features:
- YOLOv11 Inference: Real-time object detection for 102 pest classes.
- LLM Integration: Connectivity to Ollama (Custom Pest-LLM) for generates control advice.
- Hybrid Video Feed: Supports inputs from local webcam (Rover Mode) and remote clients.
- Telemetry Streaming: Broadcasts system stats and detections via REST/JSON.

Author: EashcodeX
Date: 2025
"""

import cv2
import numpy as np
import time
import threading
import json
import psutil
import os
import requests
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from ultralytics import YOLO

# Configuration
PORT = 5002
CAMERA_INDEX = 0
FRAME_WIDTH = 640
FRAME_HEIGHT = 480
MODEL_PATH = 'model.pt' # Will fall back to yolov8n.pt if not found
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:latest")

# Global State to share data between Inference Thread and Flask Server
latest_frame = None
latest_telemetry = {
    "timestamp": 0,
    "gps": {"lat": 0, "lng": 0},
    "stats": {"cpuTemp": 0, "cpuUsage": 0, "memoryUsage": 0, "diskUsage": 0, "fps": 0},
    "detections": [],
    "ai_insight": "",
    "scan_report": ""
}
lock = threading.Lock()
insight_cache = {}
current_insight = "Waiting for detection..."

# Scan State
is_scanning = False
scan_findings = set()

app = Flask(__name__)
CORS(app)

def load_model():
    """
    Loads the YOLO object detection model.
    Checks for a custom 'model.pt' first, falling back to 'yolov8n.pt'.
    
    Returns:
        YOLO: Loaded model instance.
    """
    if os.path.exists(MODEL_PATH):
        print(f"Loading custom model from {MODEL_PATH}...")
        return YOLO(MODEL_PATH)
    else:
        print("Custom model not found. Downloading/Loading standard YOLOv8n...")
        return YOLO('yolov8n.pt')

def get_system_stats(inference_time):
    """
    Collects system performance metrics.
    
    Args:
        inference_time (float): The time taken for the last inference pass.
        
    Returns:
        dict: Usage stats for CPU, Memory, Disk, and calculated FPS.
    """
    return {
        "cpuTemp": 0, 
        "cpuUsage": psutil.cpu_percent(),
        "memoryUsage": psutil.virtual_memory().percent,
        "diskUsage": psutil.disk_usage('/').percent,
        "fps": 1.0 / inference_time if inference_time > 0 else 0
    }

def get_ai_insight(pest_name):
    """
    Queries the Local LLM (Ollama) for control advice regarding a detected pest.
    Updates the global `current_insight` variable.
    
    Args:
        pest_name (str): The name of the detected pest class.
    """
    global current_insight
    
    if pest_name in insight_cache:
        current_insight = insight_cache[pest_name]
        return

    prompt = f"Provide a 1-sentence control method for the agricultural pest: {pest_name}. Keep it under 20 words."
    
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        }
        response = requests.post(OLLAMA_URL, json=payload, timeout=2)
        if response.status_code == 200:
            insight = response.json().get('response', 'No insight available.')
            insight_cache[pest_name] = insight
            current_insight = insight
        else:
            print(f"Ollama Error: {response.status_code}")
    except Exception as e:
        print(f"Ollama Connection Failed: {e}")

def generate_scan_report(pests):
    """
    Generates a comprehensive summary report for a list of detected pests using the LLM.
    
    Args:
        pests (list): List of unique pest names found during the scan.
        
    Returns:
        str: A Markdown-formatted report or error message.
    """
    if not pests:
        return "No pests detected during the scan."
    
    pest_list = ", ".join(pests)
    prompt = f"I found these pests in my field: {pest_list}. Provide a comprehensive summary. Then, for each pest, provide 1) A Chemical Control method and 2) A Natural/Organic Control method. Keep it concise."
    
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        }
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
        if response.status_code == 200:
            return response.json().get('response', 'Could not generate report.')
        else:
            return f"Error generating report: {response.status_code}"
    except Exception as e:
        return f"Report generation failed: {e}"

@app.route('/control', methods=['POST'])
def control():
    """
    API Endpoint to control the scanning state.
    
    Commands:
    - START_SCAN: Resets findings and begins tracking.
    - STOP_SCAN: Stops tracking, generates report, and returns findings.
    """
    global is_scanning, scan_findings, latest_telemetry
    
    data = request.json
    command = data.get('command')
    
    print(f"Received command: {command}")
    
    if command == 'START_SCAN':
        is_scanning = True
        scan_findings = set()
        with lock:
            latest_telemetry["scan_report"] = "" # Clear previous report
        return jsonify({"status": "started", "message": "Scan started. Tracking pests..."})
    
    elif command == 'STOP_SCAN':
        is_scanning = False
        pests_found = list(scan_findings)
        print(f"Scan stopped. Found: {pests_found}")
        
        # Generate Report
        report = generate_scan_report(pests_found)
        
        with lock:
            latest_telemetry["scan_report"] = report
            
        return jsonify({"status": "stopped", "pests_found": pests_found, "report": report})
    
    return jsonify({"status": "error", "message": "Unknown command"}), 400

@app.route('/detect', methods=['POST'])
def detect_image():
    """
    API Endpoint for Client-Side Camera Inference.
    Receives an image file, runs YOLO inference, and returns detections/boxes.
    """
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    file = request.files['image']
    npimg = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    
    if frame is None:
        return jsonify({"error": "Invalid image"}), 400

    # Run Inference
    model = load_model()
    results = model(frame, verbose=False)
    result = results[0]
    
    detections = []
    h, w, _ = frame.shape
    
    for box in result.boxes:
        b = box.xyxy[0].tolist()
        conf = float(box.conf)
        cls = int(box.cls)
        
        if cls < len(CLASS_NAMES):
            class_name = CLASS_NAMES[cls]
        else:
            class_name = str(cls)
            
        if conf > 0.4: # Slightly lower threshold for mobile photos
            detections.append({
                "class": class_name,
                "confidence": conf,
                "x": b[0] / w,
                "y": b[1] / h,
                "width": (b[2] - b[0]) / w,
                "height": (b[3] - b[1]) / h,
                "color": "#00FF00"
            })
            
    return jsonify({"detections": detections})

# Class Names from original project
CLASS_NAMES = [
    'Rice Leaf Roller', 'Yellow Tail Moth', 'Black Cutworm', 'Pea Leafminer', 'Beet Armyworm',
    'Black Cutworm Moth', 'Rice Stem Borer', 'Corn Earworm', 'Tobacco Cutworm', 'Fall Armyworm',
    'Pink Stem Borer', 'Locust', 'Rice Gall Midge', 'Rice Leafhopper', 'Cotton Bollworm',
    'Whitefly', 'Thrips', 'Green Leafhopper', 'Bean Weevil', 'Corn Borer',
    'Flea Beetle', 'Rice Bug', 'Grasshopper', 'Mealybug', 'Rice Planthopper',
    'Spider Mite', 'Aphid', 'Cutworm', 'Wireworm', 'Carrot Beetle',
    'Psyllid', 'Fruit Fly', 'Fruit Moth', 'Weevil', 'Ant',
    'Hornworm', 'Gall Wasp', 'Leaf Beetle', 'Slug', 'Snail',
    'Leafminer Fly', 'Stem Maggot', 'Beetle Grub', 'Bagworm', 'Citrus Psylla',
    'Potato Beetle', 'Blue Worm', 'Diamondback Moth', 'Cabbage Fly', 'Cotton Aphid',
    'Stem Weevil', 'Rice Thrips', 'Rice Leaf Folder', 'Cotton Thrips', 'Cotton Leafworm',
    'Cutworm Moth', 'Pyralid Moth', 'Soybean Moth', 'Soybean Looper', 'Corn Aphid',
    'Beetle Nymph', 'Cotton Stainer', 'Army Beetle', 'Wheat Sawfly', 'Brown Marmorated Stink Bug',
    'Taro Caterpillar', 'Potato Moth', 'Maize Weevil', 'Cabbage Cutworm', 'Onion Maggot',
    'Rice Weevil', 'Cabbage Moth', 'Diamond Beetle', 'Mulberry Whitefly', 'Earwig',
    'Red Flour Beetle', 'Sorghum Greenbug', 'Rose Sawfly', 'Silverfish', 'Cockroach Nymph',
    'Corn Rootworm', 'Grassland Moth', 'Greenhouse Whitefly', 'Leafhopper Nymph', 'Mealybug Nymph',
    'Cotton Boll Weevil', 'Green Peach Aphid', 'Cabbage Aphid', 'Bean Weevil Nymph', 'Rice Water Weevil',
    'Leaf Gall Midge', 'Flower Thrips', 'Soybean Aphid', 'Seedcorn Maggot', 'Leaf Spot Beetle',
    'Alfalfa Weevil', 'Fruit Piercing Moth', 'Rice Leaf Miner', 'Cotton Jassid', 'Seed Beetle',
    'Unknown Pest 1', 'Unknown Pest 2'
]

def inference_thread():
    """
    Background Thread that runs the Main Inference Loop (for Rover Mode).
    Captures video from the local device, runs YOLO, and updates the global `latest_frame`.
    """
    global latest_frame, latest_telemetry, current_insight, is_scanning, scan_findings
    
    model = load_model()
    cap = cv2.VideoCapture(CAMERA_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

    if not cap.isOpened():
        print("Error: Could not open camera.")
        return

    print("Starting Local Inference Loop...")
    
    last_ai_call = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to capture frame")
            time.sleep(1)
            continue

        # 1. Run Inference
        start_time = time.time()
        results = model(frame, verbose=False)
        inference_time = time.time() - start_time

        # 2. Process Detections
        detections = []
        result = results[0]
        annotated_frame = frame.copy() # We will draw our own annotations to ensure names are correct
        
        detected_pest_name = None
        
        for box in result.boxes:
            b = box.xyxy[0].tolist() # x1, y1, x2, y2
            conf = float(box.conf)
            cls = int(box.cls)
            
            # Map class ID to Name
            if cls < len(CLASS_NAMES):
                class_name = CLASS_NAMES[cls]
            else:
                class_name = str(cls)
            
            if conf > 0.5: # Only consider confident detections for AI
                detected_pest_name = class_name
                if is_scanning:
                    scan_findings.add(class_name)
            
            # Draw on frame
            x1, y1, x2, y2 = map(int, b)
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(annotated_frame, f"{class_name} {conf:.2f}", 
                        (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 
                        0.5, (0, 255, 0), 2)
            
            # Normalize coordinates for frontend (0-1)
            h, w, _ = frame.shape
            detections.append({
                "class": class_name,
                "confidence": conf,
                "x": b[0] / w,
                "y": b[1] / h,
                "width": (b[2] - b[0]) / w,
                "height": (b[3] - b[1]) / h,
                "color": "#00FF00"
            })

        # 3. Trigger AI Insight (Async)
        if detected_pest_name and (time.time() - last_ai_call > 5): # Rate limit AI calls
            threading.Thread(target=get_ai_insight, args=(detected_pest_name,)).start()
            last_ai_call = time.time()

        # 4. Update Global State
        with lock:
            latest_frame = annotated_frame
            latest_telemetry = {
                "timestamp": time.time() * 1000,
                "gps": {"lat": 0, "lng": 0},
                "stats": get_system_stats(inference_time),
                "detections": detections,
                "ai_insight": current_insight,
                "scan_report": latest_telemetry.get("scan_report", "")
            }
        
        # Small sleep to prevent 100% CPU usage if inference is super fast
        time.sleep(0.001)

def generate_frames():
    """
    Generator function that yields JPEG frames for the video stream.
    """
    while True:
        with lock:
            if latest_frame is None:
                time.sleep(0.1)
                continue
            
            _, buffer = cv2.imencode('.jpg', latest_frame)
            frame = buffer.tobytes()
            
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        time.sleep(0.03) # Limit to ~30 FPS streaming

@app.route('/video_feed')
def video_feed():
    """
    Route for the Motion JPEG (MJPEG) video streaming.
    Includes anti-caching headers to reduce latency.
    """
    response = Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/telemetry')
def get_telemetry():
    """
    Route to get real-time JSON telemetry (stats, detections, AI insights).
    """
    with lock:
        return jsonify(latest_telemetry)

@app.route('/')
def index():
    return jsonify({
        "status": "online",
        "service": "Pest Detection Backend",
        "endpoints": ["/video_feed", "/telemetry", "/control"]
    })

if __name__ == '__main__':
    # Start background thread for Inference
    t = threading.Thread(target=inference_thread, daemon=True)
    t.start()
    
    # Start Flask Server
    app.run(host='0.0.0.0', port=PORT, debug=False)
