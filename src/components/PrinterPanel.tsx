import React, { useState, useEffect } from 'react';
import { Bluetooth, Usb, Printer, AlertCircle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { 
  isMobile, 
  isPrinterSupported, 
  connectBluetooth, 
  printViaBluetooth, 
  connectUSB, 
  printViaUSB 
} from '../printer/PhomemoM110';
import { cn } from '../utils/cn';

interface PrinterPanelProps {
  onClose?: () => void;
  onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected_bt' | 'connected_usb', name: string | null) => void;
  currentStatus?: 'disconnected' | 'connecting' | 'connected_bt' | 'connected_usb';
  btCharacteristic: BluetoothRemoteGATTCharacteristic | null;
  setBtCharacteristic: (char: BluetoothRemoteGATTCharacteristic | null) => void;
  usbPort: any;
  setUsbPort: (port: any) => void;
  mode?: 'connect' | 'print';
  onPrint?: () => Promise<void>;
}

const PrinterPanel: React.FC<PrinterPanelProps> = ({ 
  onClose,
  onStatusChange,
  currentStatus = 'disconnected',
  btCharacteristic,
  setBtCharacteristic,
  usbPort,
  setUsbPort,
  mode = 'print',
  onPrint
}) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected_bt' | 'connected_usb'>(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showAllDevices, setShowAllDevices] = useState(false);

  // Sync internal status with prop if it changes externally
  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const updateStatus = (newStatus: typeof status, name: string | null = null) => {
    setStatus(newStatus);
    if (onStatusChange) {
      onStatusChange(newStatus, name);
    }
  };

  const handleConnectBluetooth = async () => {
    setError(null);
    updateStatus('connecting');
    try {
      const characteristic = await connectBluetooth(showAllDevices);
      setBtCharacteristic(characteristic);
      updateStatus('connected_bt', characteristic.service.device.name || 'M110');
      setUsbPort(null);
    } catch (err: any) {
      console.error(err);
      updateStatus('disconnected');
      if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
        // User cancelled, just reset status without showing a scary error
        setError(null);
      } else {
        setError("Erro ao conectar Bluetooth. Verifique se a impressora está ligada.");
      }
    }
  };

  const handleConnectUSB = async () => {
    setError(null);
    updateStatus('connecting');
    try {
      const port = await connectUSB(showAllDevices);
      setUsbPort(port);
      updateStatus('connected_usb', 'M110 (USB)');
      setBtCharacteristic(null);
    } catch (err: any) {
      console.error(err);
      updateStatus('disconnected');
      if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
        setError(null);
      } else {
        setError("Erro ao conectar USB. Verifique o cabo e a alimentação.");
      }
    }
  };

  const handlePrint = async () => {
    if (!onPrint) return;

    setError(null);
    setIsPrinting(true);
    try {
      if (status !== 'disconnected' && (btCharacteristic || usbPort)) {
        await onPrint();
      } else {
        setError("Conecte a impressora primeiro.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Falha ao imprimir. Verifique a conexão.");
      updateStatus('disconnected');
    } finally {
      setIsPrinting(false);
    }
  };

  const mobile = isMobile();
  const supported = isPrinterSupported();

  if (!supported) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <XCircle className="mx-auto text-rose-500" size={48} />
        <h3 className="text-xl font-bold text-white">Navegador Não Suportado</h3>
        <p className="text-slate-400 text-sm">
          Seu navegador não suporta Web Bluetooth ou Web Serial. 
          Use o Chrome no Android ou Desktop para imprimir etiquetas.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
            <Printer size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Impressora Phomemo</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">M110 Label Printer</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <AlertCircle size={20} />
          </button>
        )}
      </div>

      {/* Status Indicator */}
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-2xl border transition-all",
        status === 'disconnected' ? "bg-slate-950 border-slate-800" : 
        status === 'connecting' ? "bg-amber-500/5 border-amber-500/20 animate-pulse" :
        "bg-emerald-500/5 border-emerald-500/20"
      )}>
        {status === 'disconnected' && <Bluetooth className="text-slate-600" size={20} />}
        {status === 'connecting' && <RefreshCw className="text-amber-500 animate-spin" size={20} />}
        {status === 'connected_bt' && <Bluetooth className="text-emerald-500" size={20} />}
        {status === 'connected_usb' && <Usb className="text-emerald-500" size={20} />}
        
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</p>
          <p className={cn(
            "text-sm font-medium",
            status === 'disconnected' ? "text-slate-500" : 
            status === 'connecting' ? "text-amber-500" : "text-emerald-500"
          )}>
            {status === 'disconnected' && "Desconectado"}
            {status === 'connecting' && "Conectando..."}
            {status === 'connected_bt' && "Conectado via Bluetooth"}
            {status === 'connected_usb' && "Conectado via USB"}
          </p>
        </div>
      </div>

      {/* Connection Buttons */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {(mobile || !!navigator.bluetooth) && (
            <button 
              onClick={handleConnectBluetooth}
              disabled={status === 'connecting'}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all",
                status === 'connected_bt' ? "bg-emerald-600 border-emerald-500 text-white" : "bg-slate-950 border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:text-slate-200"
              )}
            >
              <Bluetooth size={24} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Bluetooth</span>
            </button>
          )}
          
          {!!(navigator as any).serial && (
            <button 
              onClick={handleConnectUSB}
              disabled={status === 'connecting'}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all",
                status === 'connected_usb' ? "bg-emerald-600 border-emerald-500 text-white" : "bg-slate-950 border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:text-slate-200"
              )}
            >
              <Usb size={24} />
              <span className="text-[10px] font-bold uppercase tracking-widest">USB Serial</span>
            </button>
          )}
        </div>

        {/* Show All Devices Toggle */}
        {(mobile || !!navigator.bluetooth) && status === 'disconnected' && (
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={showAllDevices} 
              onChange={(e) => setShowAllDevices(e.target.checked)}
              className="w-3 h-3 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
            />
            <span className="text-[9px] text-slate-500 uppercase tracking-widest group-hover:text-slate-400 transition-colors">
              Mostrar todos os dispositivos (Bluetooth/USB)
            </span>
          </label>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Print Button - Only show in print mode */}
      {mode === 'print' && (
        <button 
          onClick={handlePrint}
          disabled={status === 'disconnected' || status === 'connecting' || isPrinting}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
        >
          {isPrinting ? (
            <>
              <RefreshCw size={20} className="animate-spin" />
              Imprimindo...
            </>
          ) : (
            <>
              <Printer size={20} />
              Imprimir Etiqueta
            </>
          )}
        </button>
      )}

      {/* Help Note */}
      <p className="text-[9px] text-slate-600 text-center uppercase tracking-tighter">
        Phomemo M110 • ESC/POS Protocol • 203 DPI
      </p>
    </div>
  );
};

export default PrinterPanel;
