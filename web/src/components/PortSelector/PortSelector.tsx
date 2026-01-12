import { useState, useEffect } from 'react';
import type { PortInfo, SerialConfig } from '../../types/serial';
import { DEFAULT_CONFIG, BAUD_RATES } from '../../types/serial';
import { apiClient } from '../../services/api';

interface PortSelectorProps {
  onConnect: (config: SerialConfig, autoReconnect: boolean) => void;
  onDisconnect: () => void;
  connected: boolean;
  onSaveAsProfile?: (name: string, config: SerialConfig) => void;
}

export function PortSelector({ onConnect, onDisconnect, connected, onSaveAsProfile }: PortSelectorProps) {
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dtrState, setDtrState] = useState(false);
  const [rtsState, setRtsState] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    loadPorts();
  }, []);

  const loadPorts = async () => {
    try {
      setLoading(true);
      setError(null);
      const availablePorts = await apiClient.listPorts();
      setPorts(availablePorts);
      if (availablePorts.length > 0 && !selectedPort) {
        setSelectedPort(availablePorts[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ports');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (!selectedPort) return;

    const fullConfig: SerialConfig = {
      port: selectedPort,
      ...config,
    };

    onConnect(fullConfig, autoReconnect);
  };

  const handleSaveProfile = () => {
    if (!selectedPort || !profileName.trim()) {
      setError('Port and profile name are required');
      return;
    }

    const fullConfig: SerialConfig = {
      port: selectedPort,
      ...config,
    };

    onSaveAsProfile?.(profileName, fullConfig);
    setProfileName('');
    setShowSaveDialog(false);
    setError(null);
  };


  const handleDTRToggle = async () => {
    if (!connected || !selectedPort) return;

    try {
      const newState = !dtrState;
      await apiClient.setDTR(selectedPort, newState);
      setDtrState(newState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set DTR');
    }
  };

  const handleRTSToggle = async () => {
    if (!connected || !selectedPort) return;

    try {
      const newState = !rtsState;
      await apiClient.setRTS(selectedPort, newState);
      setRtsState(newState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set RTS');
    }
  };

  return (
    <div className="bg-panel-dark text-white p-5 rounded-lg mb-5">
      <div className="flex justify-between items-center mb-5">
        <h3 className="m-0 text-lg font-semibold">Serial Port Configuration</h3>
        <button
          onClick={loadPorts}
          disabled={loading || connected}
          className="flex items-center gap-1.5 bg-[#3c3c3c] text-slate-300 border border-[#555] px-3 py-1.5 rounded transition-colors hover:bg-[#464646] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">
            {loading ? 'progress_activity' : 'refresh'}
          </span>
          <span className="text-sm">{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 text-red-300 px-3 py-2.5 rounded mb-4 border-l-4 border-red-500">
          {error}
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Port:</label>
          <select
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
            disabled={connected || loading}
            className="bg-[#3c3c3c] text-slate-200 border border-[#555] px-2 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {ports.length === 0 ? (
              <option value="">No ports available</option>
            ) : (
              ports.map((port) => (
                <option key={port.name} value={port.name}>
                  {port.name} - {port.description}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Baud Rate:</label>
          <select
            value={config.baud_rate}
            onChange={(e) => setConfig({ ...config, baud_rate: Number(e.target.value) })}
            disabled={connected}
            className="bg-[#3c3c3c] text-slate-200 border border-[#555] px-2 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {BAUD_RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Data Bits:</label>
          <select
            value={config.data_bits}
            onChange={(e) => setConfig({ ...config, data_bits: Number(e.target.value) as 5 | 6 | 7 | 8 })}
            disabled={connected}
            className="bg-[#3c3c3c] text-slate-200 border border-[#555] px-2 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value={5}>5</option>
            <option value={6}>6</option>
            <option value={7}>7</option>
            <option value={8}>8</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Parity:</label>
          <select
            value={config.parity}
            onChange={(e) => setConfig({ ...config, parity: e.target.value as any })}
            disabled={connected}
            className="bg-[#3c3c3c] text-slate-200 border border-[#555] px-2 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="none">None</option>
            <option value="odd">Odd</option>
            <option value="even">Even</option>
            <option value="mark">Mark</option>
            <option value="space">Space</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Stop Bits:</label>
          <select
            value={config.stop_bits}
            onChange={(e) => setConfig({ ...config, stop_bits: Number(e.target.value) as 1 | 1.5 | 2 })}
            disabled={connected}
            className="bg-[#3c3c3c] text-slate-200 border border-[#555] px-2 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value={1}>1</option>
            <option value={1.5}>1.5</option>
            <option value={2}>2</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Flow Control:</label>
          <select
            value={config.flow_control}
            onChange={(e) => setConfig({ ...config, flow_control: e.target.value as any })}
            disabled={connected}
            className="bg-[#3c3c3c] text-slate-200 border border-[#555] px-2 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="none">None</option>
            <option value="rtscts">RTS/CTS</option>
            <option value="xonxoff">XON/XOFF</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 cursor-pointer select-none py-2 text-sm">
            <input
              type="checkbox"
              checked={autoReconnect}
              onChange={(e) => setAutoReconnect(e.target.checked)}
              disabled={connected}
              className="w-4 h-4 cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-slate-200 font-medium">Auto Reconnect</span>
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {connected ? (
          <button
            className="px-6 py-2.5 border-none rounded-md text-[15px] font-semibold cursor-pointer transition-all bg-red-700 text-white hover:bg-red-600"
            onClick={onDisconnect}
          >
            Disconnect
          </button>
        ) : (
          <>
            <button
              className="px-6 py-2.5 border-none rounded-md text-[15px] font-semibold cursor-pointer transition-all bg-primary text-white hover:bg-[#1177bb] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleConnect}
              disabled={!selectedPort || loading}
            >
              Connect
            </button>

            {onSaveAsProfile && (
              <button
                className="px-6 py-2.5 border border-[#555] rounded-md text-[15px] font-semibold cursor-pointer transition-all bg-[#2d2d2d] text-slate-300 hover:bg-[#3c3c3c] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setShowSaveDialog(true)}
                disabled={!selectedPort || loading}
              >
                Save as Profile
              </button>
            )}
          </>
        )}
      </div>

      {connected && (
        <div className="mt-5 p-4 bg-[#252525] rounded-md border border-[#3c3c3c]">
          <h4 className="m-0 mb-3 text-sm font-semibold text-slate-400 uppercase tracking-wide">
            Hardware Control
          </h4>
          <div className="flex gap-2.5">
            <button
              className={`flex-1 px-4 py-2.5 border-2 rounded-md text-xs font-semibold cursor-pointer transition-all uppercase tracking-wide ${
                dtrState
                  ? 'bg-primary border-primary text-white shadow-[0_0_8px_rgba(43,108,238,0.5)] hover:bg-[#1177bb] hover:border-[#1177bb]'
                  : 'bg-[#3c3c3c] text-slate-300 border-[#555] hover:bg-[#464646] hover:border-[#666]'
              }`}
              onClick={handleDTRToggle}
              title="Toggle DTR (Data Terminal Ready)"
            >
              DTR {dtrState ? 'ON' : 'OFF'}
            </button>
            <button
              className={`flex-1 px-4 py-2.5 border-2 rounded-md text-xs font-semibold cursor-pointer transition-all uppercase tracking-wide ${
                rtsState
                  ? 'bg-primary border-primary text-white shadow-[0_0_8px_rgba(43,108,238,0.5)] hover:bg-[#1177bb] hover:border-[#1177bb]'
                  : 'bg-[#3c3c3c] text-slate-300 border-[#555] hover:bg-[#464646] hover:border-[#666]'
              }`}
              onClick={handleRTSToggle}
              title="Toggle RTS (Request To Send)"
            >
              RTS {rtsState ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      )}

      {/* Save Profile Dialog */}
      {showSaveDialog && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000] animate-[fadeIn_0.2s]"
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            className="bg-[#2d2d2d] border border-[#555] rounded-md p-5 min-w-[400px] shadow-[0_8px_24px_rgba(0,0,0,0.5)] animate-[slideUp_0.2s]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-4 text-slate-200 text-lg">Save Serial Profile</h3>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Profile Name:</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g., Arduino Uno, ESP32, Raspberry Pi, etc."
                  className="px-3 py-2 bg-[#1e1e1e] border border-[#555] rounded text-slate-200 text-sm font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>

              <div className="p-2.5 bg-[#1e1e1e] border-l-[3px] border-l-primary text-xs text-slate-400">
                This will save the current serial settings ({selectedPort} @ {config.baud_rate} baud) as a reusable profile.
              </div>
            </div>

            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={!profileName.trim()}
                className="px-5 py-2 bg-primary border border-primary rounded cursor-pointer text-xs text-white transition-all hover:bg-[#1177bb] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-5 py-2 bg-[#3c3c3c] text-slate-300 border border-[#555] rounded cursor-pointer text-xs transition-all hover:bg-[#464646]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
