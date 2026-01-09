FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV and GL
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and model
COPY laptop_client.py .
COPY model.pt .
# Fallback model if custom model is missing
COPY yolov8n.pt . 

# Expose the port
EXPOSE 5001

# Run the application
CMD ["python", "laptop_client.py"]
