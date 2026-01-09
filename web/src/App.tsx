import { useEffect, useState } from 'react';
import { Terminal, useTerminal } from './components/Terminal/Terminal';
import { PortSelector } from './components/PortSelector/PortSelector';
import { wsClient } from './services/websocket';
import type { WSMessage, DataPayload, StatusPayload, ErrorPayload } from './types/message';
import type { SerialConfig } from './types/serial';
import './App.css';

function App() {
  const [connected, setConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const { write } = useTerminal();

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
  }, [write]);

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
          <Terminal onData={handleTerminalData} />
        </div>
      </main>
    </div>
  );
}

export default App;
