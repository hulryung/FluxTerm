import { useState } from 'react';

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
    <div className="p-4 bg-[#1e1e1e] rounded-md">
      <h3 className="m-0 mb-4 text-base text-slate-200 font-semibold">SSH Connection</h3>

      {!connected ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Host:</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="localhost or 192.168.1.100"
              className="px-3 py-2 bg-[#252525] border border-[#3c3c3c] rounded text-slate-200 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Port:</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              min={1}
              max={65535}
              className="px-3 py-2 bg-[#252525] border border-[#3c3c3c] rounded text-slate-200 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="root, ubuntu, etc."
              className="px-3 py-2 bg-[#252525] border border-[#3c3c3c] rounded text-slate-200 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Authentication:</label>
            <select
              value={authMethod}
              onChange={(e) => setAuthMethod(e.target.value as 'password' | 'publickey')}
              className="px-3 py-2 bg-[#252525] border border-[#3c3c3c] rounded text-slate-200 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="password">Password</option>
              <option value="publickey">Public Key</option>
            </select>
          </div>

          {authMethod === 'password' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="px-3 py-2 bg-[#252525] border border-[#3c3c3c] rounded text-slate-200 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Private Key (PEM format):</label>
                <textarea
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                  rows={6}
                  className="px-3 py-2 bg-[#252525] border border-[#3c3c3c] rounded text-slate-200 text-[11px] font-mono outline-none resize-y focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Passphrase (if encrypted):</label>
                <input
                  type="password"
                  value={privateKeyPassphrase}
                  onChange={(e) => setPrivateKeyPassphrase(e.target.value)}
                  placeholder="Optional"
                  className="px-3 py-2 bg-[#252525] border border-[#3c3c3c] rounded text-slate-200 text-xs font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          )}

          {error && (
            <div className="px-3 py-2 bg-red-900/30 border border-red-700 rounded text-red-300 text-xs">
              {error}
            </div>
          )}

          <button
            className="px-4 py-2.5 border-none rounded cursor-pointer text-sm font-semibold transition-all bg-primary text-white hover:bg-[#1177bb]"
            onClick={handleConnect}
          >
            Connect
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 p-3 bg-[#252525] border border-[#3c3c3c] rounded">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Host:</span>
              <span className="text-slate-200 font-mono">{host}:{port}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">User:</span>
              <span className="text-slate-200 font-mono">{username}</span>
            </div>
          </div>
          <button
            className="px-4 py-2.5 border border-[#555] rounded cursor-pointer text-sm font-semibold transition-all bg-[#3c3c3c] text-slate-300 hover:bg-red-700 hover:border-red-700"
            onClick={onDisconnect}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
