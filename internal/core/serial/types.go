package serial

import "time"

// SerialConfig holds the configuration for a serial port
type SerialConfig struct {
	Port        string      `json:"port"`
	BaudRate    int         `json:"baud_rate"`
	DataBits    int         `json:"data_bits"`
	StopBits    StopBits    `json:"stop_bits"`
	Parity      Parity      `json:"parity"`
	FlowControl FlowControl `json:"flow_control"`
	ReadTimeout time.Duration `json:"read_timeout"`
}

// StopBits represents the number of stop bits
type StopBits int

const (
	StopBits1   StopBits = 1
	StopBits1_5 StopBits = 15 // Represented as 15 to avoid float
	StopBits2   StopBits = 2
)

// Parity represents the parity setting
type Parity string

const (
	ParityNone  Parity = "none"
	ParityOdd   Parity = "odd"
	ParityEven  Parity = "even"
	ParityMark  Parity = "mark"
	ParitySpace Parity = "space"
)

// FlowControl represents the flow control setting
type FlowControl string

const (
	FlowNone   FlowControl = "none"
	FlowRTSCTS FlowControl = "rtscts"
	FlowXONOFF FlowControl = "xonxoff"
)

// PortInfo contains information about a serial port
type PortInfo struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	IsUSB        bool   `json:"is_usb"`
	VID          string `json:"vid,omitempty"`
	PID          string `json:"pid,omitempty"`
	SerialNumber string `json:"serial_number,omitempty"`
}

// DefaultSerialConfig returns a default serial configuration
func DefaultSerialConfig() SerialConfig {
	return SerialConfig{
		BaudRate:    115200,
		DataBits:    8,
		StopBits:    StopBits1,
		Parity:      ParityNone,
		FlowControl: FlowNone,
		ReadTimeout: 100 * time.Millisecond,
	}
}
