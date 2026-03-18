import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  Truck, 
  Package, 
  Box, 
  Archive, 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  MapPin, 
  Weight, 
  Droplets, 
  FileText,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Scissors,
  Fan,
  Camera,
  X,
  Database,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { 
  PaperReel, 
  InkCan, 
  PrintedPaperReel, 
  FreshCutBag, 
  BlownBag, 
  FinalBox, 
  RawMaterialCode, 
  InkType 
} from '../types';

interface LogisticsProps {
  paperReels: PaperReel[];
  setPaperReels: React.Dispatch<React.SetStateAction<PaperReel[]>>;
  inkCans: InkCan[];
  setInkCans: React.Dispatch<React.SetStateAction<InkCan[]>>;
  printedReels: PrintedPaperReel[];
  freshCutBags: FreshCutBag[];
  blownBags: BlownBag[];
  finalBoxes: FinalBox[];
  rawMaterialCodes: RawMaterialCode[];
  initialTab?: 'receiving' | 'stock_reels' | 'stock_printed' | 'stock_management' | 'stock_boxes';
}

const Logistics: React.FC<LogisticsProps> = ({ 
  paperReels, setPaperReels, 
  inkCans, setInkCans, 
  printedReels, 
  freshCutBags, 
  blownBags, 
  finalBoxes,
  rawMaterialCodes,
  initialTab
}) => {
  const [activeTab, setActiveTab] = useState<'receiving' | 'stock_reels' | 'stock_printed' | 'stock_management' | 'stock_boxes'>(initialTab || 'receiving');
  const [receivingType, setReceivingType] = useState<'Paper Reel' | 'Ink' | null>(null);
  
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // --- Receiving Form States ---
  const [selectedRMCode, setSelectedRMCode] = useState('');
  const [receivingItems, setReceivingItems] = useState<{ serial: string; weight: number }[]>([]);
  const [newItemSerial, setNewItemSerial] = useState('');
  const [newItemWeight, setNewItemWeight] = useState('');
  const [receivingLocation, setReceivingLocation] = useState('');
  
  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const selectedRM = rawMaterialCodes.find(rm => rm.code === selectedRMCode);

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "receiving-scanner",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scanner.render((decodedText) => {
        setNewItemSerial(decodedText);
        setIsScanning(false);
        scanner.clear();
      }, (error) => {
        // console.warn(error);
      });

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  const handleAddItem = () => {
    if (!newItemSerial.trim() || !newItemWeight) return;
    setReceivingItems(prev => [...prev, { serial: newItemSerial.trim(), weight: parseFloat(newItemWeight) }]);
    setNewItemSerial('');
    setNewItemWeight('');
  };

  const handleRemoveItem = (index: number) => {
    setReceivingItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinalizeReceiving = () => {
    if (!selectedRM || receivingItems.length === 0) return;

    if (receivingType === 'Paper Reel') {
      const newReels: PaperReel[] = receivingItems.map(item => ({
        serialNumber: item.serial,
        weight: item.weight,
        gsm: selectedRM.defaultGsm || 20,
        receivedDate: Date.now(),
        supplier: selectedRM.supplier,
        location: receivingLocation || 'Main Stock',
        status: 'Available'
      }));
      setPaperReels(prev => [...prev, ...newReels]);
    } else if (receivingType === 'Ink') {
      const newInks: InkCan[] = receivingItems.map(item => ({
        serialNumber: item.serial,
        supplier: selectedRM.supplier,
        colour: selectedRM.inkColour || 'Unknown',
        type: selectedRM.inkType || 'Visible',
        volume: item.weight, // Using weight as volume for simplicity if not specified
        remainingVolume: item.weight,
        receivedDate: Date.now(),
        location: receivingLocation || 'Ink Storage',
        status: 'Available'
      }));
      setInkCans(prev => [...prev, ...newInks]);
    }

    // Reset
    setReceivingType(null);
    setSelectedRMCode('');
    setReceivingItems([]);
    setReceivingLocation('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">Logistics & Stock</h2>
          <p className="text-slate-400">Material Receiving and Inventory Management</p>
        </div>
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('receiving')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2",
              activeTab === 'receiving' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Truck size={16} />
            Receiving
          </button>
          <button 
            onClick={() => setActiveTab('stock_reels')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2",
              activeTab === 'stock_reels' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Package size={16} />
            Paper Reels
          </button>
          <button 
            onClick={() => setActiveTab('stock_printed')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2",
              activeTab === 'stock_printed' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Layers size={16} />
            Printed Reels
          </button>
          <button 
            onClick={() => setActiveTab('stock_management')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2",
              activeTab === 'stock_management' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Archive size={16} />
            Stock Management
          </button>
          <button 
            onClick={() => setActiveTab('stock_boxes')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2",
              activeTab === 'stock_boxes' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Box size={16} />
            Final Boxes
          </button>
        </div>
      </header>

      {/* --- Receiving Tab --- */}
      {activeTab === 'receiving' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {!receivingType ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => setReceivingType('Paper Reel')}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-xl hover:border-amber-500/50 transition-all group flex flex-col items-center text-center gap-6"
              >
                <div className="bg-amber-500/10 p-6 rounded-full group-hover:scale-110 transition-transform">
                  <Package className="text-amber-500" size={48} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Receive Paper Reels</h3>
                  <p className="text-slate-400">Register new raw paper reels into inventory.</p>
                </div>
              </button>

              <button 
                onClick={() => setReceivingType('Ink')}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-xl hover:border-indigo-500/50 transition-all group flex flex-col items-center text-center gap-6"
              >
                <div className="bg-indigo-500/10 p-6 rounded-full group-hover:scale-110 transition-transform">
                  <Droplets className="text-indigo-500" size={48} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Receive Ink Cans</h3>
                  <p className="text-slate-400">Register new ink cans into inventory.</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setReceivingType(null)}
                      className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                    >
                      <X size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-xl",
                        receivingType === 'Paper Reel' ? "bg-amber-500/10 text-amber-500" : "bg-indigo-500/10 text-indigo-500"
                      )}>
                        {receivingType === 'Paper Reel' ? <Package size={20} /> : <Droplets size={20} />}
                      </div>
                      <h3 className="font-bold text-lg">Receiving: {receivingType}s</h3>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">
                        {receivingType === 'Paper Reel' ? 'Paper Code' : 'Ink Code'}
                      </label>
                      <select 
                        value={selectedRMCode}
                        onChange={(e) => setSelectedRMCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                      >
                        <option value="">Select code...</option>
                        {rawMaterialCodes
                          .filter(rm => rm.type === receivingType)
                          .map(rm => (
                            <option key={rm.code} value={rm.code}>{rm.code} - {rm.name}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Item Name</label>
                      <div className="w-full bg-slate-800/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300">
                        {selectedRM ? selectedRM.name : 'Select a code first'}
                      </div>
                    </div>

                    {receivingType === 'Ink' && selectedRM && (
                      <div className="col-span-full grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Colour</label>
                          <div className="w-full bg-slate-800/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300">
                            {selectedRM.inkColour || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Ink Type</label>
                          <div className="w-full bg-slate-800/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-300">
                            {selectedRM.inkType || 'N/A'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-800">
                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <Plus size={16} className="text-emerald-500" />
                      Add Items to List
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-6">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Serial Number</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={newItemSerial}
                            onChange={(e) => setNewItemSerial(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            placeholder="Enter or scan serial..."
                          />
                          <button 
                            onClick={() => setIsScanning(true)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
                          >
                            <Camera size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">
                          {receivingType === 'Paper Reel' ? 'Weight (kg)' : 'Weight/Volume'}
                        </label>
                        <input 
                          type="number" 
                          value={newItemWeight}
                          onChange={(e) => setNewItemWeight(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <button 
                          onClick={handleAddItem}
                          disabled={!newItemSerial || !newItemWeight}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold h-[46px] rounded-xl transition-all flex items-center justify-center"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>

                    {isScanning && (
                      <div className="mt-4 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400">Scan Barcode</span>
                          <button onClick={() => setIsScanning(false)} className="text-slate-500 hover:text-white">
                            <X size={16} />
                          </button>
                        </div>
                        <div id="receiving-scanner" className="w-full max-w-md mx-auto" />
                      </div>
                    )}

                    <div className="mt-6 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900/50 border-b border-slate-800">
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Serial Number</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Weight</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {receivingItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                              <td className="px-4 py-3 font-mono text-sm text-slate-200">{item.serial}</td>
                              <td className="px-4 py-3 text-sm text-slate-400">{item.weight} {receivingType === 'Paper Reel' ? 'kg' : 'L/kg'}</td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => handleRemoveItem(idx)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {receivingItems.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-slate-600 italic text-sm">No items added yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row items-end gap-6">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Storage Location</label>
                      <input 
                        type="text" 
                        value={receivingLocation}
                        onChange={(e) => setReceivingLocation(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        placeholder="e.g. A1-04"
                      />
                    </div>
                    <button 
                      onClick={handleFinalizeReceiving}
                      disabled={!selectedRM || receivingItems.length === 0}
                      className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={20} />
                      Finalize Receiving
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* --- Paper Reels Stock Tab --- */}
      {activeTab === 'stock_reels' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Serial Number</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Weight</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">GSM</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Received</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Location</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paperReels.map(r => (
                  <tr key={r.serialNumber} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-amber-400 font-bold">{r.serialNumber}</td>
                    <td className="px-6 py-4 text-sm">{r.weight} kg</td>
                    <td className="px-6 py-4 text-sm">{r.gsm} GSM</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(r.receivedDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-mono">{r.location}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        r.status === 'Available' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
                      )}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {paperReels.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">No paper reels in stock.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* --- Printed Reels Stock Tab --- */}
      {activeTab === 'stock_printed' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Printed Serial</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Product</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Source Reel</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Weight</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {printedReels.map(r => (
                  <tr key={r.serialNumber} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-blue-400 font-bold">{r.serialNumber}</td>
                    <td className="px-6 py-4 text-sm font-medium">{r.productCode}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{r.sourceReelSerial}</td>
                    <td className="px-6 py-4 text-sm">{r.finalWeight} kg</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(r.productionDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        r.status === 'Available for Cutting' ? "bg-emerald-500/10 text-emerald-500" : 
                        r.status === 'In Cutting' ? "bg-blue-500/10 text-blue-500" : "bg-slate-500/10 text-slate-500"
                      )}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {printedReels.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">No printed reels in stock.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* --- Stock Management Tab --- */}
      {activeTab === 'stock_management' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Fresh Cut Bags */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Scissors className="text-blue-500" size={20} />
              Fresh Cut Bags Stock
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {freshCutBags.map(bag => (
                <div key={bag.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 hover:border-blue-500/50 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-mono font-bold text-sm text-slate-200">{bag.id}</p>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
                      bag.status === 'Available for Blowing' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {bag.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{bag.productCode}</p>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-600">Reel: {bag.parentReelSerial}</span>
                    <span className="text-slate-400 font-bold">{bag.weight} kg</span>
                  </div>
                </div>
              ))}
              {freshCutBags.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-600 italic">No fresh cut bags in stock.</div>
              )}
            </div>
          </div>

          {/* Blown Bags */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Fan className="text-emerald-500" size={20} />
              Blown Bags Stock
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {blownBags.map(bag => (
                <div key={bag.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 hover:border-emerald-500/50 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-mono font-bold text-sm text-slate-200">{bag.id}</p>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
                      bag.status === 'Available for Shaking' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {bag.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{bag.productCode}</p>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-600">Source: {bag.parentBagIds?.join(', ') || 'N/A'}</span>
                    <span className="text-slate-400 font-bold">{bag.weight} kg</span>
                  </div>
                </div>
              ))}
              {blownBags.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-600 italic">No blown bags in stock.</div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* --- Final Boxes Stock Tab --- */}
      {activeTab === 'stock_boxes' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finalBoxes.map(box => (
              <div key={box.boxNumber} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl hover:border-emerald-500/50 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-mono font-bold text-lg text-slate-100">{box.boxNumber}</h4>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{box.productCode}</p>
                  </div>
                  <div className="bg-emerald-500/10 px-3 py-1 rounded-full">
                    <span className="text-xs font-bold text-emerald-500">{box.totalWeight.toFixed(2)} / 15.00 kg</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${(box.totalWeight / 15) * 100}%` }}
                    />
                  </div>
                  
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Contents ({box.bags.length} Bags)</p>
                    <div className="flex flex-wrap gap-2">
                      {box.bags.map(b => (
                        <span key={b.bagId} className="px-2 py-1 bg-slate-800 rounded text-[10px] font-mono text-slate-400">
                          {b.bagId} ({b.weightAdded}kg)
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(box.packingDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      {box.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {finalBoxes.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-600 italic">No final boxes in stock.</div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Logistics;
