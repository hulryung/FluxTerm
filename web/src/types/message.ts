export type MessageType = 'data' | 'control' | 'status' | 'error' | 'file_transfer';

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
  action: 'connect' | 'connect_ssh' | 'attach_ssh' | 'disconnect' | 'resize' | 'send_file' | 'receive_file';
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

export interface FileTransferPayload {
  action: 'start' | 'progress' | 'complete' | 'error';
  file_name: string;
  file_size: number;
  sent: number;
  received: number;
  message?: string;
  error?: string;
}
