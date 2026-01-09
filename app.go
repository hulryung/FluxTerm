package main

import (
	"context"
	"fmt"
	"log"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	log.Println("FluxTerm application started")
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	log.Println("FluxTerm application shutting down")
}

// domReady is called after front-end resources have been loaded
func (a *App) domReady(ctx context.Context) {
	log.Println("DOM is ready")
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

// ShowDialog opens a dialog
func (a *App) ShowDialog(title, message string) {
	runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:    runtime.InfoDialog,
		Title:   title,
		Message: message,
	})
}

// GetVersion returns the application version
func (a *App) GetVersion() string {
	return "1.0.0"
}

// OpenExternal opens a URL in the default browser
func (a *App) OpenExternal(url string) {
	runtime.BrowserOpenURL(a.ctx, url)
}

// LogInfo logs an info message
func (a *App) LogInfo(message string) {
	log.Println(fmt.Sprintf("[INFO] %s", message))
}
