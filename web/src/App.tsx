import { useEffect, useState } from 'react';
import { Terminal, useTerminal } from './components/Terminal/Terminal';
import { TerminalToolbar, type DisplayMode } from './components/Terminal/TerminalToolbar';
import { HexViewer, useHexViewer } from './components/HexViewer/HexViewer';
import { PortSelector } from './components/PortSelector/PortSelector';
import { wsClient } from './services/websocket';
import { useLogger } from './hooks/useLogger';
import type { WSMessage, DataPayload, StatusPayload, ErrorPayload } from './types/message';
import type { SerialConfig } from './types/serial';
import './App.css';

function App() {
  const [connected, setConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('terminal');
  const { write, clear } = useTerminal();
  const hexViewer = useHexViewer();
  const logger = useLogger();

  useEffect(() => {
    // Connect WebSocket
    wsClient.connect()
      .then(() => {
        console.log('WebSocket connected');
        setWsConnected(true);
      })
      .catch((err) => {
        console.error('WebSocket connection failed:', err);
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
          } else if (payload.state === 'disconnected') {
            setConnected(false);
          } else if (payload.state === 'ready') {
            // WebSocket ready, but serial not connected
            setConnected(false);
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

    return () => {
      unsubscribe();
      wsClient.disconnect();
    };
  }, []); // Empty dependency array to run only once

  const handleConnect = (config: SerialConfig) => {
    setStatus('Connecting...');
    wsClient.connectPort(config);
  };

  const handleDisconnect = () => {
    setStatus('Disconnecting...');
    wsClient.disconnectPort();
  };

  const handleTerminalData = (data: string) => {
    if (connected) {
      wsClient.sendData(data);
    }
  };

  const handleClearDisplay = () => {
    clear();
    hexViewer.clear();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>GoTerm</h1>
        <div className="status-bar">
          <span className={`status-indicator ${wsConnected ? 'connected' : 'disconnected'}`}>
            {wsConnected ? '🟢' : '🔴'} WebSocket
          </span>
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢' : '🔴'} Serial
          </span>
          <span className="status-text">{status}</span>
        </div>
      </header>

      <main className="app-main">
        <PortSelector
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          connected={connected}
        />

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
          />
          {displayMode === 'terminal' ? (
            <Terminal onData={handleTerminalData} />
          ) : (
            <HexViewer />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
