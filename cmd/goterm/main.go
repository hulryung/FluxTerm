package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/yourusername/goterm/internal/api"
	"github.com/yourusername/goterm/internal/core/serial"
)

const (
	defaultHost = "127.0.0.1"
	defaultPort = "8080"
)

func main() {
	// Setup logger
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Starting GoTerm server...")

	// Create serial manager
	serialManager := serial.NewManager()
	defer serialManager.CloseAll()

	// Setup router
	router := api.SetupRouter(serialManager, nil)

	// Start server
	addr := fmt.Sprintf("%s:%s", getEnv("HOST", defaultHost), getEnv("PORT", defaultPort))
	log.Printf("Server listening on http://%s", addr)
	log.Printf("WebSocket endpoint: ws://%s/ws", addr)

	// Graceful shutdown
	go func() {
		if err := router.Run(addr); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
