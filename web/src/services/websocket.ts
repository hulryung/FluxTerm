import type { WSMessage, DataPayload, ControlPayload } from '../types/message';
import type { SerialConfig } from '../types/serial';

type MessageHandler = (message: WSMessage) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimeout: number | null = null;
  private url: string;

  constructor(url: string = 'ws://127.0.0.1:8080/ws') {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if WebSocket is already open or connecting
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }
      if (this.ws?.readyState === WebSocket.CONNECTING) {
        // Wait for the existing connection to open
        const onOpen = () => {
          this.ws?.removeEventListener('open', onOpen);
          this.ws?.removeEventListener('error', onError);
          resolve();
        };
        const onError = (error: Event) => {
          this.ws?.removeEventListener('open', onOpen);
          this.ws?.removeEventListener('error', onError);
          reject(error);
        };
        this.ws.addEventListener('open', onOpen);
        this.ws.addEventListener('error', onError);
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
        // Disable auto-reconnect for now
        // this._scheduleReconnect();
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
    // Properly encode UTF-8 strings (including Korean, Chinese, Japanese)
    // btoa() only works with Latin1, so we need to encode UTF-8 first
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(data);

    // Convert Uint8Array to binary string
    let binaryString = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binaryString += String.fromCharCode(utf8Bytes[i]);
    }

    // Now we can safely use btoa
    const base64Data = btoa(binaryString);

    const payload: DataPayload = {
      data: base64Data,
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

  // Reserved for future use - automatic reconnection
  // @ts-expect-error - Method intentionally unused
  private _scheduleReconnect() {
    if (this.reconnectTimeout) return;

    this.reconnectTimeout = window.setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      this.reconnectTimeout = null;
      this.connect().catch(console.error);
    }, 3000);
  }
}

export const wsClient = new WebSocketClient();
