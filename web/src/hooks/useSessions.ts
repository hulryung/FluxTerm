import { useState, useCallback } from 'react';
import type { ConnectionConfig } from '../types/connection';

export interface Session {
  id: string;
  name: string;
  connected: boolean;
  config: ConnectionConfig | null;
  createdAt: number;
}

let sessionCounter = 0;

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: 'session-0',
      name: 'Session 1',
      connected: false,
      config: null,
      createdAt: Date.now(),
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-0');

  const createSession = useCallback(() => {
    sessionCounter++;
    const newSession: Session = {
      id: `session-${sessionCounter}`,
      name: `Session ${sessionCounter + 1}`,
      connected: false,
      config: null,
      createdAt: Date.now(),
    };

    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    return newSession;
  }, []);

  const closeSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      // Ensure at least one session exists
      if (filtered.length === 0) {
        return [
          {
            id: `session-${++sessionCounter}`,
            name: `Session ${sessionCounter + 1}`,
            connected: false,
            config: null,
            createdAt: Date.now(),
          },
        ];
      }
      return filtered;
    });

    // If closing active session, switch to another
    setActiveSessionId((prev) => {
      if (prev === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        return remaining.length > 0 ? remaining[0].id : `session-${sessionCounter}`;
      }
      return prev;
    });
  }, [sessions]);

  const updateSession = useCallback((sessionId: string, updates: Partial<Session>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, ...updates } : s))
    );
  }, []);

  const renameSession = useCallback((sessionId: string, name: string) => {
    updateSession(sessionId, { name });
  }, [updateSession]);

  const getActiveSession = useCallback(() => {
    return sessions.find((s) => s.id === activeSessionId);
  }, [sessions, activeSessionId]);

  const getSession = useCallback((sessionId: string) => {
    return sessions.find((s) => s.id === sessionId);
  }, [sessions]);

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    closeSession,
    updateSession,
    renameSession,
    getActiveSession,
    getSession,
  };
}
