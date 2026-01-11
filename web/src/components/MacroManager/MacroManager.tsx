import { useState } from 'react';
import type { Macro } from '../../hooks/useMacros';

interface MacroManagerProps {
  macros: Macro[];
  onSaveMacro: (name: string, commands: string[], delay: number, description?: string) => void;
  onUpdateMacro: (id: string, updates: Partial<Omit<Macro, 'id' | 'createdAt'>>) => void;
  onDeleteMacro: (id: string) => void;
  onExecuteMacro: (macro: Macro) => void;
}

export function MacroManager({
  macros,
  onSaveMacro,
  onUpdateMacro,
  onDeleteMacro,
  onExecuteMacro,
}: MacroManagerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showList, setShowList] = useState(false);
  const [editingMacro, setEditingMacro] = useState<Macro | null>(null);

  const [name, setName] = useState('');
  const [commands, setCommands] = useState('');
  const [delay, setDelay] = useState(100);
  const [description, setDescription] = useState('');

  const handleNewMacro = () => {
    setEditingMacro(null);
    setName('');
    setCommands('');
    setDelay(100);
    setDescription('');
    setShowDialog(true);
  };

  const handleEditMacro = (macro: Macro) => {
    setEditingMacro(macro);
    setName(macro.name);
    setCommands(macro.commands.join('\n'));
    setDelay(macro.delay);
    setDescription(macro.description || '');
    setShowDialog(true);
    setShowList(false);
  };

  const handleSave = () => {
    if (!name.trim() || !commands.trim()) return;

    const commandArray = commands
      .split('\n')
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0);

    if (commandArray.length === 0) return;

    if (editingMacro) {
      onUpdateMacro(editingMacro.id, {
        name: name.trim(),
        commands: commandArray,
        delay,
        description: description.trim() || undefined,
      });
    } else {
      onSaveMacro(name.trim(), commandArray, delay, description.trim() || undefined);
    }

    setShowDialog(false);
    setEditingMacro(null);
  };

  const handleExecute = (macro: Macro) => {
    onExecuteMacro(macro);
    setShowList(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <button
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#3c3c3c] text-slate-300 border border-[#555] rounded transition-all text-xs hover:bg-[#464646] hover:border-[#666]"
          onClick={() => setShowList(!showList)}
          title="Manage macros"
        >
          <span className="material-symbols-outlined text-[16px]">bolt</span>
          <span>Macros ({macros.length})</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#3c3c3c] text-slate-300 border border-[#555] rounded transition-all text-xs hover:bg-[#464646] hover:border-[#666]"
          onClick={handleNewMacro}
          title="Create new macro"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>New</span>
        </button>
      </div>

      {showDialog && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000] animate-[fadeIn_0.2s]"
          onClick={() => setShowDialog(false)}
        >
          <div
            className="bg-[#2d2d2d] border border-[#555] rounded-md p-5 min-w-[500px] max-w-[600px] shadow-[0_8px_24px_rgba(0,0,0,0.5)] animate-[slideUp_0.2s]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 mb-5 text-slate-200 text-lg">
              {editingMacro ? 'Edit Macro' : 'New Macro'}
            </h3>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Macro"
                  autoFocus
                  className="px-3 py-2 bg-[#1e1e1e] border border-[#555] rounded text-slate-200 text-sm font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Commands (one per line):</label>
                <textarea
                  value={commands}
                  onChange={(e) => setCommands(e.target.value)}
                  placeholder="AT&#10;AT+GMR&#10;AT+RST"
                  rows={6}
                  className="px-3 py-2 bg-[#1e1e1e] border border-[#555] rounded text-slate-200 text-sm font-mono outline-none resize-y min-h-[100px] focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Delay between commands (ms):</label>
                <input
                  type="number"
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  min={0}
                  max={10000}
                  step={50}
                  className="px-3 py-2 bg-[#1e1e1e] border border-[#555] rounded text-slate-200 text-sm font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Description (optional):</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this macro do?"
                  className="px-3 py-2 bg-[#1e1e1e] border border-[#555] rounded text-slate-200 text-sm font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={handleSave}
                disabled={!name.trim() || !commands.trim()}
                className="px-5 py-2 bg-primary border border-primary rounded cursor-pointer text-xs text-white transition-all hover:bg-[#1177bb] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {editingMacro ? 'Update' : 'Save'}
              </button>
              <button
                onClick={() => setShowDialog(false)}
                className="px-5 py-2 bg-[#3c3c3c] text-slate-300 border border-[#555] rounded cursor-pointer text-xs transition-all hover:bg-[#464646]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showList && macros.length > 0 && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[2000] animate-[fadeIn_0.2s]"
          onClick={() => setShowList(false)}
        >
          <div
            className="bg-[#2d2d2d] border border-[#555] rounded-md min-w-[600px] max-w-[800px] max-h-[80vh] shadow-[0_8px_24px_rgba(0,0,0,0.5)] animate-[slideUp_0.2s] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-[#3c3c3c]">
              <h3 className="m-0 text-slate-200 text-lg">Saved Macros</h3>
              <button
                className="bg-transparent border-none text-slate-400 cursor-pointer text-xl p-0 w-6 h-6 flex items-center justify-center transition-colors hover:text-slate-200"
                onClick={() => setShowList(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="overflow-y-auto p-2">
              {macros.map((macro) => (
                <div
                  key={macro.id}
                  className="flex justify-between items-start p-3.5 px-4 bg-[#252525] border border-[#3c3c3c] rounded mb-2 transition-all hover:bg-[#2d2d2d] hover:border-[#555]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-slate-200 mb-1">{macro.name}</div>
                    {macro.description && (
                      <div className="text-xs text-slate-400 mb-1.5 italic">{macro.description}</div>
                    )}
                    <div className="text-xs text-slate-400 mb-0.5">
                      {macro.commands.length} command{macro.commands.length !== 1 ? 's' : ''} • {macro.delay}ms delay
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Created: {formatDate(macro.createdAt)}
                      {macro.lastUsed && <> • Last used: {formatDate(macro.lastUsed)}</>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0 ml-4">
                    <button
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-primary border border-primary rounded cursor-pointer text-[11px] text-white transition-all whitespace-nowrap hover:bg-[#1177bb]"
                      onClick={() => handleExecute(macro)}
                      title="Execute macro"
                    >
                      <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                      <span>Run</span>
                    </button>
                    <button
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-[#3c3c3c] text-slate-300 border border-[#555] rounded cursor-pointer text-[11px] transition-all whitespace-nowrap hover:bg-[#464646]"
                      onClick={() => handleEditMacro(macro)}
                      title="Edit macro"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      <span>Edit</span>
                    </button>
                    <button
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-[#3c3c3c] text-slate-300 border border-[#555] rounded cursor-pointer text-[11px] transition-all whitespace-nowrap hover:bg-red-700 hover:border-red-700"
                      onClick={() => onDeleteMacro(macro.id)}
                      title="Delete macro"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
