import { useState, useRef } from 'react';

interface FileTransferProps {
  connected: boolean;
  onSendFile: (file: File, protocol: string) => void;
  onReceiveFile: (fileName: string, protocol: string) => void;
  transferProgress: FileTransferProgress | null;
}

export interface FileTransferProgress {
  action: 'start' | 'progress' | 'complete' | 'error';
  fileName: string;
  fileSize: number;
  sent: number;
  received: number;
  message?: string;
  error?: string;
  data?: string; // Base64 encoded file data for received files
}

export function FileTransfer({
  connected,
  onSendFile,
  onReceiveFile,
  transferProgress,
}: FileTransferProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [mode, setMode] = useState<'send' | 'receive'>('send');
  const [protocol, setProtocol] = useState<string>('xmodem-crc');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receiveFileName, setReceiveFileName] = useState('received_file.bin');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenDialog = (transferMode: 'send' | 'receive') => {
    setMode(transferMode);
    setShowDialog(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSend = () => {
    if (!selectedFile) return;
    onSendFile(selectedFile, protocol);
    setShowDialog(false);
  };

  const handleReceive = () => {
    onReceiveFile(receiveFileName, protocol);
    setShowDialog(false);
  };

  const downloadReceivedFile = () => {
    if (!transferProgress || transferProgress.action !== 'complete' || !transferProgress.data) {
      return;
    }

    try {
      // Decode base64 data
      const binaryString = atob(transferProgress.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create blob and download
      const blob = new Blob([bytes]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = transferProgress.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  };

  const getProgressPercent = () => {
    if (!transferProgress || transferProgress.fileSize === 0) return 0;
    const current = transferProgress.sent || transferProgress.received || 0;
    return Math.round((current / transferProgress.fileSize) * 100);
  };

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <button
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#3c3c3c] text-slate-300 border border-[#555] border-l-[3px] border-l-primary rounded transition-all text-xs hover:bg-[#464646] hover:border-[#666] disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => handleOpenDialog('send')}
          disabled={!connected}
          title="Send file using XMODEM/YMODEM"
        >
          <span className="material-symbols-outlined text-[16px]">upload</span>
          <span>Send File</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#3c3c3c] text-slate-300 border border-[#555] border-l-[3px] border-l-green-500 rounded transition-all text-xs hover:bg-[#464646] hover:border-[#666] disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => handleOpenDialog('receive')}
          disabled={!connected}
          title="Receive file using XMODEM/YMODEM"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          <span>Receive File</span>
        </button>
      </div>

      {transferProgress && transferProgress.action !== 'complete' && (
        <div className="mt-3 p-3 bg-[#252525] border border-[#3c3c3c] rounded">
          <div className="flex justify-between mb-2 text-xs">
            <span className="text-slate-200 font-semibold">{transferProgress.fileName}</span>
            <span className="text-primary font-bold">{getProgressPercent()}%</span>
          </div>
          <div className="h-2 bg-[#1e1e1e] rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-[#1177bb] transition-[width] duration-300"
              style={{ width: `${getProgressPercent()}%` }}
            />
          </div>
          {transferProgress.message && (
            <div className="mt-2 text-xs text-slate-400 italic">{transferProgress.message}</div>
          )}
          {transferProgress.error && (
            <div className="mt-2 text-xs text-red-300">Error: {transferProgress.error}</div>
          )}
        </div>
      )}

      {transferProgress &&
        transferProgress.action === 'complete' &&
        transferProgress.received > 0 && (
          <div className="mt-3 p-3 bg-[#252525] border border-green-500 rounded">
            <div className="text-green-500 text-xs mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>File received: {transferProgress.fileName} ({transferProgress.fileSize} bytes)</span>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white border border-primary rounded cursor-pointer text-xs transition-all hover:bg-[#1177bb]"
              onClick={downloadReceivedFile}
            >
              <span className="material-symbols-outlined text-[14px]">save</span>
              <span>Download File</span>
            </button>
          </div>
        )}

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
              {mode === 'send' ? 'Send File' : 'Receive File'}
            </h3>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Protocol:</label>
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  className="px-3 py-2 bg-[#1e1e1e] border border-[#555] rounded text-slate-200 text-sm font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="xmodem">XMODEM (Checksum)</option>
                  <option value="xmodem-crc">XMODEM-CRC (Recommended)</option>
                  <option value="xmodem1k">XMODEM-1K</option>
                  <option value="ymodem">YMODEM</option>
                </select>
              </div>

              {mode === 'send' ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">Select File:</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="px-3 py-2 bg-[#1e1e1e] border border-[#555] rounded text-slate-200 text-sm font-mono outline-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  {selectedFile && (
                    <div className="px-3 py-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded text-xs text-slate-400">
                      <div className="mb-1">File: {selectedFile.name}</div>
                      <div>Size: {selectedFile.size} bytes</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Save As:</label>
                  <input
                    type="text"
                    value={receiveFileName}
                    onChange={(e) => setReceiveFileName(e.target.value)}
                    placeholder="received_file.bin"
                    className="px-3 py-2 bg-[#1e1e1e] border border-[#555] rounded text-slate-200 text-sm font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              <div className="p-2.5 bg-[#1e1e1e] border-l-[3px] border-l-primary text-xs text-slate-400">
                <strong className="text-slate-200">Note:</strong> Make sure the remote device is ready to{' '}
                {mode === 'send' ? 'receive' : 'send'} the file using the selected protocol.
              </div>
            </div>

            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={mode === 'send' ? handleSend : handleReceive}
                disabled={mode === 'send' && !selectedFile}
                className="px-5 py-2 bg-primary border border-primary rounded cursor-pointer text-xs text-white transition-all hover:bg-[#1177bb] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {mode === 'send' ? 'Send' : 'Receive'}
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
    </div>
  );
}
