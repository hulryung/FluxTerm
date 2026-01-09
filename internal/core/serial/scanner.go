package serial

import (
	"strings"

	"go.bug.st/serial/enumerator"
)

// Scanner provides functionality to scan for available serial ports
type Scanner struct{}

// NewScanner creates a new port scanner
func NewScanner() *Scanner {
	return &Scanner{}
}

// ListPorts returns a list of available serial ports
func (s *Scanner) ListPorts() ([]PortInfo, error) {
	ports, err := enumerator.GetDetailedPortsList()
	if err != nil {
		return nil, err
	}

	result := make([]PortInfo, 0, len(ports))
	for _, port := range ports {
		info := PortInfo{
			Name:        port.Name,
			Description: getDescription(port),
			IsUSB:       port.IsUSB,
		}

		if port.IsUSB {
			info.VID = port.VID
			info.PID = port.PID
			info.SerialNumber = port.SerialNumber
		}

		result = append(result, info)
	}

	return result, nil
}

// GetPortByName finds a specific port by name
func (s *Scanner) GetPortByName(name string) (*PortInfo, error) {
	ports, err := s.ListPorts()
	if err != nil {
		return nil, err
	}

	for _, port := range ports {
		if port.Name == name {
			return &port, nil
		}
	}

	return nil, nil
}

// IsPortAvailable checks if a port is available
func (s *Scanner) IsPortAvailable(name string) (bool, error) {
	ports, err := s.ListPorts()
	if err != nil {
		return false, err
	}

	for _, port := range ports {
		if port.Name == name {
			return true, nil
		}
	}

	return false, nil
}

// getDescription returns a human-readable description of the port
func getDescription(port *enumerator.PortDetails) string {
	if port.Product != "" {
		return port.Product
	}

	// Build description from available fields
	parts := make([]string, 0, 2)

	if port.IsUSB {
		parts = append(parts, "USB Serial")
		if port.VID != "" && port.PID != "" {
			parts = append(parts, "VID:"+port.VID+" PID:"+port.PID)
		}
	}

	if len(parts) == 0 {
		return "Serial Port"
	}

	return strings.Join(parts, " - ")
}
