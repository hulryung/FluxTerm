import type { SerialConfig } from './serial';

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  auth_method: 'password' | 'publickey';
  password?: string;
  private_key?: string;
  private_key_path?: string;
  private_key_passphrase?: string;
  cols?: number;
  rows?: number;
}

// Discriminated union for type-safe configs
export type ConnectionConfig =
  | { type: 'serial'; config: SerialConfig }
  | { type: 'ssh'; config: SSHConfig };

// Type guards for safe runtime checking
export function isSerialConfig(
  conn: ConnectionConfig
): conn is { type: 'serial'; config: SerialConfig } {
  return conn.type === 'serial';
}

export function isSSHConfig(
  conn: ConnectionConfig
): conn is { type: 'ssh'; config: SSHConfig } {
  return conn.type === 'ssh';
}
