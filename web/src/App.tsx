import { useEffect, useState } from 'react';
import { TabBar } from './components/TabBar/TabBar';
import { SessionView } from './components/SessionView/SessionView';
import { Sidebar } from './components/Sidebar/Sidebar';
import { StatusBar } from './components/StatusBar/StatusBar';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { ConnectionPanel } from './components/ConnectionPanel/ConnectionPanel';
import { AutomationPanel } from './components/AutomationPanel/AutomationPanel';
import { useSessions } from './hooks/useSessions';
import { useUIState } from './hooks/useUIState';
import { useCommands, type Command } from './hooks/useCommands';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useProfiles, type SessionProfile } from './hooks/useProfiles';
import { useMacros, type Macro } from './hooks/useMacros';
import { wsClient } from './services/websocket';
import type { SSHConfig } from './components/SSHConnector/SSHConnector';
import type { SerialConfig } from './types/serial';
import type { ConnectionConfig } from './types/connection';
import { isSerialConfig, isSSHConfig } from './types/connection';

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

  const {
    showCommandPalette,
    showConnectionPanel,
    showAutomationPanel,
    activeSidebarView,
    toggleCommandPalette,
    closeCommandPalette,
    setSidebarView,
    closeAllPanels,
  } = useUIState();

  const {
    profiles,
    saveProfile,
    deleteProfile,
    getProfile,
    updateLastUsed: updateProfileLastUsed,
  } = useProfiles();

  const {
    macros,
    saveMacro,
    updateMacro,
    deleteMacro,
    getMacro,
    updateLastUsed: updateMacroLastUsed,
  } = useMacros();

  const [searchVisible, setSearchVisible] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  // Get active session
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Connection handlers
  const handleSerialConnect = (config: SerialConfig, _autoReconnect: boolean) => {
    wsClient.connectPort(config);
    updateSession(activeSessionId, { config: { type: 'serial', config }, connected: false }); // Will be set to true on status message
    closeAllPanels();
  };

  const handleSSHConnect = (config: SSHConfig) => {
    wsClient.connectSSH(config as unknown as Record<string, unknown>);
    updateSession(activeSessionId, { config: { type: 'ssh', config }, connected: false }); // Will be set to true on status message
    closeAllPanels();
  };

  const handleDisconnect = () => {
    wsClient.disconnectPort();
    updateSession(activeSessionId, { connected: false, config: null });
  };

  // Profile handlers
  const handleSaveProfile = (name: string, config: ConnectionConfig) => {
    saveProfile(name, config);
  };

  const handleLoadProfile = (profile: SessionProfile) => {
    updateProfileLastUsed(profile.id);

    if (isSerialConfig(profile.config)) {
      handleSerialConnect(profile.config.config, false);
    } else if (isSSHConfig(profile.config)) {
      handleSSHConnect(profile.config.config);
    }
  };

  // Macro handlers
  const handleExecuteMacro = (macro: Macro) => {
    if (!activeSession?.connected) {
      console.warn('Cannot execute macro: not connected');
      return;
    }

    updateMacroLastUsed(macro.id);
    // Execute macro commands with delay
    macro.commands.forEach((cmd, index) => {
      setTimeout(() => {
        wsClient.sendData(cmd + '\r\n');
      }, index * macro.delay);
    });
  };

  // Commands for command palette
  const commands = useCommands({
    onNewSerialConnection: () => {
      setSidebarView('connection');
      closeCommandPalette();
    },
    onNewSSHConnection: () => {
      setSidebarView('connection');
      closeCommandPalette();
    },
    onLoadProfile: (profileId: string) => {
      const profile = getProfile(profileId);
      if (profile) {
        handleLoadProfile(profile);
      }
      closeCommandPalette();
    },
    onRunMacro: (macroId: string) => {
      const macro = getMacro(macroId);
      if (macro) {
        handleExecuteMacro(macro);
      }
      closeCommandPalette();
    },
    onToggleHexView: () => {
      // HEX view toggle is handled within SessionView/TerminalToolbar
      closeCommandPalette();
    },
    onStartLogging: () => {
      setIsLogging(true);
      closeCommandPalette();
    },
    onStopLogging: () => {
      setIsLogging(false);
      closeCommandPalette();
    },
    onClearTerminal: () => {
      // Access global terminal methods
      (window as any).__terminal?.clear();
      (window as any).__hexViewer?.clear();
      closeCommandPalette();
    },
    onToggleSearch: () => {
      setSearchVisible((prev) => !prev);
      closeCommandPalette();
    },
    onOpenSettings: () => {
      setSidebarView('settings');
      closeCommandPalette();
    },
    onResetTerminal: () => {
      // Clear and reset terminal state
      (window as any).__terminal?.clear();
      (window as any).__hexViewer?.clear();
      closeCommandPalette();
    },
    profiles: profiles.map((p) => ({ id: p.id, name: p.name })),
    macros: macros.map((m) => ({ id: m.id, name: m.name, description: m.description })),
    isLogging,
  });

  // Handle command execution
  const handleCommandExecute = (command: Command) => {
    command.action();
  };

  // Connect WebSocket once on mount
  useEffect(() => {
    wsClient.connect().catch((err) => {
      console.error('Failed to connect WebSocket:', err);
    });

    return () => {
      wsClient.disconnect();
    };
  }, []);

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    onNewTab: createSession,
    onCloseTab: () => closeSession(activeSessionId),
    onNextTab: () => {
      const currentIndex = sessions.findIndex((s) => s.id === activeSessionId);
      const nextIndex = (currentIndex + 1) % sessions.length;
      setActiveSessionId(sessions[nextIndex].id);
    },
    onToggleCommandPalette: toggleCommandPalette,
    onToggleSearch: () => setSearchVisible((prev) => !prev),
    onEscape: () => {
      if (showCommandPalette) {
        closeCommandPalette();
      } else if (searchVisible) {
        setSearchVisible(false);
      } else {
        closeAllPanels();
      }
    },
    canCloseTab: sessions.length > 1,
  });

  return (
    <div className="dark">
      <div className="h-screen flex flex-col bg-background-dark text-white overflow-hidden font-display">
        {/* Top Tab Bar */}
        <TabBar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSessionChange={setActiveSessionId}
          onSessionClose={closeSession}
          onSessionCreate={createSession}
          onSessionRename={renameSession}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Icon Sidebar */}
          <Sidebar activeView={activeSidebarView} onViewChange={setSidebarView} />

          {/* Connection Panel (Left Slide-in) */}
          <ConnectionPanel
            visible={showConnectionPanel}
            onClose={() => setSidebarView(null)}
            connected={activeSession?.connected || false}
            onSerialConnect={handleSerialConnect}
            onSSHConnect={handleSSHConnect}
            onDisconnect={handleDisconnect}
            profiles={profiles}
            onSaveProfile={handleSaveProfile}
            onLoadProfile={handleLoadProfile}
            onDeleteProfile={deleteProfile}
          />

          {/* Center Terminal Area */}
          <main className="flex-1 flex flex-col bg-background-dark overflow-hidden">
            {sessions.map((session) => (
              <SessionView
                key={session.id}
                sessionId={session.id}
                isActive={session.id === activeSessionId}
                onConnectionChange={(connected) => {
                  updateSession(session.id, { connected });
                }}
                onConfigChange={(config) => {
                  updateSession(session.id, { config });
                }}
              />
            ))}
          </main>

          {/* Automation Panel (Right Slide-in) */}
          <AutomationPanel
            visible={showAutomationPanel}
            onClose={() => setSidebarView(null)}
            macros={macros}
            onSaveMacro={saveMacro}
            onUpdateMacro={updateMacro}
            onDeleteMacro={deleteMacro}
            onExecuteMacro={handleExecuteMacro}
          />
        </div>

        {/* Bottom Status Bar */}
        <StatusBar
          connected={activeSession?.connected || false}
          connectionType={
            activeSession?.config
              ? isSerialConfig(activeSession.config)
                ? 'serial'
                : 'ssh'
              : null
          }
          config={activeSession?.config || null}
        />

        {/* Command Palette Overlay */}
        <CommandPalette
          visible={showCommandPalette}
          commands={commands}
          onClose={closeCommandPalette}
          onExecute={handleCommandExecute}
        />
      </div>
    </div>
  );
}

export default App;
