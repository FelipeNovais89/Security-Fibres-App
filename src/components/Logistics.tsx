import React, { useState } from 'react';
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
  Fan
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
}

const Logistics: React.FC<LogisticsProps> = ({ 
  paperReels, setPaperReels, 
  inkCans, setInkCans, 
  printedReels, 
  freshCutBags, 
  blownBags, 
  finalBoxes,
  rawMaterialCodes
}) => {
  const [activeTab, setActiveTab] = useState<'receiving' | 'stock_reels' | 'stock_printed' | 'stock_bags' | 'stock_boxes'>('receiving');
  const [isReceivingReel, setIsReceivingReel] = useState(false);
  const [isReceivingInk, setIsReceivingInk] = useState(false);

  // --- Receiving Form States ---
  const [newReel, setNewReel] = useState<Partial<PaperReel>>({
    serialNumber: '',
    weight: 0,
    gsm: 20,
    supplier: '',
    location: '',
    status: 'Available'
  });

  const [newInk, setNewInk] = useState<Partial<InkCan>>({
    serialNumber: '',
    supplier: '',
    colour: '',
    type: 'Visible',
    volume: 0,
    location: '',
    status: 'Available'
  });

  const handleReceiveReel = () => {
    if (!newReel.serialNumber || !newReel.weight) return;
    setPaperReels(prev => [...prev, { ...newReel, receivedDate: Date.now() } as PaperReel]);
    setNewReel({ serialNumber: '', weight: 0, gsm: 20, supplier: '', location: '', status: 'Available' });
    setIsReceivingReel(false);
  };

  const handleReceiveInk = () => {
    if (!newInk.serialNumber || !newInk.volume) return;
    setInkCans(prev => [...prev, { ...newInk, remainingVolume: newInk.volume, receivedDate: Date.now() } as InkCan]);
    setNewInk({ serialNumber: '', supplier: '', colour: '', type: 'Visible', volume: 0, location: '', status: 'Available' });
    setIsReceivingInk(false);
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
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === 'receiving' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Receiving
          </button>
          <button 
            onClick={() => setActiveTab('stock_reels')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === 'stock_reels' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Paper Reels
          </button>
          <button 
            onClick={() => setActiveTab('stock_printed')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === 'stock_printed' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Printed Reels
          </button>
          <button 
            onClick={() => setActiveTab('stock_bags')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === 'stock_bags' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Bags Stock
          </button>
          <button 
            onClick={() => setActiveTab('stock_boxes')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              activeTab === 'stock_boxes' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Final Boxes
          </button>
        </div>
      </header>

      {/* --- Receiving Tab --- */}
      {activeTab === 'receiving' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Paper Reel Receiving */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-500/10 p-3 rounded-2xl">
                <Package className="text-amber-500" size={24} />
              </div>
              <h3 className="text-xl font-bold">Receive Paper Reels</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Serial Number</label>
                  <input 
                    type="text" 
                    value={newReel.serialNumber}
                    onChange={e => setNewReel({...newReel, serialNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    placeholder="e.g. 3251172M22"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Weight (kg)</label>
                  <input 
                    type="number" 
                    value={newReel.weight}
                    onChange={e => setNewReel({...newReel, weight: parseFloat(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">GSM</label>
                  <select 
                    value={newReel.gsm}
                    onChange={e => setNewReel({...newReel, gsm: parseInt(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none"
                  >
                    <option value={20}>20 GSM</option>
                    <option value={23}>23 GSM</option>
                    <option value={25}>25 GSM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Storage Location</label>
                  <input 
                    type="text" 
                    value={newReel.location}
                    onChange={e => setNewReel({...newReel, location: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    placeholder="e.g. A1-04"
                  />
                </div>
              </div>
              <button 
                onClick={handleReceiveReel}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Register Paper Reel
              </button>
            </div>
          </div>

          {/* Ink Can Receiving */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-500/10 p-3 rounded-2xl">
                <Droplets className="text-indigo-500" size={24} />
              </div>
              <h3 className="text-xl font-bold">Receive Ink Cans</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Serial Number</label>
                  <input 
                    type="text" 
                    value={newInk.serialNumber}
                    onChange={e => setNewInk({...newInk, serialNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="e.g. INK-RED-001"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Volume (Liters)</label>
                  <input 
                    type="number" 
                    value={newInk.volume}
                    onChange={e => setNewInk({...newInk, volume: parseFloat(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Colour</label>
                  <input 
                    type="text" 
                    value={newInk.colour}
                    onChange={e => setNewInk({...newInk, colour: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="e.g. UV Red"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Ink Type</label>
                  <select 
                    value={newInk.type}
                    onChange={e => setNewInk({...newInk, type: e.target.value as InkType})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="Visible">Visible</option>
                    <option value="Invisible UV">Invisible UV</option>
                    <option value="Magnetic">Magnetic</option>
                    <option value="Security">Security</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={handleReceiveInk}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Register Ink Can
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- Paper Reels Stock Tab --- */}
      {activeTab === 'stock_reels' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-bottom border-slate-800">
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
                <tr className="bg-slate-950/50 border-bottom border-slate-800">
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

      {/* --- Bags Stock Tab --- */}
      {activeTab === 'stock_bags' && (
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
                    <span className="text-slate-600">Source: {bag.parentBagId}</span>
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
