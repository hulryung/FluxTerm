import { useState } from 'react';
import './SSHConnector.css';

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

interface SSHConnectorProps {
  onConnect: (config: SSHConfig) => void;
  onDisconnect: () => void;
  connected: boolean;
}

export function SSHConnector({ onConnect, onDisconnect, connected }: SSHConnectorProps) {
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState(22);
  const [username, setUsername] = useState('');
  const [authMethod, setAuthMethod] = useState<'password' | 'publickey'>('password');
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [privateKeyPassphrase, setPrivateKeyPassphrase] = useState('');
  const [error, setError] = useState('');

  const handleConnect = () => {
    if (!host || !username) {
      setError('Host and username are required');
      return;
    }

    if (authMethod === 'password' && !password) {
      setError('Password is required');
      return;
    }

    if (authMethod === 'publickey' && !privateKey) {
      setError('Private key is required');
      return;
    }

    setError('');

    const config: SSHConfig = {
      host,
      port,
      username,
      auth_method: authMethod,
      cols: 80,
      rows: 24,
    };

    if (authMethod === 'password') {
      config.password = password;
    } else {
      config.private_key = privateKey;
      if (privateKeyPassphrase) {
        config.private_key_passphrase = privateKeyPassphrase;
      }
    }

    onConnect(config);
  };

  return (
    <div className="ssh-connector">
      <h3>SSH Connection</h3>

      {!connected ? (
        <div className="ssh-form">
          <div className="form-group">
            <label>Host:</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="localhost or 192.168.1.100"
            />
          </div>

          <div className="form-group">
            <label>Port:</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              min={1}
              max={65535}
            />
          </div>

          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="root, ubuntu, etc."
            />
          </div>

          <div className="form-group">
            <label>Authentication:</label>
            <select value={authMethod} onChange={(e) => setAuthMethod(e.target.value as 'password' | 'publickey')}>
              <option value="password">Password</option>
              <option value="publickey">Public Key</option>
            </select>
          </div>

          {authMethod === 'password' ? (
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Private Key (PEM format):</label>
                <textarea
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                  rows={6}
                />
              </div>
              <div className="form-group">
                <label>Passphrase (if encrypted):</label>
                <input
                  type="password"
                  value={privateKeyPassphrase}
                  onChange={(e) => setPrivateKeyPassphrase(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </>
          )}

          {error && <div className="ssh-error">{error}</div>}

          <button className="ssh-btn connect" onClick={handleConnect}>
            Connect
          </button>
        </div>
      ) : (
        <div className="ssh-connected">
          <div className="connection-info">
            <div className="info-item">
              <span className="label">Host:</span>
              <span className="value">{host}:{port}</span>
            </div>
            <div className="info-item">
              <span className="label">User:</span>
              <span className="value">{username}</span>
            </div>
          </div>
          <button className="ssh-btn disconnect" onClick={onDisconnect}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
