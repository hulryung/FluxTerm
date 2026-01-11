import { useEffect, useState } from 'react';
import { Terminal, useTerminal } from '../Terminal/Terminal';
import { TerminalToolbar, type DisplayMode } from '../Terminal/TerminalToolbar';
import { SearchBar } from '../Terminal/SearchBar';
import { HexViewer, useHexViewer } from '../HexViewer/HexViewer';
import { wsClient } from '../../services/websocket';
import { useLogger } from '../../hooks/useLogger';
import type { WSMessage, DataPayload, StatusPayload, ErrorPayload } from '../../types/message';
import type { SerialConfig } from '../../types/serial';

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
}: SessionViewProps) {
  const [connected, setConnected] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('terminal');
  const [searchVisible, setSearchVisible] = useState(false);
  const [autoReconnect] = useState(false);
  const [lastConfig] = useState<SerialConfig | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { write, clear, findNext, findPrevious, clearSearch } = useTerminal();
  const hexViewer = useHexViewer();
  const logger = useLogger();

  useEffect(() => {
    // Handle WebSocket messages
    const unsubscribe = wsClient.onMessage((message: WSMessage) => {
      switch (message.type) {
        case 'data': {
          const payload = message.payload as DataPayload;
          try {
            // Decode base64 to binary string
            const binaryString = atob(payload.data);
            // Convert binary string to Uint8Array
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            // Decode as UTF-8
            const decoder = new TextDecoder('utf-8');
            const decoded = decoder.decode(bytes);

            write(decoded);
            hexViewer.addData(binaryString); // HexViewer uses raw bytes
            logger.addLog(decoded);
          } catch (err) {
            console.error('Failed to decode data:', err);
          }
          break;
        }

        case 'status': {
          const payload = message.payload as StatusPayload;
          if (payload.state === 'connected') {
            setConnected(true);
            setReconnectAttempts(0);
            onConnectionChange(true);
          } else if (payload.state === 'disconnected') {
            setConnected(false);
            onConnectionChange(false);
          } else if (payload.state === 'ready') {
            setConnected(false);
            onConnectionChange(false);
          }
          break;
        }

        case 'error': {
          const payload = message.payload as ErrorPayload;
          write(`\r\n[ERROR] ${payload.message}\r\n`);
          break;
        }

        case 'file_transfer': {
          const payload = message.payload as any;
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

    return () => {
      unsubscribe();
    };
  }, [sessionId, isActive]);

  // Auto-reconnect logic
  useEffect(() => {
    if (!connected && autoReconnect && lastConfig && reconnectAttempts < 5) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);

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
    } else {
      console.warn('[SessionView] Not connected - input ignored:', data.charCodeAt(0));
    }
  };

  const handleTerminalResize = (cols: number, rows: number) => {
    if (connected) {
      wsClient.resizeTerminal(cols, rows);
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
    <div
      className={`flex flex-col h-full ${isActive ? 'flex' : 'hidden'}`}
      style={{ fontFamily: 'JetBrains Mono, monospace' }}
    >
      {/* Terminal Toolbar */}
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

      {/* Search Bar (only in terminal mode) */}
      {displayMode === 'terminal' && (
        <SearchBar
          visible={searchVisible}
          onFindNext={findNext}
          onFindPrevious={findPrevious}
          onClose={handleSearchClose}
        />
      )}

      {/* Terminal or Hex Viewer */}
      <div className="flex-1 overflow-hidden">
        {displayMode === 'terminal' ? (
          <Terminal onData={handleTerminalData} onResize={handleTerminalResize} />
        ) : (
          <HexViewer />
        )}
      </div>
    </div>
  );
}
