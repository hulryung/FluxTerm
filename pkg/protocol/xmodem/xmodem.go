package xmodem

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"time"
)

// Protocol constants
const (
	SOH byte = 0x01 // Start of 128-byte block
	STX byte = 0x02 // Start of 1024-byte block
	EOT byte = 0x04 // End of transmission
	ACK byte = 0x06 // Acknowledge
	NAK byte = 0x15 // Negative acknowledge
	CAN byte = 0x18 // Cancel
	SUB byte = 0x1A // Substitute (padding)

	BlockSize128  = 128
	BlockSize1024 = 1024

	MaxRetries     = 10
	TimeoutSeconds = 3
)

var (
	ErrTimeout     = errors.New("timeout")
	ErrCancelled   = errors.New("cancelled")
	ErrTooManyNAKs = errors.New("too many NAKs")
)

// ProgressCallback is called during transfer to report progress
type ProgressCallback func(sent, total int64)

// Sender implements XMODEM sender
type Sender struct {
	port     io.ReadWriter
	progress ProgressCallback
	useCRC   bool
	use1K    bool // XMODEM-1K or YMODEM
}

// NewSender creates a new XMODEM sender
func NewSender(port io.ReadWriter, useCRC bool, use1K bool) *Sender {
	return &Sender{
		port:   port,
		useCRC: useCRC,
		use1K:  use1K,
	}
}

// SetProgressCallback sets the progress callback
func (s *Sender) SetProgressCallback(cb ProgressCallback) {
	s.progress = cb
}

// Send sends a file using XMODEM protocol
func (s *Sender) Send(data []byte) error {
	// Wait for receiver to send NAK or 'C' (for CRC)
	if err := s.waitForStart(); err != nil {
		return err
	}

	blockNum := 1
	offset := 0
	dataLen := len(data)

	for offset < dataLen {
		blockSize := BlockSize128
		if s.use1K {
			blockSize = BlockSize1024
		}

		// Prepare block
		block := make([]byte, blockSize)
		n := copy(block, data[offset:])
		if n < blockSize {
			// Pad with SUB
			for i := n; i < blockSize; i++ {
				block[i] = SUB
			}
		}

		// Send block with retries
		if err := s.sendBlock(byte(blockNum), block); err != nil {
			return err
		}

		offset += n
		blockNum = blockNum + 1 // Automatically wraps at 256 for byte type

		// Report progress
		if s.progress != nil {
			s.progress(int64(offset), int64(dataLen))
		}
	}

	// Send EOT
	return s.sendEOT()
}

func (s *Sender) waitForStart() error {
	buf := make([]byte, 1)
	timeout := time.After(30 * time.Second)

	for {
		select {
		case <-timeout:
			return ErrTimeout
		default:
			n, err := s.port.Read(buf)
			if err != nil {
				continue
			}
			if n > 0 {
				if buf[0] == NAK {
					s.useCRC = false
					return nil
				} else if buf[0] == 'C' {
					s.useCRC = true
					return nil
				} else if buf[0] == CAN {
					return ErrCancelled
				}
			}
		}
	}
}

func (s *Sender) sendBlock(blockNum byte, data []byte) error {
	blockSize := len(data)
	var header byte = SOH
	if blockSize == BlockSize1024 {
		header = STX
	}

	for retry := 0; retry < MaxRetries; retry++ {
		// Build packet
		packet := make([]byte, 0, 3+blockSize+2)
		packet = append(packet, header)
		packet = append(packet, blockNum)
		packet = append(packet, ^blockNum) // One's complement
		packet = append(packet, data...)

		// Add checksum or CRC
		if s.useCRC {
			crc := calcCRC16(data)
			packet = append(packet, byte(crc>>8))
			packet = append(packet, byte(crc&0xFF))
		} else {
			checksum := calcChecksum(data)
			packet = append(packet, checksum)
		}

		// Send packet
		if _, err := s.port.Write(packet); err != nil {
			return err
		}

		// Wait for ACK/NAK
		response, err := s.waitResponse()
		if err == ErrTimeout {
			continue
		}
		if err != nil {
			return err
		}

		if response == ACK {
			return nil
		} else if response == NAK {
			continue
		} else if response == CAN {
			return ErrCancelled
		}
	}

	return ErrTooManyNAKs
}

func (s *Sender) sendEOT() error {
	for retry := 0; retry < MaxRetries; retry++ {
		if _, err := s.port.Write([]byte{EOT}); err != nil {
			return err
		}

		response, err := s.waitResponse()
		if err == ErrTimeout {
			continue
		}
		if err != nil {
			return err
		}

		if response == ACK {
			return nil
		}
	}
	return ErrTimeout
}

