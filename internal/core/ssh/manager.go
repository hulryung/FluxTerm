package ssh

import (
	"fmt"
	"sync"
)

// Manager manages SSH connections
type Manager struct {
	clients map[string]*Client
	mu      sync.RWMutex
}

// NewManager creates a new SSH manager
func NewManager() *Manager {
	return &Manager{
		clients: make(map[string]*Client),
	}
}

// Connect creates and connects an SSH client
func (m *Manager) Connect(id string, config SSHConfig) (*Client, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Check if client already exists and close it first
	if existingClient, exists := m.clients[id]; exists {
		fmt.Printf("[SSH Manager] Client with ID %s already exists, closing existing connection\n", id)
		existingClient.Close()
		delete(m.clients, id)
	}

	// Create new client
	client := NewClient(config)

	// Connect
	if err := client.Connect(); err != nil {
		return nil, err
	}

	// Store client
	m.clients[id] = client

	return client, nil
}

// Get retrieves an SSH client by ID
func (m *Manager) Get(id string) (*Client, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	client, exists := m.clients[id]
	return client, exists
}

// Close closes and removes an SSH client
func (m *Manager) Close(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	client, exists := m.clients[id]
	if !exists {
		return fmt.Errorf("client with ID %s not found", id)
	}

	// Close client
	if err := client.Close(); err != nil {
		return err
	}

	// Remove from map
	delete(m.clients, id)

	return nil
}

// List returns all client IDs
func (m *Manager) List() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	ids := make([]string, 0, len(m.clients))
	for id := range m.clients {
		ids = append(ids, id)
	}

	return ids
}

// CloseAll closes all SSH clients
func (m *Manager) CloseAll() {
	m.mu.Lock()
	defer m.mu.Unlock()

	for id, client := range m.clients {
		client.Close()
		delete(m.clients, id)
	}
}
