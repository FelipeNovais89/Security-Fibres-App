/**
 * Phomemo M110 Printer Integration
 * Supports Bluetooth BLE (Mobile) and USB Serial (PC)
 */

// ESC/POS Constants
export const ESC = 0x1b;
export const CMD_INIT = new Uint8Array([ESC, 0x40]);
export const CMD_ALIGN_CTR = new Uint8Array([ESC, 0x61, 0x01]);
export const CMD_FEED = new Uint8Array([ESC, 0x64, 0x01]); // Feed 1 line
export const CMD_FF = new Uint8Array([0x0C]); // Form Feed

// BLE UUIDs
export const BLE_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
export const BLE_CHAR_WRITE_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

// Fallback UUIDs for different Phomemo models or generic thermal printers
export const COMMON_PRINTER_SERVICES = [
  { service: '000018f0-0000-1000-8000-00805f9b34fb', char: '00002af1-0000-1000-8000-00805f9b34fb' }, // Phomemo M110/M220
  { service: '0000ff00-0000-1000-8000-00805f9b34fb', char: '0000ff02-0000-1000-8000-00805f9b34fb' }, // Generic Chinese Printers
  { service: '0000ae30-0000-1000-8000-00805f9b34fb', char: '0000ae01-0000-1000-8000-00805f9b34fb' }, // Some Phomemo variants
  { service: 'e7fe6041-ff76-4370-9065-3367d313bb6e', char: 'e7fe6042-ff76-4370-9065-3367d313bb6e' }, // M110 variants
  { service: '49535343-fe7d-4ae5-8fa9-9fafd205e455', char: '49535343-8841-43f4-a8d4-ecbe34729bb3' }, // ISSC / Microchip
  { service: '0000fee7-0000-1000-8000-00805f9b34fb', char: '0000fec7-0000-1000-8000-00805f9b34fb' }, // WeChat / Tencent
  { service: '0000ff01-0000-1000-8000-00805f9b34fb', char: '0000ff02-0000-1000-8000-00805f9b34fb' }, // Alternative Generic
  { service: '00001101-0000-1000-8000-00805f9b34fb', char: '00001101-0000-1000-8000-00805f9b34fb' }, // SPP (Serial Port Profile)
];

/**
 * Detects if the current platform is mobile (Android or iPhone)
 */
export const isMobile = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Android|iPhone/i.test(ua);
};

/**
 * Checks if any printer communication method is supported
 */
export const isPrinterSupported = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return !!(navigator.bluetooth || (navigator as any).serial);
};

/**
 * Connects to the Phomemo M110 via Bluetooth BLE
 */
export const connectBluetooth = async (acceptAll: boolean = false): Promise<BluetoothRemoteGATTCharacteristic> => {
  if (!navigator.bluetooth) {
    throw new Error("Web Bluetooth não é suportado neste navegador.");
  }

  try {
    const optionalServices = COMMON_PRINTER_SERVICES.map(s => s.service);
    
    const options: RequestDeviceOptions = acceptAll 
      ? { acceptAllDevices: true, optionalServices }
      : {
          filters: [
            { namePrefix: 'M110' },
            { namePrefix: 'M220' },
            { namePrefix: 'Phomemo' },
            { namePrefix: 'Label' },
            { namePrefix: 'Printer' },
            { namePrefix: 'BP' },
            { namePrefix: 'Q30' },
            { namePrefix: 'D30' },
            { namePrefix: 'M' } // Generic M-series
          ],
          optionalServices
        };

    console.log("Solicitando dispositivo Bluetooth com opções:", options);
    const device = await navigator.bluetooth.requestDevice(options);
    console.log("Dispositivo selecionado:", device.name, device.id);

    if (!device.gatt) {
      throw new Error("GATT não disponível no dispositivo.");
    }

    console.log("Conectando ao servidor GATT...");
    const server = await device.gatt.connect();
    console.log("Servidor GATT conectado.");
    
    // Try each common service until one works
    let lastError = null;
    for (const pair of COMMON_PRINTER_SERVICES) {
      try {
        console.log(`Tentando serviço: ${pair.service}`);
        const service = await server.getPrimaryService(pair.service);
        console.log(`Serviço encontrado. Buscando característica: ${pair.char}`);
        const characteristic = await service.getCharacteristic(pair.char);
        console.log(`Conectado com sucesso ao serviço: ${pair.service}`);
        return characteristic;
      } catch (e) {
        console.warn(`Serviço ${pair.service} falhou:`, e);
        lastError = e;
      }
    }

    // If no specific service found, try to discover any service with a writable characteristic
    console.log("Tentando descoberta automática de serviços...");
    try {
      const services = await server.getPrimaryServices();
      console.log(`Encontrados ${services.length} serviços.`);
      for (const service of services) {
        console.log(`Inspecionando serviço: ${service.uuid}`);
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              console.log(`Característica de escrita encontrada no serviço: ${service.uuid}, Char: ${char.uuid}`);
              return char;
            }
          }
        } catch (charError) {
          console.warn(`Falha ao ler características do serviço ${service.uuid}:`, charError);
        }
      }
    } catch (e) {
      console.error("Falha na descoberta automática de serviços:", e);
    }

    throw lastError || new Error("Nenhum serviço de impressão compatível encontrado no dispositivo.");
  } catch (error) {
    console.error("Erro fatal ao conectar Bluetooth:", error);
    throw error;
  }
};

/**
 * Prints text via Bluetooth BLE
 */
