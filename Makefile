.PHONY: build run clean test tidy

# Build configuration
BINARY_NAME=goterm
MAIN_PATH=./cmd/goterm
BUILD_DIR=.

# Build the application
build:
	go build -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PATH)

# Build for multiple platforms
build-all:
	GOOS=windows GOARCH=amd64 go build -o $(BUILD_DIR)/$(BINARY_NAME)-windows-amd64.exe $(MAIN_PATH)
	GOOS=linux GOARCH=amd64 go build -o $(BUILD_DIR)/$(BINARY_NAME)-linux-amd64 $(MAIN_PATH)
	GOOS=darwin GOARCH=amd64 go build -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-amd64 $(MAIN_PATH)
	GOOS=darwin GOARCH=arm64 go build -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-arm64 $(MAIN_PATH)

# Run the application
run: build
	./$(BINARY_NAME)

# Clean build artifacts
clean:
	rm -f $(BUILD_DIR)/$(BINARY_NAME)*
	rm -f $(BUILD_DIR)/*.exe

# Run tests
test:
	go test -v ./...

# Tidy dependencies
tidy:
	go mod tidy

# Install dependencies
deps:
	go get -u github.com/gin-gonic/gin
	go get -u github.com/gorilla/websocket
	go get -u go.bug.st/serial
	go mod tidy

# Development server with auto-reload (requires air)
dev:
	air

# Format code
fmt:
	go fmt ./...

# Lint code (requires golangci-lint)
lint:
	golangci-lint run

# Show help
help:
	@echo "Available targets:"
	@echo "  build      - Build the application"
	@echo "  build-all  - Build for multiple platforms"
	@echo "  run        - Build and run the application"
	@echo "  clean      - Remove build artifacts"
	@echo "  test       - Run tests"
	@echo "  tidy       - Tidy Go modules"
	@echo "  deps       - Install dependencies"
	@echo "  dev        - Run with auto-reload (requires air)"
	@echo "  fmt        - Format code"
	@echo "  lint       - Lint code (requires golangci-lint)"
	@echo "  help       - Show this help message"
