package handler

import (
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/yourusername/goterm/internal/core/serial"
	"github.com/yourusername/goterm/pkg/protocol/ws"
	"github.com/yourusername/goterm/pkg/protocol/xmodem"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // TODO: implement proper origin checking
	},
}

// WebSocketHandler handles WebSocket connections
type WebSocketHandler struct {
	serialManager *serial.Manager
	sessions      map[string]*Session
	mu            sync.RWMutex
}

// Session represents a WebSocket session
type Session struct {
	ID     string
	conn   *websocket.Conn
	port   *serial.Port
	send   chan []byte
	stop   chan struct{}
	mu     sync.Mutex
}

// NewWebSocketHandler creates a new WebSocket handler
func NewWebSocketHandler(serialManager *serial.Manager) *WebSocketHandler {
	return &WebSocketHandler{
		serialManager: serialManager,
		sessions:      make(map[string]*Session),
	}
}

// HandleWebSocket handles WebSocket upgrade and communication
func (h *WebSocketHandler) HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	sessionID := generateSessionID()
	session := &Session{
		ID:   sessionID,
		conn: conn,
		send: make(chan []byte, 256),
		stop: make(chan struct{}),
	}

	h.mu.Lock()
	h.sessions[sessionID] = session
	h.mu.Unlock()

	// Send welcome message
	h.sendStatus(session, "ready", "WebSocket connection established")

	// Start read/write goroutines
	go h.readPump(session)
	go h.writePump(session)
}

// readPump reads messages from the WebSocket connection
func (h *WebSocketHandler) readPump(session *Session) {
	defer func() {
		h.closeSession(session)
	}()

	session.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	session.conn.SetPongHandler(func(string) error {
		session.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		select {
		case <-session.stop:
			return
		default:
		}

		_, message, err := session.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			return
		}

		h.handleMessage(session, message)
	}
}

// writePump writes messages to the WebSocket connection
func (h *WebSocketHandler) writePump(session *Session) {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		session.conn.Close()
	}()

	for {
		select {
		case message, ok := <-session.send:
			session.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				session.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := session.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			session.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := session.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}

		case <-session.stop:
			return
		}
	}
}

// handleMessage processes incoming WebSocket messages
func (h *WebSocketHandler) handleMessage(session *Session, data []byte) {
	var msg ws.Message
	if err := json.Unmarshal(data, &msg); err != nil {
		h.sendError(session, "INVALID_MESSAGE", "Failed to parse message")
		return
	}

	switch msg.Type {
	case ws.MsgTypeControl:
		h.handleControl(session, msg.Payload)
	case ws.MsgTypeData:
		h.handleData(session, msg.Payload)
	default:
		h.sendError(session, "UNKNOWN_TYPE", "Unknown message type")
	}
}

// handleControl processes control messages
func (h *WebSocketHandler) handleControl(session *Session, payload json.RawMessage) {
	var ctrl ws.ControlPayload
	if err := json.Unmarshal(payload, &ctrl); err != nil {
		h.sendError(session, "INVALID_CONTROL", "Invalid control payload")
		return
	}

	switch ctrl.Action {
	case "connect":
		h.handleConnect(session, ctrl.Params)
	case "disconnect":
		h.handleDisconnect(session)
	case "send_file":
		h.handleSendFile(session, ctrl.Params)
	case "receive_file":
		h.handleReceiveFile(session, ctrl.Params)
	default:
		h.sendError(session, "UNKNOWN_ACTION", "Unknown control action")
	}
}

// handleConnect handles port connection
func (h *WebSocketHandler) handleConnect(session *Session, params map[string]interface{}) {
	// Parse port configuration from params
	config := serial.DefaultSerialConfig()

	if port, ok := params["port"].(string); ok {
		config.Port = port
	}
	if baudRate, ok := params["baud_rate"].(float64); ok {
		config.BaudRate = int(baudRate)
	}
	if dataBits, ok := params["data_bits"].(float64); ok {
		config.DataBits = int(dataBits)
	}

	// Open port
	port, err := h.serialManager.Open(config)
	if err != nil {
		h.sendError(session, "OPEN_FAILED", err.Error())
		return
	}

	session.mu.Lock()
	session.port = port
	session.mu.Unlock()

	h.sendStatus(session, "connected", "Port opened successfully")

	// Start reading from port
	go h.readFromPort(session)
}