export const printViaBluetooth = async (characteristic: BluetoothRemoteGATTCharacteristic, text: string): Promise<void> => {
  try {
    const encoder = new TextEncoder();
    const textData = encoder.encode(text);

    // Combine commands: INIT + ALIGN_CTR + TEXT + FEED + FF
    const combinedData = new Uint8Array(
      CMD_INIT.length + CMD_ALIGN_CTR.length + textData.length + CMD_FEED.length + CMD_FF.length
    );

    let offset = 0;
    combinedData.set(CMD_INIT, offset);
    offset += CMD_INIT.length;
    combinedData.set(CMD_ALIGN_CTR, offset);
    offset += CMD_ALIGN_CTR.length;
    combinedData.set(textData, offset);
    offset += textData.length;
    combinedData.set(CMD_FEED, offset);
    offset += CMD_FEED.length;
    combinedData.set(CMD_FF, offset);

    // Send in chunks if necessary (BLE MTU is usually small, but writeValue handles some fragmentation)
    // For M110, sending the whole buffer often works if it's small (labels are usually short text)
    await characteristic.writeValue(combinedData);
  } catch (error) {
    console.error("Erro ao imprimir via Bluetooth:", error);
    throw error;
  }
};

/**
 * Prints an image via Bluetooth BLE
 * Image must be a monochrome bitmap
 */
export const printImageViaBluetooth = async (
  characteristic: BluetoothRemoteGATTCharacteristic, 
  imageData: Uint8Array, 
  width: number, 
  height: number
): Promise<void> => {
  try {
    // GS v 0 m xL xH yL yH d1...dk
    // m=0 (normal), xL=widthBytes, xH=0, yL=heightDots, yH=heightDots>>8
    const widthBytes = Math.ceil(width / 8);
    const xL = widthBytes & 0xFF;
    const xH = (widthBytes >> 8) & 0xFF;
    const yL = height & 0xFF;
    const yH = (height >> 8) & 0xFF;

    const header = new Uint8Array([0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
    
    // Send INIT
    await characteristic.writeValue(CMD_INIT);
    
    // Send Image Header + Data in chunks
    const fullData = new Uint8Array(header.length + imageData.length);
    fullData.set(header, 0);
    fullData.set(imageData, header.length);

    // BLE MTU is typically 20-512 bytes. We should chunk the data.
    const CHUNK_SIZE = 100; 
    for (let i = 0; i < fullData.length; i += CHUNK_SIZE) {
      const chunk = fullData.slice(i, i + CHUNK_SIZE);
      await characteristic.writeValue(chunk);
    }

    // Send FF
    await characteristic.writeValue(CMD_FF);
  } catch (error) {
    console.error("Erro ao imprimir imagem via Bluetooth:", error);
    throw error;
  }
};

/**
 * Connects to the Phomemo M110 via USB Serial
 * usbVendorId 0x0519 is standard for Phomemo M110
 * Check chrome://device-log if it doesn't appear
 */
export const connectUSB = async (showAll: boolean = false): Promise<any> => {
  if (!(navigator as any).serial) {
    throw new Error("Web Serial não é suportado neste navegador.");
  }

  try {
    const options = showAll ? {} : { filters: [{ usbVendorId: 0x0519 }] };
    const port = await (navigator as any).serial.requestPort(options);

    await port.open({ baudRate: 115200 });
    return port;
  } catch (error) {
    console.error("Erro ao conectar USB:", error);
    throw error;
  }
};

/**
 * Prints text via USB Serial
 */
export const printViaUSB = async (port: any, text: string): Promise<void> => {
  if (!port.writable) {
    throw new Error("Porta serial não está pronta para escrita.");
  }

  const writer = port.writable.getWriter();
  try {
    const encoder = new TextEncoder();
    const textData = encoder.encode(text);

    await writer.write(CMD_INIT);
    await writer.write(CMD_ALIGN_CTR);
    await writer.write(textData);
    await writer.write(CMD_FEED);
    await writer.write(CMD_FF);
  } catch (error) {
    console.error("Erro ao imprimir via USB:", error);
    throw error;
  } finally {
    writer.releaseLock();
  }
};

/**
 * Prints an image via USB Serial
 */
export const printImageViaUSB = async (
  port: any, 
  imageData: Uint8Array, 
  width: number, 
  height: number
): Promise<void> => {
  if (!port.writable) {
    throw new Error("Porta serial não está pronta para escrita.");
  }

  const writer = port.writable.getWriter();
  try {
    const widthBytes = Math.ceil(width / 8);
    const xL = widthBytes & 0xFF;
    const xH = (widthBytes >> 8) & 0xFF;
    const yL = height & 0xFF;
    const yH = (height >> 8) & 0xFF;

    const header = new Uint8Array([0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
    
    await writer.write(CMD_INIT);
    await writer.write(header);
    await writer.write(imageData);
    await writer.write(CMD_FF);
  } catch (error) {
    console.error("Erro ao imprimir imagem via USB:", error);
    throw error;
  } finally {
    writer.releaseLock();
  }
};

/**
 * Converts a Canvas image to a monochrome bitmap for thermal printing
 */
export const processImageForPrinting = (canvas: HTMLCanvasElement): { data: Uint8Array, width: number, height: number } => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get canvas context");

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  const widthBytes = Math.ceil(width / 8);
  const bitData = new Uint8Array(widthBytes * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      
      // Grayscale conversion
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      
      // Thresholding (black if < 128)
      if (gray < 128) {
        const byteIdx = y * widthBytes + Math.floor(x / 8);
        const bitIdx = 7 - (x % 8);
        bitData[byteIdx] |= (1 << bitIdx);
      }
    }
  }

  return { data: bitData, width, height };
};
