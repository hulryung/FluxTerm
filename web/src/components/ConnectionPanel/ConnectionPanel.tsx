import { useState } from 'react';
import { PortSelector } from '../PortSelector/PortSelector';
import { SSHConnector, type SSHConfig } from '../SSHConnector/SSHConnector';
import type { SerialConfig } from '../../types/serial';

interface ConnectionPanelProps {
  visible: boolean;
  onClose: () => void;
  connected: boolean;
  onSerialConnect: (config: SerialConfig, autoReconnect: boolean) => void;
  onSSHConnect: (config: SSHConfig) => void;
  onDisconnect: () => void;
}

export function ConnectionPanel({
  visible,
  onClose,
  connected,
  onSerialConnect,
  onSSHConnect,
  onDisconnect,
}: ConnectionPanelProps) {
  const [mode, setMode] = useState<'serial' | 'ssh'>('serial');

  if (!visible) return null;

  return (
    <aside
      className={`w-80 bg-panel-dark border-r border-border-dark flex flex-col shrink-0 overflow-y-auto transition-transform duration-200 ${
        visible ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-5 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-medium text-lg">Connection</h2>
            <p className="text-slate-400 text-sm">Configure interface parameters</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Connection Type Tabs */}
        <div className="bg-[#1c1f27] p-1 rounded-lg flex border border-border-dark">
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="conn_type"
              value="serial"
              checked={mode === 'serial'}
              onChange={() => setMode('serial')}
              className="sr-only peer"
            />
            <div className="flex items-center justify-center py-2 px-3 rounded text-sm font-medium text-slate-400 transition-all peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-sm">
              <span className="material-symbols-outlined text-[18px] mr-2">usb</span>
              Serial
            </div>
          </label>
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="conn_type"
              value="ssh"
              checked={mode === 'ssh'}
              onChange={() => setMode('ssh')}
              className="sr-only peer"
            />
            <div className="flex items-center justify-center py-2 px-3 rounded text-sm font-medium text-slate-400 transition-all peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-sm">
              <span className="material-symbols-outlined text-[18px] mr-2">terminal</span>
              SSH
            </div>
          </label>
        </div>

        {/* Content area */}
        <div>
          {mode === 'serial' ? (
            <PortSelector
              onConnect={onSerialConnect}
              onDisconnect={onDisconnect}
              connected={connected}
            />
          ) : (
            <SSHConnector
              onConnect={onSSHConnect}
              onDisconnect={onDisconnect}
              connected={connected}
            />
          )}
        </div>
      </div>
    </aside>
  );
}