// handleDisconnect handles port disconnection
func (h *WebSocketHandler) handleDisconnect(session *Session) {
	session.mu.Lock()
	defer session.mu.Unlock()

	if session.port != nil {
		portName := session.port.GetConfig().Port
		h.serialManager.Close(portName)
		session.port = nil
	}

	h.sendStatus(session, "disconnected", "Port closed")
}

// handleData handles data transmission
func (h *WebSocketHandler) handleData(session *Session, payload json.RawMessage) {
	var data ws.DataPayload
	if err := json.Unmarshal(payload, &data); err != nil {
		h.sendError(session, "INVALID_DATA", "Invalid data payload")
		return
	}

	session.mu.Lock()
	port := session.port
	session.mu.Unlock()

	if port == nil {
		h.sendError(session, "NOT_CONNECTED", "No port connected")
		return
	}

	// Decode data
	decoded, err := base64.StdEncoding.DecodeString(data.Data)
	if err != nil {
		h.sendError(session, "DECODE_ERROR", "Failed to decode data")
		return
	}

	// Write to port
	if _, err := port.Write(decoded); err != nil {
		h.sendError(session, "WRITE_ERROR", err.Error())
		return
	}
}

// readFromPort reads data from the serial port and sends to WebSocket
func (h *WebSocketHandler) readFromPort(session *Session) {
	buf := make([]byte, 1024)

	for {
		select {
		case <-session.stop:
			return
		default:
		}

		session.mu.Lock()
		port := session.port
		session.mu.Unlock()

		if port == nil {
			return
		}

		n, err := port.Read(buf)
		if err != nil {
			continue // Timeout or error, continue
		}

		if n > 0 {
			// Send data to WebSocket
			encoded := base64.StdEncoding.EncodeToString(buf[:n])
			dataPayload := ws.DataPayload{
				Data:     encoded,
				Encoding: "base64",
			}

			payloadJSON, _ := json.Marshal(dataPayload)
			msg := ws.Message{
				Type:      ws.MsgTypeData,
				SessionID: session.ID,
				Payload:   payloadJSON,
				Timestamp: time.Now().UnixMilli(),
			}

			msgJSON, _ := json.Marshal(msg)
			select {
			case session.send <- msgJSON:
			case <-session.stop:
				return
			}
		}
	}
}

// sendStatus sends a status message
func (h *WebSocketHandler) sendStatus(session *Session, state, message string) {
	payload := ws.StatusPayload{
		State:   state,
		Message: message,
	}
	payloadJSON, _ := json.Marshal(payload)

	msg := ws.Message{
		Type:      ws.MsgTypeStatus,
		SessionID: session.ID,
		Payload:   payloadJSON,
		Timestamp: time.Now().UnixMilli(),
	}

	msgJSON, _ := json.Marshal(msg)
	select {
	case session.send <- msgJSON:
	default:
	}
}

// sendError sends an error message
func (h *WebSocketHandler) sendError(session *Session, code, message string) {
	payload := ws.ErrorPayload{
		Code:    code,
		Message: message,
	}
	payloadJSON, _ := json.Marshal(payload)

	msg := ws.Message{
		Type:      ws.MsgTypeError,
		SessionID: session.ID,
		Payload:   payloadJSON,
		Timestamp: time.Now().UnixMilli(),
	}

	msgJSON, _ := json.Marshal(msg)
	select {
	case session.send <- msgJSON:
	default:
	}
}

// closeSession closes a session and cleans up
func (h *WebSocketHandler) closeSession(session *Session) {
	close(session.stop)

	session.mu.Lock()
	if session.port != nil {
		portName := session.port.GetConfig().Port
		h.serialManager.Close(portName)
	}
	session.mu.Unlock()

	h.mu.Lock()
	delete(h.sessions, session.ID)
	h.mu.Unlock()

	close(session.send)
}

// generateSessionID generates a unique session ID
func generateSessionID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
	}
	return string(b)
}

