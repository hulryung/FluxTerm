package main

import (
	"embed"
	"fmt"
	"io"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/yourusername/fluxterm/internal/api"
	"github.com/yourusername/fluxterm/internal/core/serial"
)

//go:embed ../../web/dist
var webAssets embed.FS

const (
	defaultHost = "127.0.0.1"
	defaultPort = "8080"
	logFileName = "fluxterm.log"
)

func main() {
	// Setup logger with file output
	logFile, err := os.OpenFile(logFileName, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("Failed to open log file: %v", err)
	}
	defer logFile.Close()

	// Write logs to both file and stdout
	multiWriter := io.MultiWriter(os.Stdout, logFile)
	log.SetOutput(multiWriter)
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Starting FluxTerm server...")

	// Create serial manager
	serialManager := serial.NewManager()
	defer serialManager.CloseAll()

	// Setup router with embedded web assets
	router := api.SetupRouter(serialManager, &webAssets)

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
