import { useEffect, useState } from 'react';
import { Terminal, useTerminal } from '../Terminal/Terminal';
import { TerminalToolbar, type DisplayMode } from '../Terminal/TerminalToolbar';
import { SearchBar } from '../Terminal/SearchBar';
import { HexViewer, useHexViewer } from '../HexViewer/HexViewer';
import { PortSelector } from '../PortSelector/PortSelector';
import { wsClient } from '../../services/websocket';
import { useLogger } from '../../hooks/useLogger';
import type { WSMessage, DataPayload, StatusPayload, ErrorPayload } from '../../types/message';
import type { SerialConfig } from '../../types/serial';
import './SessionView.css';

interface SessionViewProps {
  sessionId: string;
  isActive: boolean;
  onConnectionChange: (connected: boolean) => void;
  onConfigChange: (config: SerialConfig | null) => void;
}

export function SessionView({
  sessionId,
  isActive,
  onConnectionChange,
  onConfigChange,
}: SessionViewProps) {
  const [connected, setConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('terminal');
  const [searchVisible, setSearchVisible] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(false);
  const [lastConfig, setLastConfig] = useState<SerialConfig | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { write, clear, findNext, findPrevious, clearSearch } = useTerminal();
  const hexViewer = useHexViewer();
  const logger = useLogger();

  useEffect(() => {
    // Connect WebSocket when component mounts
    wsClient.connect()
      .then(() => {
        console.log(`[${sessionId}] WebSocket connected`);
        setWsConnected(true);
      })
      .catch((err) => {
        console.error(`[${sessionId}] WebSocket connection failed:`, err);
        setWsConnected(false);
      });

    // Handle WebSocket messages
    const unsubscribe = wsClient.onMessage((message: WSMessage) => {
      switch (message.type) {
        case 'data': {
          const payload = message.payload as DataPayload;
          try {
            const decoded = atob(payload.data);
            write(decoded);
            hexViewer.addData(decoded);
            logger.addLog(decoded);
          } catch (err) {
            console.error('Failed to decode data:', err);
          }
          break;
        }

        case 'status': {
          const payload = message.payload as StatusPayload;
          setStatus(payload.message || payload.state);
          if (payload.state === 'connected') {
            setConnected(true);
            setReconnectAttempts(0);
            onConnectionChange(true);
          } else if (payload.state === 'disconnected') {
            setConnected(false);
            onConnectionChange(false);
            // Auto-reconnect will be triggered by useEffect
          } else if (payload.state === 'ready') {
            // WebSocket ready, but serial not connected
            setConnected(false);
            onConnectionChange(false);
          }
          break;
        }

        case 'error': {
          const payload = message.payload as ErrorPayload;
          setStatus(`Error: ${payload.message}`);
          write(`\r\n[ERROR] ${payload.message}\r\n`);
          break;
        }
      }
    });

    // Keyboard shortcut for search (Ctrl+F)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;

      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setSearchVisible(true);
      } else if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        // New tab creation handled by parent
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sessionId, isActive]);

  const handleConnect = (config: SerialConfig, enableAutoReconnect: boolean) => {
    setStatus('Connecting...');
    setLastConfig(config);
    setAutoReconnect(enableAutoReconnect);
    setReconnectAttempts(0);
    wsClient.connectPort(config);
    onConfigChange(config);
  };

  const handleDisconnect = () => {
    setStatus('Disconnecting...');
    setAutoReconnect(false); // Disable auto-reconnect on manual disconnect
    setLastConfig(null);
    wsClient.disconnectPort();
    onConfigChange(null);
  };

  // Auto-reconnect logic
  useEffect(() => {
    if (!connected && autoReconnect && lastConfig && reconnectAttempts < 5) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000); // Exponential backoff, max 10s

      setStatus(`Reconnecting in ${Math.round(delay / 1000)}s... (attempt ${reconnectAttempts + 1}/5)`);

      const timer = setTimeout(() => {
        console.log(`[${sessionId}] Auto-reconnecting, attempt ${reconnectAttempts + 1}`);
        setReconnectAttempts((prev) => prev + 1);
        wsClient.connectPort(lastConfig);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [connected, autoReconnect, lastConfig, reconnectAttempts, sessionId]);

  const handleTerminalData = (data: string) => {
    if (connected) {
      wsClient.sendData(data);
    }
  };

  const handleClearDisplay = () => {
    clear();
    hexViewer.clear();
  };

  const handleToggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) {
      clearSearch();
    }
  };

  const handleSearchClose = () => {
    setSearchVisible(false);
    clearSearch();
  };

  return (
    <div className={`session-view ${isActive ? 'active' : ''}`}>
      <div className="session-sidebar">
        <PortSelector
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          connected={connected}
        />
      </div>

      <div className="session-main">
        <div className="session-status-bar">
          <span className={`status-indicator ${wsConnected ? 'connected' : 'disconnected'}`}>
            {wsConnected ? '🟢' : '🔴'} WebSocket
          </span>
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢' : '🔴'} Serial
          </span>
          <span className="status-text">{status}</span>
        </div>

        <div className="terminal-container">
          <TerminalToolbar
            isLogging={logger.isLogging}
            onStartLogging={logger.startLogging}
            onStopLogging={logger.stopLogging}
            onDownloadLog={logger.downloadLog}
            onClearLog={logger.clearLog}
            onClearTerminal={handleClearDisplay}
            logCount={logger.logCount}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            onToggleSearch={handleToggleSearch}
          />
          {displayMode === 'terminal' && (
            <SearchBar
              visible={searchVisible}
              onFindNext={findNext}
              onFindPrevious={findPrevious}
              onClose={handleSearchClose}
            />
          )}
          {displayMode === 'terminal' ? (
            <Terminal onData={handleTerminalData} />
          ) : (
            <HexViewer />
          )}
        </div>
      </div>
    </div>
  );
}
