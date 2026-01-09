import type { PortInfo, SerialConfig } from '../types/serial';

const API_BASE = 'http://127.0.0.1:8080/api/v1';

export class ApiClient {
  async listPorts(): Promise<PortInfo[]> {
    const response = await fetch(`${API_BASE}/ports`);
    if (!response.ok) {
      throw new Error('Failed to fetch ports');
    }
    const data = await response.json();
    return data.ports || [];
  }

  async openPort(config: SerialConfig): Promise<void> {
    const response = await fetch(`${API_BASE}/ports/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to open port');
    }
  }

  async closePort(portName: string): Promise<void> {
    const response = await fetch(`${API_BASE}/ports/${portName}/close`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to close port');
    }
  }

  async getPortStatus(portName: string): Promise<any> {
    const response = await fetch(`${API_BASE}/ports/${portName}/status`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get port status');
    }
    return response.json();
  }

  async setDTR(portName: string, value: boolean): Promise<void> {
    const response = await fetch(`${API_BASE}/ports/${portName}/dtr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set DTR');
    }
  }

  async setRTS(portName: string, value: boolean): Promise<void> {
    const response = await fetch(`${API_BASE}/ports/${portName}/rts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set RTS');
    }
  }
}

export const apiClient = new ApiClient();
