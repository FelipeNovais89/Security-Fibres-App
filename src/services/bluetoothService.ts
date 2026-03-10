
/**
 * Bluetooth Service for Web Bluetooth API
 * Specifically targeted at Phomemo M110/M220 printers
 */

export interface BluetoothDiagnostics {
  bluetoothSupported: boolean;
  secureContext: boolean;
  inIframe: boolean;
  userAgent: string;
}

export interface BluetoothConnectionState {
  device: BluetoothDevice | null;
  server: BluetoothRemoteGATTServer | null;
  service: BluetoothRemoteGATTService | null;
  characteristic: BluetoothRemoteGATTCharacteristic | null;
  isConnected: boolean;
  lastError: string | null;
  logs: string[];
}

export class BluetoothService {
  private static instance: BluetoothService;
  private logs: string[] = [];

  private constructor() {}

  public static getInstance(): BluetoothService {
    if (!BluetoothService.instance) {
      BluetoothService.instance = new BluetoothService();
    }
    return BluetoothService.instance;
  }

  private addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
    // Keep only last 50 logs
    if (this.logs.length > 50) this.logs.shift();
  }

  public getLogs(): string[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
  }

  public checkSupport(): BluetoothDiagnostics {
    const diagnostics = {
      bluetoothSupported: typeof navigator !== 'undefined' && !!navigator.bluetooth,
      secureContext: typeof window !== 'undefined' && window.isSecureContext,
      inIframe: typeof window !== 'undefined' && window.self !== window.top,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    };
    
    this.addLog(`Support Check: Bluetooth=${diagnostics.bluetoothSupported}, Secure=${diagnostics.secureContext}, Iframe=${diagnostics.inIframe}`);
    return diagnostics;
  }

  /**
   * Request a Bluetooth device. 
   * MUST be called directly from a user gesture (click).
   */
  public async requestDevice(useFilters: boolean = true): Promise<BluetoothDevice> {
    this.addLog(`Requesting device (filters=${useFilters})...`);
    
    if (!navigator.bluetooth) {
      throw new Error("Web Bluetooth is not supported in this browser.");
    }

    try {
      const options: RequestDeviceOptions = useFilters ? {
        filters: [
          { namePrefix: 'M110' },
          { namePrefix: 'M220' },
          { namePrefix: 'M120' },
          { namePrefix: 'M200' },
          { namePrefix: 'Phomemo' },
          { namePrefix: 'Printer' },
          { namePrefix: 'Label' },
          { services: ['0000ff00-0000-1000-8000-00805f9b34fb'] }
        ],
        optionalServices: [
          '0000ff00-0000-1000-8000-00805f9b34fb',
          '000018f0-0000-1000-8000-00805f9b34fb',
          '0000fee7-0000-1000-8000-00805f9b34fb'
        ]
      } : {
        acceptAllDevices: true,
        optionalServices: [
          '0000ff00-0000-1000-8000-00805f9b34fb',
          '000018f0-0000-1000-8000-00805f9b34fb'
        ]
      };

      const device = await navigator.bluetooth.requestDevice(options);
      this.addLog(`Device selected: ${device.name || 'Unknown'} (${device.id})`);
      return device;
    } catch (error) {
      if ((error as any).name === 'NotFoundError') {
        this.addLog("User cancelled device selection.");
        throw error;
      }
      this.addLog(`Error requesting device: ${error}`);
      throw error;
    }
  }

  public async connect(device: BluetoothDevice): Promise<BluetoothRemoteGATTServer> {
    this.addLog(`Connecting to GATT server on ${device.name}...`);
    
    if (!device.gatt) {
      this.addLog("GATT is not available on this device.");
      throw new Error("GATT is not available on this device.");
    }

    try {
      const server = await device.gatt.connect();
      this.addLog("GATT server connected successfully.");
      return server;
    } catch (error) {
      this.addLog(`Failed to connect to GATT server: ${error}`);
      throw error;
    }
  }

  public async discoverServices(server: BluetoothRemoteGATTServer): Promise<BluetoothRemoteGATTService[]> {
    this.addLog("Discovering services...");
    try {
      const services = await server.getPrimaryServices();
      this.addLog(`Found ${services.length} primary services.`);
      services.forEach(s => this.addLog(`Service UUID: ${s.uuid}`));
      return services;
    } catch (error) {
      this.addLog(`Error discovering services: ${error}`);
      throw error;
    }
  }

  public async getPrinterCharacteristic(service: BluetoothRemoteGATTService): Promise<BluetoothRemoteGATTCharacteristic> {
    this.addLog(`Getting characteristic for service ${service.uuid}...`);
    
    // Common Phomemo characteristic UUIDs
    const charUUIDs = [
      '0000ff02-0000-1000-8000-00805f9b34fb',
      '00002af1-0000-1000-8000-00805f9b34fb'
    ];

    for (const uuid of charUUIDs) {
      try {
        const characteristic = await service.getCharacteristic(uuid);
        this.addLog(`Found characteristic: ${uuid}`);
        return characteristic;
      } catch (e) {
        this.addLog(`Characteristic ${uuid} not found in this service.`);
      }
    }

    // Fallback: try to find any writable characteristic
    try {
      const characteristics = await service.getCharacteristics();
      const writable = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);
      if (writable) {
        this.addLog(`Fallback: Found writable characteristic ${writable.uuid}`);
        return writable;
      }
    } catch (e) {
      this.addLog("Error listing all characteristics.");
    }

    throw new Error("No compatible printer characteristic found.");
  }
}

export const bluetoothService = BluetoothService.getInstance();
