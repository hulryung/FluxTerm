import { useMemo } from 'react';

export interface Command {
  id: string;
  label: string;
  description: string;
  icon: string;
  shortcut?: string;
  action: () => void;
  category: 'connection' | 'macro' | 'profile' | 'setting' | 'action';
}

interface UseCommandsProps {
  onNewSerialConnection: () => void;
  onNewSSHConnection: () => void;
  onLoadProfile: (profileId: string) => void;
  onRunMacro: (macroId: string) => void;
  onToggleHexView: () => void;
  onStartLogging: () => void;
  onStopLogging: () => void;
  onClearTerminal: () => void;
  onToggleSearch: () => void;
  onOpenSettings: () => void;
  onResetTerminal: () => void;
  profiles: Array<{ id: string; name: string }>;
  macros: Array<{ id: string; name: string; description?: string }>;
  isLogging: boolean;
}

export function useCommands({
  onNewSerialConnection,
  onNewSSHConnection,
  onLoadProfile,
  onRunMacro,
  onToggleHexView,
  onStartLogging,
  onStopLogging,
  onClearTerminal,
  onToggleSearch,
  onOpenSettings,
  onResetTerminal,
  profiles,
  macros,
  isLogging,
}: UseCommandsProps): Command[] {
  return useMemo(() => {
    const commands: Command[] = [
      // Connection commands
      {
        id: 'new-serial',
        label: 'New Serial Connection',
        description: 'Start a new serial session...',
        icon: 'add_link',
        shortcut: 'Ctrl+Shift+N',
        action: onNewSerialConnection,
        category: 'connection',
      },
      {
        id: 'new-ssh',
        label: 'New SSH Connection',
        description: 'Connect to a remote server...',
        icon: 'lock',
        action: onNewSSHConnection,
        category: 'connection',
      },

      // Profile commands
      ...profiles.map((profile) => ({
        id: `profile-${profile.id}`,
        label: `Load Profile: ${profile.name}`,
        description: 'Load saved connection profile',
        icon: 'person',
        action: () => onLoadProfile(profile.id),
        category: 'profile' as const,
      })),

      // Macro commands
      ...macros.map((macro) => ({
        id: `macro-${macro.id}`,
        label: `Run Macro: ${macro.name}`,
        description: macro.description || 'Execute saved macro',
        icon: 'play_arrow',
        action: () => onRunMacro(macro.id),
        category: 'macro' as const,
      })),

      // Action commands
      {
        id: 'toggle-hex',
        label: 'Toggle HEX Viewer',
        description: 'Switch between terminal and hex view',
        icon: 'grid_on',
        action: onToggleHexView,
        category: 'action',
      },
      {
        id: 'clear-terminal',
        label: 'Clear Terminal',
        description: 'Clear terminal display',
        icon: 'delete_sweep',
        action: onClearTerminal,
        category: 'action',
      },
      {
        id: 'reset-terminal',
        label: 'Reset Terminal',
        description: 'Clear buffer and reset state',
        icon: 'settings_backup_restore',
        action: onResetTerminal,
        category: 'action',
      },
      {
        id: 'search',
        label: 'Search',
        description: 'Search in terminal',
        icon: 'search',
        shortcut: 'Ctrl+F',
        action: onToggleSearch,
        category: 'action',
      },
      {
        id: 'logging',
        label: isLogging ? 'Stop Logging' : 'Start Logging',
        description: isLogging ? 'Stop recording terminal output' : 'Start recording terminal output',
        icon: isLogging ? 'stop' : 'fiber_manual_record',
        action: isLogging ? onStopLogging : onStartLogging,
        category: 'action',
      },

      // Settings
      {
        id: 'settings',
        label: 'Settings',
        description: 'Open application settings',
        icon: 'settings',
        action: onOpenSettings,
        category: 'setting',
      },
    ];

    return commands;
  }, [
    onNewSerialConnection,
    onNewSSHConnection,
    onLoadProfile,
    onRunMacro,
    onToggleHexView,
    onStartLogging,
    onStopLogging,
    onClearTerminal,
    onToggleSearch,
    onOpenSettings,
    onResetTerminal,
    profiles,
    macros,
    isLogging,
  ]);
}
