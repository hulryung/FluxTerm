import { useState, useRef, useEffect } from 'react';
import type { Session } from '../../hooks/useSessions';
import './TabBar.css';

interface TabBarProps {
  sessions: Session[];
  activeSessionId: string;
  onSessionChange: (sessionId: string) => void;
  onSessionClose: (sessionId: string) => void;
  onSessionCreate: () => void;
  onSessionRename: (sessionId: string, name: string) => void;
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
    <div className="tab-bar">
      <div className="tab-list">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`tab ${session.id === activeSessionId ? 'active' : ''} ${
              session.connected ? 'connected' : ''
            }`}
            onClick={() => onSessionChange(session.id)}
            onDoubleClick={() => handleDoubleClick(session)}
          >
            <span className="tab-status-dot" />
            {editingId === session.id ? (
              <input
                ref={inputRef}
                type="text"
                className="tab-name-input"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleRename(session.id)}
                onKeyDown={(e) => handleKeyDown(e, session.id)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="tab-name" title={session.config?.port || 'No port'}>
                {session.name}
              </span>
            )}
            {sessions.length > 1 && (
              <button
                className="tab-close"
                onClick={(e) => handleClose(e, session.id)}
                title="Close session"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <button className="tab-new" onClick={onSessionCreate} title="New session (Ctrl+T)">
        +
      </button>
    </div>
  );
}
