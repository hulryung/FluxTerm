package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/fluxterm/internal/core/serial"
)

// SerialHandler handles serial port related requests
type SerialHandler struct {
	manager *serial.Manager
}

// NewSerialHandler creates a new serial handler
func NewSerialHandler(manager *serial.Manager) *SerialHandler {
	return &SerialHandler{
		manager: manager,
	}
}

// ListPorts handles GET /api/v1/ports
func (h *SerialHandler) ListPorts(c *gin.Context) {
	ports, err := h.manager.ListPorts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ports": ports,
	})
}

// OpenPort handles POST /api/v1/ports/:name/open
func (h *SerialHandler) OpenPort(c *gin.Context) {
	var config serial.SerialConfig
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid configuration",
		})
		return
	}

	port, err := h.manager.Open(config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "port opened successfully",
		"config":  port.GetConfig(),
	})
}

// ClosePort handles POST /api/v1/ports/:name/close
func (h *SerialHandler) ClosePort(c *gin.Context) {
	portName := c.Param("name")

	if err := h.manager.Close(portName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "port closed successfully",
	})
}

// GetPortStatus handles GET /api/v1/ports/:name/status
func (h *SerialHandler) GetPortStatus(c *gin.Context) {
	portName := c.Param("name")

	port, exists := h.manager.Get(portName)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "port not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"name":   portName,
		"open":   !port.IsClosed(),
		"config": port.GetConfig(),
	})
}

// ListOpenPorts handles GET /api/v1/ports/open
func (h *SerialHandler) ListOpenPorts(c *gin.Context) {
	openPorts := h.manager.ListOpenPorts()

	c.JSON(http.StatusOK, gin.H{
		"ports": openPorts,
	})
}

// SetDTR handles POST /api/v1/ports/:name/dtr
func (h *SerialHandler) SetDTR(c *gin.Context) {
	portName := c.Param("name")

	var req struct {
		Value bool `json:"value"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request",
		})
		return
	}

	port, exists := h.manager.Get(portName)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "port not found",
		})
		return
	}

	if err := port.SetDTR(req.Value); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "DTR set successfully",
	})
}

// SetRTS handles POST /api/v1/ports/:name/rts
func (h *SerialHandler) SetRTS(c *gin.Context) {
	portName := c.Param("name")

	var req struct {
		Value bool `json:"value"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request",
		})
		return
	}

	port, exists := h.manager.Get(portName)
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "port not found",
		})
		return
	}

	if err := port.SetRTS(req.Value); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "RTS set successfully",
	})
}
