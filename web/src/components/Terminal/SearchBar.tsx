import { useState } from 'react';

interface SearchBarProps {
  visible: boolean;
  onFindNext: (query: string, caseSensitive: boolean) => void;
  onFindPrevious: (query: string, caseSensitive: boolean) => void;
  onClose: () => void;
}

export function SearchBar({
  visible,
  onFindNext,
  onFindPrevious,
  onClose,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);

  if (!visible) {
    return null;
  }

  const handleNext = () => {
    if (query) {
      onFindNext(query, caseSensitive);
    }
  };

  const handlePrevious = () => {
    if (query) {
      onFindPrevious(query, caseSensitive);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevious();
      } else {
        handleNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-panel-dark border-b border-border-dark">
      <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        className="flex-1 bg-[#1c1f27] border border-border-dark rounded px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        autoFocus
      />

      <label className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(e) => setCaseSensitive(e.target.checked)}
          className="rounded border-border-dark bg-[#1c1f27] text-primary focus:ring-primary focus:ring-offset-0"
        />
        <span>Case sensitive</span>
      </label>

      <div className="flex items-center gap-1">
        <button
          onClick={handlePrevious}
          disabled={!query}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous (Shift+Enter)"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
        </button>
        <button
          onClick={handleNext}
          disabled={!query}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next (Enter)"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
        </button>
      </div>

      <button
        onClick={onClose}
        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        title="Close (Esc)"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}
