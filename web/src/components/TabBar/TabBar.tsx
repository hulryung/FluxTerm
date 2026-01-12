import { useState, useRef, useEffect } from 'react';
import type { Session } from '../../hooks/useSessions';
import { isSerialConfig } from '../../types/connection';

interface TabBarProps {
  sessions: Session[];
  activeSessionId: string;
  onSessionChange: (sessionId: string) => void;
  onSessionClose: (sessionId: string) => void;
  onSessionCreate: () => void;
  onSessionRename: (sessionId: string, name: string) => void;
}

// Get icon based on connection type (you can extend this based on actual connection mode)
function getConnectionIcon(_session: Session): string {
  // TODO: Update this when we have connection type in session
  return 'power'; // Default icon
}

export function TabBar({
  sessions,
  activeSessionId,
  onSessionChange,
  onSessionClose,
  onSessionCreate,
  onSessionRename,
}: TabBarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDoubleClick = (session: Session) => {
    setEditingId(session.id);
    setEditingName(session.name);
  };

  const handleRename = (sessionId: string) => {
    if (editingName.trim()) {
      onSessionRename(sessionId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      handleRename(sessionId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleClose = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    onSessionClose(sessionId);
  };

  return (
    <header className="flex h-10 bg-panel-dark border-b border-border-dark select-none">
      {/* Brand / Menu Toggle */}
      <div className="w-12 flex items-center justify-center border-r border-border-dark shrink-0">
        <span className="material-symbols-outlined text-primary text-[20px]">terminal</span>
      </div>

      {/* Tabs Container */}
      <div className="flex flex-1 overflow-x-auto no-scrollbar">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          const isConnected = session.connected;

          return (
            <div
              key={session.id}
              className={`group flex items-center gap-2 px-3 min-w-[200px] max-w-[240px] border-r border-border-dark border-t-2 cursor-pointer relative ${
                isActive
                  ? 'bg-background-dark border-t-primary text-white'
                  : 'bg-panel-dark hover:bg-[#1f293a] border-t-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => onSessionChange(session.id)}
              onDoubleClick={() => handleDoubleClick(session)}
            >
              {/* Connection type icon */}
              <span
                className={`material-symbols-outlined text-[16px] ${
                  isConnected ? 'text-green-400' : 'text-slate-600'
                }`}
              >
                {getConnectionIcon(session)}
              </span>

              {/* Tab name or input */}
              {editingId === session.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 bg-transparent border-none outline-none text-white text-xs font-medium px-0"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => handleRename(session.id)}
                  onKeyDown={(e) => handleKeyDown(e, session.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="text-xs font-medium truncate flex-1"
                  title={
                    session.config && isSerialConfig(session.config)
                      ? session.config.config.port
                      : session.name
                  }
                >
                  {session.name}
                </span>
              )}

              {/* Status dot */}
              <div
                className={`h-2 w-2 rounded-full mr-1 ${
                  isConnected ? 'bg-green-500' : 'bg-slate-600'
                }`}
              />

              {/* Close button */}
              {sessions.length > 1 && (
                <button
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded"
                  onClick={(e) => handleClose(e, session.id)}
                  title="Close session"
                >
                  <span className="material-symbols-outlined text-[14px] text-slate-400">
                    close
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* New Tab Button */}
      <button
        className="flex items-center justify-center w-10 hover:bg-white/5 text-slate-400"
        onClick={onSessionCreate}
        title="New session (Ctrl+T)"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
      </button>

      {/* Window Controls (macOS style) */}
      <div className="flex items-center px-2 gap-2">
        <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/50" />
        <div className="h-3 w-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
        <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500/50" />
      </div>
    </header>
  );
}
