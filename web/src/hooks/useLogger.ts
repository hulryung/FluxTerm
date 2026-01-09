import { useRef, useState } from 'react';

export type LogFormat = 'plain' | 'timestamped' | 'hex';

interface LogEntry {
  timestamp: Date;
  data: string;
}

export function useLogger() {
  const [isLogging, setIsLogging] = useState(false);
  const logBuffer = useRef<LogEntry[]>([]);

  const startLogging = () => {
    logBuffer.current = [];
    setIsLogging(true);
  };

  const stopLogging = () => {
    setIsLogging(false);
  };

  const addLog = (data: string) => {
    if (!isLogging) return;

    logBuffer.current.push({
      timestamp: new Date(),
      data,
    });
  };

  const downloadLog = (format: LogFormat = 'plain', filename?: string) => {
    if (logBuffer.current.length === 0) {
      alert('No log data to save');
      return;
    }

    let content = '';

    switch (format) {
      case 'plain':
        content = logBuffer.current.map(entry => entry.data).join('');
        break;

      case 'timestamped':
        content = logBuffer.current
          .map(entry => {
            const time = entry.timestamp.toISOString();
            return `[${time}] ${entry.data}`;
          })
          .join('\n');
        break;

      case 'hex':
        content = logBuffer.current
          .map(entry => {
            const hex = Array.from(entry.data)
              .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
              .join(' ');
            return `[${entry.timestamp.toISOString()}] ${hex}`;
          })
          .join('\n');
        break;
    }

    // Create download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `goterm-log-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLog = () => {
    logBuffer.current = [];
  };

  return {
    isLogging,
    startLogging,
    stopLogging,
    addLog,
    downloadLog,
    clearLog,
    logCount: logBuffer.current.length,
  };
}
