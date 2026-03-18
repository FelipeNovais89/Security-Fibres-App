import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  Scissors, 
  Fan, 
  Plus, 
  Minus,
  History, 
  ChevronRight, 
  Package, 
  Factory, 
  LayoutGrid,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  X,
  Shield,
  ShieldAlert,
  Box,
  Droplets,
  Layers,
  Database,
  Camera,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { v4 as uuidv4 } from 'uuid';
import { 
  ProductCode, 
  BOM, 
  PaperReel, 
  InkCan, 
  PrintedPaperReel, 
  FreshCutBag, 
  BlownBag, 
  ShakenBag, 
  FinalBox,
  PrintedReelStatus,
  FreshCutBagStatus,
  BlownBagStatus,
  ShakenBagStatus,
  BoxStatus
} from '../types';

interface Machine {
  id: string;
  name: string;
  bay: string;
  type: 'blower' | 'shaker';
  status: 'clean' | 'in_production' | 'needs_cleaning';
  currentBagId?: string;
  currentBagIds?: string[];
  sourceBags?: { id: string; weightUsed: number; usedEntirely: boolean }[];
  blowingPasses?: number;
  currentBagSerialNumber?: string;
  currentProduct?: string;
  assignedProduct?: string;
}

interface ProductionProps {
  customers: any[];
  products: any[];
  productCodes: ProductCode[];
  boms: BOM[];
  paperReels: PaperReel[];
  setPaperReels: React.Dispatch<React.SetStateAction<PaperReel[]>>;
  inkCans: InkCan[];
  setInkCans: React.Dispatch<React.SetStateAction<InkCan[]>>;
  printedReels: PrintedPaperReel[];
  setPrintedReels: React.Dispatch<React.SetStateAction<PrintedPaperReel[]>>;
  freshCutBags: FreshCutBag[];
  setFreshCutBags: React.Dispatch<React.SetStateAction<FreshCutBag[]>>;
  blownBags: BlownBag[];
  setBlownBags: React.Dispatch<React.SetStateAction<BlownBag[]>>;
  shakenBags: ShakenBag[];
  setShakenBags: React.Dispatch<React.SetStateAction<ShakenBag[]>>;
  finalBoxes: FinalBox[];
  setFinalBoxes: React.Dispatch<React.SetStateAction<FinalBox[]>>;
}

