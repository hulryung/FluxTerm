import { useState, useEffect } from 'react';
import type { PortInfo, SerialConfig } from '../../types/serial';
import { DEFAULT_CONFIG, BAUD_RATES } from '../../types/serial';
import { apiClient } from '../../services/api';
import { ProfileManager } from '../ProfileManager/ProfileManager';
import { useProfiles, type SessionProfile } from '../../hooks/useProfiles';
import './PortSelector.css';

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
    <div className="port-selector">
      <div className="port-selector-header">
        <h3>Serial Port Configuration</h3>
        <button onClick={loadPorts} disabled={loading || connected}>
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="config-form">
        <div className="form-group">
          <label>Port:</label>
          <select
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
            disabled={connected || loading}
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

        <div className="form-group">
          <label>Baud Rate:</label>
          <select
            value={config.baud_rate}
            onChange={(e) => setConfig({ ...config, baud_rate: Number(e.target.value) })}
            disabled={connected}
          >
            {BAUD_RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Data Bits:</label>
          <select
            value={config.data_bits}
            onChange={(e) => setConfig({ ...config, data_bits: Number(e.target.value) as 5 | 6 | 7 | 8 })}
            disabled={connected}
          >
            <option value={5}>5</option>
            <option value={6}>6</option>
            <option value={7}>7</option>
            <option value={8}>8</option>
          </select>
        </div>

        <div className="form-group">
          <label>Parity:</label>
          <select
            value={config.parity}
            onChange={(e) => setConfig({ ...config, parity: e.target.value as any })}
            disabled={connected}
          >
            <option value="none">None</option>
            <option value="odd">Odd</option>
            <option value="even">Even</option>
            <option value="mark">Mark</option>
            <option value="space">Space</option>
          </select>
        </div>

        <div className="form-group">
          <label>Stop Bits:</label>
          <select
            value={config.stop_bits}
            onChange={(e) => setConfig({ ...config, stop_bits: Number(e.target.value) as 1 | 1.5 | 2 })}
            disabled={connected}
          >
            <option value={1}>1</option>
            <option value={1.5}>1.5</option>
            <option value={2}>2</option>
          </select>
        </div>

        <div className="form-group">
          <label>Flow Control:</label>
          <select
            value={config.flow_control}
            onChange={(e) => setConfig({ ...config, flow_control: e.target.value as any })}
            disabled={connected}
          >
            <option value="none">None</option>
            <option value="rtscts">RTS/CTS</option>
            <option value="xonxoff">XON/XOFF</option>
          </select>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoReconnect}
              onChange={(e) => setAutoReconnect(e.target.checked)}
              disabled={connected}
            />
            <span>Auto Reconnect</span>
          </label>
        </div>
      </div>

      <div className="button-group">
        {connected ? (
          <button className="btn-disconnect" onClick={onDisconnect}>
            Disconnect
          </button>
        ) : (
          <button
            className="btn-connect"
            onClick={handleConnect}
            disabled={!selectedPort || loading}
          >
            Connect
          </button>
        )}
      </div>

      {connected && (
        <div className="control-panel">
          <h4>Hardware Control</h4>
          <div className="control-buttons">
            <button
              className={`control-btn ${dtrState ? 'active' : ''}`}
              onClick={handleDTRToggle}
              title="Toggle DTR (Data Terminal Ready)"
            >
              DTR {dtrState ? 'ON' : 'OFF'}
            </button>
            <button
              className={`control-btn ${rtsState ? 'active' : ''}`}
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
