import { useState, useRef } from 'react';
import './FileTransfer.css';

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
    <div className="file-transfer">
      <div className="file-transfer-buttons">
        <button
          className="ft-btn send"
          onClick={() => handleOpenDialog('send')}
          disabled={!connected}
          title="Send file using XMODEM/YMODEM"
        >
          📤 Send File
        </button>
        <button
          className="ft-btn receive"
          onClick={() => handleOpenDialog('receive')}
          disabled={!connected}
          title="Receive file using XMODEM/YMODEM"
        >
          📥 Receive File
        </button>
      </div>

      {transferProgress && transferProgress.action !== 'complete' && (
        <div className="transfer-progress">
          <div className="progress-header">
            <span className="progress-file">{transferProgress.fileName}</span>
            <span className="progress-percent">{getProgressPercent()}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${getProgressPercent()}%` }}
            />
          </div>
          {transferProgress.message && (
            <div className="progress-message">{transferProgress.message}</div>
          )}
          {transferProgress.error && (
            <div className="progress-error">Error: {transferProgress.error}</div>
          )}
        </div>
      )}

      {transferProgress &&
        transferProgress.action === 'complete' &&
        transferProgress.received > 0 && (
          <div className="transfer-complete">
            <div className="complete-message">
              ✅ File received: {transferProgress.fileName} ({transferProgress.fileSize}{' '}
              bytes)
            </div>
            <button className="download-btn" onClick={downloadReceivedFile}>
              💾 Download File
            </button>
          </div>
        )}

      {showDialog && (
        <div className="ft-dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="ft-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{mode === 'send' ? 'Send File' : 'Receive File'}</h3>

            <div className="ft-form">
              <div className="form-field">
                <label>Protocol:</label>
                <select value={protocol} onChange={(e) => setProtocol(e.target.value)}>
                  <option value="xmodem">XMODEM (Checksum)</option>
                  <option value="xmodem-crc">XMODEM-CRC (Recommended)</option>
                  <option value="xmodem1k">XMODEM-1K</option>
                  <option value="ymodem">YMODEM</option>
                </select>
              </div>

              {mode === 'send' ? (
                <>
                  <div className="form-field">
                    <label>Select File:</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="file-input"
                    />
                  </div>
                  {selectedFile && (
                    <div className="file-info">
                      <div>File: {selectedFile.name}</div>
                      <div>Size: {selectedFile.size} bytes</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="form-field">
                  <label>Save As:</label>
                  <input
                    type="text"
                    value={receiveFileName}
                    onChange={(e) => setReceiveFileName(e.target.value)}
                    placeholder="received_file.bin"
                  />
                </div>
              )}

              <div className="protocol-info">
                <strong>Note:</strong> Make sure the remote device is ready to{' '}
                {mode === 'send' ? 'receive' : 'send'} the file using the selected protocol.
              </div>
            </div>

            <div className="ft-dialog-buttons">
              <button
                onClick={mode === 'send' ? handleSend : handleReceive}
                disabled={mode === 'send' && !selectedFile}
              >
                {mode === 'send' ? 'Send' : 'Receive'}
              </button>
              <button onClick={() => setShowDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
