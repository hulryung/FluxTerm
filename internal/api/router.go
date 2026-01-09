package api

import (
	"github.com/gin-gonic/gin"
	"github.com/yourusername/goterm/internal/api/handler"
	"github.com/yourusername/goterm/internal/core/serial"
)

// SetupRouter sets up the API routes
func SetupRouter(serialManager *serial.Manager) *gin.Engine {
	router := gin.Default()

	// Handlers
	serialHandler := handler.NewSerialHandler(serialManager)
	wsHandler := handler.NewWebSocketHandler(serialManager)

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"app":    "goterm",
		})
	})

	// WebSocket endpoint
	router.GET("/ws", wsHandler.HandleWebSocket)

	// API v1 routes
	api := router.Group("/api/v1")
	{
		// Serial ports
		ports := api.Group("/ports")
		{
			ports.GET("", serialHandler.ListPorts)
			ports.GET("/open", serialHandler.ListOpenPorts)
			ports.POST("/open", serialHandler.OpenPort)
			ports.POST("/:name/close", serialHandler.ClosePort)
			ports.GET("/:name/status", serialHandler.GetPortStatus)
			ports.POST("/:name/dtr", serialHandler.SetDTR)
			ports.POST("/:name/rts", serialHandler.SetRTS)
		}
	}

	return router
}