func (s *Sender) waitResponse() (byte, error) {
	buf := make([]byte, 1)
	timeout := time.After(TimeoutSeconds * time.Second)

	for {
		select {
		case <-timeout:
			return 0, ErrTimeout
		default:
			n, err := s.port.Read(buf)
			if err != nil {
				continue
			}
			if n > 0 {
				return buf[0], nil
			}
		}
	}
}

// Receiver implements XMODEM receiver
type Receiver struct {
	port     io.ReadWriter
	progress ProgressCallback
	useCRC   bool
}

// NewReceiver creates a new XMODEM receiver
func NewReceiver(port io.ReadWriter, useCRC bool) *Receiver {
	return &Receiver{
		port:   port,
		useCRC: useCRC,
	}
}

// SetProgressCallback sets the progress callback
func (r *Receiver) SetProgressCallback(cb ProgressCallback) {
	r.progress = cb
}

// Receive receives a file using XMODEM protocol
func (r *Receiver) Receive() ([]byte, error) {
	var buf bytes.Buffer
	blockNum := byte(1)

	// Send initial NAK or 'C'
	if err := r.sendStart(); err != nil {
		return nil, err
	}

	for {
		block, eot, err := r.receiveBlock(blockNum)
		if eot {
			// Send final ACK
			r.port.Write([]byte{ACK})
			return buf.Bytes(), nil
		}
		if err != nil {
			return nil, err
		}

		buf.Write(block)
		blockNum = blockNum + 1 // Automatically wraps at 256 for byte type

		// Report progress
		if r.progress != nil {
			r.progress(int64(buf.Len()), 0) // Total unknown
		}
	}
}

func (r *Receiver) sendStart() error {
	start := NAK
	if r.useCRC {
		start = 'C'
	}

	for retry := 0; retry < 10; retry++ {
		if _, err := r.port.Write([]byte{start}); err != nil {
			return err
		}
		time.Sleep(1 * time.Second)

		// Check if we got a response
		buf := make([]byte, 1)
		if n, _ := r.port.Read(buf); n > 0 {
			if buf[0] == SOH || buf[0] == STX || buf[0] == EOT {
				// Unread this byte (we'll read it again in receiveBlock)
				return nil
			}
		}
	}
	return ErrTimeout
}

func (r *Receiver) receiveBlock(expectedBlockNum byte) ([]byte, bool, error) {
	buf := make([]byte, 1)

	// Read header
	timeout := time.After(TimeoutSeconds * time.Second)
	for {
		select {
		case <-timeout:
			r.port.Write([]byte{NAK})
			return nil, false, ErrTimeout
		default:
			n, err := r.port.Read(buf)
			if err != nil || n == 0 {
				continue
			}

			header := buf[0]
			if header == EOT {
				return nil, true, nil
			} else if header == CAN {
				return nil, false, ErrCancelled
			} else if header == SOH || header == STX {
				blockSize := BlockSize128
				if header == STX {
					blockSize = BlockSize1024
				}

				// Read rest of packet
				packet := make([]byte, blockSize+4) // block# + ~block# + data + checksum/crc
				if _, err := io.ReadFull(r.port, packet); err != nil {
					r.port.Write([]byte{NAK})
					return nil, false, err
				}

				// Verify block number
				if packet[0] != expectedBlockNum || packet[1] != ^expectedBlockNum {
					r.port.Write([]byte{NAK})
					return nil, false, fmt.Errorf("block number mismatch")
				}

				// Verify checksum/CRC
				data := packet[2 : 2+blockSize]
				if r.useCRC {
					crc := uint16(packet[2+blockSize])<<8 | uint16(packet[2+blockSize+1])
					if calcCRC16(data) != crc {
						r.port.Write([]byte{NAK})
						return nil, false, fmt.Errorf("CRC error")
					}
				} else {
					checksum := packet[2+blockSize]
					if calcChecksum(data) != checksum {
						r.port.Write([]byte{NAK})
						return nil, false, fmt.Errorf("checksum error")
					}
				}

				// Send ACK
				r.port.Write([]byte{ACK})
				return data, false, nil
			}
		}
	}
}

// calcChecksum calculates simple checksum
func calcChecksum(data []byte) byte {
	var sum byte
	for _, b := range data {
		sum += b
	}
	return sum
}

// calcCRC16 calculates CRC-16-CCITT
func calcCRC16(data []byte) uint16 {
	crc := uint16(0)
	for _, b := range data {
		crc ^= uint16(b) << 8
		for i := 0; i < 8; i++ {
			if crc&0x8000 != 0 {
				crc = (crc << 1) ^ 0x1021
			} else {
				crc = crc << 1
			}
		}
	}
	return crc
}
