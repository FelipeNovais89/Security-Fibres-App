import React, { useState, useRef } from 'react';
import { 
  Printer, 
  CheckSquare, 
  Droplets, 
  LayoutDashboard, 
  Download, 
  Box, 
  QrCode, 
  ChevronRight,
  Factory,
  Menu,
  X,
  Database,
  Plus,
  Trash2,
  Save,
  Edit2,
  Calendar,
  Clock,
  Fan,
  Settings,
  Bluetooth,
  BluetoothOff,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import FibreVerification from './components/FibreVerification';
import WheelDatePicker from './components/WheelDatePicker';
import Home from './components/Home';
import TimeClock from './components/TimeClock';
import Production from './components/Production';
import { cn } from './utils/cn';
import { bluetoothService, BluetoothDiagnostics } from './services/bluetoothService';
import { 
  RawMaterialCode, 
  ProductCode, 
  BOM, 
  PaperReel, 
  InkCan, 
  PrintedPaperReel, 
  FreshCutBag, 
  BlownBag, 
  ShakenBag, 
  FinalBox 
} from './types';

// --- Types ---

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  colour: string;
  colorVisibility?: 'Visible' | 'Invisible UV' | 'Visible & Invisible' | 'Invisible UV SW' | 'Invisible UV LW';
  cutType: string;
  length: string;
  pitch: string;
  gsm: string;
}

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick, 
  disabled = false 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void,
  disabled?: boolean
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
      active 
        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" 
        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
      disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-slate-400"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
    {disabled && <span className="ml-auto text-[10px] uppercase tracking-wider opacity-60">Soon</span>}
  </button>
);


const CustomDropdown = ({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder,
  onSelect
}: { 
  label: string, 
  value: string, 
  options: string[], 
  onChange: (val: string) => void,
  placeholder: string,
  onSelect?: (val: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-[10px] font-medium text-slate-400 mb-1 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input 
          type="text" 
          value={value}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700"
        />
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    onSelect?.(opt);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs md:text-sm hover:bg-emerald-600 text-slate-300 hover:text-white transition-all flex items-center justify-between group border-b border-slate-800/50 last:border-0"
                >
                  <span>{opt}</span>
                  <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-slate-500 italic">
                No matches found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StoreBoxLabel = ({ data, config }: { data: any, config: any }) => {
  const barcodeRef = useRef<HTMLCanvasElement>(null);

  const monthMap: Record<string, string> = {
    January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
    July: '07', August: '08', September: '09', October: '10', November: '11', December: '12'
  };

  const autoBarcode = `${monthMap[data.month] || '00'}/${data.year.toString().slice(-2)} - Box ${data.boxNr}`;

  React.useEffect(() => {
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, autoBarcode, {
          format: "CODE128",
          displayValue: true,
          fontSize: 14,
          fontOptions: "bold",
          width: 2.0,
          height: config.barcode.height,
          margin: 0,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch (e) {
        console.error("Barcode error", e);
      }
    }
  }, [autoBarcode, config.barcode.height]);

  return (
    <div 
      id="store-box-label"
      className="bg-white text-black border border-slate-200 shadow-sm relative"
      style={{ width: '80mm', height: '50mm', boxSizing: 'border-box', overflow: 'hidden' }}
    >
      {/* Logo */}
      <div 
        className="absolute flex items-center"
        style={{ 
          top: `${config.logo.top}px`, 
          left: `${config.logo.left}px`, 
          width: `${config.logo.width}px` 
        }}
      >
        <img 
          src="https://media.licdn.com/dms/image/v2/C4E0BAQEm03RiTKqcpA/company-logo_200_200/company-logo_200_200/0/1630648866973/security_fibres_uk_limited_logo?e=2147483647&v=beta&t=R0VL_C7Lva5nqAjdK4OjOGPZK4hGJs3nFM5pwYIm40Q" 
          alt="Security Fibres Logo" 
          className="max-w-full max-h-full object-contain"
          crossOrigin="anonymous"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://picsum.photos/seed/logo/100/40";
          }}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Title */}
      <h2 
        className="absolute font-bold text-slate-800 tracking-tight leading-tight"
        style={{ 
          top: `${config.title.top}px`, 
          left: `${config.title.left}px`, 
          fontSize: `${config.title.fontSize}px` 
        }}
      >
        Fibre's Sample Bags
      </h2>

      {/* Table */}
      <div 
        className="absolute"
        style={{ 
          top: `${config.table.top}px`, 
          left: `${config.table.left}px`, 
          width: `${config.table.width}px` 
        }}
      >
        <table 
          className="w-full border-collapse border border-black"
          style={{ fontSize: `${config.table.fontSize}px` }}
        >
          <tbody>
            <tr className="border-b border-black">
              <td className="border-r border-black px-3 py-1 font-bold w-[40%]">Box Nr.</td>
              <td className="px-3 py-1 text-center font-medium">{data.boxNr}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black px-3 py-1 font-bold">Month</td>
              <td className="px-3 py-1 text-center font-medium">{data.month}</td>
            </tr>
            <tr>
              <td className="border-r border-black px-3 py-1 font-bold">Year</td>
              <td className="px-3 py-1 text-center font-medium">{data.year}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Barcode */}
      <div 
        className="absolute flex justify-center overflow-hidden"
        style={{ 
          top: `${config.barcode.top}px`, 
          left: `${config.barcode.left}px`, 
          width: `${config.barcode.width}px` 
        }}
      >
        <canvas ref={barcodeRef} className="max-w-full h-full"></canvas>
      </div>
    </div>
  );
};

