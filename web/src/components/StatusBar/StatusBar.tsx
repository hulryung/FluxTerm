import type { ConnectionConfig } from '../../types/connection';
import { isSerialConfig, isSSHConfig } from '../../types/connection';

interface StatusBarProps {
  connected: boolean;
  connectionType: 'serial' | 'ssh' | null;
  config: ConnectionConfig | null;
  encoding?: string;
  terminalType?: string;
}

export function StatusBar({
  connected,
  connectionType,
  config,
  encoding = 'UTF-8',
  terminalType = 'VT100',
}: StatusBarProps) {
  return (
    <footer className="h-7 bg-primary text-white flex items-center px-3 text-xs gap-4 select-none shadow-inner font-body">
      {/* Connection info (only show if serial) */}
      {config && isSerialConfig(config) && (
        <>
          <div className="flex items-center gap-2 hover:bg-white/10 px-2 rounded cursor-pointer h-full">
            <span className="material-symbols-outlined text-[14px]">usb</span>
            <span className="font-medium">{config.config.port || 'No Port'}</span>
          </div>

          <div className="flex items-center gap-2 hover:bg-white/10 px-2 rounded cursor-pointer h-full">
            <span className="material-symbols-outlined text-[14px]">speed</span>
            <span>{config.config.baud_rate}</span>
          </div>

          <div className="flex items-center gap-2 hover:bg-white/10 px-2 rounded cursor-pointer h-full">
            <span className="material-symbols-outlined text-[14px]">tune</span>
            <span>
              {config.config.data_bits}-
              {config.config.parity === 'none' ? 'N' : config.config.parity === 'odd' ? 'O' : 'E'}-
              {config.config.stop_bits}
            </span>
          </div>
        </>
      )}

      {/* SSH info */}
      {config && isSSHConfig(config) && (
        <>
          <div className="flex items-center gap-2 hover:bg-white/10 px-2 rounded cursor-pointer h-full">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            <span className="font-medium">
              {config.config.username}@{config.config.host}:{config.config.port}
            </span>
          </div>
        </>
      )}

      {/* Terminal type */}
      {connectionType && (
        <div className="flex items-center gap-2 hover:bg-white/10 px-2 rounded cursor-pointer h-full">
          <span className="material-symbols-outlined text-[14px]">terminal</span>
          <span>{terminalType}</span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Encoding */}
      <div className="flex items-center gap-2">
        <span>{encoding}</span>
      </div>

      {/* Connection status */}
      <div className="flex items-center gap-2">
        <span
          className={`material-symbols-outlined text-[14px] ${
            connected ? 'animate-pulse' : ''
          }`}
        >
          {connected ? 'check_circle' : 'cancel'}
        </span>
        <span className="font-bold">{connected ? 'Connected' : 'Disconnected'}</span>
      </div>

      {/* Notifications button */}
      <div className="flex items-center gap-2 ml-2 hover:bg-white/10 px-2 rounded cursor-pointer h-full">
        <span className="material-symbols-outlined text-[14px]">notifications</span>
      </div>
    </footer>
  );
}
