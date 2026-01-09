export type MessageType = 'data' | 'control' | 'status' | 'error';

export interface WSMessage {
  type: MessageType;
  session_id?: string;
  payload: DataPayload | ControlPayload | StatusPayload | ErrorPayload;
  timestamp: number;
}

export interface DataPayload {
  data: string;  // Base64 encoded
  encoding: 'raw' | 'base64';
}

export interface ControlPayload {
  action: 'connect' | 'disconnect' | 'resize';
  params?: Record<string, unknown>;
}

export interface StatusPayload {
  state: 'connected' | 'disconnected' | 'connecting' | 'error' | 'ready';
  message?: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
}