const ProductCheckLabel = ({ data, config }: { data: any, config: any }) => {
  const qrValue = [
    data.customer,
    data.colour,
    data.quantity,
    data.cutType,
    data.length,
    data.pitch,
    data.gsm,
    data.op,
    data.dn,
    data.deliveryData
  ].join(',');

  return (
    <div 
      id="product-check-label"
      className="bg-white text-black border border-slate-200 shadow-sm relative"
      style={{ width: '80mm', height: '50mm', boxSizing: 'border-box', overflow: 'hidden' }}
    >
      {/* Logo */}
      <div 
        className="absolute flex items-center"
        style={{ 
          top: `${config.logo.top}px`, 
          left: `${config.logo.left}px`, 
          width: `${config.logo.width}px` 
        }}
      >
        <img 
          src="https://media.licdn.com/dms/image/v2/C4E0BAQEm03RiTKqcpA/company-logo_200_200/company-logo_200_200/0/1630648866973/security_fibres_uk_limited_logo?e=2147483647&v=beta&t=R0VL_C7Lva5nqAjdK4OjOGPZK4hGJs3nFM5pwYIm40Q" 
          alt="Security Fibres Logo" 
          className="max-w-full max-h-full object-contain"
          crossOrigin="anonymous"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://picsum.photos/seed/logo/100/40";
          }}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Title */}
      <div 
        className="absolute text-right"
        style={{ 
          top: `${config.title.top}px`, 
          left: `${config.title.left}px`
        }}
      >
        <h2 
          className="font-black uppercase tracking-tighter leading-none"
          style={{ fontSize: `${config.title.fontSize}px` }}
        >
          Quality Control
        </h2>
        <p 
          className="font-bold text-slate-500"
          style={{ fontSize: `${config.title.subSize}px` }}
        >
          PRODUCT VERIFICATION
        </p>
      </div>

      {/* Table */}
      <div 
        className="absolute"
        style={{ 
          top: `${config.table.top}px`, 
          left: `${config.table.left}px`, 
          width: `${config.table.width}px` 
        }}
      >
        <table 
          className="w-full border-collapse border-[1.5px] border-black"
          style={{ fontSize: `${config.table.fontSize}px` }}
        >
          <tbody>
            {[
              ["CUSTOMER", data.customer],
              ["COLOUR", data.colour],
              ["QUANTITY", data.quantity],
              ["CUT TYPE", data.cutType],
              ["LENGTH", data.length],
              ["PITCH", data.pitch],
              ["GSM", data.gsm],
              ["O.P.", data.op],
              ["D.N.", data.dn],
              ["DELIVERY DATA", data.deliveryData]
            ].map(([label, val], idx) => (
              <tr key={idx} className="border-b border-black last:border-0">
                <td className="border-r border-black px-1.5 py-0.5 font-bold w-[35%] align-middle bg-slate-50">{label}</td>
                <td className="px-1.5 py-0.5 align-middle truncate font-medium">{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* QR Code */}
      <div 
        className="absolute flex flex-col items-center justify-center border-[1.5px] border-black p-2 bg-white"
        style={{ 
          top: `${config.qr.top}px`, 
          left: `${config.qr.left}px`
        }}
      >
        <QRCodeSVG 
          value={qrValue} 
          size={config.qr.size} 
          level="M"
          includeMargin={false}
        />
        <div className="mt-2 text-center">
          <p className="text-[7px] font-black leading-none">SCAN FOR</p>
          <p className="text-[7px] font-black leading-none">FULL SPECS</p>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeModule, setActiveModule] = useState<'home' | 'labels' | 'fibre' | 'ink' | 'database' | 'timeclock' | 'production' | 'logistics' | 'engineering' | 'traceability'>('home');
  const [activeSubModule, setActiveSubModule] = useState<string>('');
  const [labelType, setLabelType] = useState<'store' | 'product'>('store');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  
  // --- Factory Flow States ---
  const [rawMaterialCodes, setRawMaterialCodes] = useState<RawMaterialCode[]>(() => {
    const saved = localStorage.getItem('fiberqc_rm_codes');
    return saved ? JSON.parse(saved) : [];
  });
  const [productCodes, setProductCodes] = useState<ProductCode[]>(() => {
    const saved = localStorage.getItem('fiberqc_product_codes');
    return saved ? JSON.parse(saved) : [];
  });
  const [boms, setBoms] = useState<BOM[]>(() => {
    const saved = localStorage.getItem('fiberqc_boms');
    return saved ? JSON.parse(saved) : [];
  });
  const [paperReels, setPaperReels] = useState<PaperReel[]>(() => {
    const saved = localStorage.getItem('fiberqc_paper_reels');
    return saved ? JSON.parse(saved) : [];
  });
  const [inkCans, setInkCans] = useState<InkCan[]>(() => {
    const saved = localStorage.getItem('fiberqc_ink_cans');
    return saved ? JSON.parse(saved) : [];
  });
  const [printedReels, setPrintedReels] = useState<PrintedPaperReel[]>(() => {
    const saved = localStorage.getItem('fiberqc_printed_reels');
    return saved ? JSON.parse(saved) : [];
  });
  const [freshCutBags, setFreshCutBags] = useState<FreshCutBag[]>(() => {
    const saved = localStorage.getItem('fiberqc_fresh_cut_bags');
    return saved ? JSON.parse(saved) : [];
  });
  const [blownBags, setBlownBags] = useState<BlownBag[]>(() => {
    const saved = localStorage.getItem('fiberqc_blown_bags');
    return saved ? JSON.parse(saved) : [];
  });
  const [shakenBags, setShakenBags] = useState<ShakenBag[]>(() => {
    const saved = localStorage.getItem('fiberqc_shaken_bags');
    return saved ? JSON.parse(saved) : [];
  });
  const [finalBoxes, setFinalBoxes] = useState<FinalBox[]>(() => {
    const saved = localStorage.getItem('fiberqc_final_boxes');
    return saved ? JSON.parse(saved) : [];
  });

  const [fibreChecks, setFibreChecks] = useState<any[]>(() => {
    const saved = localStorage.getItem('fiberqc_fibre_checks');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Printer States ---
  const [printerDevice, setPrinterDevice] = useState<BluetoothDevice | null>(null);
  const [printerCharacteristic, setPrinterCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [isConnectingPrinter, setIsConnectingPrinter] = useState(false);
  const [bluetoothLogs, setBluetoothLogs] = useState<string[]>([]);
  const [diagnostics, setDiagnostics] = useState<BluetoothDiagnostics>({
    bluetoothSupported: false,
    secureContext: false,
    inIframe: false,
    userAgent: ''
  });

  // Run diagnostics on mount
  React.useEffect(() => {
    const diag = bluetoothService.checkSupport();
    setDiagnostics(diag);
    setBluetoothLogs(bluetoothService.getLogs());
  }, []);

  const connectPrinter = async (useFilters: boolean = true) => {
    setIsConnectingPrinter(true);
    setBluetoothLogs(bluetoothService.getLogs());
    
    try {
      // 1. Request Device (Directly in user gesture)
      const device = await bluetoothService.requestDevice(useFilters);
      setBluetoothLogs(bluetoothService.getLogs());

      // 2. Connect to GATT
      const server = await bluetoothService.connect(device);
      setBluetoothLogs(bluetoothService.getLogs());

      // 3. Discover Services
      const services = await bluetoothService.discoverServices(server);
      setBluetoothLogs(bluetoothService.getLogs());

      if (services.length === 0) {
        throw new Error("Nenhum serviço encontrado no dispositivo.");
      }

      // 4. Get Characteristic
      // Try to find the characteristic in any of the primary services
      let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
      for (const service of services) {
        try {
          characteristic = await bluetoothService.getPrinterCharacteristic(service);
          if (characteristic) break;
        } catch (e) {
          continue;
        }
      }

      if (characteristic) {
        setPrinterDevice(device);
        setPrinterCharacteristic(characteristic);
        
        device.addEventListener('gattserverdisconnected', () => {
          setPrinterDevice(null);
          setPrinterCharacteristic(null);
          bluetoothService.checkSupport(); // Just to log disconnection
          setBluetoothLogs(bluetoothService.getLogs());
        });

        setIsPrinterModalOpen(false);
        alert(`Conectado com sucesso à ${device.name}!`);
      } else {
        throw new Error("Característica de impressão compatível não encontrada.");
      }
    } catch (error) {
      setBluetoothLogs(bluetoothService.getLogs());
      if ((error as any).name === 'NotFoundError') {
        // User cancelled, no need for alert
        return;
      }
      
      const msg = error instanceof Error ? error.message : String(error);
      alert(`Falha na conexão: ${msg}`);
    } finally {
      setIsConnectingPrinter(false);
      setBluetoothLogs(bluetoothService.getLogs());
    }
  };

  const printLabel = async (elementId: string) => {
    if (!printerCharacteristic) {
      alert("Impressora não conectada.");
      return;
    }

    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      // 1. Capture image at high quality
      const dataUrl = await toPng(element, { 
        pixelRatio: 3, 
        backgroundColor: '#ffffff'
      });

      // 2. Process image to monochrome bitmap
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => img.onload = resolve);

      const canvas = document.createElement('canvas');
      // M220 80mm width is roughly 640 dots at 203dpi
      canvas.width = 640;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const bitmap = new Uint8Array((canvas.width * canvas.height) / 8);

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const avg = (r + g + b) / 3;
        // Threshold for black/white
        const bit = avg < 150 ? 1 : 0; 
        
        const pixelIdx = i / 4;
        const byteIdx = Math.floor(pixelIdx / 8);
        const bitIdx = 7 - (pixelIdx % 8);
        
        if (bit) {
          bitmap[byteIdx] |= (1 << bitIdx);
        }
      }

      // 3. Send Phomemo protocol commands
      const send = async (data: number[] | Uint8Array) => {
        const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);
        // BLE packets usually limited to 20-512 bytes depending on MTU
        const mtu = 20; 
        for (let i = 0; i < uint8.length; i += mtu) {
          await printerCharacteristic.writeValueWithoutResponse(uint8.slice(i, i + mtu));
        }
      };

      // Phomemo M-series / Print Master protocol often requires a specific sequence
      // Start of Job
      await send([0x1b, 0x40]); // ESC @ (Initialize)
      await send([0x1b, 0x61, 0x01]); // Center alignment
      
      // Set density
      await send([0x1f, 0x11, 0x02]); 

      // Print bitmap command: ESC v n L H (Standard ESC/POS bitmap)
      const wBytes = canvas.width / 8;
      const hL = canvas.height % 256;
      const hH = Math.floor(canvas.height / 256);
      
      // GS v 0 m xL xH yL yH d1...dk
      await send([0x1d, 0x76, 0x30, 0x00, wBytes, 0x00, hL, hH]);
      await send(bitmap);

      // Feed and finish
      await send([0x1b, 0x64, 0x03]); // Feed 3 lines
      await send([0x1b, 0x6d]);       // Cut
      
      alert("Impressão enviada!");
    } catch (error) {
      console.error("Erro ao imprimir:", error);
      alert("Erro ao imprimir: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  // --- Label Layout Config ---
  const [storeBoxConfig, setStoreBoxConfig] = useState(() => {
    const saved = localStorage.getItem('fiberqc_store_box_config');
    return saved ? JSON.parse(saved) : {
      logo: { top: 15, left: 15, width: 90 },
      title: { top: 15, left: 120, fontSize: 16 },
      table: { top: 65, left: 15, width: 270, fontSize: 12 },
      barcode: { top: 140, left: 40, width: 220, height: 45 }
    };
  });

  const [productCheckConfig, setProductCheckConfig] = useState(() => {
    const saved = localStorage.getItem('fiberqc_product_check_config');
    return saved ? JSON.parse(saved) : {
      logo: { top: 15, left: 15, width: 80 },
      title: { top: 15, left: 180, fontSize: 14, subSize: 8 },
      table: { top: 60, left: 15, width: 180, fontSize: 8.5 },
      qr: { top: 60, left: 210, size: 85 }
    };
  });

  // Database States (persisted in localStorage)
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [showAllCustomers, setShowAllCustomers] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('fiberqc_customers');
    const data = saved ? JSON.parse(saved) : [
      { id: '1', name: 'Louisenthal' },
      { id: '2', name: 'Crane Currency' },
      { id: '3', name: 'De La Rue' }
    ];
    return [...data].sort((a, b) => a.name.localeCompare(b.name));
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('fiberqc_products');
    const data = saved ? JSON.parse(saved) : [
      { 
        id: '1', 
        name: 'Standard Red/Yellow', 
        colour: 'Red / Yellow', 
        colorVisibility: 'Invisible UV',
        cutType: 'Random', 
        length: '3 mm', 
        pitch: '0.30 mm', 
        gsm: '22' 
      }
    ];
    return [...data].sort((a, b) => a.name.localeCompare(b.name));
  });

  // --- Sync Logic ---
  // Load data from server on mount
  React.useEffect(() => {
    const loadData = async () => {
      setSyncStatus('syncing');
      try {
        const response = await fetch('/api/data');
        if (response.ok) {
          const data = await response.json();
          if (Object.keys(data).length > 0) {
            if (data.fiberqc_rm_codes) setRawMaterialCodes(data.fiberqc_rm_codes);
            if (data.fiberqc_product_codes) setProductCodes(data.fiberqc_product_codes);
            if (data.fiberqc_boms) setBoms(data.fiberqc_boms);
            if (data.fiberqc_paper_reels) setPaperReels(data.fiberqc_paper_reels);
            if (data.fiberqc_ink_cans) setInkCans(data.fiberqc_ink_cans);
            if (data.fiberqc_printed_reels) setPrintedReels(data.fiberqc_printed_reels);
            if (data.fiberqc_fresh_cut_bags) setFreshCutBags(data.fiberqc_fresh_cut_bags);
            if (data.fiberqc_blown_bags) setBlownBags(data.fiberqc_blown_bags);
            if (data.fiberqc_shaken_bags) setShakenBags(data.fiberqc_shaken_bags);
            if (data.fiberqc_final_boxes) setFinalBoxes(data.fiberqc_final_boxes);
            if (data.fiberqc_fibre_checks) setFibreChecks(data.fiberqc_fibre_checks);
            if (data.fiberqc_store_box_config) setStoreBoxConfig(data.fiberqc_store_box_config);
            if (data.fiberqc_product_check_config) setProductCheckConfig(data.fiberqc_product_check_config);
            if (data.fiberqc_customers) setCustomers(data.fiberqc_customers);
            if (data.fiberqc_products) setProducts(data.fiberqc_products);
            setSyncStatus('synced');
          } else {
            setSyncStatus('idle');
          }
        }
      } catch (error) {
        console.error("Failed to load data from server:", error);
        setSyncStatus('error');
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadData();
  }, []);

  // Save data to server and localStorage (debounced)
  React.useEffect(() => {
    if (!isDataLoaded) return;

    const timer = setTimeout(async () => {
      setSyncStatus('syncing');
      const allData = {
        fiberqc_rm_codes: rawMaterialCodes,
        fiberqc_product_codes: productCodes,
        fiberqc_boms: boms,
        fiberqc_paper_reels: paperReels,
        fiberqc_ink_cans: inkCans,
        fiberqc_printed_reels: printedReels,
        fiberqc_fresh_cut_bags: freshCutBags,
        fiberqc_blown_bags: blownBags,
        fiberqc_shaken_bags: shakenBags,
        fiberqc_final_boxes: finalBoxes,
        fiberqc_fibre_checks: fibreChecks,
        fiberqc_store_box_config: storeBoxConfig,
        fiberqc_product_check_config: productCheckConfig,
        fiberqc_customers: customers,
        fiberqc_products: products,
      };

      // Always update localStorage as fallback
      Object.entries(allData).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });

      try {
        const response = await fetch('/api/data/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(allData),
        });
        if (response.ok) {
          setSyncStatus('synced');
        } else {
          setSyncStatus('error');
        }
      } catch (error) {
        console.error("Failed to save data to server:", error);
        setSyncStatus('error');
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(timer);
  }, [
    isDataLoaded,
    rawMaterialCodes, productCodes, boms, paperReels, inkCans, 
    printedReels, freshCutBags, blownBags, shakenBags, finalBoxes, 
    fibreChecks, storeBoxConfig, productCheckConfig, customers, products
  ]);

  // Form States
  const [storeData, setStoreData] = useState({
    boxNr: '1',
    month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date()),
    year: new Date().getFullYear().toString()
  });

  const [productData, setProductData] = useState({
    customer: '',
    colour: '',
    quantity: '',
    cutType: 'Random',
    length: '',
    pitch: '',
    gsm: '',
    op: '',
    dn: '',
    deliveryData: ''
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const downloadLabel = async (id: string, name: string, format: 'png' | 'pdf' = 'png') => {
    const element = document.getElementById(id);
    if (!element) return;
    
    try {
      const dataUrl = await toPng(element, {
        pixelRatio: 3, // High quality for thermal printing
        backgroundColor: '#ffffff',
      });

      if (format === 'pdf') {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [80, 50]
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, 80, 50);
        pdf.save(`${name}.pdf`);
      } else {
        const link = document.createElement('a');
        link.download = `${name}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Download failed', err);
      alert("Falha ao gerar arquivo. Tente novamente.");
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl p-6 flex flex-col gap-8 transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between lg:justify-start gap-3 px-2">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-900/20">
              <Factory className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">FiberQC</h1>
              <p className="text-xs text-slate-500 font-mono">v1.0.0-PROD</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Home" 
            active={activeModule === 'home'} 
            onClick={() => {
              setActiveModule('home');
              setIsSidebarOpen(false);
            }} 
          />
          <SidebarItem 
            icon={Factory} 
            label="Production" 
            active={activeModule === 'production'} 
            onClick={() => {
              setActiveModule('production');
              setIsSidebarOpen(false);
            }} 
          />
          <SidebarItem 
            icon={Printer} 
            label="Label Printing" 
            active={activeModule === 'labels'} 
            onClick={() => {
              setActiveModule('labels');
              setIsSidebarOpen(false);
            }} 
          />
          <SidebarItem 
            icon={Bluetooth} 
            label="Printer Status" 
            active={isPrinterModalOpen} 
            onClick={() => {
              setIsPrinterModalOpen(true);
              setIsSidebarOpen(false);
            }} 
          />
          <SidebarItem 
            icon={Database} 
            label="Database" 
            active={activeModule === 'database'} 
            onClick={() => {
              setActiveModule('database');
              setIsSidebarOpen(false);
            }} 
          />
          <SidebarItem 
            icon={CheckSquare} 
            label="Fibre Verification" 
            active={activeModule === 'fibre'} 
            onClick={() => {
              setActiveModule('fibre');
              setIsSidebarOpen(false);
            }} 
          />
          <SidebarItem 
            icon={Clock} 
            label="Time Clock" 
            active={activeModule === 'timeclock'} 
            onClick={() => {
              setActiveModule('timeclock');
              setIsSidebarOpen(false);
            }} 
          />
          <SidebarItem 
            icon={Droplets} 
            label="Ink Check" 
            active={activeModule === 'ink'} 
            onClick={() => {}} 
            disabled
          />
        </nav>

        <div className="mt-auto p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Cloud Sync</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {syncStatus === 'syncing' ? (
                <RefreshCw className="text-blue-400 animate-spin" size={14} />
              ) : syncStatus === 'synced' ? (
                <Cloud className="text-emerald-400" size={14} />
              ) : syncStatus === 'error' ? (
                <CloudOff className="text-rose-400" size={14} />
              ) : (
                <Cloud className="text-slate-500" size={14} />
              )}
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                syncStatus === 'syncing' ? "text-blue-400" :
                syncStatus === 'synced' ? "text-emerald-400" :
                syncStatus === 'error' ? "text-rose-400" : "text-slate-500"
              )}>
                {syncStatus === 'syncing' ? 'Syncing...' :
                 syncStatus === 'synced' ? 'Synced' :
                 syncStatus === 'error' ? 'Sync Error' : 'Offline'}
              </span>
            </div>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              syncStatus === 'synced' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
              syncStatus === 'syncing' ? "bg-blue-500 animate-pulse" :
              syncStatus === 'error' ? "bg-rose-500" : "bg-slate-700"
            )} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* Mobile Header */}
        <div className="flex items-center gap-4 mb-6 lg:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400"
          >
            <Menu size={24} />
          </button>
          <h1 className="font-bold text-xl">FiberQC</h1>
        </div>

        {activeModule === 'home' ? (
          <Home 
            onSelectModule={(mod) => setActiveModule(mod)} 
            printerDevice={printerDevice}
            onConnectPrinter={() => setIsPrinterModalOpen(true)}
          />
        ) : activeModule === 'production' ? (
          <Production 
            products={products}
            productCodes={productCodes}
            boms={boms}
            paperReels={paperReels}
            setPaperReels={setPaperReels}
            inkCans={inkCans}
            setInkCans={setInkCans}
            printedReels={printedReels}
            setPrintedReels={setPrintedReels}
            freshCutBags={freshCutBags}
            setFreshCutBags={setFreshCutBags}
            blownBags={blownBags}
            setBlownBags={setBlownBags}
            shakenBags={shakenBags}
            setShakenBags={setShakenBags}
            finalBoxes={finalBoxes}
            setFinalBoxes={setFinalBoxes}
          />
        ) : activeModule === 'labels' ? (
          <div className="max-w-5xl mx-auto">
            <header className="mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Label Printing</h2>
              <p className="text-sm md:text-base text-slate-400">Generate and print standardized labels.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              {/* Controls */}
              <div className="lg:col-span-5 space-y-4 md:space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Label Type</label>
                  <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button 
                      onClick={() => setLabelType('store')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all",
                        labelType === 'store' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      <Box size={14} />
                      <span className="text-xs md:text-sm font-medium">Store Box</span>
                    </button>
                    <button 
                      onClick={() => setLabelType('product')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all",
                        labelType === 'product' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      <QrCode size={14} />
                      <span className="text-xs md:text-sm font-medium">Product Check</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4 md:mb-6">Configuration</h3>
                  
                  {labelType === 'store' ? (
                    <div className="space-y-3 md:space-y-4">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-400 mb-1">Box Number</label>
                        <input 
                          type="text" 
                          value={storeData.boxNr}
                          onChange={(e) => setStoreData({...storeData, boxNr: e.target.value})}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-400 mb-1">Month</label>
                          <select 
                            value={storeData.month}
                            onChange={(e) => setStoreData({...storeData, month: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                          >
                            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-400 mb-1">Year</label>
                          <select 
                            value={storeData.year}
                            onChange={(e) => setStoreData({...storeData, year: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                          >
                            {Array.from({ length: 2100 - 2020 + 1 }, (_, i) => (2020 + i).toString()).map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        {/* CUSTOMER with Custom Dropdown */}
                        <CustomDropdown 
                          label="Customer"
                          placeholder="Select or type customer..."
                          value={productData.customer}
                          options={([...new Set(customers.map(c => c.name))] as string[]).sort((a, b) => a.localeCompare(b))}
                          onChange={(val) => setProductData({...productData, customer: val})}
                        />

                        {/* COLOUR with Custom Dropdown and Auto-fill */}
                        <CustomDropdown 
                          label="Colour"
                          placeholder="Select or type colour..."
                          value={productData.colour}
                          options={([...new Set(products.map(p => p.colour).filter(Boolean))] as string[]).sort((a, b) => a.localeCompare(b))}
                          onChange={(val) => {
                            const product = products.find(p => p.colour === val || p.name === val);
                            if (product) {
                              setProductData({
                                ...productData,
                                colour: product.colour,
                                cutType: product.cutType,
                                length: product.length,
                                pitch: product.pitch,
                                gsm: product.gsm
                              });
                            } else {
                              setProductData({...productData, colour: val});
                            }
                          }}
                        />

                        {/* Other Fields */}
                        {Object.entries({
                          quantity: "e.g. 80 Kg",
                          cutType: "Random",
                          length: "e.g. 3",
                          pitch: "e.g. 0.30",
                          gsm: "e.g. 22",
                          op: "Order Number",
                          dn: "Delivery Note",
                          deliveryData: "DD/MM/YY"
                        }).map(([key, placeholder]) => {
                          const label = key.replace(/([A-Z])/g, ' $1').toUpperCase();
                          const value = (productData as any)[key];

                          if (key === 'cutType') {
                            return (
                              <div key={key}>
                                <label className="block text-[10px] font-medium text-slate-400 mb-1 uppercase tracking-wider">{label}</label>
                                <select 
                                  value={value}
                                  onChange={(e) => setProductData({...productData, cutType: e.target.value})}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                  <option value="Random">Random</option>
                                  <option value="Register">Register</option>
                                </select>
                              </div>
                            );
                          }

                          const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
                            let val = e.target.value.trim();
                            if (!val) return;
                            
                            if (key === 'length' || key === 'pitch') {
                              if (!val.toLowerCase().endsWith('mm')) {
                                setProductData(prev => ({ ...prev, [key]: `${val} mm` }));
                              }
                            } else if (key === 'gsm') {
                              if (!val.toLowerCase().endsWith('gsm')) {
                                setProductData(prev => ({ ...prev, [key]: `${val} GSM` }));
                              }
                            } else if (key === 'quantity') {
                              if (!val.toLowerCase().endsWith('kg')) {
                                setProductData(prev => ({ ...prev, [key]: `${val} Kg` }));
                              }
                            }
                          };

                          if (key === 'deliveryData') {
                            return (
                              <div key={key} className="relative">
                                <label className="block text-[10px] font-medium text-slate-400 mb-1 uppercase tracking-wider">{label}</label>
                                <div 
                                  onClick={() => setIsDatePickerOpen(true)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer flex items-center justify-between group"
                                >
                                  <span className={cn(value ? "text-slate-100" : "text-slate-700")}>
                                    {value || placeholder}
                                  </span>
                                  <Calendar size={14} className="text-slate-600 group-hover:text-emerald-500 transition-colors" />
                                </div>
                                <AnimatePresence>
                                  {isDatePickerOpen && (
                                    <WheelDatePicker 
                                      isOpen={isDatePickerOpen}
                                      onClose={() => setIsDatePickerOpen(false)}
                                      onSelect={(date) => setProductData({...productData, deliveryData: date})}
                                    />
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          }

                          return (
                            <div key={key}>
                              <label className="block text-[10px] font-medium text-slate-400 mb-1 uppercase">{label}</label>
                              <input 
                                type="text" 
                                value={value}
                                placeholder={placeholder}
                                onChange={(e) => setProductData({...productData, [key]: e.target.value})}
                                onBlur={handleBlur}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-8 shadow-xl flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px]">
                  <div className="mb-4 md:mb-6 flex items-center justify-between w-full">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Preview (80x50mm)</h3>
                    <div className="flex items-center gap-3">
                      {/* Printer Status */}
                      <button 
                        onClick={() => setIsPrinterModalOpen(true)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border shadow-sm",
                          printerDevice 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
                        )}
                        title={printerDevice ? "Printer Connected" : "Click to connect Phomemo M220/M110"}
                      >
                        {isConnectingPrinter ? (
                          <span className="animate-pulse flex items-center gap-1">
                            <RefreshCw size={10} className="animate-spin" />
                            Connecting...
                          </span>
                        ) : printerDevice ? (
                          <>
                            <Bluetooth size={12} className="text-emerald-500" />
                            <span className="max-w-[80px] truncate">{printerDevice.name || 'Printer'}</span>
                          </>
                        ) : (
                          <>
                            <BluetoothOff size={12} />
                            Connect Printer
                          </>
                        )}
                      </button>
                      <div className="flex gap-2 border-l border-slate-800 pl-3">
                         <span className="px-2 py-1 rounded bg-slate-800 text-[8px] font-mono text-slate-400">Thermal</span>
                         <span className="px-2 py-1 rounded bg-slate-800 text-[8px] font-mono text-slate-400">300 DPI</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative group scale-[0.8] sm:scale-100 origin-center">
                    <div className="absolute -inset-4 bg-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      {labelType === 'store' ? (
                        <StoreBoxLabel data={storeData} config={storeBoxConfig} />
                      ) : (
                        <ProductCheckLabel data={productData} config={productCheckConfig} />
                      )}
                    </div>
                  </div>

                  {labelType === 'store' ? (
                    <div className="mt-8 w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                        <Settings size={16} className="text-emerald-500" />
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">Store Box Layout</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Logo Config */}
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logo</h5>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Top</label>
                              <input type="number" value={storeBoxConfig.logo.top} onChange={(e) => setStoreBoxConfig({...storeBoxConfig, logo: {...storeBoxConfig.logo, top: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Left</label>
                              <input type="number" value={storeBoxConfig.logo.left} onChange={(e) => setStoreBoxConfig({...storeBoxConfig, logo: {...storeBoxConfig.logo, left: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Width</label>
                              <input type="number" value={storeBoxConfig.logo.width} onChange={(e) => setStoreBoxConfig({...storeBoxConfig, logo: {...storeBoxConfig.logo, width: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Title Config */}
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Title</h5>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Top</label>
                              <input type="number" value={storeBoxConfig.title.top} onChange={(e) => setStoreBoxConfig({...storeBoxConfig, title: {...storeBoxConfig.title, top: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Left</label>
                              <input type="number" value={storeBoxConfig.title.left} onChange={(e) => setStoreBoxConfig({...storeBoxConfig, title: {...storeBoxConfig.title, left: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Size</label>
                              <input type="number" value={storeBoxConfig.title.fontSize} onChange={(e) => setStoreBoxConfig({...storeBoxConfig, title: {...storeBoxConfig.title, fontSize: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Table Config */}
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Table</h5>
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Top</label>
                              <input type="number" value={storeBoxConfig.table.top} onChange={(e) => setStoreBoxConfig({...storeBoxConfig, table: {...storeBoxConfig.table, top: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Left</label>
                              <input type="number" value={storeBoxConfig.table.left} onChange={(e) => setStoreBoxConfig({...storeBoxConfig, table: {...storeBoxConfig.table, left: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Width</label>
                              <input type="number" value={storeBoxConfig.table.width} onChange={(e) => setStoreBoxConfig({...storeBoxConfig, table: {...storeBoxConfig.table, width: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Size</label>
                              <input type="number" value={storeBoxConfig.table.fontSize} onChange={(e) => setStoreBoxConfig({...storeBoxConfig, table: {...storeBoxConfig.table, fontSize: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Barcode Config */}
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Barcode</h5>
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Top</label>
                              <input type="number" value={storeBoxConfig.barcode.top} onChange={(e) => setStoreBoxConfig({...storeBoxConfig, barcode: {...storeBoxConfig.barcode, top: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Left</label>
                              <input type="number" value={storeBoxConfig.barcode.left} onChange={(e) => setStoreBoxConfig({...storeBoxConfig, barcode: {...storeBoxConfig.barcode, left: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Width</label>
                              <input type="number" value={storeBoxConfig.barcode.width} onChange={(e) => setStoreBoxConfig({...storeBoxConfig, barcode: {...storeBoxConfig.barcode, width: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Height</label>
                              <input type="number" value={storeBoxConfig.barcode.height} onChange={(e) => setStoreBoxConfig({...storeBoxConfig, barcode: {...storeBoxConfig.barcode, height: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setStoreBoxConfig({
                            logo: { top: 15, left: 15, width: 90 },
                            title: { top: 15, left: 120, fontSize: 16 },
                            table: { top: 65, left: 15, width: 270, fontSize: 12 },
                            barcode: { top: 140, left: 40, width: 220, height: 45 }
                          });
                        }}
                        className="mt-6 text-[10px] font-bold text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-widest"
                      >
                        Reset to Defaults
                      </button>
                    </div>
                  ) : (
                    <div className="mt-8 w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                        <Settings size={16} className="text-emerald-500" />
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">Product Check Layout</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Logo Config */}
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logo</h5>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Top</label>
                              <input type="number" value={productCheckConfig.logo.top} onChange={(e) => setProductCheckConfig({...productCheckConfig, logo: {...productCheckConfig.logo, top: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Left</label>
                              <input type="number" value={productCheckConfig.logo.left} onChange={(e) => setProductCheckConfig({...productCheckConfig, logo: {...productCheckConfig.logo, left: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Width</label>
                              <input type="number" value={productCheckConfig.logo.width} onChange={(e) => setProductCheckConfig({...productCheckConfig, logo: {...productCheckConfig.logo, width: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Title Config */}
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Title</h5>
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Top</label>
                              <input type="number" value={productCheckConfig.title.top} onChange={(e) => setProductCheckConfig({...productCheckConfig, title: {...productCheckConfig.title, top: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Left</label>
                              <input type="number" value={productCheckConfig.title.left} onChange={(e) => setProductCheckConfig({...productCheckConfig, title: {...productCheckConfig.title, left: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Size</label>
                              <input type="number" value={productCheckConfig.title.fontSize} onChange={(e) => setProductCheckConfig({...productCheckConfig, title: {...productCheckConfig.title, fontSize: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Sub</label>
                              <input type="number" value={productCheckConfig.title.subSize} onChange={(e) => setProductCheckConfig({...productCheckConfig, title: {...productCheckConfig.title, subSize: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Table Config */}
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Table</h5>
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Top</label>
                              <input type="number" value={productCheckConfig.table.top} onChange={(e) => setProductCheckConfig({...productCheckConfig, table: {...productCheckConfig.table, top: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Left</label>
                              <input type="number" value={productCheckConfig.table.left} onChange={(e) => setProductCheckConfig({...productCheckConfig, table: {...productCheckConfig.table, left: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Width</label>
                              <input type="number" value={productCheckConfig.table.width} onChange={(e) => setProductCheckConfig({...productCheckConfig, table: {...productCheckConfig.table, width: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Size</label>
                              <input type="number" value={productCheckConfig.table.fontSize} onChange={(e) => setProductCheckConfig({...productCheckConfig, table: {...productCheckConfig.table, fontSize: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                          </div>
                        </div>

                        {/* QR Config */}
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">QR Code</h5>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Top</label>
                              <input type="number" value={productCheckConfig.qr.top} onChange={(e) => setProductCheckConfig({...productCheckConfig, qr: {...productCheckConfig.qr, top: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Left</label>
                              <input type="number" value={productCheckConfig.qr.left} onChange={(e) => setProductCheckConfig({...productCheckConfig, qr: {...productCheckConfig.qr, left: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-500 mb-1">Size</label>
                              <input type="number" value={productCheckConfig.qr.size} onChange={(e) => setProductCheckConfig({...productCheckConfig, qr: {...productCheckConfig.qr, size: parseInt(e.target.value) || 0}})} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setProductCheckConfig({
                            logo: { top: 15, left: 15, width: 80 },
                            title: { top: 15, left: 180, fontSize: 14, subSize: 8 },
                            table: { top: 60, left: 15, width: 180, fontSize: 8.5 },
                            qr: { top: 60, left: 210, size: 85 }
                          });
                        }}
                        className="mt-6 text-[10px] font-bold text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-widest"
                      >
                        Reset to Defaults
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 mt-6 md:mt-10 justify-center">
                    <button 
                      onClick={() => downloadLabel(
                        labelType === 'store' ? 'store-box-label' : 'product-check-label',
                        labelType === 'store' ? `box_${storeData.boxNr}` : 'product_check',
                        'png'
                      )}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-bold transition-all shadow-lg active:scale-95"
                    >
                      <Download size={18} />
                      Download PNG
                    </button>

                    <button 
                      onClick={() => downloadLabel(
                        labelType === 'store' ? 'store-box-label' : 'product-check-label',
                        labelType === 'store' ? `box_${storeData.boxNr}` : 'product_check',
                        'pdf'
                      )}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-bold transition-all shadow-lg active:scale-95"
                    >
                      <Save size={18} />
                      Save PDF
                    </button>

                    <button 
                      onClick={() => printLabel(labelType === 'store' ? 'store-box-label' : 'product-check-label')}
                      disabled={!printerDevice}
                      className={cn(
                        "flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-bold transition-all shadow-lg active:scale-95",
                        printerDevice 
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20" 
                          : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                      )}
                    >
                      <Printer size={18} />
                      Print via Bluetooth
                    </button>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 md:p-6 flex gap-3 md:gap-4">
                  <div className="bg-blue-500/20 p-2 md:p-3 rounded-xl h-fit">
                    <Printer className="text-blue-400" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-400 mb-1 text-sm md:text-base">Printing Instructions</h4>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                      Optimized for 80x50mm. Set scale to "Actual Size" or "100%" in printer settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeModule === 'database' ? (
          <div className="max-w-5xl mx-auto">
            <header className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight mb-2">Database</h2>
              <p className="text-slate-400">Manage your customers and product specifications.</p>
            </header>

            <div className="flex flex-col gap-8">
              {/* Customers Section */}
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <CheckSquare className="text-emerald-500" size={20} />
                    Customers
                  </h3>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="New customer name..."
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newCustomerName.trim()) {
                          const newCust = { id: uuidv4(), name: newCustomerName.trim() };
                          setCustomers(prev => [...prev, newCust].sort((a, b) => a.name.localeCompare(b.name)));
                          setNewCustomerName('');
                        }
                      }}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all w-64"
                    />
                    <button 
                      onClick={() => {
                        if (newCustomerName.trim()) {
                          const newCust = { id: uuidv4(), name: newCustomerName.trim() };
                          setCustomers(prev => [...prev, newCust].sort((a, b) => a.name.localeCompare(b.name)));
                          setNewCustomerName('');
                        }
                      }}
                      disabled={!newCustomerName.trim()}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    >
                      <Plus size={14} />
                      Add Customer
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer Name</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {(showAllCustomers ? customers : customers.slice(0, 3)).map(customer => (
                        <tr key={customer.id} className="group hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <input 
                              type="text"
                              value={customer.name}
                              onChange={(e) => {
                                setCustomers(customers.map(c => c.id === customer.id ? {...c, name: e.target.value} : c));
                              }}
                              onBlur={() => {
                                setCustomers(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
                              }}
                              className="w-full bg-transparent border-none font-medium text-slate-200 focus:ring-1 focus:ring-emerald-500/30 rounded px-2 py-1 -ml-2"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => setCustomers(customers.filter(c => c.id !== customer.id))}
                              className="p-2 text-slate-600 hover:text-red-500 transition-all"
                              title="Delete Customer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {customers.length > 3 && (
                  <button 
                    onClick={() => setShowAllCustomers(!showAllCustomers)}
                    className="w-full mt-4 py-2 text-xs font-bold text-slate-500 hover:text-emerald-500 transition-colors border-t border-slate-800"
                  >
                    {showAllCustomers ? 'Show Less' : `Show All (${customers.length})`}
                  </button>
                )}

                {customers.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">No customers registered.</div>
                )}
              </section>

              {/* Products Section */}
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Box className="text-emerald-500" size={20} />
                    Products
                  </h3>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="New product name..."
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newProductName.trim()) {
                          const newProd = { 
                            id: uuidv4(), 
                            name: newProductName.trim(),
                            colour: '',
                            colorVisibility: 'Invisible UV' as const,
                            cutType: 'Random',
                            length: '',
                            pitch: '',
                            gsm: ''
                          };
                          setProducts(prev => [...prev, newProd].sort((a, b) => a.name.localeCompare(b.name)));
                          setNewProductName('');
                        }
                      }}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all w-64"
                    />
                    <button 
                      onClick={() => {
                        if (newProductName.trim()) {
                          const newProd = { 
                            id: uuidv4(), 
                            name: newProductName.trim(),
                            colour: '',
                            colorVisibility: 'Invisible UV' as const,
                            cutType: 'Random',
                            length: '',
                            pitch: '',
                            gsm: ''
                          };
                          setProducts(prev => [...prev, newProd].sort((a, b) => a.name.localeCompare(b.name)));
                          setNewProductName('');
                        }
                      }}
                      disabled={!newProductName.trim()}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    >
                      <Plus size={14} />
                      Add Product
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Product Name</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Colour</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Visibility</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Cut Type</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Length</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Pitch</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">GSM</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {(showAllProducts ? products : products.slice(0, 3)).map(product => (
                        <tr key={product.id} className="group hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <input 
                              type="text"
                              value={product.name}
                              onChange={(e) => {
                                setProducts(products.map(p => p.id === product.id ? {...p, name: e.target.value} : p));
                              }}
                              onBlur={() => {
                                setProducts(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
                              }}
                              className="w-full bg-transparent border-none font-bold text-emerald-400 focus:ring-1 focus:ring-emerald-500/30 rounded px-2 py-1 -ml-2"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="text"
                              value={product.colour}
                              onChange={(e) => {
                                setProducts(products.map(p => p.id === product.id ? {...p, colour: e.target.value} : p));
                              }}
                              className="w-full bg-transparent border-none text-xs text-slate-300 focus:ring-1 focus:ring-emerald-500/30 rounded px-2 py-1"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={product.colorVisibility || 'Invisible UV'}
                              onChange={(e) => {
                                setProducts(products.map(p => p.id === product.id ? {...p, colorVisibility: e.target.value as any} : p));
                              }}
                              className="w-full bg-transparent border-none text-xs text-slate-300 focus:ring-1 focus:ring-emerald-500/30 rounded px-2 py-1 appearance-none cursor-pointer"
                            >
                              <option value="Invisible UV" className="bg-slate-900">Invisible UV</option>
                              <option value="Visible" className="bg-slate-900">Visible</option>
                              <option value="Visible & Invisible" className="bg-slate-900">Visible & Invisible</option>
                              <option value="Invisible UV SW" className="bg-slate-900">Invisible UV (Short Wave)</option>
                              <option value="Invisible UV LW" className="bg-slate-900">Invisible UV (Long Wave)</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={product.cutType}
                              onChange={(e) => {
                                setProducts(products.map(p => p.id === product.id ? {...p, cutType: e.target.value} : p));
                              }}
                              className="w-full bg-transparent border-none text-xs text-slate-300 focus:ring-1 focus:ring-emerald-500/30 rounded px-2 py-1 appearance-none"
                            >
                              <option value="Random" className="bg-slate-900">Random</option>
                              <option value="Register" className="bg-slate-900">Register</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="text"
                              value={product.length}
                              onChange={(e) => {
                                setProducts(products.map(p => p.id === product.id ? {...p, length: e.target.value} : p));
                              }}
                              onBlur={(e) => {
                                let val = e.target.value.trim();
                                if (val && !val.toLowerCase().endsWith('mm')) {
                                  setProducts(products.map(p => p.id === product.id ? {...p, length: `${val} mm`} : p));
                                }
                              }}
                              className="w-full bg-transparent border-none text-xs text-slate-300 focus:ring-1 focus:ring-emerald-500/30 rounded px-2 py-1"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="text"
                              value={product.pitch}
                              onChange={(e) => {
                                setProducts(products.map(p => p.id === product.id ? {...p, pitch: e.target.value} : p));
                              }}
                              onBlur={(e) => {
                                let val = e.target.value.trim();
                                if (val && !val.toLowerCase().endsWith('mm')) {
                                  setProducts(products.map(p => p.id === product.id ? {...p, pitch: `${val} mm`} : p));
                                }
                              }}
                              className="w-full bg-transparent border-none text-xs text-slate-300 focus:ring-1 focus:ring-emerald-500/30 rounded px-2 py-1"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input 
                              type="text"
                              value={product.gsm}
                              onChange={(e) => {
                                setProducts(products.map(p => p.id === product.id ? {...p, gsm: e.target.value} : p));
                              }}
                              onBlur={(e) => {
                                let val = e.target.value.trim();
                                if (val && !val.toLowerCase().endsWith('gsm')) {
                                  setProducts(products.map(p => p.id === product.id ? {...p, gsm: `${val} GSM`} : p));
                                }
                              }}
                              className="w-full bg-transparent border-none text-xs text-slate-300 focus:ring-1 focus:ring-emerald-500/30 rounded px-2 py-1"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => setProducts(products.filter(p => p.id !== product.id))}
                              className="p-2 text-slate-600 hover:text-red-500 transition-all"
                              title="Delete Product"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {products.length > 3 && (
                  <button 
                    onClick={() => setShowAllProducts(!showAllProducts)}
                    className="w-full mt-4 py-2 text-xs font-bold text-slate-500 hover:text-emerald-500 transition-colors border-t border-slate-800"
                  >
                    {showAllProducts ? 'Show Less' : `Show All (${products.length})`}
                  </button>
                )}

                {products.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">No products registered.</div>
                )}
              </section>
            </div>
          </div>
        ) : activeModule === 'fibre' ? (
          <FibreVerification 
            customers={customers}
            products={products}
            sessions={fibreChecks}
            onAddProduct={(newProd) => {
              setProducts(prev => [...prev, newProd].sort((a, b) => a.name.localeCompare(b.name)));
            }}
            onSave={(newSession) => {
              setFibreChecks(prev => {
                const exists = prev.find(s => s.id === newSession.id);
                if (exists) {
                  return prev.map(s => s.id === newSession.id ? newSession : s);
                }
                return [newSession, ...prev];
              });
            }}
          />
        ) : activeModule === 'timeclock' ? (
          <TimeClock />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto px-4">
            <div className="bg-slate-900 p-6 md:p-8 rounded-full mb-6 border border-slate-800 shadow-2xl">
              <Factory className="text-slate-700 w-12 h-12 md:w-16 md:h-16" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Under Development</h2>
            <p className="text-sm md:text-base text-slate-400 mb-8">
              The {activeModule === 'fibre' ? 'Fibre Verification' : 'Ink Check'} module is part of our Phase 2 rollout.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Planned Features</h4>
                <ul className="text-xs md:text-sm space-y-2 text-slate-300">
                  <li className="flex items-center gap-2"><ChevronRight size={10} className="text-emerald-500" /> Real-time analysis</li>
                  <li className="flex items-center gap-2"><ChevronRight size={10} className="text-emerald-500" /> Database integration</li>
                </ul>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-left">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Timeline</h4>
                <p className="text-xs md:text-sm text-slate-300">Expected Q3 2026</p>
              </div>
            </div>
          </div>
        )}

        {/* Printer Connection Modal */}
        {isPrinterModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => !isConnectingPrinter && setIsPrinterModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <Printer className="text-emerald-500" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Printer Connection</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Bluetooth Setup & Diagnostics</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPrinterModalOpen(false)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {/* Warning for Iframe/Secure Context */}
                {(diagnostics.inIframe || !diagnostics.secureContext || !diagnostics.bluetoothSupported) && (
                  <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-4">
                    <div className="p-2 bg-rose-500/20 rounded-xl h-fit">
                      <BluetoothOff className="text-rose-500" size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-rose-500 mb-1">Environment Restriction Detected</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {!diagnostics.bluetoothSupported ? "Your browser does not support Web Bluetooth. " : ""}
                        {!diagnostics.secureContext ? "Web Bluetooth requires a Secure Context (HTTPS). " : ""}
                        {diagnostics.inIframe ? "This app is running inside an iframe, which often blocks Bluetooth access. " : ""}
                        <strong className="text-white block mt-2">Please open this app directly in Google Chrome or Microsoft Edge using the external URL.</strong>
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Connection Controls */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                      <div className={cn(
                        "relative w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                        isConnectingPrinter ? "border-emerald-500 border-t-transparent animate-spin" : "border-slate-800"
                      )}>
                        {!isConnectingPrinter && (
                          <Bluetooth className={cn(
                            "transition-colors duration-500",
                            printerDevice ? "text-emerald-500" : "text-slate-700"
                          )} size={40} />
                        )}
                      </div>
                      {printerDevice && !isConnectingPrinter && (
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1.5 rounded-full border-4 border-slate-900">
                          <CheckSquare className="text-white" size={12} />
                        </div>
                      )}
                    </div>

                    <h4 className="text-xl font-bold mb-2">
                      {printerDevice ? printerDevice.name : "No Printer Connected"}
                    </h4>
                    <p className="text-sm text-slate-400 mb-8 max-w-xs">
                      {printerDevice 
                        ? "Your printer is ready to use. You can now print labels directly from the app."
                        : "Connect your Phomemo M220, M110 or compatible Bluetooth label printer."}
                    </p>

                    <div className="w-full space-y-3">
                      <button
                        onClick={() => connectPrinter(true)}
                        disabled={isConnectingPrinter}
                        className={cn(
                          "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all",
                          isConnectingPrinter 
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
                        )}
                      >
                        {isConnectingPrinter ? (
                          <>
                            <RefreshCw className="animate-spin" size={18} />
                            Searching...
                          </>
                        ) : (
                          <>
                            <Bluetooth size={18} />
                            {printerDevice ? "Change Printer" : "Search & Connect"}
                          </>
                        )}
                      </button>

                      {!printerDevice && (
                        <button
                          onClick={() => connectPrinter(false)}
                          disabled={isConnectingPrinter}
                          className="w-full py-3 text-xs font-bold text-slate-500 hover:text-white transition-colors"
                        >
                          Fallback: Search All Devices
                        </button>
                      )}

                      {printerDevice && (
                        <button
                          onClick={() => {
                            printerDevice.gatt?.disconnect();
                            setPrinterDevice(null);
                            setPrinterCharacteristic(null);
                            bluetoothService.clearLogs();
                            setBluetoothLogs(bluetoothService.getLogs());
                          }}
                          className="w-full py-3 text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors"
                        >
                          Disconnect Device
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Diagnostics Panel */}
                  <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 flex flex-col">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">System Diagnostics</h5>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Bluetooth Supported</span>
                        <span className={diagnostics.bluetoothSupported ? "text-emerald-500" : "text-rose-500"}>
                          {diagnostics.bluetoothSupported ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Secure Context (HTTPS)</span>
                        <span className={diagnostics.secureContext ? "text-emerald-500" : "text-rose-500"}>
                          {diagnostics.secureContext ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Running in Iframe</span>
                        <span className={diagnostics.inIframe ? "text-amber-500" : "text-emerald-500"}>
                          {diagnostics.inIframe ? "Yes (May Block)" : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">GATT Connected</span>
                        <span className={printerDevice?.gatt?.connected ? "text-emerald-500" : "text-slate-600"}>
                          {printerDevice?.gatt?.connected ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>

                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Debug Logs</h5>
                    <div className="flex-1 bg-black/40 rounded-xl p-3 font-mono text-[9px] overflow-y-auto max-h-[150px] space-y-1 border border-slate-800/50">
                      {bluetoothLogs.length === 0 ? (
                        <span className="text-slate-700 italic">No logs yet...</span>
                      ) : (
                        bluetoothLogs.map((log, i) => (
                          <div key={i} className="text-slate-400 border-b border-slate-800/30 pb-1 last:border-0">
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-950 border-t border-slate-800 shrink-0">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Quick Guide</h5>
                    <ul className="text-[10px] text-slate-400 space-y-1">
                      <li>• Use <strong className="text-white">Chrome</strong> or <strong className="text-white">Edge</strong> on Desktop or Android.</li>
                      <li>• For iOS, use the <strong className="text-white">Bluefy</strong> browser app.</li>
                      <li>• Ensure the printer is ON and not paired with other apps.</li>
                    </ul>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={() => {
                        bluetoothService.clearLogs();
                        setBluetoothLogs(bluetoothService.getLogs());
                      }}
                      className="text-[9px] font-bold text-slate-600 hover:text-white uppercase tracking-widest"
                    >
                      Clear Logs
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
