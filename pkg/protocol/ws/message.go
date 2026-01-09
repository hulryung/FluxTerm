package ws

import "encoding/json"

// MessageType defines the type of WebSocket message
type MessageType string

const (
	MsgTypeData         MessageType = "data"
	MsgTypeControl      MessageType = "control"
	MsgTypeStatus       MessageType = "status"
	MsgTypeError        MessageType = "error"
	MsgTypeFileTransfer MessageType = "file_transfer"
)

// Message represents a WebSocket message
type Message struct {
	Type      MessageType     `json:"type"`
	SessionID string          `json:"session_id,omitempty"`
	Payload   json.RawMessage `json:"payload"`
	Timestamp int64           `json:"timestamp"`
}

// DataPayload represents data being sent/received
type DataPayload struct {
	Data     string `json:"data"`     // Base64 encoded
	Encoding string `json:"encoding"` // "raw" | "base64"
}

// ControlPayload represents a control command
type ControlPayload struct {
	Action string                 `json:"action"` // "connect" | "disconnect" | "resize"
	Params map[string]interface{} `json:"params,omitempty"`
}

// StatusPayload represents status information
type StatusPayload struct {
	State   string `json:"state"`
	Message string `json:"message,omitempty"`
}

// ErrorPayload represents an error
type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// FileTransferPayload represents file transfer progress/status
type FileTransferPayload struct {
	Action   string `json:"action"`   // "start" | "progress" | "complete" | "error"
	FileName string `json:"file_name,omitempty"`
	FileSize int64  `json:"file_size,omitempty"`
	Sent     int64  `json:"sent,omitempty"`
	Received int64  `json:"received,omitempty"`
	Message  string `json:"message,omitempty"`
	Error    string `json:"error,omitempty"`
}
