import { useState, useEffect, useRef } from 'react';
import type { Command } from '../../hooks/useCommands';

interface CommandPaletteProps {
  visible: boolean;
  commands: Command[];
  onClose: () => void;
  onExecute: (command: Command) => void;
}

export function CommandPalette({
  visible,
  commands,
  onClose,
  onExecute,
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter commands based on search query
  const filteredCommands = commands.filter((cmd) => {
    const query = searchQuery.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query)
    );
  });

  // Reset state when visibility changes
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setSelectedIndex(0);
      // Focus input after a short delay to ensure it's rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          onExecute(selected);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, filteredCommands, selectedIndex, onClose, onExecute]);

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-start justify-center pt-[10vh] z-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#1E232B] rounded-lg shadow-2xl border border-border-dark flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="p-3 border-b border-border-dark flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">terminal</span>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 w-full text-lg p-0 font-display outline-none"
            placeholder="> Connect to..."
          />
          <span className="text-xs text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">
            Esc to close
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[300px] overflow-y-auto p-2 flex flex-col gap-1">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              No commands found
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <button
                key={command.id}
                onClick={() => {
                  onExecute(command);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`group flex items-center gap-3 p-2 rounded cursor-pointer transition-colors text-left ${
                  index === selectedIndex
                    ? 'bg-primary text-white'
                    : 'text-slate-300 hover:bg-primary hover:text-white'
                }`}
              >
                <span
                  className={`material-symbols-outlined ${
                    index === selectedIndex
                      ? 'text-white'
                      : 'text-slate-400 group-hover:text-white'
                  }`}
                >
                  {command.icon}
                </span>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium">{command.label}</span>
                  <span
                    className={`text-xs ${
                      index === selectedIndex
                        ? 'text-white/80'
                        : 'text-slate-500 group-hover:text-white/80'
                    }`}
                  >
                    {command.description}
                  </span>
                </div>
                {command.shortcut && (
                  <span
                    className={`ml-auto text-xs ${
                      index === selectedIndex
                        ? 'text-white/70'
                        : 'text-slate-500 group-hover:text-white/70'
                    }`}
                  >
                    {command.shortcut}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-[#181d24] border-t border-border-dark text-xs text-slate-500 flex justify-between">
          <span>flux-term: commands</span>
          <span>{filteredCommands.length} results</span>
        </div>
      </div>
    </div>
  );
}
