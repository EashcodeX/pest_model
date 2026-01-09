export interface PestDetection {
  id: string;
  timestamp: string;
  species: string;
  count: number;
  confidence: number;
  latitude: number;
  longitude: number;
  imageUrl: string;
}

export interface RoverStatus {
  battery: number; // 0-100
  status: 'online' | 'offline' | 'scanning' | 'returning' | 'error';
  signalStrength: number; // 0-100
  speed: number;
}

export interface PiSystemStats {
  cpuTemp: number; // Celsius
  cpuUsage: number; // Percentage
  memoryUsage: number; // Percentage
  diskUsage: number; // Percentage
  fps: number; // Inference Frames Per Second
}

export interface BoundingBox {
  class: string;
  confidence: number;
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  width: number; // normalized 0-1
  height: number; // normalized 0-1
  color: string;
}

export interface TelemetryFrame {
  timestamp: number;
  gps: { lat: number; lng: number };
  stats: PiSystemStats;
  detections: BoundingBox[];
  ai_insight?: string;
  scan_report?: string;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isSearch?: boolean;
  sources?: Array<{
    uri: string;
    title: string;
  }>;
}

export enum ViewState {
  LIVE_FEED = 'LIVE_FEED',
  DETECTIONS = 'DETECTIONS',
  MAP = 'MAP',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS'
}