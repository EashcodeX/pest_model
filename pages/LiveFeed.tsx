import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, ScanLine, Activity, Thermometer, Cpu, Disc, Camera, Video } from 'lucide-react';
import { piService } from '../services/piService';
import { getBackendBaseUrl } from '../services/backendConfig';
import { TelemetryFrame, BoundingBox } from '../types';

const LiveFeed: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cameraMode, setCameraMode] = useState<'rover' | 'client'>('client');
  const backendUrl = getBackendBaseUrl();

  // Real-time state from Pi
  const [telemetry, setTelemetry] = useState<TelemetryFrame | null>(null);

  // Client-Side Camera Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Connect to Pi Service (backed by selected telemetry server: Mac or Pi)
  useEffect(() => {
    piService.connect('');

    const unsubscribe = piService.subscribe((data) => {
      if (cameraMode === 'rover') {
        setTelemetry(data);
      }
    });

    return () => {
      unsubscribe();
      piService.disconnect();
    };
  }, [cameraMode]);

  // Client-Side Camera Logic
  const startClientCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      startInferenceLoop();
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please allow permissions.");
      setCameraMode('rover');
    }
  };

  const stopClientCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startInferenceLoop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState !== 4) return;

      // Draw video frame to canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob and send to backend
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append('image', blob);

        try {
          const response = await fetch(`${backendUrl}/detect`, {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            const data = await response.json();
            // Update local telemetry state with detection results
            setTelemetry(prev => {
              const baseStats = prev?.stats || { cpuTemp: 0, cpuUsage: 0, memoryUsage: 0, diskUsage: 0, fps: 0 };
              return {
                timestamp: Date.now(),
                gps: prev?.gps || { lat: 0, lng: 0 },
                stats: { ...baseStats, fps: 0 },
                detections: data.detections,
                ai_insight: prev?.ai_insight || "",
                scan_report: prev?.scan_report || ""
              };
            });
          }
        } catch (err) {
          console.error("Inference error:", err);
        }
      }, 'image/jpeg', 0.8);

    }, 500); // Run inference every 500ms (2 FPS)
  };

  useEffect(() => {
    if (cameraMode === 'client') {
      startClientCamera();
    } else {
      stopClientCamera();
    }
    return () => stopClientCamera();
  }, [cameraMode]);

  // Restart inference loop when scanning toggles
  useEffect(() => {
    if (cameraMode === 'client' && isScanning) {
      startInferenceLoop();
    }
  }, [isScanning]);


  const toggleScan = () => {
    const newState = !isScanning;
    setIsScanning(newState);
    if (cameraMode === 'rover') {
      piService.sendCommand(newState ? 'START_SCAN' : 'STOP_SCAN');
    }
  };

  // Derived stats
  const fpsColor = (telemetry?.stats.fps || 0) > 15 ? 'text-green-400' : 'text-yellow-400';
  const tempColor = (telemetry?.stats.cpuTemp || 0) > 70 ? 'text-red-400' : 'text-blue-400';

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-100px)]">
        {/* Main Video Feed Area */}
        <div className="lg:col-span-3 bg-black rounded-2xl overflow-hidden relative shadow-xl flex flex-col">
          <div className="absolute top-4 left-4 z-10 bg-black/60 text-white px-3 py-1 rounded text-sm flex items-center gap-2 backdrop-blur-sm border border-white/10">
            <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            {isScanning ? 'SCANNING' : 'IDLE'}
          </div>
          <div className="absolute top-4 right-4 z-10 text-white/80 font-mono text-sm bg-black/30 px-2 rounded">
            {currentTime.toLocaleTimeString()}
          </div>

          {/* Video Content */}
          <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">

            {cameraMode === 'rover' ? (
              <img
                src={`${backendUrl}/video_feed`}
                alt="Rover Feed"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <video ref={videoRef} className="hidden" playsInline muted />
                <canvas ref={canvasRef} className="w-full h-full object-contain" />
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                    <p>Press Start Scan to detect pests</p>
                  </div>
                )}
              </div>
            )}

            {/* Dynamic Bounding Box Overlay (Shared for both modes) */}
            {showOverlay && telemetry?.detections.map((det, idx) => (
              <div
                key={idx}
                className="absolute border-2 transition-all duration-200 ease-linear"
                style={{
                  left: `${det.x * 100}%`,
                  top: `${det.y * 100}%`,
                  width: `${det.width * 100}%`,
                  height: `${det.height * 100}%`,
                  borderColor: det.color,
                  boxShadow: `0 0 10px ${det.color}80`
                }}
              >
                <div
                  className="absolute -top-6 left-0 text-xs font-bold px-1.5 py-0.5 text-white whitespace-nowrap rounded-t"
                  style={{ backgroundColor: det.color }}
                >
                  {det.class} {Math.round(det.confidence * 100)}%
                </div>
              </div>
            ))}

            {/* Scan Line Animation */}
            {isScanning && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/10 to-transparent animate-scan pointer-events-none h-[20%] w-full top-0"></div>
            )}
          </div>

          {/* Video Controls */}
          <div className="bg-slate-800 p-4 flex items-center justify-between border-t border-slate-700">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleScan}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isScanning
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-agri-600 text-white hover:bg-agri-500'
                  }`}
              >
                {isScanning ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                {isScanning ? 'Stop Scan' : 'Start Scan'}
              </button>

              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className={`p-2 rounded-lg transition-colors ${showOverlay ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-gray-700'
                  }`}
                title="Toggle AI Overlay"
              >
                <ScanLine size={20} />
              </button>

              {/* Camera Source Toggle */}
              <div className="h-8 w-px bg-slate-700 mx-2"></div>
              <div className="flex bg-slate-900 rounded-lg p-1">
                <button
                  onClick={() => setCameraMode('rover')}
                  className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-all ${cameraMode === 'rover' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <Video size={16} />
                  Rover
                </button>
                <button
                  onClick={() => setCameraMode('client')}
                  className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-all ${cameraMode === 'client' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  <Camera size={16} />
                  My Camera
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6 text-gray-400 text-sm font-mono">
              <div className="flex items-center gap-2">
                <Activity size={14} />
                <span className={fpsColor}>{telemetry?.stats.fps.toFixed(1)} FPS</span>
              </div>
              <div className="hidden sm:block">RES: 1280x720</div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: System Health & Stats */}
        <div className="bg-white rounded-2xl p-5 shadow-lg flex flex-col border border-gray-100 h-full overflow-hidden">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Cpu className="text-agri-600" />
            System Health (Pi)
          </h2>

          {/* Pi Stats Cards */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase">CPU Temp</span>
                <Thermometer size={14} className={tempColor} />
              </div>
              <div className="text-2xl font-mono font-bold text-slate-700">
                {telemetry?.stats.cpuTemp.toFixed(1)}°C
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${telemetry?.stats.cpuTemp && telemetry.stats.cpuTemp > 70 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min((telemetry?.stats.cpuTemp || 0) / 85 * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase">RAM Usage</span>
                <Disc size={14} className="text-purple-400" />
              </div>
              <div className="text-2xl font-mono font-bold text-slate-700">
                {Math.round(telemetry?.stats.memoryUsage || 0)}%
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${telemetry?.stats.memoryUsage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* AI Insight Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Cpu size={48} />
            </div>
            <h3 className="text-xs font-bold text-indigo-500 uppercase mb-2 flex items-center gap-2">
              <Activity size={14} />
              AI Pest Advisor
            </h3>
            <div className="text-sm text-indigo-900 font-medium leading-relaxed">
              {telemetry?.ai_insight || "Waiting for detection..."}
            </div>
          </div>



          <div className="flex-1 overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Live Detection Log</h3>
            <div className="space-y-2">
              {telemetry?.detections && telemetry.detections.length > 0 ? (
                telemetry.detections.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                      <span className="text-sm font-medium text-gray-700">{d.class}</span>
                    </div>
                    <span className="text-xs font-mono bg-white px-1 rounded border border-gray-200">
                      {(d.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 text-xs py-4 italic">Waiting for detection...</div>
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <div className="text-xs text-gray-400 font-mono">Link: ws://192.168.1.105:8765</div>
          </div>
        </div >
      </div >

      {/* Full Width Scan Report */}
      {telemetry?.scan_report && (
        <div className="w-full bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 shadow-lg relative overflow-hidden animate-fade-in mb-10">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ScanLine size={120} />
          </div>
          <h3 className="text-lg font-bold text-green-700 uppercase mb-4 flex items-center gap-3">
            <ScanLine size={24} />
            Scan Summary Report
          </h3>
          <div className="text-base text-green-900 font-medium leading-relaxed whitespace-pre-wrap">
            {telemetry.scan_report}
          </div>
        </div>
      )}
    </div >
  );
};

export default LiveFeed;