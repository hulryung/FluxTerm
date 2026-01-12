import { MacroManager } from '../MacroManager/MacroManager';
import type { Macro } from '../../hooks/useMacros';

interface AutomationPanelProps {
  visible: boolean;
  onClose: () => void;
  macros: Macro[];
  onSaveMacro: (name: string, commands: string[], delay: number, description?: string) => void;
  onUpdateMacro: (id: string, updates: Partial<Omit<Macro, 'id' | 'createdAt'>>) => void;
  onDeleteMacro: (id: string) => void;
  onExecuteMacro: (macro: Macro) => void;
}

export function AutomationPanel({
  visible,
  onClose,
  macros,
  onSaveMacro,
  onUpdateMacro,
  onDeleteMacro,
  onExecuteMacro,
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
          Macros
        </h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Macro Manager */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <MacroManager
          macros={macros}
          onSaveMacro={onSaveMacro}
          onUpdateMacro={onUpdateMacro}
          onDeleteMacro={onDeleteMacro}
          onExecuteMacro={onExecuteMacro}
        />
      </div>
    </aside>
  );
}
