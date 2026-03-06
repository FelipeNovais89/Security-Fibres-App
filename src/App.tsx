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
  Fan
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'motion/react';
import FibreVerification from './components/FibreVerification';
import WheelDatePicker from './components/WheelDatePicker';
import Home from './components/Home';
import TimeClock from './components/TimeClock';
import Production from './components/Production';
import { cn } from './utils/cn';

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

const StoreBoxLabel = ({ data }: { data: any }) => {
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
          height: 45,
          margin: 0,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch (e) {
        console.error("Barcode error", e);
      }
    }
  }, [autoBarcode]);

  return (
    <div 
      id="store-box-label"
      className="bg-white text-black p-4 border border-slate-200 shadow-sm flex flex-col"
      style={{ width: '80mm', height: '50mm', boxSizing: 'border-box', overflow: 'hidden' }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-24 h-10 flex-shrink-0 flex items-center">
          <img 
            src="https://media.licdn.com/dms/image/v2/C4E0BAQEm03RiTKqcpA/company-logo_200_200/company-logo_200_200/0/1630648866973/security_fibres_uk_limited_logo?e=2147483647&v=beta&t=R0VL_C7Lva5nqAjdK4OjOGPZK4hGJs3nFM5pwYIm40Q" 
            alt="Security Fibres Logo" 
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://picsum.photos/seed/logo/100/40";
            }}
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 className="text-[16px] font-bold text-slate-800 tracking-tight leading-tight pt-1">
          Fibre's Sample Bags
        </h2>
      </div>

      <div className="flex-1">
        <table className="w-full border-collapse border border-black text-[12px]">
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

      <div className="flex justify-center mt-2 h-[65px] overflow-hidden">
        <canvas ref={barcodeRef} className="max-w-full h-full"></canvas>
      </div>
    </div>
  );
};

const ProductCheckLabel = ({ data }: { data: any }) => {
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
      className="bg-white text-black p-4 border border-slate-200 shadow-sm flex flex-col"
      style={{ width: '80mm', height: '50mm', boxSizing: 'border-box', overflow: 'hidden' }}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="w-20 h-8 flex-shrink-0 flex items-center">
          <img 
            src="https://media.licdn.com/dms/image/v2/C4E0BAQEm03RiTKqcpA/company-logo_200_200/company-logo_200_200/0/1630648866973/security_fibres_uk_limited_logo?e=2147483647&v=beta&t=R0VL_C7Lva5nqAjdK4OjOGPZK4hGJs3nFM5pwYIm40Q" 
            alt="Security Fibres Logo" 
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://picsum.photos/seed/logo/100/40";
            }}
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="text-right">
          <h2 className="text-[14px] font-black uppercase tracking-tighter leading-none">Quality Control</h2>
          <p className="text-[8px] font-bold text-slate-500">PRODUCT VERIFICATION</p>
        </div>
      </div>

      <div className="flex gap-3 flex-1">
        {/* Left Side: Table */}
        <div className="flex-1">
          <table className="w-full border-collapse border-[1.5px] border-black text-[8.5px] h-full">
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

        {/* Right Side: QR Code */}
        <div className="w-[35%] flex flex-col items-center justify-center border-[1.5px] border-black p-2 bg-white">
          <QRCodeSVG 
            value={qrValue} 
            size={85} 
            level="M"
            includeMargin={false}
          />
          <div className="mt-2 text-center">
            <p className="text-[7px] font-black leading-none">SCAN FOR</p>
            <p className="text-[7px] font-black leading-none">FULL SPECS</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeModule, setActiveModule] = useState<'home' | 'labels' | 'fibre' | 'ink' | 'database' | 'timeclock' | 'production'>('home');
  const [labelType, setLabelType] = useState<'store' | 'product'>('store');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Fibre Check States
  const [fibreCheckStep, setFibreCheckStep] = useState<'setup' | 'boxes' | 'inspect'>('setup');
  const [currentFibreCheck, setCurrentFibreCheck] = useState<any>(null);
  const [fibreChecks, setFibreChecks] = useState<any[]>(() => {
    const saved = localStorage.getItem('fiberqc_fibre_checks');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);

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

  // Persist to localStorage
  React.useEffect(() => {
    localStorage.setItem('fiberqc_customers', JSON.stringify(customers));
  }, [customers]);

  React.useEffect(() => {
    localStorage.setItem('fiberqc_products', JSON.stringify(products));
  }, [products]);

  React.useEffect(() => {
    localStorage.setItem('fiberqc_fibre_checks', JSON.stringify(fibreChecks));
  }, [fibreChecks]);

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

  const downloadLabel = async (id: string, name: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    
    try {
      const dataUrl = await toPng(element, {
        pixelRatio: 3, // High quality for thermal printing
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `${name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed', err);
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
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">System Online</span>
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
          <Home onSelectModule={(mod) => setActiveModule(mod)} />
        ) : activeModule === 'production' ? (
          <Production products={products} />
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
                    <div className="flex gap-2">
                       <span className="px-2 py-1 rounded bg-slate-800 text-[8px] font-mono text-slate-400">Thermal</span>
                       <span className="px-2 py-1 rounded bg-slate-800 text-[8px] font-mono text-slate-400">300 DPI</span>
                    </div>
                  </div>
                  
                  <div className="relative group scale-[0.8] sm:scale-100 origin-center">
                    <div className="absolute -inset-4 bg-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      {labelType === 'store' ? (
                        <StoreBoxLabel data={storeData} />
                      ) : (
                        <ProductCheckLabel data={productData} />
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => downloadLabel(
                      labelType === 'store' ? 'store-box-label' : 'product-check-label',
                      labelType === 'store' ? `box_${storeData.boxNr}` : 'product_check'
                    )}
                    className="mt-6 md:mt-10 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                  >
                    <Download size={18} />
                    Download PNG
                  </button>
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
      </main>
    </div>
  );
}
