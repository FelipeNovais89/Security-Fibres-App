import React, { useState } from 'react';
import { 
  History, 
  Search, 
  ChevronRight, 
  Package, 
  Box, 
  Truck, 
  Scissors, 
  Fan, 
  LayoutGrid, 
  Layers, 
  Droplets,
  ArrowRight,
  AlertCircle,
  Calendar,
  Weight,
  User,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { 
  PaperReel, 
  InkCan, 
  PrintedPaperReel, 
  FreshCutBag, 
  BlownBag, 
  ShakenBag, 
  FinalBox 
} from '../types';

interface TraceabilityProps {
  paperReels: PaperReel[];
  inkCans: InkCan[];
  printedReels: PrintedPaperReel[];
  freshCutBags: FreshCutBag[];
  blownBags: BlownBag[];
  shakenBags: ShakenBag[];
  finalBoxes: FinalBox[];
}

const Traceability: React.FC<TraceabilityProps> = ({ 
  paperReels, 
  inkCans, 
  printedReels, 
  freshCutBags, 
  blownBags, 
  shakenBags, 
  finalBoxes 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [traceType, setTraceType] = useState<'box' | 'bag' | 'reel' | 'printed'>('box');

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    let found: any = null;
    
    if (traceType === 'box') {
      found = finalBoxes.find(b => b.boxNumber.toLowerCase() === searchQuery.toLowerCase());
    } else if (traceType === 'bag') {
      found = freshCutBags.find(b => b.id.toLowerCase() === searchQuery.toLowerCase()) ||
              blownBags.find(b => b.id.toLowerCase() === searchQuery.toLowerCase()) ||
              shakenBags.find(b => b.id.toLowerCase() === searchQuery.toLowerCase());
    } else if (traceType === 'reel') {
      found = paperReels.find(r => r.serialNumber.toLowerCase() === searchQuery.toLowerCase());
    } else if (traceType === 'printed') {
      found = printedReels.find(r => r.serialNumber.toLowerCase() === searchQuery.toLowerCase());
    }
    
    setSelectedItem(found);
  };

  const renderTraceFlow = () => {
    if (!selectedItem) return null;

    // Trace back from Final Box
    if (traceType === 'box') {
      const box = selectedItem as FinalBox;
      return (
        <div className="space-y-12 relative">
          {/* Box Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-emerald-500/10 p-4 rounded-2xl">
                <Box className="text-emerald-500" size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-100">{box.boxNumber}</h3>
                <p className="text-sm text-emerald-500 font-bold uppercase tracking-widest">{box.productCode}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Weight</p>
                <p className="text-lg font-bold text-slate-200">{box.totalWeight.toFixed(2)} kg</p>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Packing Date</p>
                <p className="text-lg font-bold text-slate-200">{new Date(box.packingDate).toLocaleDateString()}</p>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bags Count</p>
                <p className="text-lg font-bold text-slate-200">{box.bags.length}</p>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                <p className="text-lg font-bold text-emerald-500">{box.status}</p>
              </div>
            </div>
          </div>

          {/* Flow Steps */}
          <div className="space-y-8 pl-8 border-l-2 border-slate-800 relative">
            {box.bags.map((bagRef, idx) => {
              const shakenBag = shakenBags.find(b => b.id === bagRef.bagId);
              const blownBag = blownBags.find(b => b.id === shakenBag?.parentBlownBagId);
              const freshBag = freshCutBags.find(b => b.id === blownBag?.parentBagId);
              const printedReel = printedReels.find(r => r.serialNumber === freshBag?.parentReelSerial);
              const paperReel = paperReels.find(r => r.serialNumber === printedReel?.sourceReelSerial);

              return (
                <div key={bagRef.bagId} className="space-y-6 relative">
                  <div className="absolute -left-[41px] top-6 w-4 h-4 rounded-full bg-slate-800 border-4 border-slate-950 z-20" />
                  
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-all">
                    <h4 className="font-bold text-indigo-400 mb-4 flex items-center gap-2">
                      <LayoutGrid size={18} />
                      Bag Trace: {bagRef.bagId}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                      {/* Shaken */}
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Shaken Bag</p>
                        <p className="text-xs font-mono text-slate-200">{shakenBag?.id || 'N/A'}</p>
                      </div>
                      
                      <ArrowRight className="text-slate-700 hidden md:block" size={16} />
                      
                      {/* Blown */}
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Blown Bag</p>
                        <p className="text-xs font-mono text-slate-200">{blownBag?.id || 'N/A'}</p>
                      </div>

                      <ArrowRight className="text-slate-700 hidden md:block" size={16} />

                      {/* Fresh Cut */}
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Fresh Cut Bag</p>
                        <p className="text-xs font-mono text-slate-200">{freshBag?.id || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Printed Reel */}
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-500/10 p-3 rounded-xl">
                          <Printer className="text-blue-500" size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Printed Paper Reel</p>
                          <p className="text-sm font-mono text-blue-400 font-bold">{printedReel?.serialNumber || 'N/A'}</p>
                          <p className="text-[10px] text-slate-600 mt-1">Weight: {printedReel?.finalWeight} kg | Date: {printedReel ? new Date(printedReel.productionDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>

                      {/* Source Reel */}
                      <div className="flex items-center gap-4">
                        <div className="bg-amber-500/10 p-3 rounded-xl">
                          <Package className="text-amber-500" size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Original Paper Reel</p>
                          <p className="text-sm font-mono text-amber-500 font-bold">{paperReel?.serialNumber || 'N/A'}</p>
                          <p className="text-[10px] text-slate-600 mt-1">Weight: {paperReel?.weight} kg | GSM: {paperReel?.gsm} | Supplier: {paperReel?.supplier || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Inks Used */}
                    {printedReel && printedReel.inksUsed.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Inks Consumed</p>
                        <div className="flex flex-wrap gap-2">
                          {printedReel.inksUsed.map(inkRef => {
                            const ink = inkCans.find(i => i.serialNumber === inkRef.serial);
                            return (
                              <span key={inkRef.serial} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-bold">
                                {inkRef.serial} ({ink?.colour}) - {inkRef.consumption}L
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
        <AlertCircle className="mx-auto text-slate-700 mb-4" size={48} />
        <p className="text-slate-500 italic">Traceability flow for {traceType} is coming soon.</p>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Full Traceability</h2>
        <p className="text-slate-400">Track material flow from raw paper to final box</p>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={`Enter ${traceType} serial number...`}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button 
              onClick={() => setTraceType('box')}
              className={cn(
                "px-6 py-3 rounded-xl text-sm font-bold transition-all uppercase tracking-widest",
                traceType === 'box' ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Box
            </button>
            <button 
              onClick={() => setTraceType('bag')}
              className={cn(
                "px-6 py-3 rounded-xl text-sm font-bold transition-all uppercase tracking-widest",
                traceType === 'bag' ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Bag
            </button>
            <button 
              onClick={() => setTraceType('printed')}
              className={cn(
                "px-6 py-3 rounded-xl text-sm font-bold transition-all uppercase tracking-widest",
                traceType === 'printed' ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Reel
            </button>
          </div>
          <button 
            onClick={handleSearch}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20"
          >
            Trace Item
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedItem ? (
          <motion.div 
            key={selectedItem.id || selectedItem.boxNumber || selectedItem.serialNumber}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {renderTraceFlow()}
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center"
          >
            <History className="mx-auto text-slate-800 mb-4 opacity-20" size={64} />
            <p className="text-slate-600 font-medium">Search for an item to see its full production history.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Traceability;
