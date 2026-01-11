# FluxTerm

A modern **desktop** serial/SSH terminal client - an alternative to SecureCRT and TeraTerm.

> Built with Wails (Go + React) for native desktop experience on macOS, Linux, and Windows.

## Features

### ✅ Implemented
- 🔌 Serial port connection and management
- 🌐 SSH client (password & key authentication)
- 💻 xterm.js-based terminal UI
- 📡 Real-time WebSocket communication
- 🗂️ Multi-tab session management
- 📁 File transfer (XMODEM protocol)
- 💾 Profile and macro management
- 🖥️ Cross-platform native desktop app (macOS, Linux, Windows)

## Quick Start

### Prerequisites
- Node.js 18+
- Go 1.25+
- Wails 2.11+

### Installation (macOS)
```bash
# Install dependencies
brew install node go wails

# Build desktop app
./build.sh
```

### Installation (Linux/Windows)
```bash
# Install dependencies
# - Node.js from https://nodejs.org/
# - Go from https://go.dev/
# - Wails from https://wails.io/

# Build desktop app
./build.sh
```

### Running

**Desktop App (Production):**
```bash
# Build first
./build.sh

# Run the app
# macOS
open ./build/bin/FluxTerm.app

# Linux
./build/bin/fluxterm

# Windows
./build/bin/fluxterm.exe
```

**Development Mode (Recommended):**
```bash
# Hot reload - changes to frontend/backend automatically reload
wails dev
```

## Usage

1. **Launch FluxTerm**
2. **Create a new session** (Ctrl+T)
3. **Choose connection type:**
   - Serial: Select port, configure baud rate, etc.
   - SSH: Enter host, username, authentication method
4. **Start using the terminal!**

### Keyboard Shortcuts
- `Ctrl+T` - New session tab
- `Ctrl+W` - Close current tab
- `Ctrl+Tab` - Switch between tabs
- `Ctrl+F` - Search in terminal

## Project Structure

```
FluxTerm/
├── cmd/
│   └── server/          # Standalone web server entry point
├── main.go              # Wails desktop app entry point
├── app.go               # Wails app lifecycle handlers
├── build.sh             # Unified build script
├── internal/
│   ├── api/             # REST API & WebSocket handlers
│   │   ├── router.go
│   │   └── handler/
│   └── core/
│       ├── serial/      # Serial port management
│       └── ssh/         # SSH client implementation
├── pkg/
│   └── protocol/
│       ├── ws/          # WebSocket message protocol
│       └── xmodem/      # File transfer protocol
└── web/                 # React + TypeScript + Vite
    ├── src/
    │   ├── components/  # UI components
    │   ├── hooks/       # React hooks
    │   ├── services/    # API & WebSocket clients
    │   └── types/       # TypeScript type definitions
    └── dist/            # Build output
```

## Development Guide

For detailed development instructions, see [CLAUDE.md](CLAUDE.md).

For debugging and troubleshooting, see [DEBUGGING.md](DEBUGGING.md).

### Development Mode

**Recommended (Hot Reload):**
```bash
# Full app with hot reload
wails dev

# Open DevTools: Cmd+Option+I
```

**Alternative (Separate Frontend/Backend):**
```bash
# Terminal 1: Frontend dev server (http://localhost:5173)
cd web && npm run dev

# Terminal 2: Backend server
make build && ./fluxterm
```

### Code Formatting
```bash
# Go
make fmt

# TypeScript/React
cd web && npm run lint
```

### Testing
```bash
# Go tests
make test

# Or specific package
go test -v ./internal/core/serial
```

## Build Options

### Production Build
```bash
# Quick build (recommended)
./build.sh

# Manual steps
cd web && npm run build && cd ..
wails build

# Output locations:
# macOS: ./build/bin/FluxTerm.app
# Linux: ./build/bin/fluxterm
# Windows: ./build/bin/fluxterm.exe
```

### Cross-Platform Builds
```bash
# Build for specific platform
wails build -platform darwin/universal  # macOS (Intel + Apple Silicon)
wails build -platform windows/amd64     # Windows
wails build -platform linux/amd64       # Linux

# All builds will be in ./build/bin/
```

### Development Server (Backend Only)
For backend development without running the full desktop app:
```bash
# Build and run standalone server
cd web && npm run build && cd ..
make build
./fluxterm

# The web UI will be available at http://localhost:8080
```

## Technology Stack

**Backend:**
- Go 1.25+
- Gin (HTTP router)
- Gorilla WebSocket
- go.bug.st/serial (serial port)
- golang.org/x/crypto/ssh (SSH client)

**Frontend:**
- React 19
- TypeScript 5.9
- Vite 7
- xterm.js (terminal emulator)
- Zustand (state management)
- Lucide React (icons)

**Desktop:**
- Wails v2.11 (Go + Web UI framework)

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2026 HUCONN Corporation

## Contributing

Issues and pull requests are always welcome!

## Support

For questions and support, please open an issue on GitHub.
