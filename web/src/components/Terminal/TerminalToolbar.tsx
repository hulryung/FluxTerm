import { useState } from 'react';
import type { LogFormat } from '../../hooks/useLogger';

export type DisplayMode = 'terminal' | 'hex';

interface TerminalToolbarProps {
  isLogging: boolean;
  onStartLogging: () => void;
  onStopLogging: () => void;
  onDownloadLog: (format: LogFormat) => void;
  onClearLog: () => void;
  onClearTerminal: () => void;
  logCount: number;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onToggleSearch: () => void;
}

export function TerminalToolbar({
  isLogging,
  onStartLogging,
  onStopLogging,
  onDownloadLog,
  onClearLog,
  onClearTerminal,
  logCount,
  displayMode,
  onDisplayModeChange,
  onToggleSearch,
}: TerminalToolbarProps) {
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  const handleDownload = (format: LogFormat) => {
    onDownloadLog(format);
    setShowFormatMenu(false);
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-panel-dark border-b border-border-dark text-sm">
      {/* Display Mode */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onDisplayModeChange('terminal')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
            displayMode === 'terminal'
              ? 'bg-primary text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Terminal mode"
        >
          <span className="material-symbols-outlined text-[18px]">terminal</span>
          <span className="text-xs font-medium">Terminal</span>
        </button>
        <button
          onClick={() => onDisplayModeChange('hex')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
            displayMode === 'hex'
              ? 'bg-primary text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="HEX viewer mode"
        >
          <span className="material-symbols-outlined text-[18px]">grid_on</span>
          <span className="text-xs font-medium">HEX</span>
        </button>
      </div>

      <div className="h-6 w-px bg-border-dark" />

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSearch}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Search in terminal (Ctrl+F)"
        >
          <span className="material-symbols-outlined text-[20px]">search</span>
        </button>
        <button
          onClick={onClearTerminal}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Clear display"
        >
          <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
        </button>
      </div>

      <div className="h-6 w-px bg-border-dark" />

      {/* Logging */}
      <div className="flex items-center gap-2">
        {!isLogging ? (
          <button
            onClick={onStartLogging}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Start logging"
          >
            <span className="material-symbols-outlined text-[18px]">fiber_manual_record</span>
            <span className="text-xs font-medium">Start Log</span>
          </button>
        ) : (
          <button
            onClick={onStopLogging}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            title="Stop logging"
          >
            <span className="material-symbols-outlined text-[18px]">stop</span>
            <span className="text-xs font-medium">Stop Log</span>
          </button>
        )}

        <span className="text-xs text-slate-500 px-2">
          {logCount} entries
        </span>

        {/* Download dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFormatMenu(!showFormatMenu)}
            disabled={logCount === 0}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Download log"
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
          </button>
          {showFormatMenu && (
            <div className="absolute top-full right-0 mt-1 bg-panel-dark border border-border-dark rounded-lg shadow-xl overflow-hidden z-10 min-w-[160px]">
              <button
                onClick={() => handleDownload('plain')}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-primary hover:text-white transition-colors"
              >
                Plain Text
              </button>
              <button
                onClick={() => handleDownload('timestamped')}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-primary hover:text-white transition-colors"
              >
                With Timestamps
              </button>
              <button
                onClick={() => handleDownload('hex')}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-primary hover:text-white transition-colors"
              >
                HEX Dump
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onClearLog}
          disabled={logCount === 0}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Clear log buffer"
        >
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>
    </div>
  );
}
