import { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  onFindNext: (term: string, caseSensitive: boolean) => boolean;
  onFindPrevious: (term: string, caseSensitive: boolean) => boolean;
  onClose: () => void;
  visible: boolean;
}

export function SearchBar({
  onFindNext,
  onFindPrevious,
  onClose,
  visible,
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [resultInfo, setResultInfo] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  const handleSearch = (direction: 'next' | 'previous') => {
    if (!searchTerm) {
      setResultInfo('');
      return;
    }

    const found =
      direction === 'next'
        ? onFindNext(searchTerm, caseSensitive)
        : onFindPrevious(searchTerm, caseSensitive);

    setResultInfo(found ? '' : 'Not found');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e.shiftKey ? 'previous' : 'next');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleChange = (value: string) => {
    setSearchTerm(value);
    setResultInfo('');
  };

  if (!visible) return null;

  return (
    <div className="search-bar">
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder="Find in terminal..."
        value={searchTerm}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <label className="search-option">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(e) => setCaseSensitive(e.target.checked)}
        />
        <span>Aa</span>
      </label>

      <button
        className="search-btn"
        onClick={() => handleSearch('previous')}
        disabled={!searchTerm}
        title="Previous match (Shift+Enter)"
      >
        ▲
      </button>

      <button
        className="search-btn"
        onClick={() => handleSearch('next')}
        disabled={!searchTerm}
        title="Next match (Enter)"
      >
        ▼
      </button>

      {resultInfo && <span className="search-info">{resultInfo}</span>}

      <button className="search-close" onClick={onClose} title="Close (Esc)">
        ✕
      </button>
    </div>
  );
}
