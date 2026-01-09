import { useState } from 'react';
import type { LogFormat } from '../../hooks/useLogger';
import './TerminalToolbar.css';

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
    <div className="terminal-toolbar">
      <div className="toolbar-section">
        <span className="toolbar-label">Display:</span>
        <button
          className={`toolbar-btn ${displayMode === 'terminal' ? 'btn-active' : ''}`}
          onClick={() => onDisplayModeChange('terminal')}
          title="Terminal mode"
        >
          📟 Terminal
        </button>
        <button
          className={`toolbar-btn ${displayMode === 'hex' ? 'btn-active' : ''}`}
          onClick={() => onDisplayModeChange('hex')}
          title="HEX viewer mode"
        >
          🔢 HEX
        </button>
      </div>

      <div className="toolbar-section">
        <span className="toolbar-label">Controls:</span>
        <button
          className="toolbar-btn"
          onClick={onToggleSearch}
          title="Search in terminal (Ctrl+F)"
        >
          🔍 Search
        </button>
        <button
          className="toolbar-btn"
          onClick={onClearTerminal}
          title="Clear display"
        >
          🗑️ Clear
        </button>
      </div>

      <div className="toolbar-section">
        <span className="toolbar-label">Logging:</span>
        {!isLogging ? (
          <button
            className="toolbar-btn btn-start"
            onClick={onStartLogging}
            title="Start logging"
          >
            ▶️ Start Log
          </button>
        ) : (
          <button
            className="toolbar-btn btn-stop"
            onClick={onStopLogging}
            title="Stop logging"
          >
            ⏸️ Stop Log
          </button>
        )}

        <span className="log-count">
          {logCount} entries
        </span>

        <div className="dropdown">
          <button
            className="toolbar-btn"
            onClick={() => setShowFormatMenu(!showFormatMenu)}
            disabled={logCount === 0}
            title="Download log"
          >
            💾 Save Log
          </button>
          {showFormatMenu && (
            <div className="dropdown-menu">
              <button onClick={() => handleDownload('plain')}>
                Plain Text
              </button>
              <button onClick={() => handleDownload('timestamped')}>
                With Timestamps
              </button>
              <button onClick={() => handleDownload('hex')}>
                HEX Dump
              </button>
            </div>
          )}
        </div>

        <button
          className="toolbar-btn"
          onClick={onClearLog}
          disabled={logCount === 0}
          title="Clear log buffer"
        >
          🗑️ Clear Log
        </button>
      </div>
    </div>
  );
}
