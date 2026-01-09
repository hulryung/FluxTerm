package main

import (
	"embed"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"time"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"github.com/yourusername/fluxterm/internal/api"
	"github.com/yourusername/fluxterm/internal/core/serial"
)

//go:embed web/dist
var assets embed.FS

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
	log.Println("=== Starting FluxTerm application ===")

	// Create serial manager
	serialManager := serial.NewManager()
	defer serialManager.CloseAll()

	// Start backend server in background
	addr := fmt.Sprintf("%s:%s", getEnv("HOST", defaultHost), getEnv("PORT", defaultPort))
	log.Printf("Starting backend server on %s", addr)
	go startBackendServer(serialManager, addr)

	// Wait for server to be ready
	log.Println("Waiting for backend server to start...")
	if !waitForServer(addr, 10*time.Second) {
		log.Fatalf("Backend server failed to start")
	}

	log.Printf("✓ Backend server started successfully on http://%s", addr)

	// Create application with options
	log.Println("Creating Wails application...")
	app := NewApp()

	log.Println("Configuring Wails options...")
	err = wails.Run(&options.App{
		Title:     "FluxTerm - Serial & SSH Terminal",
		Width:     1280,
		Height:    800,
		MinWidth:  1024,
		MinHeight: 600,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		OnDomReady:       app.domReady,
		OnShutdown:       app.shutdown,
		OnBeforeClose:    app.beforeClose,
		Bind: []interface{}{
			app,
		},
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			DisableWindowIcon:    false,
		},
	})

	if err != nil {
		log.Fatalf("Error running Wails app: %v", err)
	}

	log.Println("=== FluxTerm application terminated ===")
}

func startBackendServer(serialManager *serial.Manager, addr string) {
	router := api.SetupRouter(serialManager, nil)
	log.Printf("[Backend] Starting Gin server...")
	if err := router.Run(addr); err != nil {
		log.Fatalf("[Backend] Failed to start server: %v", err)
	}
}

func waitForServer(addr string, timeout time.Duration) bool {
	deadline := time.Now().Add(timeout)
	attempts := 0
	for time.Now().Before(deadline) {
		attempts++
		conn, err := net.DialTimeout("tcp", addr, 100*time.Millisecond)
		if err == nil {
			conn.Close()
			log.Printf("Server ready after %d attempts", attempts)
			return true
		}
		time.Sleep(100 * time.Millisecond)
	}
	log.Printf("Server failed to start after %d attempts", attempts)
	return false
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
