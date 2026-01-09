import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  onData: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
}

export function Terminal({ onData, onResize }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
      },
      cols: 80,
      rows: 24,
    });

    // Create fit addon
    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);

    // Open terminal
    xterm.open(terminalRef.current);
    fitAddon.fit();

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

    return () => {
      window.removeEventListener('resize', handleResize);
      xterm.dispose();
    };
  }, [onData, onResize]);

  // Expose write method
  useEffect(() => {
    if (xtermRef.current) {
      (window as any).__terminal = {
        write: (data: string) => xtermRef.current?.write(data),
        clear: () => xtermRef.current?.clear(),
      };
    }
  }, []);

  return (
    <div
      ref={terminalRef}
      style={{
        width: '100%',
        height: '100%',
        padding: '8px',
      }}
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

  return { write, clear };
}