// handleSendFile handles sending a file using XMODEM protocol
func (h *WebSocketHandler) handleSendFile(session *Session, params map[string]interface{}) {
	session.mu.Lock()
	port := session.port
	session.mu.Unlock()

	if port == nil {
		h.sendError(session, "NOT_CONNECTED", "No port connected")
		return
	}

	// Get file data (base64 encoded)
	fileDataStr, ok := params["data"].(string)
	if !ok {
		h.sendError(session, "INVALID_PARAMS", "Missing or invalid 'data' parameter")
		return
	}

	fileName, _ := params["file_name"].(string)
	if fileName == "" {
		fileName = "file.bin"
	}

	// Decode file data
	fileData, err := base64.StdEncoding.DecodeString(fileDataStr)
	if err != nil {
		h.sendError(session, "DECODE_ERROR", "Failed to decode file data")
		return
	}

	// Determine protocol (XMODEM-CRC, XMODEM-1K/YMODEM)
	useCRC := true
	use1K := false
	if protocol, ok := params["protocol"].(string); ok {
		if protocol == "ymodem" || protocol == "xmodem1k" {
			use1K = true
		}
	}

	// Send file transfer start notification
	h.sendFileTransfer(session, "start", fileName, int64(len(fileData)), 0, 0, "Starting file transfer...", "")

	// Create XMODEM sender
	sender := xmodem.NewSender(port, useCRC, use1K)
	sender.SetProgressCallback(func(sent, total int64) {
		h.sendFileTransfer(session, "progress", fileName, total, sent, 0, "", "")
	})

	// Send file in a goroutine
	go func() {
		if err := sender.Send(fileData); err != nil {
			h.sendFileTransfer(session, "error", fileName, int64(len(fileData)), 0, 0, "", err.Error())
		} else {
			h.sendFileTransfer(session, "complete", fileName, int64(len(fileData)), int64(len(fileData)), 0, "File transfer completed successfully", "")
		}
	}()
}

// handleReceiveFile handles receiving a file using XMODEM protocol
func (h *WebSocketHandler) handleReceiveFile(session *Session, params map[string]interface{}) {
	session.mu.Lock()
	port := session.port
	session.mu.Unlock()

	if port == nil {
		h.sendError(session, "NOT_CONNECTED", "No port connected")
		return
	}

	fileName, _ := params["file_name"].(string)
	if fileName == "" {
		fileName = "received_file.bin"
	}

	useCRC := true
	if protocol, ok := params["protocol"].(string); ok {
		if protocol == "xmodem" {
			useCRC = false
		}
	}

	// Send file transfer start notification
	h.sendFileTransfer(session, "start", fileName, 0, 0, 0, "Starting file receive...", "")

	// Create XMODEM receiver
	receiver := xmodem.NewReceiver(port, useCRC)
	receiver.SetProgressCallback(func(received, total int64) {
		h.sendFileTransfer(session, "progress", fileName, total, 0, received, "", "")
	})

	// Receive file in a goroutine
	go func() {
		data, err := receiver.Receive()
		if err != nil {
			h.sendFileTransfer(session, "error", fileName, 0, 0, 0, "", err.Error())
		} else {
			// Send received file data (base64 encoded)
			encoded := base64.StdEncoding.EncodeToString(data)
			payload := ws.FileTransferPayload{
				Action:   "complete",
				FileName: fileName,
				FileSize: int64(len(data)),
				Received: int64(len(data)),
				Message:  encoded, // Using Message field for file data
			}
			payloadJSON, _ := json.Marshal(payload)

			msg := ws.Message{
				Type:      ws.MsgTypeFileTransfer,
				SessionID: session.ID,
				Payload:   payloadJSON,
				Timestamp: time.Now().UnixMilli(),
			}

			msgJSON, _ := json.Marshal(msg)
			select {
			case session.send <- msgJSON:
			default:
			}
		}
	}()
}

// sendFileTransfer sends a file transfer progress/status message
func (h *WebSocketHandler) sendFileTransfer(session *Session, action, fileName string, fileSize, sent, received int64, message, errorMsg string) {
	payload := ws.FileTransferPayload{
		Action:   action,
		FileName: fileName,
		FileSize: fileSize,
		Sent:     sent,
		Received: received,
		Message:  message,
		Error:    errorMsg,
	}
	payloadJSON, _ := json.Marshal(payload)

	msg := ws.Message{
		Type:      ws.MsgTypeFileTransfer,
		SessionID: session.ID,
		Payload:   payloadJSON,
		Timestamp: time.Now().UnixMilli(),
	}

	msgJSON, _ := json.Marshal(msg)
	select {
	case session.send <- msgJSON:
	default:
	}
}
