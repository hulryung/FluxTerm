package serial

import (
	"fmt"
	"io"
	"sync"

	"go.bug.st/serial"
)

// Port wraps a serial port with additional functionality
type Port struct {
	port   serial.Port
	config SerialConfig
	mu     sync.RWMutex
	closed bool
}

// OpenPort opens a serial port with the given configuration
func OpenPort(config SerialConfig) (*Port, error) {
	mode := &serial.Mode{
		BaudRate: config.BaudRate,
		DataBits: config.DataBits,
		Parity:   convertParity(config.Parity),
		StopBits: convertStopBits(config.StopBits),
	}

	port, err := serial.Open(config.Port, mode)
	if err != nil {
		return nil, fmt.Errorf("failed to open port %s: %w", config.Port, err)
	}

	// Set read timeout
	if err := port.SetReadTimeout(config.ReadTimeout); err != nil {
		port.Close()
		return nil, fmt.Errorf("failed to set read timeout: %w", err)
	}

	return &Port{
		port:   port,
		config: config,
	}, nil
}

// Read reads data from the port
func (p *Port) Read(buf []byte) (int, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed {
		return 0, io.EOF
	}

	return p.port.Read(buf)
}

// Write writes data to the port
func (p *Port) Write(data []byte) (int, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed {
		return 0, io.EOF
	}

	return p.port.Write(data)
}

// Close closes the port
func (p *Port) Close() error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.closed {
		return nil
	}

	p.closed = true
	return p.port.Close()
}

// SetDTR sets the DTR (Data Terminal Ready) signal
func (p *Port) SetDTR(value bool) error {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed {
		return fmt.Errorf("port is closed")
	}

	return p.port.SetDTR(value)
}

// SetRTS sets the RTS (Request To Send) signal
func (p *Port) SetRTS(value bool) error {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.closed {
		return fmt.Errorf("port is closed")
	}

	return p.port.SetRTS(value)
}

// GetConfig returns the current configuration
func (p *Port) GetConfig() SerialConfig {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.config
}

// IsClosed returns whether the port is closed
func (p *Port) IsClosed() bool {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.closed
}

// convertParity converts our Parity type to serial.Parity
func convertParity(p Parity) serial.Parity {
	switch p {
	case ParityNone:
		return serial.NoParity
	case ParityOdd:
		return serial.OddParity
	case ParityEven:
		return serial.EvenParity
	case ParityMark:
		return serial.MarkParity
	case ParitySpace:
		return serial.SpaceParity
	default:
		return serial.NoParity
	}
}

// convertStopBits converts our StopBits type to serial.StopBits
func convertStopBits(s StopBits) serial.StopBits {
	switch s {
	case StopBits1:
		return serial.OneStopBit
	case StopBits1_5:
		return serial.OnePointFiveStopBits
	case StopBits2:
		return serial.TwoStopBits
	default:
		return serial.OneStopBit
	}
}
