package serial

import (
	"fmt"
	"sync"
)

// Manager manages multiple serial ports
type Manager struct {
	scanner *Scanner
	ports   map[string]*Port
	mu      sync.RWMutex
}

// NewManager creates a new serial port manager
func NewManager() *Manager {
	return &Manager{
		scanner: NewScanner(),
		ports:   make(map[string]*Port),
	}
}

// ListPorts returns a list of available serial ports
func (m *Manager) ListPorts() ([]PortInfo, error) {
	return m.scanner.ListPorts()
}

// Open opens a serial port with the given configuration
func (m *Manager) Open(config SerialConfig) (*Port, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Check if port is already open and close it first
	if existingPort, exists := m.ports[config.Port]; exists {
		fmt.Printf("[Serial Manager] Port %s is already open, closing existing connection\n", config.Port)
		existingPort.Close()
		delete(m.ports, config.Port)
	}

	// Open the port
	port, err := OpenPort(config)
	if err != nil {
		return nil, err
	}

	// Store the port
	m.ports[config.Port] = port
	return port, nil
}

// Close closes a serial port
func (m *Manager) Close(portName string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	port, exists := m.ports[portName]
	if !exists {
		return fmt.Errorf("port %s is not open", portName)
	}

	if err := port.Close(); err != nil {
		return err
	}

	delete(m.ports, portName)
	return nil
}

// Get retrieves an open port by name
func (m *Manager) Get(portName string) (*Port, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	port, exists := m.ports[portName]
	return port, exists
}

// CloseAll closes all open ports
func (m *Manager) CloseAll() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	var errs []error
	for name, port := range m.ports {
		if err := port.Close(); err != nil {
			errs = append(errs, fmt.Errorf("failed to close %s: %w", name, err))
		}
	}

	m.ports = make(map[string]*Port)

	if len(errs) > 0 {
		return fmt.Errorf("errors closing ports: %v", errs)
	}

	return nil
}

// ListOpenPorts returns a list of currently open ports
func (m *Manager) ListOpenPorts() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	names := make([]string, 0, len(m.ports))
	for name := range m.ports {
		names = append(names, name)
	}

	return names
}
