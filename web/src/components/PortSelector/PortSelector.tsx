import { useState, useEffect } from 'react';
import type { PortInfo, SerialConfig } from '../../types/serial';
import { DEFAULT_CONFIG, BAUD_RATES } from '../../types/serial';
import { apiClient } from '../../services/api';
import { ProfileManager } from '../ProfileManager/ProfileManager';
import { useProfiles, type SessionProfile } from '../../hooks/useProfiles';

interface PortSelectorProps {
  onConnect: (config: SerialConfig, autoReconnect: boolean) => void;
  onDisconnect: () => void;
  connected: boolean;
}

export function PortSelector({ onConnect, onDisconnect, connected }: PortSelectorProps) {
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dtrState, setDtrState] = useState(false);
  const [rtsState, setRtsState] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(true);

  const { profiles, saveProfile, deleteProfile, updateLastUsed } = useProfiles();

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

  const handleSaveProfile = (name: string, profileConfig: SerialConfig) => {
    saveProfile(name, profileConfig);
  };

  const handleLoadProfile = (profile: SessionProfile) => {
    setSelectedPort(profile.config.port);
    setConfig({
      baud_rate: profile.config.baud_rate,
      data_bits: profile.config.data_bits,
      stop_bits: profile.config.stop_bits,
      parity: profile.config.parity,
      flow_control: profile.config.flow_control,
    });
    updateLastUsed(profile.id);
  };

  const getCurrentConfig = (): SerialConfig | null => {
    if (!selectedPort) return null;
    return {
      port: selectedPort,
      ...config,
    };
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

      <div className="flex gap-2.5 justify-end">
        {connected ? (
          <button
            className="px-6 py-2.5 border-none rounded-md text-[15px] font-semibold cursor-pointer transition-all bg-red-700 text-white hover:bg-red-600"
            onClick={onDisconnect}
          >
            Disconnect
          </button>
        ) : (
          <button
            className="px-6 py-2.5 border-none rounded-md text-[15px] font-semibold cursor-pointer transition-all bg-primary text-white hover:bg-[#1177bb] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleConnect}
            disabled={!selectedPort || loading}
          >
            Connect
          </button>
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

      <ProfileManager
        profiles={profiles}
        onSaveProfile={handleSaveProfile}
        onLoadProfile={handleLoadProfile}
        onDeleteProfile={deleteProfile}
        currentConfig={getCurrentConfig()}
      />
    </div>
  );
}
