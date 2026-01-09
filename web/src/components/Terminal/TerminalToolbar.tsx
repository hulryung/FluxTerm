import { useState } from 'react';
import type { LogFormat } from '../../hooks/useLogger';
import './TerminalToolbar.css';

interface TerminalToolbarProps {
  isLogging: boolean;
  onStartLogging: () => void;
  onStopLogging: () => void;
  onDownloadLog: (format: LogFormat) => void;
  onClearLog: () => void;
  onClearTerminal: () => void;
  logCount: number;
}

export function TerminalToolbar({
  isLogging,
  onStartLogging,
  onStopLogging,
  onDownloadLog,
  onClearLog,
  onClearTerminal,
  logCount,
}: TerminalToolbarProps) {
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  const handleDownload = (format: LogFormat) => {
    onDownloadLog(format);
    setShowFormatMenu(false);
  };

  return (
    <div className="terminal-toolbar">
      <div className="toolbar-section">
        <span className="toolbar-label">Terminal Controls:</span>
        <button
          className="toolbar-btn"
          onClick={onClearTerminal}
          title="Clear terminal display"
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
