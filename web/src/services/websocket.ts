import type { WSMessage, DataPayload, ControlPayload } from '../types/message';
import type { SerialConfig } from '../types/serial';

type MessageHandler = (message: WSMessage) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimeout: number | null = null;
  private url: string;

  constructor(url: string = `ws://${window.location.host}/ws`) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.handlers.forEach(handler => handler(message));
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.scheduleReconnect();
      };
    });
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(message: WSMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  sendData(data: string) {
    const payload: DataPayload = {
      data: btoa(data),  // Base64 encode
      encoding: 'base64',
    };

    this.send({
      type: 'data',
      payload,
      timestamp: Date.now(),
    });
  }

  sendControl(action: ControlPayload['action'], params?: Record<string, unknown>) {
    const payload: ControlPayload = {
      action,
      params,
    };

    this.send({
      type: 'control',
      payload,
      timestamp: Date.now(),
    });
  }

  connectPort(config: SerialConfig) {
    this.sendControl('connect', config as unknown as Record<string, unknown>);
  }

  connectSSH(config: Record<string, unknown>) {
    this.sendControl('connect_ssh', config);
  }

  disconnectPort() {
    this.sendControl('disconnect');
  }

  resizeTerminal(cols: number, rows: number) {
    this.sendControl('resize', { cols, rows });
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;

    this.reconnectTimeout = window.setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      this.reconnectTimeout = null;
      this.connect().catch(console.error);
    }, 3000);
  }
}

export const wsClient = new WebSocketClient();
