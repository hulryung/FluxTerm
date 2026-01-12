import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  onData: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
}

export function Terminal({ onData, onResize }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Consolas, "Courier New", monospace',
      theme: {
        background: '#101622',
        foreground: '#d4d4d4',
        cursor: '#2b6cee',
      },
      cols: 80,
      rows: 24,
      scrollback: 1000,
      tabStopWidth: 8,
      convertEol: false,
      allowProposedApi: true,
    });

    // Create fit addon
    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    // Create search addon
    const searchAddon = new SearchAddon();
    xterm.loadAddon(searchAddon);

    // Open terminal
    xterm.open(terminalRef.current);
    fitAddon.fit();

    // Enable IME input by ensuring the textarea is properly configured
    setTimeout(() => {
      const textareaElement = terminalRef.current?.querySelector('textarea');
      if (textareaElement) {
        // Configure textarea for better IME support
        textareaElement.setAttribute('autocomplete', 'off');
        textareaElement.setAttribute('autocorrect', 'off');
        textareaElement.setAttribute('autocapitalize', 'off');
        textareaElement.setAttribute('spellcheck', 'false');

        // Set input mode for mobile keyboards (helps with IME)
        textareaElement.setAttribute('inputmode', 'text');

        // Ensure the textarea can receive focus and input
        textareaElement.setAttribute('aria-label', 'Terminal input');

        // Auto-focus the terminal for immediate input
        textareaElement.focus();
      }
    }, 100);

    // Handle data input
    xterm.onData((data) => {
      onData(data);
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      if (onResize) {
        onResize(xterm.cols, xterm.rows);
      }
    };

    window.addEventListener('resize', handleResize);

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;

    return () => {
      window.removeEventListener('resize', handleResize);
      xterm.dispose();
    };
  }, [onData, onResize]);

  // Expose terminal methods
  useEffect(() => {
    if (xtermRef.current && searchAddonRef.current) {
      (window as any).__terminal = {
        write: (data: string) => xtermRef.current?.write(data),
        clear: () => xtermRef.current?.clear(),
        findNext: (term: string, caseSensitive?: boolean) =>
          searchAddonRef.current?.findNext(term, { caseSensitive }),
        findPrevious: (term: string, caseSensitive?: boolean) =>
          searchAddonRef.current?.findPrevious(term, { caseSensitive }),
        clearSearch: () => searchAddonRef.current?.clearDecorations(),
      };
    }
  }, []);

  return (
    <div
      ref={terminalRef}
      className="w-full h-full p-2"
    />
  );
}

export function useTerminal() {
  const write = (data: string) => {
    (window as any).__terminal?.write(data);
  };

  const clear = () => {
    (window as any).__terminal?.clear();
  };

  const findNext = (term: string, caseSensitive = false) => {
    return (window as any).__terminal?.findNext(term, caseSensitive);
  };

  const findPrevious = (term: string, caseSensitive = false) => {
    return (window as any).__terminal?.findPrevious(term, caseSensitive);
  };

  const clearSearch = () => {
    (window as any).__terminal?.clearSearch();
  };

  return { write, clear, findNext, findPrevious, clearSearch };
}
