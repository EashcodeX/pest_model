import socket
import struct
import cv2
import numpy as np
from ultralytics import YOLO
import time
import json
import psutil

# Configuration
HOST = '0.0.0.0'  # Listen on all interfaces
PORT = 9999
MODEL_PATH = 'model.pt'  # Path to your YOLO model

def load_model():
    print(f"Loading model from {MODEL_PATH}...")
    try:
        model = YOLO(MODEL_PATH)
        print("Model loaded successfully.")
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        print("Please ensure 'model.pt' is in the same directory.")
        return None

def recv_all(sock, count):
    buf = b''
    while count:
        newbuf = sock.recv(count)
        if not newbuf: return None
        buf += newbuf
        count -= len(newbuf)
    return buf

def get_system_stats(inference_time):
    return {
        "cpuTemp": 0, # Psutil doesn't always give temp on all OSs easily, keeping 0 for now or implement specific Pi check
        "cpuUsage": psutil.cpu_percent(),
        "memoryUsage": psutil.virtual_memory().percent,
        "diskUsage": psutil.disk_usage('/').percent,
        "fps": 1.0 / inference_time if inference_time > 0 else 0
    }

# Try to get Pi temperature
def get_pi_temp():
    try:
        with open('/sys/class/thermal/thermal_zone0/temp', 'r') as f:
            temp = float(f.read()) / 1000.0
            return temp
    except:
        return 0.0

def run_server():
    model = load_model()
    if not model:
        return

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind((HOST, PORT))
    server_socket.listen(1)
    print(f"Server listening on {HOST}:{PORT}")

    conn, addr = server_socket.accept()
    print(f"Connected by {addr}")

    try:
        while True:
            # 1. Receive Frame Size
            size_data = recv_all(conn, 4)
            if not size_data:
                break
            size = struct.unpack('>L', size_data)[0]

            # 2. Receive Frame Data
            frame_data = recv_all(conn, size)
            if not frame_data:
                break

            # 3. Decode Frame
            nparr = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                print("Failed to decode frame")
                continue

            # 4. Run Inference
            start_time = time.time()
            results = model(frame, verbose=False)
            inference_time = time.time() - start_time

            # 5. Process Detections
            detections = []
            result = results[0]
            annotated_frame = result.plot()
            
            for box in result.boxes:
                b = box.xyxy[0].tolist() # x1, y1, x2, y2
                conf = float(box.conf)
                cls = int(box.cls)
                class_name = result.names[cls]
                
                # Normalize coordinates for frontend (0-1)
                h, w, _ = frame.shape
                detections.append({
                    "class": class_name,
                    "confidence": conf,
                    "x": b[0] / w,
                    "y": b[1] / h,
                    "width": (b[2] - b[0]) / w,
                    "height": (b[3] - b[1]) / h,
                    "color": "#00FF00" # Default green, can be customized
                })

            # 6. Prepare Metadata
            stats = get_system_stats(inference_time)
            stats['cpuTemp'] = get_pi_temp()
            
            metadata = {
                "timestamp": time.time() * 1000,
                "gps": {"lat": 0, "lng": 0}, # Placeholder
                "stats": stats,
                "detections": detections
            }
            
            metadata_json = json.dumps(metadata).encode('utf-8')

            # 7. Encode Frame
            _, encoded_img = cv2.imencode('.jpg', annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            img_data = encoded_img.tobytes()
            
            # 8. Send Metadata Size & Data
            conn.sendall(struct.pack('>L', len(metadata_json)))
            conn.sendall(metadata_json)
            
            # 9. Send Image Size & Data
            conn.sendall(struct.pack('>L', len(img_data)))
            conn.sendall(img_data)

    except Exception as e:
        print(f"Connection error: {e}")
    finally:
        conn.close()
        server_socket.close()
        print("Server closed")

if __name__ == '__main__':
    run_server()
