package api

import (
	"embed"
	"io/fs"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/fluxterm/internal/api/handler"
	"github.com/yourusername/fluxterm/internal/core/serial"
	"github.com/yourusername/fluxterm/internal/core/ssh"
)

// SetupRouter sets up the API routes
func SetupRouter(serialManager *serial.Manager, webAssets *embed.FS) *gin.Engine {
	router := gin.Default()

	// Managers
	sshManager := ssh.NewManager()

	// Handlers
	serialHandler := handler.NewSerialHandler(serialManager)
	wsHandler := handler.NewWebSocketHandler(serialManager, sshManager)

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
			"app":    "fluxterm",
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

	// Serve static files (frontend)
	if webAssets != nil {
		distFS, err := fs.Sub(*webAssets, "dist")
		if err == nil {
			router.NoRoute(func(c *gin.Context) {
				// Try to serve file
				file, err := distFS.Open(c.Request.URL.Path[1:])
				if err == nil {
					file.Close()
					c.FileFromFS(c.Request.URL.Path, http.FS(distFS))
					return
				}

				// Fallback to index.html for SPA routing
				c.FileFromFS("index.html", http.FS(distFS))
			})
		}
	} else {
		// Development mode: serve from ./web/dist directory
		router.Static("/assets", "./web/dist/assets")
		router.NoRoute(func(c *gin.Context) {
			c.File("./web/dist/index.html")
		})
	}

	return router
}
