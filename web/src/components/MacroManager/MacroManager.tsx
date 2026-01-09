import { useState } from 'react';
import type { Macro } from '../../hooks/useMacros';
import './MacroManager.css';

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
    <div className="macro-manager">
      <div className="macro-buttons">
        <button
          className="macro-btn"
          onClick={() => setShowList(!showList)}
          title="Manage macros"
        >
          ⚡ Macros ({macros.length})
        </button>
        <button
          className="macro-btn"
          onClick={handleNewMacro}
          title="Create new macro"
        >
          ➕ New
        </button>
      </div>

      {showDialog && (
        <div className="macro-dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="macro-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{editingMacro ? 'Edit Macro' : 'New Macro'}</h3>

            <div className="macro-form">
              <div className="form-field">
                <label>Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Macro"
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label>Commands (one per line):</label>
                <textarea
                  value={commands}
                  onChange={(e) => setCommands(e.target.value)}
                  placeholder="AT&#10;AT+GMR&#10;AT+RST"
                  rows={6}
                />
              </div>

              <div className="form-field">
                <label>Delay between commands (ms):</label>
                <input
                  type="number"
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  min={0}
                  max={10000}
                  step={50}
                />
              </div>

              <div className="form-field">
                <label>Description (optional):</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this macro do?"
                />
              </div>
            </div>

            <div className="macro-dialog-buttons">
              <button onClick={handleSave} disabled={!name.trim() || !commands.trim()}>
                {editingMacro ? 'Update' : 'Save'}
              </button>
              <button onClick={() => setShowDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showList && macros.length > 0 && (
        <div className="macro-list-overlay" onClick={() => setShowList(false)}>
          <div className="macro-list" onClick={(e) => e.stopPropagation()}>
            <div className="macro-list-header">
              <h3>Saved Macros</h3>
              <button className="macro-close" onClick={() => setShowList(false)}>
                ✕
              </button>
            </div>
            <div className="macro-items">
              {macros.map((macro) => (
                <div key={macro.id} className="macro-item">
                  <div className="macro-info">
                    <div className="macro-name">{macro.name}</div>
                    {macro.description && (
                      <div className="macro-description">{macro.description}</div>
                    )}
                    <div className="macro-details">
                      {macro.commands.length} command{macro.commands.length !== 1 ? 's' : ''} • {macro.delay}ms delay
                    </div>
                    <div className="macro-date">
                      Created: {formatDate(macro.createdAt)}
                      {macro.lastUsed && <> • Last used: {formatDate(macro.lastUsed)}</>}
                    </div>
                  </div>
                  <div className="macro-actions">
                    <button
                      className="macro-action-btn execute"
                      onClick={() => handleExecute(macro)}
                      title="Execute macro"
                    >
                      ▶️ Run
                    </button>
                    <button
                      className="macro-action-btn edit"
                      onClick={() => handleEditMacro(macro)}
                      title="Edit macro"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="macro-action-btn delete"
                      onClick={() => onDeleteMacro(macro.id)}
                      title="Delete macro"
                    >
                      🗑️ Delete
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
