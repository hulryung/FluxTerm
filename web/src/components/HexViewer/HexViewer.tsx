import { useEffect, useRef } from 'react';

interface HexViewerProps {
  onScroll?: () => void;
}

interface HexLine {
  offset: number;
  hex: string[];
  ascii: string;
}

export function HexViewer({ onScroll }: HexViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HexLine[]>([]);
  const currentOffset = useRef(0);

  useEffect(() => {
    // Expose methods to global for external access
    (window as any).__hexViewer = {
      addData: (data: string) => {
        const bytes = Array.from(data).map(c => c.charCodeAt(0));
        addBytes(bytes);
      },
      clear: () => {
        linesRef.current = [];
        currentOffset.current = 0;
        render();
      },
    };

    return () => {
      delete (window as any).__hexViewer;
    };
  }, []);

  const addBytes = (bytes: number[]) => {
    for (const byte of bytes) {
      const lineIndex = Math.floor(currentOffset.current / 16);
      const byteIndex = currentOffset.current % 16;

      if (byteIndex === 0) {
        // Start new line
        linesRef.current.push({
          offset: currentOffset.current,
          hex: [],
          ascii: '',
        });
      }

      const line = linesRef.current[lineIndex];
      line.hex.push(byte.toString(16).padStart(2, '0').toUpperCase());
      line.ascii += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';

      currentOffset.current++;
    }

    render();
  };

  const render = () => {
    if (!containerRef.current) return;

    const html = linesRef.current.map(line => {
      const offset = line.offset.toString(16).padStart(8, '0').toUpperCase();
      const hexPart = line.hex.join(' ').padEnd(47, ' '); // 16 bytes * 3 - 1
      const asciiPart = line.ascii.padEnd(16, ' ');

      return `<div style="display: flex; gap: 16px; line-height: 1.4; white-space: pre;">
        <span style="color: #858585; user-select: none;">${offset}</span>
        <span style="color: #4ec9b0; letter-spacing: 0.5px;">${hexPart}</span>
        <span style="color: #ce9178; border-left: 1px solid #3c3c3c; padding-left: 12px;">${asciiPart}</span>
      </div>`;
    }).join('');

    containerRef.current.innerHTML = html;

    // Auto scroll to bottom
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full p-2 bg-[#1e1e1e] text-slate-300 font-mono text-xs overflow-y-auto overflow-x-hidden"
      onScroll={onScroll}
    />
  );
}

export function useHexViewer() {
  const addData = (data: string) => {
    (window as any).__hexViewer?.addData(data);
  };

  const clear = () => {
    (window as any).__hexViewer?.clear();
  };

  return { addData, clear };
}
