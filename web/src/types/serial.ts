export interface SerialConfig {
  port: string;
  baud_rate: number;
  data_bits: 5 | 6 | 7 | 8;
  stop_bits: 1 | 1.5 | 2;
  parity: 'none' | 'odd' | 'even' | 'mark' | 'space';
  flow_control: 'none' | 'rtscts' | 'xonxoff';
}

export interface PortInfo {
  name: string;
  description: string;
  is_usb: boolean;
  vid?: string;
  pid?: string;
  serial_number?: string;
}

export const DEFAULT_CONFIG: Omit<SerialConfig, 'port'> = {
  baud_rate: 115200,
  data_bits: 8,
  stop_bits: 1,
  parity: 'none',
  flow_control: 'none',
};

export const BAUD_RATES = [
  300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600
];
