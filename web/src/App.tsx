import { useEffect } from 'react';
import { TabBar } from './components/TabBar/TabBar';
import { SessionView } from './components/SessionView/SessionView';
import { useSessions } from './hooks/useSessions';
import { wsClient } from './services/websocket';
import './App.css';

function App() {
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    closeSession,
    updateSession,
    renameSession,
  } = useSessions();

  useEffect(() => {
    // Global keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T: New tab
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        createSession();
      }
      // Ctrl+W: Close current tab (only if more than one)
      else if (e.ctrlKey && e.key === 'w' && sessions.length > 1) {
        e.preventDefault();
        closeSession(activeSessionId);
      }
      // Ctrl+Tab: Next tab
      else if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = sessions.findIndex((s) => s.id === activeSessionId);
        const nextIndex = (currentIndex + 1) % sessions.length;
        setActiveSessionId(sessions[nextIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      wsClient.disconnect();
    };
  }, [sessions, activeSessionId, createSession, closeSession, setActiveSessionId]);

  const handleConnectionChange = (sessionId: string, connected: boolean) => {
    updateSession(sessionId, { connected });
  };

  const handleConfigChange = (sessionId: string, config: any) => {
    updateSession(sessionId, { config });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>FluxTerm</h1>
      </header>

      <TabBar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionChange={setActiveSessionId}
        onSessionClose={closeSession}
        onSessionCreate={createSession}
        onSessionRename={renameSession}
      />

      <main className="app-main">
        {sessions.map((session) => (
          <SessionView
            key={session.id}
            sessionId={session.id}
            isActive={session.id === activeSessionId}
            onConnectionChange={(connected) => handleConnectionChange(session.id, connected)}
            onConfigChange={(config) => handleConfigChange(session.id, config)}
          />
        ))}
      </main>
    </div>
  );
}

export default App;
