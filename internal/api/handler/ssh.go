package handler

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/fluxterm/internal/core/ssh"
)

type SSHHandler struct {
	manager *ssh.Manager
}

func NewSSHHandler(manager *ssh.Manager) *SSHHandler {
	return &SSHHandler{
		manager: manager,
	}
}

type SSHConnectRequest struct {
	Host                 string `json:"host" binding:"required"`
	Port                 int    `json:"port"`
	Username             string `json:"username" binding:"required"`
	AuthMethod           string `json:"auth_method"`
	Password             string `json:"password"`
	PrivateKey           string `json:"private_key"`
	PrivateKeyPath       string `json:"private_key_path"`
	PrivateKeyPassphrase string `json:"private_key_passphrase"`
}

type SSHSessionResponse struct {
	Success   bool   `json:"success"`
	Message   string `json:"message"`
	SessionID string `json:"session_id,omitempty"`
	Connected bool   `json:"connected"`
}

// Connect creates a persistent SSH session
func (h *SSHHandler) Connect(c *gin.Context) {
	var req SSHConnectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, SSHSessionResponse{
			Success: false,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}

	// Set defaults
	if req.Port == 0 {
		req.Port = 22
	}
	if req.AuthMethod == "" {
		req.AuthMethod = "password"
	}

	// Create SSH config
	config := ssh.SSHConfig{
		Host:                 req.Host,
		Port:                 req.Port,
		Username:             req.Username,
		AuthMethod:           ssh.AuthMethod(req.AuthMethod),
		Password:             req.Password,
		PrivateKey:           req.PrivateKey,
		PrivateKeyPath:       req.PrivateKeyPath,
		PrivateKeyPassphrase: req.PrivateKeyPassphrase,
		TerminalType:         "xterm-256color",
		Cols:                 80,
		Rows:                 24,
		ConnectTimeout:       10,
	}

	// Create session ID
	sessionID := generateSessionID()

	// Try to connect
	_, err := h.manager.Connect(sessionID, config)
	if err != nil {
		log.Printf("SSH connection failed: %v", err)
		c.JSON(http.StatusOK, SSHSessionResponse{
			Success: false,
			Message: "Connection failed: " + err.Error(),
		})
		return
	}

	log.Printf("SSH session created: %s@%s:%d (ID: %s)", config.Username, config.Host, config.Port, sessionID)

	c.JSON(http.StatusOK, SSHSessionResponse{
		Success:   true,
		Message:   "SSH session created",
		SessionID: sessionID,
		Connected: true,
	})
}

// Disconnect closes an SSH session
func (h *SSHHandler) Disconnect(c *gin.Context) {
	sessionID := c.Param("session_id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, SSHSessionResponse{
			Success: false,
			Message: "Session ID required",
		})
		return
	}

	err := h.manager.Close(sessionID)
	if err != nil {
		c.JSON(http.StatusOK, SSHSessionResponse{
			Success: false,
			Message: "Failed to close session: " + err.Error(),
		})
		return
	}

	log.Printf("SSH session closed: %s", sessionID)

	c.JSON(http.StatusOK, SSHSessionResponse{
		Success: true,
		Message: "SSH session closed",
	})
}

// Status checks if an SSH session is active
func (h *SSHHandler) Status(c *gin.Context) {
	sessionID := c.Param("session_id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, SSHSessionResponse{
			Success: false,
			Message: "Session ID required",
		})
		return
	}

	_, exists := h.manager.Get(sessionID)

	c.JSON(http.StatusOK, SSHSessionResponse{
		Success:   true,
		Message:   "Session status retrieved",
		SessionID: sessionID,
		Connected: exists,
	})
}
