import { TelemetryFrame } from '../types';
import { getBackendBaseUrl } from './backendConfig';

// Configuration for real backend polling
const CONFIG = {
  updateRate: 700, // ms between polls to the telemetry server
};

type TelemetryCallback = (data: TelemetryFrame) => void;

class PiService {
  private isConnected: boolean = false;
  private subscribers: TelemetryCallback[] = [];
  private intervalId: any = null;
  private baseUrl: string = getBackendBaseUrl();

  connect(url: string) {
    console.log(`Connecting to telemetry server at ${url || this.baseUrl}...`);
    this.baseUrl = url || getBackendBaseUrl();
    this.isConnected = true;

    // Start polling the Python telemetry backend
    this.intervalId = setInterval(async () => {
      try {
        const res = await fetch(`${this.baseUrl}/telemetry`);
        if (!res.ok) return;
        const frame: TelemetryFrame = await res.json();
        this.subscribers.forEach(cb => cb(frame));
      } catch (err) {
        console.error('Telemetry fetch error:', err);
      }
    }, CONFIG.updateRate);

    return Promise.resolve(true);
  }

  disconnect() {
    this.isConnected = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  subscribe(callback: TelemetryCallback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  async sendCommand(cmd: string, payload?: any) {
    console.log(`Sending command to telemetry backend: ${cmd}`, payload);
    try {
      await fetch(`${this.baseUrl}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, payload })
      });
    } catch (err) {
      console.error('Failed to send command:', err);
    }
  }
}

export const piService = new PiService();