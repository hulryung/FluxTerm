package ssh

// AuthMethod represents SSH authentication methods
type AuthMethod string

const (
	AuthPassword            AuthMethod = "password"
	AuthPublicKey           AuthMethod = "publickey"
	AuthKeyboardInteractive AuthMethod = "keyboard-interactive"
)

// SSHConfig represents SSH connection configuration
type SSHConfig struct {
	Host       string     `json:"host"`
	Port       int        `json:"port"`
	Username   string     `json:"username"`
	AuthMethod AuthMethod `json:"auth_method"`

	// Password authentication
	Password string `json:"password,omitempty"`

	// Public key authentication
	PrivateKey       string `json:"private_key,omitempty"`        // PEM format or file path
	PrivateKeyPath   string `json:"private_key_path,omitempty"`   // Path to private key file
	PrivateKeyPassphrase string `json:"private_key_passphrase,omitempty"` // Passphrase for encrypted key

	// Terminal settings
	TerminalType string `json:"terminal_type,omitempty"` // Default: xterm-256color
	Cols         int    `json:"cols,omitempty"`          // Default: 80
	Rows         int    `json:"rows,omitempty"`          // Default: 24

	// Timeout
	ConnectTimeout int `json:"connect_timeout,omitempty"` // Seconds, default: 30
}

// DefaultSSHConfig returns default SSH configuration
func DefaultSSHConfig() SSHConfig {
	return SSHConfig{
		Port:           22,
		AuthMethod:     AuthPassword,
		TerminalType:   "xterm-256color",
		Cols:           80,
		Rows:           24,
		ConnectTimeout: 30,
	}
}
