#!/bin/bash

# FluxTerm Desktop App Build Script
# This project is a DESKTOP APPLICATION built with Wails
# The standalone server mode is only for development purposes

set -e

BUILD_TYPE="${1:-desktop}"
PLATFORM=$(uname -s)

echo "🚀 FluxTerm Desktop App Build Script"
echo "====================================="
echo "Platform: $PLATFORM"
echo ""

# Check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found. Please install Node.js first."
        echo "   macOS: brew install node"
        echo "   Other: https://nodejs.org/"
        exit 1
    fi
    echo "   ✅ Node.js: $(node --version)"

    # Check npm
    if ! command -v npm &> /dev/null; then
        echo "❌ npm not found. Please install npm first."
        exit 1
    fi
    echo "   ✅ npm: $(npm --version)"

    # Check Go
    if ! command -v go &> /dev/null; then
        echo "❌ Go not found. Please install Go first."
        echo "   macOS: brew install go"
        echo "   Other: https://go.dev/"
        exit 1
    fi
    echo "   ✅ Go: $(go version)"

    # Check Wails (for desktop builds)
    if [ "$BUILD_TYPE" = "desktop" ] || [ "$BUILD_TYPE" = "all" ]; then
        if ! command -v wails &> /dev/null; then
            echo "❌ Wails not found. Please install Wails first."
            echo "   macOS: brew install wails"
            echo "   Other: https://wails.io/docs/gettingstarted/installation"
            exit 1
        fi
        echo "   ✅ Wails: $(wails version | head -1)"
    fi

    echo ""
}

build_frontend() {
    echo "📦 Building frontend..."
    cd web

    if [ ! -d "node_modules" ]; then
        echo "   Installing npm dependencies..."
        npm install
    fi

    echo "   Running npm build..."
    npm run build
    cd ..
    echo "✅ Frontend build complete"
    echo ""
}

build_desktop() {
    echo "🖥️  Building Wails Desktop Application..."
    echo ""
    echo "   This is the MAIN build for FluxTerm"
    echo "   The app will embed the frontend and run as a native desktop application"
    echo ""

    # Ensure frontend is built
    if [ ! -d "web/dist" ]; then
        echo "❌ Frontend not built. Building frontend first..."
        build_frontend
    fi

    echo "   Running wails build..."
    wails build

    echo ""
    echo "✅ Desktop app built successfully!"
    echo ""

    # Show platform-specific output
    case "$PLATFORM" in
        Darwin)
            echo "   📱 macOS app: ./build/bin/FluxTerm.app"
            echo ""
            echo "   To run:"
            echo "   $ open ./build/bin/FluxTerm.app"
            ;;
        Linux)
            echo "   🐧 Linux app: ./build/bin/fluxterm"
            echo ""
            echo "   To run:"
            echo "   $ ./build/bin/fluxterm"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            echo "   🪟 Windows app: ./build/bin/fluxterm.exe"
            echo ""
            echo "   To run:"
            echo "   $ ./build/bin/fluxterm.exe"
            ;;
    esac
    echo ""
}

build_dev_server() {
    echo "🔧 Building Development Server (Backend Only)..."
    echo ""
    echo "   ⚠️  This is NOT the main distribution format!"
    echo "   This server mode is only for backend development."
    echo "   Use 'wails dev' for full-stack development."
    echo ""

    # Ensure frontend is built
    if [ ! -d "web/dist" ]; then
        echo "❌ Frontend not built. Building frontend first..."
        build_frontend
    fi

    echo "   Running go build..."
    go mod download
    make build

    echo ""
    echo "✅ Development server built: ./fluxterm"
    echo ""
    echo "   To run:"
    echo "   $ ./fluxterm"
    echo "   $ HOST=0.0.0.0 PORT=8080 ./fluxterm"
    echo ""
    echo "   Web UI will be available at http://localhost:8080"
    echo ""
}

show_help() {
    echo "FluxTerm is a DESKTOP APPLICATION built with Wails"
    echo ""
    echo "Usage: $0 [desktop|dev-server|all]"
    echo ""
    echo "Build modes:"
    echo "  desktop     Build the desktop app (DEFAULT - this is the main product)"
    echo "  dev-server  Build standalone server for backend development only"
    echo "  all         Build both desktop and dev server"
    echo ""
    echo "Examples:"
    echo "  $0              # Build desktop app (recommended)"
    echo "  $0 desktop      # Same as above"
    echo "  $0 dev-server   # Build dev server for testing backend"
    echo ""
    echo "For development with hot reload, use:"
    echo "  wails dev"
    echo ""
}

check_prerequisites

case "$BUILD_TYPE" in
    desktop)
        build_frontend
        build_desktop
        ;;
    dev-server)
        build_frontend
        build_dev_server
        ;;
    all)
        build_frontend
        build_desktop
        build_dev_server
        ;;
    help|--help|-h)
        show_help
        exit 0
        ;;
    *)
        echo "❌ Invalid build type: $BUILD_TYPE"
        echo ""
        show_help
        exit 1
        ;;
esac

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Build complete!"
echo ""
echo "💡 Development tip:"
echo "   For development with hot reload, run: wails dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
