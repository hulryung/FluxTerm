import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onNewTab: () => void;
  onCloseTab: () => void;
  onNextTab: () => void;
  onToggleCommandPalette: () => void;
  onToggleSearch: () => void;
  onEscape: () => void;
  canCloseTab: boolean;
}

export function useKeyboardShortcuts({
  onNewTab,
  onCloseTab,
  onNextTab,
  onToggleCommandPalette,
  onToggleSearch,
  onEscape,
  canCloseTab,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Escape key - always works
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
        return;
      }

      // Command/Ctrl+K: Toggle command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onToggleCommandPalette();
        return;
      }

      // Don't handle other shortcuts if we're in an input field
      if (isInputField) {
        return;
      }

      // Ctrl+T: New tab
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        onNewTab();
      }
      // Ctrl+W: Close current tab (only if more than one)
      else if (e.ctrlKey && e.key === 'w' && canCloseTab) {
        e.preventDefault();
        onCloseTab();
      }
      // Ctrl+Tab: Next tab
      else if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        onNextTab();
      }
      // Ctrl+F: Toggle search
      else if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        onToggleSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    onNewTab,
    onCloseTab,
    onNextTab,
    onToggleCommandPalette,
    onToggleSearch,
    onEscape,
    canCloseTab,
  ]);
}
