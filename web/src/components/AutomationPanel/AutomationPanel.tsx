import type { AutomationTab } from '../../hooks/useUIState';
import { MacroManager } from '../MacroManager/MacroManager';
import { ProfileManager } from '../ProfileManager/ProfileManager';
import type { Macro } from '../../hooks/useMacros';
import type { SessionProfile } from '../../hooks/useProfiles';
import type { SerialConfig } from '../../types/serial';

interface AutomationPanelProps {
  visible: boolean;
  tab: AutomationTab;
  onClose: () => void;
  onTabChange: (tab: AutomationTab) => void;
  // Macro props
  macros: Macro[];
  onSaveMacro: (name: string, commands: string[], delay: number, description?: string) => void;
  onUpdateMacro: (id: string, updates: Partial<Omit<Macro, 'id' | 'createdAt'>>) => void;
  onDeleteMacro: (id: string) => void;
  onExecuteMacro: (macro: Macro) => void;
  // Profile props
  profiles: SessionProfile[];
  onSaveProfile: (name: string, config: SerialConfig) => void;
  onLoadProfile: (profile: SessionProfile) => void;
  onDeleteProfile: (id: string) => void;
  currentConfig: SerialConfig | null;
}

export function AutomationPanel({
  visible,
  tab,
  onClose,
  onTabChange,
  macros,
  onSaveMacro,
  onUpdateMacro,
  onDeleteMacro,
  onExecuteMacro,
  profiles,
  onSaveProfile,
  onLoadProfile,
  onDeleteProfile,
  currentConfig,
}: AutomationPanelProps) {
  if (!visible) return null;

  return (
    <aside
      className={`w-[400px] bg-[#1a1d24] border-l border-border-dark flex flex-col shrink-0 shadow-xl transition-transform duration-200 ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Panel Header */}
      <div className="px-6 py-5 border-b border-border-dark flex items-center justify-between">
        <h2 className="text-lg font-bold text-white tracking-tight">
          Automation & Profiles
        </h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Tabs (Segmented Control) */}
      <div className="px-6 py-4">
        <div className="flex p-1 bg-[#111318] rounded-lg">
          <button
            onClick={() => onTabChange('profiles')}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
              tab === 'profiles'
                ? 'bg-[#282e39] text-white shadow-sm ring-1 ring-white/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Profiles
          </button>
          <button
            onClick={() => onTabChange('macros')}
            className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
              tab === 'macros'
                ? 'bg-[#282e39] text-white shadow-sm ring-1 ring-white/5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Macros
          </button>
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {tab === 'profiles' ? (
          <ProfileManager
            profiles={profiles}
            onSaveProfile={onSaveProfile}
            onLoadProfile={onLoadProfile}
            onDeleteProfile={onDeleteProfile}
            currentConfig={currentConfig}
          />
        ) : (
          <MacroManager
            macros={macros}
            onSaveMacro={onSaveMacro}
            onUpdateMacro={onUpdateMacro}
            onDeleteMacro={onDeleteMacro}
            onExecuteMacro={onExecuteMacro}
          />
        )}
      </div>
    </aside>
  );
}
