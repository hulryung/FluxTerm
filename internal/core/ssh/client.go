package ssh

import (
	"fmt"
	"io"
	"os"
	"sync"
	"time"

	"golang.org/x/crypto/ssh"
)

// Client represents an SSH client connection
type Client struct {
	config     SSHConfig
	client     *ssh.Client
	session    *ssh.Session
	stdin      io.WriteCloser
	stdout     io.Reader
	stderr     io.Reader
	mu         sync.Mutex
	connected  bool
	onData     func([]byte)
	stopReader chan struct{}
}

// NewClient creates a new SSH client
func NewClient(config SSHConfig) *Client {
	return &Client{
		config:     config,
		stopReader: make(chan struct{}),
	}
}

// Connect establishes SSH connection
func (c *Client) Connect() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.connected {
		return fmt.Errorf("already connected")
	}

	// Build SSH client config
	sshConfig, err := c.buildSSHConfig()
	if err != nil {
		return fmt.Errorf("failed to build SSH config: %w", err)
	}

	// Connect to SSH server
	addr := fmt.Sprintf("%s:%d", c.config.Host, c.config.Port)
	client, err := ssh.Dial("tcp", addr, sshConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to SSH server: %w", err)
	}
	c.client = client

	// Create session
	session, err := client.NewSession()
	if err != nil {
		client.Close()
		return fmt.Errorf("failed to create SSH session: %w", err)
	}
	c.session = session

	// Set up terminal modes
	modes := ssh.TerminalModes{
		ssh.ECHO:          1,     // Enable echo
		ssh.TTY_OP_ISPEED: 14400, // Input speed = 14.4kbaud
		ssh.TTY_OP_OSPEED: 14400, // Output speed = 14.4kbaud
	}

	// Request pseudo terminal
	if err := session.RequestPty(c.config.TerminalType, c.config.Rows, c.config.Cols, modes); err != nil {
		session.Close()
		client.Close()
		return fmt.Errorf("failed to request PTY: %w", err)
	}

	// Set up I/O
	stdin, err := session.StdinPipe()
	if err != nil {
		session.Close()
		client.Close()
		return fmt.Errorf("failed to create stdin pipe: %w", err)
	}
	c.stdin = stdin

	stdout, err := session.StdoutPipe()
	if err != nil {
		session.Close()
		client.Close()
		return fmt.Errorf("failed to create stdout pipe: %w", err)
	}
	c.stdout = stdout

	stderr, err := session.StderrPipe()
	if err != nil {
		session.Close()
		client.Close()
		return fmt.Errorf("failed to create stderr pipe: %w", err)
	}
	c.stderr = stderr

	// Start shell
	if err := session.Shell(); err != nil {
		session.Close()
		client.Close()
		return fmt.Errorf("failed to start shell: %w", err)
	}

	c.connected = true

	// Start reading output
	go c.readOutput()

	return nil
}

// buildSSHConfig builds golang.org/x/crypto/ssh config
func (c *Client) buildSSHConfig() (*ssh.ClientConfig, error) {
	config := &ssh.ClientConfig{
		User:            c.config.Username,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(), // TODO: Implement proper host key verification
		Timeout:         time.Duration(c.config.ConnectTimeout) * time.Second,
	}

	switch c.config.AuthMethod {
	case AuthPassword:
		config.Auth = []ssh.AuthMethod{
			ssh.Password(c.config.Password),
		}

	case AuthPublicKey:
		var keyBytes []byte
		var err error

		// Load private key from file or use provided key
		if c.config.PrivateKeyPath != "" {
			keyBytes, err = os.ReadFile(c.config.PrivateKeyPath)
			if err != nil {
				return nil, fmt.Errorf("failed to read private key file: %w", err)
			}
		} else if c.config.PrivateKey != "" {
			keyBytes = []byte(c.config.PrivateKey)
		} else {
			return nil, fmt.Errorf("no private key provided")
		}

		// Parse private key
		var signer ssh.Signer
		if c.config.PrivateKeyPassphrase != "" {
			signer, err = ssh.ParsePrivateKeyWithPassphrase(keyBytes, []byte(c.config.PrivateKeyPassphrase))
		} else {
			signer, err = ssh.ParsePrivateKey(keyBytes)
		}
		if err != nil {
			return nil, fmt.Errorf("failed to parse private key: %w", err)
		}

		config.Auth = []ssh.AuthMethod{
			ssh.PublicKeys(signer),
		}

	case AuthKeyboardInteractive:
		// For keyboard-interactive, we'll use a simple callback
		// In a real implementation, this should prompt the user
		config.Auth = []ssh.AuthMethod{
			ssh.KeyboardInteractive(func(user, instruction string, questions []string, echos []bool) ([]string, error) {
				// For now, just return the password for all questions
				answers := make([]string, len(questions))
				for i := range answers {
					answers[i] = c.config.Password
				}
				return answers, nil
			}),
		}

	default:
		return nil, fmt.Errorf("unsupported auth method: %s", c.config.AuthMethod)
	}

	return config, nil
}

// readOutput reads from stdout and stderr
func (c *Client) readOutput() {
	buf := make([]byte, 32*1024) // 32KB buffer

	for {
		select {
		case <-c.stopReader:
			return
		default:
		}

		// Read from stdout
		n, err := c.stdout.Read(buf)
		if err != nil {
			if err != io.EOF {
				// Connection closed or error
			}
			return
		}

		if n > 0 && c.onData != nil {
			data := make([]byte, n)
			copy(data, buf[:n])
			c.onData(data)
		}
	}
}

// Write sends data to SSH session
func (c *Client) Write(data []byte) (int, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if !c.connected || c.stdin == nil {
		return 0, fmt.Errorf("not connected")
	}

	return c.stdin.Write(data)
}

// Resize resizes the terminal
func (c *Client) Resize(cols, rows int) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if !c.connected || c.session == nil {
		return fmt.Errorf("not connected")
	}

	c.config.Cols = cols
	c.config.Rows = rows

	return c.session.WindowChange(rows, cols)
}

// SetDataHandler sets the handler for received data
func (c *Client) SetDataHandler(handler func([]byte)) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.onData = handler
}

// Close closes the SSH connection
func (c *Client) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if !c.connected {
		return nil
	}

	close(c.stopReader)

	if c.session != nil {
		c.session.Close()
		c.session = nil
	}

	if c.client != nil {
		c.client.Close()
		c.client = nil
	}

	c.connected = false
	return nil
}

// IsConnected returns connection status
func (c *Client) IsConnected() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.connected
}

// GetConfig returns the SSH configuration
func (c *Client) GetConfig() SSHConfig {
	return c.config
}
