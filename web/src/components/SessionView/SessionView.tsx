import { useEffect, useState } from 'react';
import { Terminal, useTerminal } from '../Terminal/Terminal';
import { TerminalToolbar, type DisplayMode } from '../Terminal/TerminalToolbar';
import { SearchBar } from '../Terminal/SearchBar';
import { HexViewer, useHexViewer } from '../HexViewer/HexViewer';
import { PortSelector } from '../PortSelector/PortSelector';
import { SSHConnector, type SSHConfig } from '../SSHConnector/SSHConnector';
import { MacroManager } from '../MacroManager/MacroManager';
import { FileTransfer, type FileTransferProgress } from '../FileTransfer/FileTransfer';
import { wsClient } from '../../services/websocket';
import { useLogger } from '../../hooks/useLogger';
import { useMacros, type Macro } from '../../hooks/useMacros';
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
  const [connectionMode, setConnectionMode] = useState<'serial' | 'ssh'>('serial');
  const [connected, setConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('terminal');
  const [searchVisible, setSearchVisible] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(false);
  const [lastConfig, setLastConfig] = useState<SerialConfig | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [transferProgress, setTransferProgress] = useState<FileTransferProgress | null>(null);
  const { write, clear, findNext, findPrevious, clearSearch } = useTerminal();
  const hexViewer = useHexViewer();
  const logger = useLogger();
  const { macros, saveMacro, updateMacro, deleteMacro, updateLastUsed } = useMacros();

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

        case 'file_transfer': {
          const payload = message.payload as any; // FileTransferPayload
          setTransferProgress({
            action: payload.action,
            fileName: payload.file_name,
            fileSize: payload.file_size,
            sent: payload.sent,
            received: payload.received,
            message: payload.message,
            error: payload.error,
            data: payload.action === 'complete' && payload.received > 0 ? payload.message : undefined,
          });

          // Log to terminal
          if (payload.action === 'start') {
            write(`\r\n[FILE TRANSFER] ${payload.message}\r\n`);
          } else if (payload.action === 'complete') {
            write(`\r\n[FILE TRANSFER] ${payload.file_name} - Transfer complete\r\n`);
          } else if (payload.action === 'error') {
            write(`\r\n[FILE TRANSFER ERROR] ${payload.error}\r\n`);
          }
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

  const handleSSHConnect = (config: SSHConfig) => {
    setStatus('Connecting to SSH...');
    wsClient.connectSSH(config as unknown as Record<string, unknown>);
    setAutoReconnect(false);
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

  const handleExecuteMacro = async (macro: Macro) => {
    if (!connected) {
      setStatus('Cannot execute macro: not connected');
      return;
    }

    updateLastUsed(macro.id);
    setStatus(`Executing macro: ${macro.name}...`);

    for (let i = 0; i < macro.commands.length; i++) {
      const command = macro.commands[i];

      // Add line ending (CR+LF is most common for serial devices)
      const commandWithLineEnding = command + '\r\n';

      // Send command
      wsClient.sendData(commandWithLineEnding);

      // Log to terminal
      write(`> ${command}\r\n`);

      // Wait for delay before next command (except for last command)
      if (i < macro.commands.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, macro.delay));
      }
    }

    setStatus(`Macro "${macro.name}" executed (${macro.commands.length} commands)`);
  };

  const handleSendFile = async (file: File, protocol: string) => {
    if (!connected) {
      setStatus('Cannot send file: not connected');
      return;
    }

    setStatus(`Preparing to send file: ${file.name}...`);

    try {
      // Read file as base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      // Send file transfer command
      wsClient.sendControl('send_file', {
        file_name: file.name,
        data: base64,
        protocol: protocol,
      });

      setStatus(`Sending file: ${file.name} (${file.size} bytes)`);
    } catch (err) {
      setStatus(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleReceiveFile = (fileName: string, protocol: string) => {
    if (!connected) {
      setStatus('Cannot receive file: not connected');
      return;
    }

    setStatus(`Waiting to receive file: ${fileName}...`);

    // Send receive file command
    wsClient.sendControl('receive_file', {
      file_name: fileName,
      protocol: protocol,
    });
  };

  return (
    <div className={`session-view ${isActive ? 'active' : ''}`}>
      <div className="session-sidebar">
        <div className="connection-mode-selector">
          <button
            className={`mode-btn ${connectionMode === 'serial' ? 'active' : ''}`}
            onClick={() => !connected && setConnectionMode('serial')}
            disabled={connected}
          >
            Serial
          </button>
          <button
            className={`mode-btn ${connectionMode === 'ssh' ? 'active' : ''}`}
            onClick={() => !connected && setConnectionMode('ssh')}
            disabled={connected}
          >
            SSH
          </button>
        </div>

        {connectionMode === 'serial' ? (
          <PortSelector
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            connected={connected}
          />
        ) : (
          <SSHConnector
            onConnect={handleSSHConnect}
            onDisconnect={handleDisconnect}
            connected={connected}
          />
        )}

        <MacroManager
          macros={macros}
          onSaveMacro={saveMacro}
          onUpdateMacro={updateMacro}
          onDeleteMacro={deleteMacro}
          onExecuteMacro={handleExecuteMacro}
        />

        {connectionMode === 'serial' && (
          <FileTransfer
            connected={connected}
            onSendFile={handleSendFile}
            onReceiveFile={handleReceiveFile}
            transferProgress={transferProgress}
          />
        )}
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