const ActiveShakerItem = ({ 
  machine, 
  boxes, 
  onFinish,
  onFinalize
}: { 
  machine: Machine, 
  boxes: FinalBox[], 
  onFinish: (weight: number, wasteWeight: number, dustWeight: number, cardboardWeight: number, dBagWeight: number, boxId?: string, newBoxNum?: string) => void,
  onFinalize: () => void,
  key?: string
}) => {
  const [goodWeight, setGoodWeight] = useState<string>('');
  const [wasteWeight, setWasteWeight] = useState<string>('');
  const [dustWeight, setDustWeight] = useState<string>('');
  const [cardboardWeight, setCardboardWeight] = useState<string>('');
  const [dBagWeight, setDBagWeight] = useState<string>('');
  const [boxId, setBoxId] = useState<string>('');
  const [newBoxNum, setNewBoxNum] = useState<string>('');
  const [isFinishing, setIsFinishing] = useState(false);

  const availableBoxes = boxes.filter(b => b.status === 'Filling' && b.productCode === machine.currentProduct);

  const handleFinish = () => {
    const gw = parseFloat(goodWeight);
    const ww = parseFloat(wasteWeight) || 0;
    const dw = parseFloat(dustWeight) || 0;
    const cw = parseFloat(cardboardWeight) || 0;
    const dbw = parseFloat(dBagWeight) || 0;

    if (isNaN(gw) || gw < 0) {
      alert('Please enter a valid good product weight');
      return;
    }
    if (!boxId && !newBoxNum.trim()) {
      alert('Please select an existing box or enter a new box number');
      return;
    }
    onFinish(gw, ww, dw, cw, dbw, boxId || undefined, newBoxNum || undefined);
    setIsFinishing(false);
    setGoodWeight('');
    setWasteWeight('');
    setDustWeight('');
    setCardboardWeight('');
    setDBagWeight('');
    setBoxId('');
    setNewBoxNum('');
  };

  if (!machine.currentBagId) {
    return (
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl opacity-70">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center">
              <LayoutGrid size={20} />
            </div>
            <div>
              <p className="font-mono font-bold text-sm text-slate-500 text-center">IDLE</p>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{machine.name} ({machine.bay})</p>
            </div>
          </div>
          <button 
            onClick={onFinalize}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            Finalize Production
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-indigo-500/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <LayoutGrid className="animate-pulse" size={20} />
          </div>
          <div>
            <p className="font-mono font-bold text-sm text-slate-200">{machine.currentBagSerialNumber}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">{machine.name} ({machine.bay})</p>
              <span className="text-slate-700 text-[10px]">•</span>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{machine.currentProduct}</p>
            </div>
          </div>
        </div>
        {!isFinishing ? (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsFinishing(true)}
              className="px-4 py-2 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Finish & Divide
            </button>
            <button 
              onClick={onFinalize}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
              title="Finalize Production"
            >
              Finalize
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsFinishing(false)}
            className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFinishing && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Good Product Weight (Kg)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={goodWeight}
                    onChange={(e) => setGoodWeight(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Waste Weight (Kg)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={wasteWeight}
                    onChange={(e) => setWasteWeight(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Dust Weight (Kg)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={dustWeight}
                    onChange={(e) => setDustWeight(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Cardboard Weight (Kg)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={cardboardWeight}
                    onChange={(e) => setCardboardWeight(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">D-Bag Weight (Kg)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={dBagWeight}
                    onChange={(e) => setDBagWeight(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Select Existing Box</label>
                  <select 
                    value={boxId}
                    onChange={(e) => {
                      setBoxId(e.target.value);
                      if (e.target.value) setNewBoxNum('');
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="">New Box...</option>
                    {availableBoxes.map(box => (
                      <option key={box.boxNumber} value={box.boxNumber}>{box.boxNumber} ({box.totalWeight}kg / 15kg)</option>
                    ))}
                  </select>
                </div>
                {!boxId && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">New Box Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. BOX-001"
                      value={newBoxNum}
                      onChange={(e) => setNewBoxNum(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleFinish}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
              >
                <CheckCircle2 size={16} />
                Confirm Division & Finish
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Production: React.FC<ProductionProps> = ({ 
  customers,
  products,
  productCodes,
  boms,
  paperReels,
  setPaperReels,
  inkCans,
  setInkCans,
  printedReels,
  setPrintedReels,
  freshCutBags,
  setFreshCutBags,
  blownBags,
  setBlownBags,
  shakenBags,
  setShakenBags,
  finalBoxes,
  setFinalBoxes
}) => {
  const [activeTab, setActiveTab] = useState<'raw_materials' | 'printing' | 'cutting' | 'blowing' | 'shaking' | 'inventory' | 'machines' | 'history'>('raw_materials');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Raw Materials Form State
  const [newReelSerial, setNewReelSerial] = useState('');
  const [newReelWeight, setNewReelWeight] = useState('');
  const [newReelGsm, setNewReelGsm] = useState('');
  const [newReelSupplier, setNewReelSupplier] = useState('');

  // Printing Form State
  const [printingCustomer, setPrintingCustomer] = useState('');
  const [printingColour, setPrintingColour] = useState('');
  const [printingSourceReel, setPrintingSourceReel] = useState('');
  const [printingInks, setPrintingInks] = useState<{ serial: string; consumption: number }[]>([]);
  const [printingFinalWeight, setPrintingFinalWeight] = useState<string>('');
  const [printingSerial, setPrintingSerial] = useState('');
  const [printingWeightUsed, setPrintingWeightUsed] = useState<string>('');
  const [printingUsedEntireReel, setPrintingUsedEntireReel] = useState(false);
  const [printingDefects, setPrintingDefects] = useState('');
  const [printingDefectsQty, setPrintingDefectsQty] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Auto-generate serial number
  useEffect(() => {
    if (printingSourceReel) {
      const count = printedReels.filter(r => r.sourceReelSerial === printingSourceReel).length + 1;
      setPrintingSerial(`${printingSourceReel} - N${count}`);
    } else {
      setPrintingSerial('');
    }
  }, [printingSourceReel, printedReels]);

  const startScanning = () => {
    setIsScanning(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scanner.render((decodedText) => {
        setPrintingSourceReel(decodedText);
        scanner.clear();
        setIsScanning(false);
      }, (error) => {
        // console.warn(error);
      });
      scannerRef.current = scanner;
    }, 100);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Cutting Form State
  const [cuttingSourceReel, setCuttingSourceReel] = useState('');
  const [cuttingNumBags, setCuttingNumBags] = useState(1);
  const [cuttingBagWeights, setCuttingBagWeights] = useState<string[]>(['']);

  // Update bag weights array when number of bags changes
  useEffect(() => {
    setCuttingBagWeights(prev => {
      const newWeights = [...prev];
      if (cuttingNumBags > newWeights.length) {
        for (let i = newWeights.length; i < cuttingNumBags; i++) {
          newWeights.push(prev[0] || ''); // Default to the first bag's weight or empty
        }
      } else if (cuttingNumBags < newWeights.length) {
        return newWeights.slice(0, cuttingNumBags);
      }
      return newWeights;
    });
  }, [cuttingNumBags]);

  // Blowing Form State
  const [blowingSelectedBags, setBlowingSelectedBags] = useState<{ id: string; weightUsed: number; usedEntirely: boolean }[]>([]);
  const [selectedBlower, setSelectedBlower] = useState('');

  // Shaking Form State
  const [shakingSourceBag, setShakingSourceBag] = useState('');
  const [selectedShaker, setSelectedShaker] = useState('');

  // Machines State
  const [machines, setMachines] = useState<Machine[]>(() => {
    const saved = localStorage.getItem('fiberqc_machines');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure shakers exist in the list
        if (!parsed.some((m: any) => m.type === 'shaker')) {
          const blowers = parsed.map((m: any) => ({ ...m, type: 'blower' }));
          const shakers: Machine[] = Array.from({ length: 12 }, (_, i) => ({
            id: `s${i + 1}`,
            name: `Shaker ${String(i + 1).padStart(2, '0')}`,
            bay: `Area ${String(Math.floor(i / 4) + 1)}`,
            type: 'shaker',
            status: 'clean',
            assignedProduct: ''
          }));
          return [...blowers, ...shakers];
        }
        return parsed.map((m: any) => ({ ...m, type: m.type || (m.id.startsWith('s') ? 'shaker' : 'blower') }));
      } catch (e) {
        console.error("Failed to parse machines", e);
      }
    }
    
    const blowers: Machine[] = Array.from({ length: 4 }, (_, i) => ({
      id: `b${i + 1}`,
      name: `Blower ${String(i + 1).padStart(2, '0')}`,
      bay: `Bay ${String.fromCharCode(65 + i)}`,
      type: 'blower',
      status: 'clean',
      assignedProduct: ''
    }));

    const shakers: Machine[] = Array.from({ length: 12 }, (_, i) => ({
      id: `s${i + 1}`,
      name: `Shaker ${String(i + 1).padStart(2, '0')}`,
      bay: `Area ${String(Math.floor(i / 4) + 1)}`,
      type: 'shaker',
      status: 'clean',
      assignedProduct: ''
    }));

    return [...blowers, ...shakers];
  });

  useEffect(() => {
    localStorage.setItem('fiberqc_machines', JSON.stringify(machines));
  }, [machines]);
;

  // Auto-select blower/shaker if a machine is already assigned to the selected bag's product
  useEffect(() => {
    const sourceBagId = activeTab === 'blowing' ? (blowingSelectedBags[0]?.id || '') : shakingSourceBag;
    const selectedMachineId = activeTab === 'blowing' ? selectedBlower : selectedShaker;
    const setMachine = activeTab === 'blowing' ? setSelectedBlower : setSelectedShaker;

    if (!sourceBagId) {
      setMachine('');
      return;
    }

    const bag = activeTab === 'blowing' 
      ? freshCutBags.find(b => b.id === sourceBagId)
      : (blownBags.find(b => b.id === sourceBagId) || shakenBags.find(b => b.id === sourceBagId));
    
    if (!bag) return;

    // Try to find a clean machine that is ALREADY assigned to this product
    const assignedMachine = machines.find(m => 
      m.status === 'clean' && 
      m.type === (activeTab === 'blowing' ? 'blower' : 'shaker') &&
      m.assignedProduct === bag.productCode
    );
    
    if (assignedMachine && !selectedMachineId) {
      setMachine(assignedMachine.id);
    }
  }, [blowingSelectedBags, shakingSourceBag, activeTab, freshCutBags, blownBags, machines]);

  const handleAddRawReel = () => {
    if (!newReelSerial || !newReelWeight || !newReelGsm) return;

    const newReel: PaperReel = {
      serialNumber: newReelSerial,
      weight: parseFloat(newReelWeight),
      gsm: parseInt(newReelGsm),
      receivedDate: Date.now(),
      supplier: newReelSupplier,
      location: 'Warehouse',
      status: 'Available'
    };

    setPaperReels(prev => [...prev, newReel]);
    setNewReelSerial('');
    setNewReelWeight('');
    setNewReelGsm('');
    setNewReelSupplier('');
  };

  const handleStartPrinting = () => {
    if (!printingCustomer || !printingColour || !printingSourceReel || !printingSerial || !printingWeightUsed) {
      alert('Please fill in all required fields');
      return;
    }

    const sourceReel = paperReels.find(r => r.serialNumber === printingSourceReel);
    if (!sourceReel) return;

    const weightUsed = parseFloat(printingWeightUsed);
    if (weightUsed > sourceReel.weight) {
      alert('Weight used cannot exceed available weight in reel');
      return;
    }

    const newPrintedReel: PrintedPaperReel = {
      serialNumber: printingSerial,
      customer: printingCustomer,
      colour: printingColour,
      sourceReelSerial: printingSourceReel,
      inksUsed: printingInks,
      finalWeight: parseFloat(printingFinalWeight) || weightUsed,
      productionDate: Date.now(),
      status: 'Available for Cutting',
      defects: printingDefects,
      defectsQty: parseFloat(printingDefectsQty) || 0,
      usedEntireSourceReel: printingUsedEntireReel
    };

    setPrintedReels(prev => [...prev, newPrintedReel]);
    
    // Update source reel weight or status
    setPaperReels(prev => prev.map(r => {
      if (r.serialNumber === printingSourceReel) {
        if (printingUsedEntireReel) {
          return { ...r, weight: 0, status: 'Consumed' };
        }
        const remainingWeight = r.weight - weightUsed;
        return {
          ...r,
          weight: remainingWeight,
          status: remainingWeight <= 0.1 ? 'Consumed' : 'Available'
        };
      }
      return r;
    }));
    
    // Reset form
    setPrintingCustomer('');
    setPrintingColour('');
    setPrintingSourceReel('');
    setPrintingInks([]);
    setPrintingFinalWeight('');
    setPrintingSerial('');
    setPrintingWeightUsed('');
    setPrintingUsedEntireReel(false);
    setPrintingDefects('');
    setPrintingDefectsQty('');
    setActiveTab('inventory');
  };

  const handleStartCutting = () => {
    if (!cuttingSourceReel || cuttingNumBags <= 0) return;

    const reel = printedReels.find(r => r.serialNumber === cuttingSourceReel);
    if (!reel) return;

    const newBags: FreshCutBag[] = [];
    for (let i = 1; i <= cuttingNumBags; i++) {
      newBags.push({
        id: `${reel.serialNumber}/${i}`,
        parentReelSerial: reel.serialNumber,
        customer: reel.customer,
        colour: reel.colour,
        productCode: reel.productCode,
        weight: parseFloat(cuttingBagWeights[i-1]) || 0,
        cuttingDate: Date.now(),
        status: 'Available for Blowing'
      });
    }

    setFreshCutBags(prev => [...prev, ...newBags]);
    setPrintedReels(prev => prev.map(r => r.serialNumber === cuttingSourceReel ? { ...r, status: 'Cut' } : r));
    
    setCuttingSourceReel('');
    setCuttingNumBags(1);
    setCuttingBagWeights(['']);
    setActiveTab('inventory');
  };

  const handleStartBlowing = () => {
    if (blowingSelectedBags.length === 0 || !selectedBlower) return;

    const machine = machines.find(m => m.id === selectedBlower);
    if (!machine) return;

    // Mark bags as "In Blowing"
    setFreshCutBags(prev => prev.map(b => 
      blowingSelectedBags.some(sb => sb.id === b.id) ? { ...b, status: 'In Blowing' } : b
    ));
    
    const firstBag = freshCutBags.find(b => b.id === blowingSelectedBags[0].id);

    setMachines(prev => prev.map(m => 
      m.id === selectedBlower 
        ? { 
            ...m, 
            status: 'in_production', 
            currentBagIds: blowingSelectedBags.map(sb => sb.id),
            sourceBags: blowingSelectedBags,
            blowingPasses: 1,
            currentBagSerialNumber: blowingSelectedBags.length > 1 
              ? `${blowingSelectedBags.length} Bags` 
              : blowingSelectedBags[0].id,
            currentProduct: firstBag ? `${firstBag.customer} • ${firstBag.colour}` : 'Mixed Bags',
            assignedProduct: m.assignedProduct || (firstBag ? `${firstBag.customer} • ${firstBag.colour}` : '')
          } 
        : m
    ));

    setBlowingSelectedBags([]);
    setSelectedBlower('');
  };

  const handleFinishBlowing = (machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine || (!machine.currentBagId && !machine.currentBagIds)) return;

    const sourceBagsInfo = machine.sourceBags || (machine.currentBagId ? [{ id: machine.currentBagId, weightUsed: 0, usedEntirely: true }] : []);
    
    // Find actual bags from freshCutBags
    const bags = freshCutBags.filter(b => sourceBagsInfo.some(sb => sb.id === b.id));
    if (bags.length === 0) return;

    const firstBag = bags[0];
    const totalWeight = sourceBagsInfo.reduce((sum, sb) => {
      if (sb.usedEntirely) {
        const bag = bags.find(b => b.id === sb.id);
        return sum + (bag?.weight || 0);
      }
      return sum + sb.weightUsed;
    }, 0);

    const newBlownBag: BlownBag = {
      id: uuidv4(),
      parentBagIds: sourceBagsInfo.map(sb => sb.id),
      sourceBags: sourceBagsInfo,
      customer: firstBag.customer,
      colour: firstBag.colour,
      productCode: firstBag.productCode,
      weight: totalWeight,
      blowingDate: Date.now(),
      startTime: Date.now() - 3600000, // Mock 1h duration
      finishTime: Date.now(),
      duration: 60,
      blowingPasses: machine.blowingPasses,
      machineId: machineId,
      status: 'Available for Shaking'
    };

    setBlownBags(prev => [...prev, newBlownBag]);
    
    // Update freshCutBags: if usedEntirely, status = 'Blown'. If not, subtract weight and status = 'Available for Blowing'
    setFreshCutBags(prev => prev.map(b => {
      const sbInfo = sourceBagsInfo.find(sb => sb.id === b.id);
      if (sbInfo) {
        if (sbInfo.usedEntirely) {
          return { ...b, status: 'Blown' };
        } else {
          const remainingWeight = b.weight - sbInfo.weightUsed;
          return { 
            ...b, 
            weight: Math.max(0, remainingWeight), 
            status: remainingWeight <= 0.01 ? 'Blown' : 'Available for Blowing' 
          };
        }
      }
      return b;
    }));
    
    setMachines(prev => prev.map(m => 
      m.id === machineId 
        ? { 
            ...m, 
            status: 'in_production', 
            currentBagId: undefined, 
            currentBagIds: undefined,
            sourceBags: undefined,
            currentBagSerialNumber: undefined,
            currentProduct: undefined 
          } 
        : m
    ));
  };

  const handleFinalizeProduction = (machineId: string) => {
    setMachines(prev => prev.map(m => 
      m.id === machineId 
        ? { 
            ...m, 
            status: 'needs_cleaning', 
            currentBagId: undefined, 
            currentBagIds: undefined,
            sourceBags: undefined,
            blowingPasses: undefined,
            currentBagSerialNumber: undefined,
            currentProduct: undefined 
          } 
        : m
    ));
  };

  const handleIncrementBlowingPasses = (machineId: string) => {
    setMachines(prev => prev.map(m => 
      m.id === machineId 
        ? { ...m, blowingPasses: (m.blowingPasses || 0) + 1 } 
        : m
    ));
  };

  const handleDecrementBlowingPasses = (machineId: string) => {
    setMachines(prev => prev.map(m => 
      m.id === machineId 
        ? { ...m, blowingPasses: Math.max(1, (m.blowingPasses || 1) - 1) } 
        : m
    ));
  };

  const handleStartShaking = () => {
    if (!shakingSourceBag || !selectedShaker) return;

    const bag = blownBags.find(b => b.id === shakingSourceBag) || shakenBags.find(b => b.id === shakingSourceBag);
    const machine = machines.find(m => m.id === selectedShaker);
    if (!bag || !machine) return;

    setBlownBags(prev => prev.map(b => b.id === shakingSourceBag ? { ...b, status: 'In Shaking' } : b));
    setShakenBags(prev => prev.map(b => b.id === shakingSourceBag ? { ...b, status: 'In Shaking' } : b));
    
    setMachines(prev => prev.map(m => 
      m.id === selectedShaker 
        ? { 
            ...m, 
            status: 'in_production', 
            currentBagId: bag.id, 
            currentBagSerialNumber: bag.id,
            currentProduct: `${bag.customer} • ${bag.colour}`,
            assignedProduct: m.assignedProduct || `${bag.customer} • ${bag.colour}`
          } 
        : m
    ));

    setShakingSourceBag('');
    setSelectedShaker('');
  };

  const handleFinishShaking = (machineId: string, goodWeight: number, wasteWeight: number, dustWeight: number, cardboardWeight: number, dBagWeight: number, existingBoxNum?: string, newBoxNumber?: string) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine || !machine.currentBagId) return;

    // The source could be a BlownBag OR a ShakenBag (if it was a D-Bag)
    const sourceBlownBag = blownBags.find(b => b.id === machine.currentBagId);
    const sourceShakenBag = shakenBags.find(b => b.id === machine.currentBagId);
    
    if (!sourceBlownBag && !sourceShakenBag) return;

    const customer = sourceBlownBag?.customer || sourceShakenBag?.customer || '';
    const colour = sourceBlownBag?.colour || sourceShakenBag?.colour || '';
    const productCode = sourceBlownBag?.productCode || sourceShakenBag?.productCode || '';
    const sourceId = sourceBlownBag?.id || sourceShakenBag?.id || '';
    const currentDBagLevel = sourceShakenBag?.dBagLevel || 0;

    // 1. Handle Box
    let targetBoxNum = existingBoxNum;
    if (!targetBoxNum && newBoxNumber) {
      const newBox: FinalBox = {
        boxNumber: newBoxNumber,
        customer: customer,
        colour: colour,
        productCode: productCode,
        bags: [],
        totalWeight: 0,
        packingDate: Date.now(),
        status: 'Filling'
      };
      setFinalBoxes(prev => [...prev, newBox]);
      targetBoxNum = newBox.boxNumber;
    }

    if (targetBoxNum && goodWeight > 0) {
      setFinalBoxes(prev => prev.map(box => {
        if (box.boxNumber === targetBoxNum) {
          const updatedWeight = box.totalWeight + goodWeight;
          return {
            ...box,
            bags: [...box.bags, { bagId: sourceId, weightAdded: goodWeight, type: 'Shaken' }],
            totalWeight: updatedWeight,
            status: updatedWeight >= 15 ? 'Completed' : 'Filling'
          };
        }
        return box;
      }));
    }

    // 2. Handle Shaken Bag Record
    const newShakenBag: ShakenBag = {
      id: uuidv4(),
      parentBlownBagId: sourceId,
      customer: customer,
      colour: colour,
      productCode: productCode,
      usableWeight: goodWeight,
      wasteWeight: wasteWeight,
      dustWeight: dustWeight,
      cardboardWeight: cardboardWeight,
      dBagWeight: dBagWeight,
      dBagLevel: dBagWeight > 0 ? currentDBagLevel + 1 : undefined,
      shakingDate: Date.now(),
      startTime: Date.now() - 1800000, // Mock 30m
      finishTime: Date.now(),
      duration: 30,
      machineId: machineId,
      status: dBagWeight > 0 ? 'D-Bag' : 'Boxed'
    };
    setShakenBags(prev => [...prev, newShakenBag]);

    // Update source status
    if (sourceBlownBag) {
      setBlownBags(prev => prev.map(b => b.id === sourceId ? { ...b, status: 'Shaken' } : b));
    } else if (sourceShakenBag) {
      setShakenBags(prev => prev.map(b => b.id === sourceId ? { ...b, status: 'Boxed' } : b));
    }

    // 3. Update Machine
    setMachines(prev => prev.map(m => 
      m.id === machineId 
        ? { 
            ...m, 
            status: 'in_production', 
            currentBagId: undefined, 
            currentBagSerialNumber: undefined,
            currentProduct: undefined 
          } 
        : m
    ));
  };

  const handleCleanMachine = (machineId: string) => {
    setMachines(prev => prev.map(m => 
      m.id === machineId 
        ? { ...m, status: 'clean' } 
        : m
    ));
  };

  const handleAssignProduct = (machineId: string, productCode: string) => {
    setMachines(prev => prev.map(m => 
      m.id === machineId 
        ? { ...m, assignedProduct: productCode } 
        : m
    ));
  };

  // History Editing State
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editingShakingId, setEditingShakingId] = useState<string | null>(null);
  const [editShakingFormData, setEditShakingFormData] = useState<any>({});

  const handleEditRecord = (record: any) => {
    setEditingRecordId(record.id);
    setEditFormData({ ...record });
  };

  const handleSaveEdit = () => {
    setEditingRecordId(null);
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
  };

  const handleDeleteRecord = (id: string) => {
    setBlownBags(prev => prev.filter(b => b.id !== id));
  };

  const handleEditShaking = (record: any) => {
    setEditingShakingId(record.id);
    setEditShakingFormData({ ...record });
  };

  const handleSaveShakingEdit = () => {
    setEditingShakingId(null);
  };

  const handleCancelShakingEdit = () => {
    setEditingShakingId(null);
  };

  const handleDeleteShakingRecord = (id: string) => {
    setShakenBags(prev => prev.filter(b => b.id !== id));
  };

  const availablePrintedReels = printedReels.filter(r => r.status === 'Available for Cutting');
  const availableFreshCutBags = freshCutBags.filter(b => b.status === 'Available for Blowing');
  const availableBlownBags = [
    ...blownBags.filter(b => b.status === 'Available for Shaking').map(b => ({
      id: b.id,
      productCode: b.productCode,
      weight: b.weight,
      label: `${b.id} (Blown - ${b.productCode} - ${b.weight}kg)`
    })),
    ...shakenBags.filter(b => b.status === 'D-Bag').map(b => ({
      id: b.id,
      productCode: b.productCode,
      weight: b.dBagWeight || 0,
      label: `${b.id} (D${b.dBagLevel} - ${b.productCode} - ${b.dBagWeight}kg)`
    }))
  ];

  const blowingHistory = blownBags.map(b => {
    const machine = machines.find(m => m.id === b.machineId);
    return {
      id: b.id,
      timestamp: b.blowingDate,
      bagSerialNumber: b.id,
      sourceBags: b.sourceBags || [],
      passes: b.blowingPasses || 1,
      product: b.productCode,
      blower: machine?.name || 'Unknown',
      bay: machine?.bay || 'Unknown'
    };
  }).sort((a, b) => b.timestamp - a.timestamp);

  const shakingHistory = shakenBags.map(b => {
    const machine = machines.find(m => m.id === b.machineId);
    const box = finalBoxes.find(box => box.bags.some(bag => bag.bagId === b.id));
    return {
      id: b.id,
      timestamp: b.shakingDate,
      bagSerialNumber: b.id,
      product: b.productCode,
      boxNumber: box?.boxNumber || 'N/A',
      status: b.status
    };
  }).sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/20">
              <Factory className="text-white" size={24} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Production Management</h2>
          </div>
          
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all border",
              isAdmin 
                ? "bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-lg shadow-rose-500/10" 
                : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
            )}
          >
            {isAdmin ? <ShieldAlert size={14} /> : <Shield size={14} />}
            {isAdmin ? "Admin Mode ON" : "Admin Mode"}
          </button>
        </div>
        <p className="text-slate-400">Manage factory production processes from printing to shaking.</p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl mb-8 w-fit">
        <button
          onClick={() => setActiveTab('printing')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm",
            activeTab === 'printing' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Droplets size={16} />
          Printing
        </button>
        <button
          onClick={() => setActiveTab('cutting')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm",
            activeTab === 'cutting' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Scissors size={16} />
          Cutting
        </button>
        <button
          onClick={() => setActiveTab('blowing')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm",
            activeTab === 'blowing' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Fan size={16} />
          Blowing
        </button>
        <button
          onClick={() => setActiveTab('shaking')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm",
            activeTab === 'shaking' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
          )}
        >
          <LayoutGrid size={16} />
          Shaking
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm",
            activeTab === 'inventory' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Package size={16} />
          Stock
        </button>
        <button
          onClick={() => setActiveTab('machines')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm",
            activeTab === 'machines' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Factory size={16} />
          Machines
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm",
            activeTab === 'history' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
          )}
        >
          <History size={16} />
          History
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'raw_materials' && (
          <motion.div
            key="raw_materials"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Plus className="text-blue-500" size={20} />
                  Register New Raw Reel
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Serial Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. RR-001"
                      value={newReelSerial}
                      onChange={(e) => setNewReelSerial(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Initial Weight (Kg)</label>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        value={newReelWeight}
                        onChange={(e) => setNewReelWeight(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">GSM</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 22"
                        value={newReelGsm}
                        onChange={(e) => setNewReelGsm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Supplier</label>
                    <input 
                      type="text" 
                      placeholder="e.g. PaperCo"
                      value={newReelSupplier}
                      onChange={(e) => setNewReelSupplier(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  
                  <button
                    onClick={handleAddRawReel}
                    disabled={!newReelSerial || !newReelWeight || !newReelGsm}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                  >
                    <Plus size={18} />
                    Add to Inventory
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-full">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Package className="text-slate-500" size={20} />
                  Available Raw Reels
                </h3>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {paperReels.filter(r => r.status === 'Available').length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                      <Package size={48} className="mb-4 opacity-20" />
                      <p className="font-medium">No raw reels available</p>
                    </div>
                  ) : (
                    paperReels.filter(r => r.status === 'Available').slice().reverse().map((roll) => (
                      <div 
                        key={roll.serialNumber}
                        className="group flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <Package size={20} />
                          </div>
                          <div>
                            <p className="font-mono font-bold text-sm text-slate-200">{roll.serialNumber}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{roll.supplier || 'No Supplier'}</p>
                              <span className="text-slate-700 text-[10px]">•</span>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{roll.weight}kg • {roll.gsm}gsm</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500">
                            Available
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'printing' && (
          <motion.div
            key="printing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Plus className="text-blue-500" size={20} />
                  New Printing Process
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Customer</label>
                      <select 
                        value={printingCustomer}
                        onChange={(e) => setPrintingCustomer(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Select customer...</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Colour</label>
                      <select 
                        value={printingColour}
                        onChange={(e) => setPrintingColour(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Select colour...</option>
                        {Array.from(new Set(products.map(p => p.colour).filter(Boolean))).map(colour => (
                          <option key={colour} value={colour}>{colour}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest flex justify-between">
                      Source Paper Reel
                      <button 
                        onClick={startScanning}
                        className="text-blue-500 hover:text-blue-400 flex items-center gap-1"
                      >
                        <Camera size={12} />
                        Scan
                      </button>
                    </label>
                    <select 
                      value={printingSourceReel}
                      onChange={(e) => setPrintingSourceReel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="">Select reel...</option>
                      {paperReels.filter(r => r.status === 'Available').map(r => (
                        <option key={r.serialNumber} value={r.serialNumber}>{r.serialNumber} ({r.weight}kg - {r.gsm}gsm)</option>
                      ))}
                    </select>
                  </div>

                  {isScanning && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold">Scan Barcode</h3>
                          <button onClick={stopScanning} className="p-2 text-slate-500 hover:text-white">
                            <X size={20} />
                          </button>
                        </div>
                        <div id="reader" className="overflow-hidden rounded-2xl border border-slate-800 bg-black"></div>
                        <p className="text-center text-xs text-slate-500 mt-4">Point the camera at the reel's barcode</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Reel Number (Serial)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 3225711M22 - N1"
                        value={printingSerial}
                        onChange={(e) => setPrintingSerial(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Reel Weight (Final Kg)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={printingFinalWeight}
                        onChange={(e) => setPrintingFinalWeight(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Weight Used from Source (Kg)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={printingWeightUsed}
                        onChange={(e) => setPrintingWeightUsed(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center transition-all",
                          printingUsedEntireReel ? "bg-blue-600 border-blue-600" : "border-slate-700 group-hover:border-slate-500"
                        )} onClick={() => setPrintingUsedEntireReel(!printingUsedEntireReel)}>
                          {printingUsedEntireReel && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">Entire Reel used?</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Defects (Description & Qty)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Describe defects..."
                        value={printingDefects}
                        onChange={(e) => setPrintingDefects(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <input 
                        type="number" 
                        placeholder="Qty"
                        value={printingDefectsQty}
                        onChange={(e) => setPrintingDefectsQty(e.target.value)}
                        className="w-20 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Ink's usage</label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select 
                          id="ink-select"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                        >
                          <option value="">Select ink...</option>
                          {inkCans.filter(i => i.status !== 'Empty').map(ink => (
                            <option key={ink.serialNumber} value={ink.serialNumber}>{ink.serialNumber} ({ink.colour} - {ink.remainingVolume}L)</option>
                          ))}
                        </select>
                        <input 
                          id="ink-qty"
                          type="number" 
                          step="0.01"
                          placeholder="Qty (L)"
                          className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        <button 
                          onClick={() => {
                            const select = document.getElementById('ink-select') as HTMLSelectElement;
                            const qtyInput = document.getElementById('ink-qty') as HTMLInputElement;
                            const serial = select.value;
                            const consumption = parseFloat(qtyInput.value);
                            if (serial && consumption > 0) {
                              setPrintingInks(prev => [...prev, { serial, consumption }]);
                              select.value = '';
                              qtyInput.value = '';
                            }
                          }}
                          className="p-3 bg-slate-800 hover:bg-slate-700 text-blue-500 rounded-xl transition-all"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {printingInks.map((ink, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
                            <span className="text-slate-300 font-mono">{ink.serial}</span>
                            <span className="text-blue-500 font-bold">{ink.consumption}L</span>
                            <button 
                              onClick={() => setPrintingInks(prev => prev.filter((_, i) => i !== idx))}
                              className="text-slate-600 hover:text-rose-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleStartPrinting}
                    disabled={!printingCustomer || !printingColour || !printingSourceReel || !printingSerial}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                  >
                    <CheckCircle2 size={18} />
                    Complete Printing Process
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-full">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Package className="text-slate-500" size={20} />
                  Recent Printed Reels
                </h3>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {printedReels.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                      <Package size={48} className="mb-4 opacity-20" />
                      <p className="font-medium">No printed reels yet</p>
                    </div>
                  ) : (
                    printedReels.slice().reverse().map((roll) => (
                      <div 
                        key={roll.serialNumber}
                        className="group flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            roll.status === 'Cut' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                          )}>
                            <Droplets size={20} />
                          </div>
                          <div>
                            <p className="font-mono font-bold text-sm text-slate-200">{roll.serialNumber}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{roll.customer} • {roll.colour}</p>
                              <span className="text-slate-700 text-[10px]">•</span>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{roll.finalWeight}kg</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            roll.status === 'Cut' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                          )}>
                            {roll.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'cutting' && (
          <motion.div
            key="cutting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Plus className="text-blue-500" size={20} />
                  New Cutting Process
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Select Printed Reel</label>
                    <select 
                      value={cuttingSourceReel}
                      onChange={(e) => setCuttingSourceReel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="">Select a reel...</option>
                      {availablePrintedReels.map(roll => (
                        <option key={roll.serialNumber} value={roll.serialNumber}>{roll.serialNumber} ({roll.customer} • {roll.colour})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Number of Bags</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        value={cuttingNumBags}
                        onChange={(e) => setCuttingNumBags(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <span className="bg-slate-950 border border-slate-800 w-12 h-10 flex items-center justify-center rounded-xl font-mono font-bold text-blue-400">
                        {cuttingNumBags}
                      </span>
                    </div>
                  </div>

                  {cuttingSourceReel && (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-900/50 border-b border-slate-800">
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Bag ID</th>
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Weight (Kg)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {Array.from({ length: cuttingNumBags }).map((_, i) => (
                            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 font-mono text-slate-400">
                                {cuttingSourceReel}/{i + 1}
                              </td>
                              <td className="px-4 py-2">
                                <input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="0.00"
                                  value={cuttingBagWeights[i] || ''}
                                  onChange={(e) => {
                                    const newWeights = [...cuttingBagWeights];
                                    newWeights[i] = e.target.value;
                                    setCuttingBagWeights(newWeights);
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <button
                    onClick={handleStartCutting}
                    disabled={!cuttingSourceReel}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                  >
                    <Scissors size={18} />
                    Cut Reel into Bags
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-full">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Package className="text-slate-500" size={20} />
                  Recent Fresh Cut Bags
                </h3>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {freshCutBags.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                      <Package size={48} className="mb-4 opacity-20" />
                      <p className="font-medium">No bags generated yet</p>
                    </div>
                  ) : (
                    freshCutBags.slice().reverse().map((bag) => (
                      <div 
                        key={bag.id}
                        className="group flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            bag.status === 'Blown' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                          )}>
                            <Package size={20} />
                          </div>
                          <div>
                            <p className="font-mono font-bold text-sm text-slate-200">{bag.id}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{bag.customer} • {bag.colour}</p>
                              <span className="text-slate-700 text-[10px]">•</span>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{bag.weight}kg</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            bag.status === 'Blown' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                          )}>
                            {bag.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'inventory' && (
          <motion.div
            key="inventory"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Package className="text-blue-500" size={20} />
                Production Inventory Summary
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Raw Reels</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Available</span>
                    <span className="text-lg font-bold text-emerald-400">{paperReels.filter(r => r.status === 'Available').length}</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Printed Reels</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Available</span>
                    <span className="text-lg font-bold text-blue-400">{printedReels.filter(r => r.status === 'Available for Cutting').length}</span>
                  </div>
                </div>
                
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Fresh Cut Bags</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Available</span>
                    <span className="text-lg font-bold text-blue-400">{freshCutBags.filter(b => b.status === 'Available for Blowing').length}</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Blown Bags</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Available</span>
                    <span className="text-lg font-bold text-blue-400">{blownBags.filter(b => b.status === 'Available for Shaking').length}</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Final Boxes</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">In Progress</span>
                    <span className="text-lg font-bold text-indigo-400">{finalBoxes.filter(b => b.status === 'In Progress').length}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <Database size={18} className="text-emerald-500" />
                    Available Raw Reels
                  </h4>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {paperReels.filter(r => r.status === 'Available').map(roll => (
                      <div key={roll.serialNumber} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-mono font-bold text-sm text-slate-200">{roll.serialNumber}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">{roll.weight}kg • {roll.gsm}gsm</p>
                        </div>
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[8px] font-bold uppercase tracking-widest">Available</span>
                      </div>
                    ))}
                    {paperReels.filter(r => r.status === 'Available').length === 0 && (
                      <p className="text-center py-8 text-slate-600 text-sm italic">No raw reels available</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <Package size={18} className="text-blue-500" />
                    Available Printed Reels
                  </h4>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {printedReels.filter(r => r.status === 'Available for Cutting').map(roll => (
                      <div key={roll.serialNumber} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-mono font-bold text-sm text-slate-200">{roll.serialNumber}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">{roll.customer} • {roll.colour} • {roll.finalWeight}kg</p>
                        </div>
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[8px] font-bold uppercase tracking-widest">Available</span>
                      </div>
                    ))}
                    {printedReels.filter(r => r.status === 'Available for Cutting').length === 0 && (
                      <p className="text-center py-8 text-slate-600 text-sm italic">No available printed reels</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <Box size={18} className="text-indigo-500" />
                    Active Final Boxes
                  </h4>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {finalBoxes.filter(b => b.status === 'In Progress').map(box => (
                      <div key={box.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-mono font-bold text-sm text-slate-200">{box.boxNumber}</p>
                          <span className="text-[10px] text-indigo-400 font-bold">{box.currentWeight.toFixed(2)} / 15.00 kg</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full transition-all duration-500" 
                            style={{ width: `${Math.min((box.currentWeight / 15) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {finalBoxes.filter(b => b.status === 'In Progress').length === 0 && (
                      <p className="text-center py-8 text-slate-600 text-sm italic">No active boxes</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'blowing' && (
          <motion.div
            key="blowing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Fan className="text-blue-500" size={20} />
                  New Blowing Operation
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Select Fresh Cut Bags</label>
                    <div className="flex gap-2 mb-4">
                      <select 
                        value={""}
                        onChange={(e) => {
                          const bagId = e.target.value;
                          if (!bagId) return;
                          const bag = freshCutBags.find(b => b.id === bagId);
                          if (bag && !blowingSelectedBags.some(sb => sb.id === bagId)) {
                            setBlowingSelectedBags([...blowingSelectedBags, { id: bagId, weightUsed: bag.weight, usedEntirely: true }]);
                          }
                        }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Add a bag...</option>
                        {availableFreshCutBags.filter(bag => !blowingSelectedBags.some(sb => sb.id === bag.id)).map(bag => (
                          <option key={bag.id} value={bag.id}>{bag.id} ({bag.customer} • {bag.colour} - {bag.weight}kg)</option>
                        ))}
                      </select>
                    </div>

                    {blowingSelectedBags.length > 0 && (
                      <div className="space-y-3 mb-6">
                        {blowingSelectedBags.map((sb, index) => {
                          const bag = freshCutBags.find(b => b.id === sb.id);
                          return (
                            <div key={sb.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Package size={16} />
                                  </div>
                                  <div>
                                    <p className="font-mono font-bold text-xs text-slate-200">{sb.id}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{bag?.customer} • {bag?.colour}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setBlowingSelectedBags(blowingSelectedBags.filter((_, i) => i !== index))}
                                  className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-900">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => {
                                      const newBags = [...blowingSelectedBags];
                                      const currentlyEntire = newBags[index].usedEntirely;
                                      newBags[index].usedEntirely = !currentlyEntire;
                                      if (newBags[index].usedEntirely && bag) {
                                        newBags[index].weightUsed = bag.weight;
                                      } else if (!newBags[index].usedEntirely && bag) {
                                        // Default to 95% when switching to partial to show the slider
                                        newBags[index].weightUsed = parseFloat(((bag.weight * 95) / 100).toFixed(2));
                                      }
                                      setBlowingSelectedBags(newBags);
                                    }}
                                    className={cn(
                                      "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
                                      sb.usedEntirely 
                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                        : "bg-slate-900 text-slate-500 border-slate-800"
                                    )}
                                  >
                                    {sb.usedEntirely ? "Used Entirely" : "Partial Usage"}
                                  </button>
                                </div>
                                
                                {!sb.usedEntirely && (
                                  <div className="flex flex-col gap-3 w-full pt-2 border-t border-slate-900/50">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Usage Percentage</span>
                                      <span className="text-[10px] font-bold text-blue-400">{Math.round((sb.weightUsed / (bag?.weight || 1)) * 100)}%</span>
                                    </div>
                                    <input 
                                      type="range"
                                      min="5"
                                      max="100"
                                      step="5"
                                      value={Math.round((sb.weightUsed / (bag?.weight || 1)) * 100)}
                                      onChange={(e) => {
                                        const percent = parseInt(e.target.value);
                                        const newBags = [...blowingSelectedBags];
                                        if (bag) {
                                          newBags[index].weightUsed = parseFloat(((bag.weight * percent) / 100).toFixed(2));
                                          newBags[index].usedEntirely = percent === 100;
                                        }
                                        setBlowingSelectedBags(newBags);
                                      }}
                                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                    <div className="flex items-center gap-2 self-end">
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        max={bag?.weight}
                                        value={sb.weightUsed}
                                        onChange={(e) => {
                                          const newBags = [...blowingSelectedBags];
                                          newBags[index].weightUsed = parseFloat(e.target.value) || 0;
                                          setBlowingSelectedBags(newBags);
                                        }}
                                        className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-right"
                                      />
                                      <span className="text-[10px] text-slate-500 font-bold">Kg</span>
                                    </div>
                                  </div>
                                )}
                                {sb.usedEntirely && (
                                  <div className="flex items-center justify-end w-full pt-2 border-t border-slate-900/50">
                                    <span className="text-[10px] text-slate-500 font-bold">{bag?.weight} Kg</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Select Blower Machine</label>
                    <select 
                      value={selectedBlower}
                      onChange={(e) => setSelectedBlower(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="">Select blower...</option>
                      {machines.filter(m => m.type === 'blower' && (m.status === 'clean' || (m.status === 'in_production' && !m.currentBagId))).map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.bay}) {m.assignedProduct ? `- ${m.assignedProduct}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={handleStartBlowing}
                    disabled={blowingSelectedBags.length === 0 || !selectedBlower}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                  >
                    <Fan size={18} />
                    Start Blowing
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-full">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <History className="text-slate-500" size={20} />
                  Active Blowers
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {machines.filter(m => m.type === 'blower' && m.status === 'in_production').map(m => (
                    <div key={m.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                      {m.currentBagId || m.currentBagIds ? (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <Fan className="animate-spin-slow" size={20} />
                              </div>
                              <div>
                                <p className="font-mono font-bold text-sm text-slate-200">{m.currentBagSerialNumber}</p>
                                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{m.name}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Passes</span>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleDecrementBlowingPasses(m.id)}
                                  className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700 transition-all"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-sm font-bold text-slate-200">{m.blowingPasses || 1}</span>
                                <button 
                                  onClick={() => handleIncrementBlowingPasses(m.id)}
                                  className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/30 transition-all"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleFinishBlowing(m.id)}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                            >
                              Finish Bag
                            </button>
                            <button 
                              onClick={() => handleFinalizeProduction(m.id)}
                              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                              title="Finalize Production"
                            >
                              Finalize
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-4 mb-4 opacity-50">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center">
                              <Fan size={20} />
                            </div>
                            <div>
                              <p className="font-mono font-bold text-sm text-slate-500">IDLE</p>
                              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{m.name}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleFinalizeProduction(m.id)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                          >
                            Finalize Production
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                  {machines.filter(m => m.type === 'blower' && m.status === 'in_production').length === 0 && (
                    <div className="col-span-2 py-12 text-center text-slate-600">
                      <p className="text-sm">No active blowing operations</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'shaking' && (
          <motion.div
            key="shaking"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <LayoutGrid className="text-blue-500" size={20} />
                  New Shaking Operation
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Select Blown Bag</label>
                    <select 
                      value={shakingSourceBag}
                      onChange={(e) => setShakingSourceBag(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="">Select a bag...</option>
                      {availableBlownBags.map(bag => (
                        <option key={bag.id} value={bag.id}>{bag.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Select Shaker Machine</label>
                    <select 
                      value={selectedShaker}
                      onChange={(e) => setSelectedShaker(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="">Select shaker...</option>
                      {machines.filter(m => m.type === 'shaker' && (m.status === 'clean' || (m.status === 'in_production' && !m.currentBagId))).map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.bay}) {m.assignedProduct ? `- ${m.assignedProduct}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={handleStartShaking}
                    disabled={!shakingSourceBag || !selectedShaker}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                  >
                    <LayoutGrid size={18} />
                    Start Shaking
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-full">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <History className="text-slate-500" size={20} />
                  Active Shakers
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {machines.filter(m => m.type === 'shaker' && m.status === 'in_production').map(m => (
                    <ActiveShakerItem 
                      key={m.id}
                      machine={m}
                      boxes={finalBoxes}
                      onFinish={(gw, ww, dw, cw, dbw, boxId, newBox) => handleFinishShaking(m.id, gw, ww, dw, cw, dbw, boxId, newBox)}
                      onFinalize={() => handleFinalizeProduction(m.id)}
                    />
                  ))}
                  {machines.filter(m => m.type === 'shaker' && m.status === 'in_production').length === 0 && (
                    <div className="col-span-2 py-12 text-center text-slate-600">
                      <p className="text-sm">No active shaking operations</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'machines' && (
          <motion.div
            key="machines"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Blowers Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Fan className="text-blue-500" size={20} />
                Blowers & Bays
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {machines.filter(m => m.type === 'blower').map((m) => (
                  <div 
                    key={m.id} 
                    className={cn(
                      "bg-slate-950 border rounded-2xl p-5 transition-all",
                      m.status === 'clean' ? "border-slate-800" : 
                      m.status === 'in_production' ? "border-blue-500/30 bg-blue-500/5" : 
                      "border-rose-500/30 bg-rose-500/5"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-slate-200">{m.name}</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{m.bay}</p>
                      </div>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        m.status === 'clean' ? "bg-emerald-500/10 text-emerald-500" : 
                        m.status === 'in_production' ? "bg-blue-500/10 text-blue-500" : 
                        "bg-rose-500/10 text-rose-500"
                      )}>
                        {m.status === 'in_production' ? <Fan className="animate-spin-slow" size={16} /> : <Factory size={16} />}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Status</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          m.status === 'clean' ? "bg-emerald-500/10 text-emerald-500" : 
                          m.status === 'in_production' ? "bg-blue-500/10 text-blue-500" : 
                          "bg-rose-500/10 text-rose-500"
                        )}>
                          {m.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-800/50">
                        <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Assigned Product</label>
                        <select 
                          value={m.assignedProduct || ''}
                          onChange={(e) => handleAssignProduct(m.id, e.target.value)}
                          disabled={m.status === 'in_production'}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] outline-none focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none disabled:opacity-50"
                        >
                          <option value="">No product assigned</option>
                          {products.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      {m.status === 'in_production' && m.currentBagId && (
                        <div className="pt-2 border-t border-slate-800/50">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Current Bag</p>
                          <p className="text-xs font-bold text-blue-400">{m.currentBagSerialNumber}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {m.status === 'needs_cleaning' && (
                        <button
                          onClick={() => handleCleanMachine(m.id)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={14} />
                          Mark as Clean
                        </button>
                      )}

                      {m.status === 'in_production' && m.currentBagId && (
                        <button
                          onClick={() => handleFinishBlowing(m.id)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          Finish Bag
                        </button>
                      )}

                      {m.status === 'in_production' && (
                        <button
                          onClick={() => handleFinalizeProduction(m.id)}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          Finalize Production
                        </button>
                      )}

                      {m.status === 'clean' && (
                        <div className="w-full py-2 bg-emerald-500/5 text-emerald-500/50 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center border border-emerald-500/10">
                          Ready for Use
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shakers Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <LayoutGrid className="text-indigo-500" size={20} />
                Shakers & Areas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {machines.filter(m => m.type === 'shaker').map((m) => (
                  <div 
                    key={m.id} 
                    className={cn(
                      "bg-slate-950 border rounded-2xl p-5 transition-all",
                      m.status === 'clean' ? "border-slate-800" : 
                      m.status === 'in_production' ? "border-indigo-500/30 bg-indigo-500/5" : 
                      "border-rose-500/30 bg-rose-500/5"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-slate-200">{m.name}</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{m.bay}</p>
                      </div>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        m.status === 'clean' ? "bg-emerald-500/10 text-emerald-500" : 
                        m.status === 'in_production' ? "bg-indigo-500/10 text-indigo-500" : 
                        "bg-rose-500/10 text-rose-500"
                      )}>
                        {m.status === 'in_production' ? <Layers className="animate-pulse" size={16} /> : <Factory size={16} />}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Status</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          m.status === 'clean' ? "bg-emerald-500/10 text-emerald-500" : 
                          m.status === 'in_production' ? "bg-indigo-500/10 text-indigo-500" : 
                          "bg-rose-500/10 text-rose-500"
                        )}>
                          {m.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-800/50">
                        <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Assigned Product</label>
                        <select 
                          value={m.assignedProduct || ''}
                          onChange={(e) => handleAssignProduct(m.id, e.target.value)}
                          disabled={m.status === 'in_production'}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none disabled:opacity-50"
                        >
                          <option value="">No product assigned</option>
                          {products.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      {m.status === 'in_production' && m.currentBagId && (
                        <div className="pt-2 border-t border-slate-800/50">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Current Bag</p>
                          <p className="text-xs font-bold text-indigo-400">{m.currentBagSerialNumber}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      {m.status === 'needs_cleaning' && (
                        <button
                          onClick={() => handleCleanMachine(m.id)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={14} />
                          Mark as Clean
                        </button>
                      )}

                      {m.status === 'in_production' && (
                        <button
                          onClick={() => handleFinalizeProduction(m.id)}
                          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          Finalize Production
                        </button>
                      )}

                      {m.status === 'clean' && (
                        <div className="w-full py-2 bg-emerald-500/5 text-emerald-500/50 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center border border-emerald-500/10">
                          Ready for Use
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <History className="text-blue-500" size={20} />
              Blowing History
            </h3>

            <div className="overflow-x-auto space-y-8">
              <div>
                <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Blowing Events</h4>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bag Serial</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Blower</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bay</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Passes</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                      {isAdmin && <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {blowingHistory.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 8 : 7} className="px-4 py-10 text-center text-slate-600">
                          No blowing records found.
                        </td>
                      </tr>
                    ) : (
                      blowingHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-4 text-xs text-slate-400 font-mono">
                            {new Date(record.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-slate-200 font-mono">
                            <div className="flex flex-col gap-1">
                              {record.sourceBags.map(sb => (
                                <span key={sb.id} className="text-[10px] text-slate-400">
                                  {sb.id} ({sb.usedEntirely ? 'Full' : `${sb.weightUsed}kg`})
                                </span>
                              ))}
                              {record.sourceBags.length === 0 && record.bagSerialNumber}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-300">
                            {editingRecordId === record.id ? (
                              <select
                                value={editFormData.product}
                                onChange={(e) => setEditFormData({ ...editFormData, product: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                              >
                                {products.map(p => (
                                  <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                              </select>
                            ) : record.product}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-300">
                            {editingRecordId === record.id ? (
                              <select
                                value={editFormData.blower}
                                onChange={(e) => {
                                  const machine = machines.find(m => m.name === e.target.value);
                                  setEditFormData({ 
                                    ...editFormData, 
                                    blower: e.target.value,
                                    bay: machine?.bay || editFormData.bay
                                  });
                                }}
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                              >
                                {machines.map(m => (
                                  <option key={m.id} value={m.name}>{m.name}</option>
                                ))}
                              </select>
                            ) : record.blower}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-300">
                            {editingRecordId === record.id ? (
                              <input
                                type="text"
                                value={editFormData.bay}
                                onChange={(e) => setEditFormData({ ...editFormData, bay: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs outline-none focus:border-blue-500 w-20"
                              />
                            ) : record.bay}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-300 font-bold">
                            {record.passes}x
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold uppercase tracking-widest">
                              Completed
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {editingRecordId === record.id ? (
                                  <>
                                    <button
                                      onClick={handleSaveEdit}
                                      className="p-1.5 bg-emerald-600/20 text-emerald-500 rounded hover:bg-emerald-600/30 transition-colors"
                                      title="Save"
                                    >
                                      <Save size={14} />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="p-1.5 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 transition-colors"
                                      title="Cancel"
                                    >
                                      <X size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEditRecord(record)}
                                      className="p-1.5 bg-blue-600/20 text-blue-500 rounded hover:bg-blue-600/30 transition-colors"
                                      title="Edit"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRecord(record.id)}
                                      className="p-1.5 bg-rose-600/20 text-rose-500 rounded hover:bg-rose-600/30 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Cutting Events</h4>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Parent Reel</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Weight</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {freshCutBags.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-600">
                          No cutting records found.
                        </td>
                      </tr>
                    ) : (
                      freshCutBags.slice().sort((a, b) => b.cuttingDate - a.cuttingDate).map((bag) => (
                        <tr key={bag.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-4 text-xs text-slate-400 font-mono">
                            {new Date(bag.cuttingDate).toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-slate-200 font-mono">
                            {bag.parentReelSerial}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-300">
                            {bag.productCode}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-300">
                            {bag.weight}kg
                          </td>
                          <td className="px-4 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                              bag.status === 'Available for Blowing' ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
                            )}>
                              {bag.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">Shaking & Boxing Events</h4>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bag Serial</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Box Number</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                      {isAdmin && <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {shakingHistory.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 6 : 5} className="px-4 py-10 text-center text-slate-600">
                          No shaking records found.
                        </td>
                      </tr>
                    ) : (
                      shakingHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-4 text-xs text-slate-400 font-mono">
                            {new Date(record.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-slate-200 font-mono">
                            {record.bagSerialNumber}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-300">
                            {editingShakingId === record.id ? (
                              <select
                                value={editShakingFormData.product}
                                onChange={(e) => setEditShakingFormData({ ...editShakingFormData, product: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                              >
                                {products.map(p => (
                                  <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                              </select>
                            ) : record.product}
                          </td>
                          <td className="px-4 py-4 text-sm text-indigo-400 font-bold">
                            {editingShakingId === record.id ? (
                              <input
                                type="text"
                                value={editShakingFormData.boxNumber}
                                onChange={(e) => setEditShakingFormData({ ...editShakingFormData, boxNumber: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs outline-none focus:border-blue-500 w-20"
                              />
                            ) : record.boxNumber}
                          </td>
                          <td className="px-4 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
                              record.status === 'D-Bag' ? "bg-amber-500/10 text-amber-500" : "bg-indigo-500/10 text-indigo-500"
                            )}>
                              {record.status}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {editingShakingId === record.id ? (
                                  <>
                                    <button
                                      onClick={handleSaveShakingEdit}
                                      className="p-1.5 bg-emerald-600/20 text-emerald-500 rounded hover:bg-emerald-600/30 transition-colors"
                                      title="Save"
                                    >
                                      <Save size={14} />
                                    </button>
                                    <button
                                      onClick={handleCancelShakingEdit}
                                      className="p-1.5 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 transition-colors"
                                      title="Cancel"
                                    >
                                      <X size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEditShaking(record)}
                                      className="p-1.5 bg-blue-600/20 text-blue-500 rounded hover:bg-blue-600/30 transition-colors"
                                      title="Edit"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteShakingRecord(record.id)}
                                      className="p-1.5 bg-rose-600/20 text-rose-500 rounded hover:bg-rose-600/30 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Production;
