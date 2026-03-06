import React, { useState, useEffect, useRef } from 'react';
import { 
  Scissors, 
  Fan, 
  Plus, 
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
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { v4 as uuidv4 } from 'uuid';

interface Bag {
  id: string;
  serialNumber: string;
  rollNumber: string;
  product: string;
  color: string;
  status: 'pending' | 'blown' | 'shaken';
  createdAt: number;
}

interface PaintedRoll {
  id: string;
  rawRollNumber: string;
  paintedRollNumber: string;
  color: string;
  product: string;
  status: 'available' | 'cut';
  createdAt: number;
}

interface BlowingRecord {
  id: string;
  bagId: string;
  bagSerialNumber: string;
  product: string;
  blower: string;
  bay: string;
  timestamp: number;
  startTime?: number;
  endTime?: number;
  duration?: number; // in seconds
}

interface ShakingRecord {
  id: string;
  bagId: string;
  bagSerialNumber: string;
  product: string;
  boxNumber: string;
  timestamp: number;
}

interface Machine {
  id: string;
  name: string;
  bay: string;
  status: 'clean' | 'in_production' | 'needs_cleaning';
  currentBagId?: string;
  currentBagSerialNumber?: string;
  currentProduct?: string;
  assignedProduct?: string;
  startTime?: number;
}

interface ProductionProps {
  products: any[];
}

const Production: React.FC<ProductionProps> = ({ products }) => {
  const [activeTab, setActiveTab] = useState<'painting' | 'cutting' | 'blowing' | 'shaking' | 'inventory' | 'history' | 'machines'>('painting');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<BlowingRecord>>({});
  const [editingShakingId, setEditingShakingId] = useState<string | null>(null);
  const [editShakingFormData, setEditShakingFormData] = useState<Partial<ShakingRecord>>({});
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [editMachineFormData, setEditMachineFormData] = useState<Partial<Machine>>({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  // State for Painting
  const [rawRollNumber, setRawRollNumber] = useState('');
  const [paintedRollNumber, setPaintedRollNumber] = useState('');
  const [paintingColor, setPaintingColor] = useState('');
  const [paintingProduct, setPaintingProduct] = useState('');
  const [paintedRolls, setPaintedRolls] = useState<PaintedRoll[]>(() => {
    const saved = localStorage.getItem('fiberqc_painted_rolls');
    return saved ? JSON.parse(saved) : [];
  });

  // State for Cutting
  const [selectedPaintedRollId, setSelectedPaintedRollId] = useState('');
  const [numBags, setNumBags] = useState(1);
  const [bags, setBags] = useState<Bag[]>(() => {
    const saved = localStorage.getItem('fiberqc_bags');
    return saved ? JSON.parse(saved) : [];
  });

  // State for Blowing
  const [selectedBagId, setSelectedBagId] = useState('');
  const [selectedBlower, setSelectedBlower] = useState('');
  const [selectedBay, setSelectedBay] = useState('');
  const prevSelectedBagId = useRef('');
  const [blowingHistory, setBlowingHistory] = useState<BlowingRecord[]>(() => {
    const saved = localStorage.getItem('fiberqc_blowing_history');
    return saved ? JSON.parse(saved) : [];
  });

  // State for Shaking
  const [shakingBagId, setShakingBagId] = useState('');
  const [boxNumber, setBoxNumber] = useState('');
  const [shakingHistory, setShakingHistory] = useState<ShakingRecord[]>(() => {
    const saved = localStorage.getItem('fiberqc_shaking_history');
    return saved ? JSON.parse(saved) : [];
  });

  // State for Machines
  const [machines, setMachines] = useState<Machine[]>(() => {
    const saved = localStorage.getItem('fiberqc_machines');
    if (saved) return JSON.parse(saved);
    
    // Default 4 blowers and bays
    return [
      { id: 'm1', name: 'Blower 01', bay: 'Bay A', status: 'clean', assignedProduct: '' },
      { id: 'm2', name: 'Blower 02', bay: 'Bay B', status: 'clean', assignedProduct: '' },
      { id: 'm3', name: 'Blower 03', bay: 'Bay C', status: 'clean', assignedProduct: '' },
      { id: 'm4', name: 'Blower 04', bay: 'Bay D', status: 'clean', assignedProduct: '' },
    ];
  });

  // Persist states
  useEffect(() => {
    localStorage.setItem('fiberqc_bags', JSON.stringify(bags));
  }, [bags]);

  useEffect(() => {
    localStorage.setItem('fiberqc_blowing_history', JSON.stringify(blowingHistory));
  }, [blowingHistory]);

  useEffect(() => {
    localStorage.setItem('fiberqc_painted_rolls', JSON.stringify(paintedRolls));
  }, [paintedRolls]);

  useEffect(() => {
    localStorage.setItem('fiberqc_shaking_history', JSON.stringify(shakingHistory));
  }, [shakingHistory]);

  useEffect(() => {
    localStorage.setItem('fiberqc_machines', JSON.stringify(machines));
  }, [machines]);

  // Auto-select blower if a machine is already assigned to the selected bag's product
  useEffect(() => {
    if (!selectedBagId) {
      setSelectedBlower('');
      setSelectedBay('');
      prevSelectedBagId.current = '';
      return;
    }

    const selectedBag = bags.find(b => b.id === selectedBagId);
    if (!selectedBag) return;

    const bagChanged = prevSelectedBagId.current !== selectedBagId;
    prevSelectedBagId.current = selectedBagId;

    // If bag changed, OR if current selection is invalid, try to auto-select
    const currentMachine = selectedBlower ? machines.find(m => m.id === selectedBlower) : null;
    const isCompatible = currentMachine && 
                        currentMachine.status === 'clean' && 
                        (!currentMachine.assignedProduct || currentMachine.assignedProduct === selectedBag.product);

    if (!bagChanged && isCompatible) return;

    // Try to find a clean machine that is ALREADY assigned to this product
    const assignedMachine = machines.find(m => 
      m.status === 'clean' && m.assignedProduct === selectedBag.product
    );
    
    if (assignedMachine) {
      setSelectedBlower(assignedMachine.id);
      setSelectedBay(assignedMachine.bay);
    } else if (bagChanged || !isCompatible) {
      // If bag changed and no assigned machine, or current selection is invalid, clear it
      setSelectedBlower('');
      setSelectedBay('');
    }
  }, [selectedBagId, bags, machines, selectedBlower]);

  const handlePaintRoll = () => {
    if (!rawRollNumber.trim() || !paintedRollNumber.trim() || !paintingColor.trim() || !paintingProduct) return;

    const newRoll: PaintedRoll = {
      id: uuidv4(),
      rawRollNumber: rawRollNumber,
      paintedRollNumber: paintedRollNumber,
      color: paintingColor,
      product: paintingProduct,
      status: 'available',
      createdAt: Date.now()
    };

    setPaintedRolls(prev => [newRoll, ...prev]);
    setRawRollNumber('');
    setPaintedRollNumber('');
    setPaintingColor('');
    setPaintingProduct('');
    setActiveTab('inventory');
  };

  const handleCutRoll = () => {
    const roll = paintedRolls.find(r => r.id === selectedPaintedRollId);
    if (!roll) return;

    const newBags: Bag[] = [];
    for (let i = 1; i <= numBags; i++) {
      newBags.push({
        id: uuidv4(),
        rollNumber: roll.paintedRollNumber,
        serialNumber: `${roll.paintedRollNumber}/${i}`,
        product: roll.product,
        color: roll.color,
        status: 'pending',
        createdAt: Date.now()
      });
    }

    setBags(prev => [...prev, ...newBags]);
    setPaintedRolls(prev => prev.map(r => r.id === selectedPaintedRollId ? { ...r, status: 'cut' } : r));
    setSelectedPaintedRollId('');
    setNumBags(1);
    setActiveTab('inventory');
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const handleStartBlowing = () => {
    if (!selectedBagId || !selectedBlower) return;

    const bag = bags.find(b => b.id === selectedBagId);
    const machine = machines.find(m => m.id === selectedBlower);
    if (!bag || !machine) return;

    const now = Date.now();
    
    // Update machine status
    setMachines(prev => prev.map(m => 
      m.id === selectedBlower 
        ? { 
            ...m, 
            status: 'in_production', 
            currentBagId: bag.id, 
            currentBagSerialNumber: bag.serialNumber,
            currentProduct: bag.product,
            assignedProduct: m.assignedProduct || bag.product,
            startTime: now
          } 
        : m
    ));

    // Update bag status
    setBags(prev => prev.map(b => b.id === selectedBagId ? { ...b, status: 'blown' } : b));

    // Reset selection
    setSelectedBagId('');
    setSelectedBlower('');
    setSelectedBay('');
    // Stay on the same tab so user can see the active operation
  };

  const handleFinishBlowing = (machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine || !machine.currentBagId || !machine.startTime) return;

    const endTime = Date.now();
    const duration = Math.floor((endTime - machine.startTime) / 1000); // duration in seconds

    const newRecord: BlowingRecord = {
      id: uuidv4(),
      bagId: machine.currentBagId,
      bagSerialNumber: machine.currentBagSerialNumber || 'N/A',
      product: machine.currentProduct || 'N/A',
      blower: machine.name,
      bay: machine.bay,
      timestamp: endTime,
      startTime: machine.startTime,
      endTime: endTime,
      duration: duration
    };

    setBlowingHistory(prev => [newRecord, ...prev]);

    setMachines(prev => prev.map(m => 
      m.id === machineId 
        ? { 
            ...m, 
            status: 'needs_cleaning', 
            currentBagId: undefined, 
            currentBagSerialNumber: undefined,
            currentProduct: undefined,
            startTime: undefined
          } 
        : m
    ));
    
    setActiveTab('history');
  };

  const handleCleanMachine = (machineId: string) => {
    setMachines(prev => prev.map(m => 
      m.id === machineId 
        ? { ...m, status: 'clean' } 
        : m
    ));
  };

  const handleAssignProduct = (machineId: string, productName: string) => {
    setMachines(prev => prev.map(m => 
      m.id === machineId 
        ? { ...m, assignedProduct: productName } 
        : m
    ));
  };

  const handleEditRecord = (record: BlowingRecord) => {
    setEditingRecordId(record.id);
    setEditFormData({ ...record });
  };

  const handleSaveEdit = () => {
    if (!editingRecordId) return;
    setBlowingHistory(prev => prev.map(r => r.id === editingRecordId ? { ...r, ...editFormData } as BlowingRecord : r));
    setEditingRecordId(null);
    setEditFormData({});
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setEditFormData({});
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setBlowingHistory(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleEditShaking = (record: ShakingRecord) => {
    setEditingShakingId(record.id);
    setEditShakingFormData({ ...record });
  };

  const handleSaveShakingEdit = () => {
    if (!editingShakingId) return;
    setShakingHistory(prev => prev.map(r => r.id === editingShakingId ? { ...r, ...editShakingFormData } as ShakingRecord : r));
    setEditingShakingId(null);
    setEditShakingFormData({});
  };

  const handleCancelShakingEdit = () => {
    setEditingShakingId(null);
    setEditShakingFormData({});
  };

  const handleDeleteShakingRecord = (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setShakingHistory(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleEditMachine = (machine: Machine) => {
    setEditingMachineId(machine.id);
    setEditMachineFormData({ ...machine });
  };

  const handleSaveMachineEdit = () => {
    if (!editingMachineId) return;
    setMachines(prev => prev.map(m => m.id === editingMachineId ? { ...m, ...editMachineFormData } as Machine : m));
    setEditingMachineId(null);
    setEditMachineFormData({});
  };

  const handleCancelMachineEdit = () => {
    setEditingMachineId(null);
    setEditMachineFormData({});
  };

  const handleCompleteShaking = () => {
    if (!shakingBagId || !boxNumber.trim()) return;

    const bag = bags.find(b => b.id === shakingBagId);
    if (!bag) return;

    const newRecord: ShakingRecord = {
      id: uuidv4(),
      bagId: bag.id,
      bagSerialNumber: bag.serialNumber,
      product: bag.product,
      boxNumber: boxNumber,
      timestamp: Date.now()
    };

    setShakingHistory(prev => [newRecord, ...prev]);
    setBags(prev => prev.map(b => b.id === shakingBagId ? { ...b, status: 'shaken' } : b));
    
    setShakingBagId('');
    setBoxNumber('');
  };

  const deleteBag = (id: string) => {
    setBags(prev => prev.filter(b => b.id !== id));
  };

  const pendingBags = bags.filter(b => b.status === 'pending');
  const blownBags = bags.filter(b => b.status === 'blown');
  const availableRolls = paintedRolls.filter(r => r.status === 'available');

  // Inventory logic
  const rollInventory = {
    available: availableRolls.length,
    cut: paintedRolls.filter(r => r.status === 'cut').length,
  };

  const inventoryByProduct = products.map(product => {
    const productBags = bags.filter(b => b.product === product.name);
    return {
      name: product.name,
      pending: productBags.filter(b => b.status === 'pending').length,
      blown: productBags.filter(b => b.status === 'blown').length,
      shaken: productBags.filter(b => b.status === 'shaken').length,
    };
  }).filter(item => (item.pending + item.blown + item.shaken) > 0);

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
        <p className="text-slate-400">Manage cutting and blowing processes.</p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl mb-8 w-fit">
        <button
          onClick={() => setActiveTab('painting')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm",
            activeTab === 'painting' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Factory size={16} />
          Painting
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
        {activeTab === 'painting' && (
          <motion.div
            key="painting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Plus className="text-blue-500" size={20} />
                  New Painting Process
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Raw Roll Number (Estoque Bruto)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. ROLL-RAW-001"
                      value={rawRollNumber}
                      onChange={(e) => setRawRollNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Painted Roll Number (Estoque Pintado)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 3260248CC2 - N° 1"
                      value={paintedRollNumber}
                      onChange={(e) => setPaintedRollNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Color</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Blue"
                        value={paintingColor}
                        onChange={(e) => setPaintingColor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Product Type</label>
                      <select 
                        value={paintingProduct}
                        onChange={(e) => setPaintingProduct(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Select product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <button
                    onClick={handlePaintRoll}
                    disabled={!rawRollNumber.trim() || !paintedRollNumber.trim() || !paintingColor.trim() || !paintingProduct}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                  >
                    <CheckCircle2 size={18} />
                    Complete Painting Process
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-full">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Package className="text-slate-500" size={20} />
                  Recent Painted Rolls
                </h3>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {paintedRolls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                      <Package size={48} className="mb-4 opacity-20" />
                      <p className="font-medium">No painted rolls yet</p>
                    </div>
                  ) : (
                    paintedRolls.map((roll) => (
                      <div 
                        key={roll.id}
                        className="group flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            roll.status === 'cut' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                          )}>
                            <Factory size={20} />
                          </div>
                          <div>
                            <p className="font-mono font-bold text-sm text-slate-200">{roll.paintedRollNumber}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{roll.color}</p>
                              <span className="text-slate-700 text-[10px]">•</span>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{roll.product}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            roll.status === 'cut' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Select Painted Roll</label>
                    <select 
                      value={selectedPaintedRollId}
                      onChange={(e) => setSelectedPaintedRollId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="">Select a roll...</option>
                      {availableRolls.map(roll => (
                        <option key={roll.id} value={roll.id}>{roll.paintedRollNumber} ({roll.product} - {roll.color})</option>
                      ))}
                    </select>
                  </div>
                  {selectedPaintedRollId && (
                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Roll Details</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Color:</span>
                        <span className="text-slate-200 font-bold">{paintedRolls.find(r => r.id === selectedPaintedRollId)?.color}</span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-slate-500">Product:</span>
                        <span className="text-slate-200 font-bold">{paintedRolls.find(r => r.id === selectedPaintedRollId)?.product}</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Number of Bags</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        value={numBags}
                        onChange={(e) => setNumBags(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <span className="bg-slate-950 border border-slate-800 w-12 h-10 flex items-center justify-center rounded-xl font-mono font-bold text-blue-400">
                        {numBags}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCutRoll}
                    disabled={!selectedPaintedRollId}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                  >
                    <Scissors size={18} />
                    Cut Roll into Bags
                  </button>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6">
                <div className="flex gap-4">
                  <div className="bg-blue-500/20 p-3 rounded-2xl h-fit">
                    <AlertCircle className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-400 mb-1">Cutting Logic</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Entering a roll number will automatically generate bag serial numbers following the pattern: <code className="text-blue-300">RollNumber/Index</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-full">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Package className="text-slate-500" size={20} />
                  Recent Bags
                </h3>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {bags.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                      <Package size={48} className="mb-4 opacity-20" />
                      <p className="font-medium">No bags generated yet</p>
                    </div>
                  ) : (
                    bags.slice().reverse().map((bag) => (
                      <div 
                        key={bag.id}
                        className="group flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            bag.status === 'blown' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                          )}>
                            {bag.status === 'blown' ? <CheckCircle2 size={20} /> : <Package size={20} />}
                          </div>
                          <div>
                            <p className="font-mono font-bold text-sm text-slate-200">{bag.serialNumber}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{bag.product}</p>
                              <span className="text-slate-700 text-[10px]">•</span>
                              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{bag.color}</p>
                              <span className="text-slate-700 text-[10px]">•</span>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                {new Date(bag.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            bag.status === 'blown' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                          )}>
                            {bag.status}
                          </span>
                          <button 
                            onClick={() => deleteBag(bag.id)}
                            className="p-2 text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
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
                Intermediate Stock (Estoque Intermediário)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {(rollInventory.available > 0 || rollInventory.cut > 0) && (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Roll Stock (Estoque de Rolos)</h4>
                    {rollInventory.available > 0 && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300">Available Painted Rolls</span>
                        <span className="text-lg font-bold text-blue-400">{rollInventory.available}</span>
                      </div>
                    )}
                    {rollInventory.cut > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Already Cut Rolls</span>
                        <span className="text-lg font-bold text-slate-500">{rollInventory.cut}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {(pendingBags.length > 0 || blownBags.length > 0) && (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Bag Stock Summary</h4>
                    {pendingBags.length > 0 && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300">Total Pending Bags</span>
                        <span className="text-lg font-bold text-blue-400">{pendingBags.length}</span>
                      </div>
                    )}
                    {blownBags.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Total Blown Bags</span>
                        <span className="text-lg font-bold text-emerald-400">{blownBags.length}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {inventoryByProduct.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inventoryByProduct.map((item) => (
                    <div key={item.name} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/30 transition-all">
                      <h4 className="font-bold text-slate-200 mb-4 flex items-center justify-between">
                        {item.name}
                        <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full uppercase tracking-widest">
                          {item.pending + item.blown + item.shaken} Total
                        </span>
                      </h4>
                      
                      <div className="space-y-3">
                        {item.pending > 0 && (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Pending (Cutting)</span>
                              <span className="font-mono font-bold text-blue-400">{item.pending}</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-500 h-full transition-all duration-500" 
                                style={{ width: `${(item.pending / (item.pending + item.blown + item.shaken || 1)) * 100}%` }}
                              />
                            </div>
                          </>
                        )}
                        
                        {item.blown > 0 && (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Blown</span>
                              <span className="font-mono font-bold text-emerald-400">{item.blown}</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full transition-all duration-500" 
                                style={{ width: `${(item.blown / (item.pending + item.blown + item.shaken || 1)) * 100}%` }}
                              />
                            </div>
                          </>
                        )}

                        {item.shaken > 0 && (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Shaken (Finished)</span>
                              <span className="font-mono font-bold text-indigo-400">{item.shaken}</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-500 h-full transition-all duration-500" 
                                style={{ width: `${(item.shaken / (item.pending + item.blown + item.shaken || 1)) * 100}%` }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !(rollInventory.available > 0 || rollInventory.cut > 0 || pendingBags.length > 0 || blownBags.length > 0) && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                    <Package size={48} className="mb-4 opacity-20" />
                    <p className="font-medium">Inventory is empty</p>
                  </div>
                )
              )}
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
                  Blowing Process
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Select Bag (Serial Number)</label>
                    <select 
                      value={selectedBagId}
                      onChange={(e) => setSelectedBagId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="">Select a pending bag...</option>
                      {pendingBags.map(bag => (
                        <option key={bag.id} value={bag.id}>{bag.serialNumber} ({bag.product})</option>
                      ))}
                    </select>
                  </div>

                  {selectedBagId && (
                    <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Associated Product & Color</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Product:</span>
                        <span className="text-slate-200 font-bold">{bags.find(b => b.id === selectedBagId)?.product}</span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-slate-500">Color:</span>
                        <span className="text-slate-200 font-bold">{bags.find(b => b.id === selectedBagId)?.color}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Select Machine (Blower & Bay)</label>
                    <select 
                      value={selectedBlower}
                      onChange={(e) => setSelectedBlower(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="">Select a machine...</option>
                      {machines.map(m => {
                        const selectedBag = bags.find(b => b.id === selectedBagId);
                        const isCompatible = !m.assignedProduct || m.assignedProduct === selectedBag?.product;
                        const statusText = m.status === 'in_production' ? ' (BUSY)' : m.status === 'needs_cleaning' ? ' (NEEDS CLEANING)' : '';
                        
                        return (
                          <option 
                            key={m.id} 
                            value={m.id}
                            disabled={m.status === 'clean' && !isCompatible}
                          >
                            {m.name} - {m.bay}{statusText} {m.assignedProduct ? `(Assigned: ${m.assignedProduct})` : '(No assignment)'}
                            {m.status === 'clean' && !isCompatible ? ' - INCOMPATIBLE' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {selectedBlower && machines.find(m => m.id === selectedBlower)?.status === 'needs_cleaning' && (
                      <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <p className="text-xs text-rose-500 font-bold flex items-center gap-2">
                          <AlertCircle size={14} />
                          This machine needs cleaning before it can be used again.
                        </p>
                        <button
                          onClick={() => handleCleanMachine(selectedBlower)}
                          className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          Clean Machine Now
                        </button>
                      </div>
                    )}
                    {selectedBlower && machines.find(m => m.id === selectedBlower)?.status === 'in_production' && (
                      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <p className="text-xs text-blue-400 font-bold flex items-center gap-2 mb-2">
                          <Fan className="animate-spin-slow" size={14} />
                          Currently Blowing: {machines.find(m => m.id === selectedBlower)?.currentBagSerialNumber}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">
                          Product: {machines.find(m => m.id === selectedBlower)?.currentProduct}
                        </p>
                        {machines.find(m => m.id === selectedBlower)?.startTime && (
                          <div className="mb-4 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Running: {formatDuration(Math.floor((now - (machines.find(m => m.id === selectedBlower)?.startTime || 0)) / 1000))}
                          </div>
                        )}
                        <button
                          onClick={() => handleFinishBlowing(selectedBlower)}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20"
                        >
                          Finish Blowing Process
                        </button>
                      </div>
                    )}
                    {selectedBagId && selectedBlower && machines.find(m => m.id === selectedBlower)?.status === 'clean' && !(!machines.find(m => m.id === selectedBlower)?.assignedProduct || machines.find(m => m.id === selectedBlower)?.assignedProduct === bags.find(b => b.id === selectedBagId)?.product) && (
                      <p className="text-[10px] text-amber-500 mt-1 font-bold">This machine is assigned to a different product. Assign it to this product in the Machines tab if needed.</p>
                    )}
                  </div>
                  
                  {(!selectedBlower || machines.find(m => m.id === selectedBlower)?.status === 'clean') && (
                    <button
                      onClick={handleStartBlowing}
                      disabled={!selectedBagId || !selectedBlower || (selectedBlower && !(!machines.find(m => m.id === selectedBlower)?.assignedProduct || machines.find(m => m.id === selectedBlower)?.assignedProduct === bags.find(b => b.id === selectedBagId)?.product))}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 mt-4"
                    >
                      <Fan size={18} />
                      Start Blowing Process
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                    <Fan className="text-blue-500 animate-spin-slow" size={48} />
                  </div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Industrial Blower Active</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-8">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Fan className="text-blue-500" size={20} />
                  Active Blowing Operations
                </h3>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {machines.filter(m => m.status === 'in_production').length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-600">
                      <Fan size={32} className="mb-2 opacity-20" />
                      <p className="text-sm">No active blowing operations</p>
                    </div>
                  ) : (
                    machines.filter(m => m.status === 'in_production').map((m) => (
                      <div 
                        key={m.id}
                        className="group flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-blue-500/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <Fan className="animate-spin-slow" size={20} />
                          </div>
                          <div>
                            <p className="font-mono font-bold text-sm text-slate-200">{m.currentBagSerialNumber}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{m.name} ({m.bay})</p>
                              <span className="text-slate-700 text-[10px]">•</span>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{m.currentProduct}</p>
                            </div>
                            {m.startTime && (
                              <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Running: {formatDuration(Math.floor((now - m.startTime) / 1000))}
                              </div>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleFinishBlowing(m.id)}
                          className="px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          Finish
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <LayoutGrid className="text-slate-500" size={20} />
                  Pending Bags for Blowing
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {pendingBags.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-10 text-slate-600">
                      <Package size={32} className="mb-2 opacity-20" />
                      <p className="text-sm">No pending bags</p>
                    </div>
                  ) : (
                    pendingBags.map((bag) => (
                      <button 
                        key={bag.id}
                        onClick={() => {
                          setSelectedBagId(bag.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={cn(
                          "flex flex-col p-4 border rounded-2xl transition-all text-left group",
                          selectedBagId === bag.id 
                            ? "bg-blue-600 border-blue-400 shadow-lg shadow-blue-900/20" 
                            : "bg-slate-950 border-slate-800 hover:border-blue-500/50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Package size={16} className={selectedBagId === bag.id ? "text-white" : "text-blue-500"} />
                          <ChevronRight size={14} className={cn(
                            "transition-transform",
                            selectedBagId === bag.id ? "text-white translate-x-1" : "text-slate-700 group-hover:text-blue-500"
                          )} />
                        </div>
                        <p className={cn(
                          "font-mono font-bold text-sm",
                          selectedBagId === bag.id ? "text-white" : "text-slate-200"
                        )}>
                          {bag.serialNumber}
                        </p>
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-widest mt-1",
                          selectedBagId === bag.id ? "text-blue-100" : "text-blue-500"
                        )}>
                          {bag.product}
                        </p>
                      </button>
                    ))
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
                  <Factory className="text-blue-500" size={20} />
                  Shaking Process
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Select Blown Bag</label>
                    <select 
                      value={shakingBagId}
                      onChange={(e) => setShakingBagId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="">Select a blown bag...</option>
                      {blownBags.map(bag => (
                        <option key={bag.id} value={bag.id}>{bag.serialNumber} ({bag.product})</option>
                      ))}
                    </select>
                  </div>

                  {shakingBagId && (
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Associated Product & Color</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Product:</span>
                        <span className="text-slate-200 font-bold">{bags.find(b => b.id === shakingBagId)?.product}</span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-slate-500">Color:</span>
                        <span className="text-slate-200 font-bold">{bags.find(b => b.id === shakingBagId)?.color}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Box Number / Final Batch</label>
                    <input 
                      type="text" 
                      placeholder="e.g. BOX-2024-001"
                      value={boxNumber}
                      onChange={(e) => setBoxNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  
                  <button
                    onClick={handleCompleteShaking}
                    disabled={!shakingBagId || !boxNumber.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 mt-4"
                  >
                    <CheckCircle2 size={18} />
                    Complete Shaking & Box
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-full">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <LayoutGrid className="text-slate-500" size={20} />
                  Blown Bags Ready for Shaking
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {blownBags.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-600">
                      <Fan size={48} className="mb-4 opacity-20" />
                      <p className="font-medium">No blown bags available.</p>
                    </div>
                  ) : (
                    blownBags.map((bag) => (
                      <button 
                        key={bag.id}
                        onClick={() => setShakingBagId(bag.id)}
                        className={cn(
                          "flex flex-col p-4 border rounded-2xl transition-all text-left group",
                          shakingBagId === bag.id 
                            ? "bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-900/20" 
                            : "bg-slate-950 border-slate-800 hover:border-indigo-500/50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Package size={16} className={shakingBagId === bag.id ? "text-white" : "text-indigo-500"} />
                          <ChevronRight size={14} className={cn(
                            "transition-transform",
                            shakingBagId === bag.id ? "text-white translate-x-1" : "text-slate-700 group-hover:text-indigo-500"
                          )} />
                        </div>
                        <p className={cn(
                          "font-mono font-bold text-sm",
                          shakingBagId === bag.id ? "text-white" : "text-slate-200"
                        )}>
                          {bag.serialNumber}
                        </p>
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-widest mt-1",
                          shakingBagId === bag.id ? "text-indigo-100" : "text-indigo-500"
                        )}>
                          {bag.product} • {bag.color}
                        </p>
                      </button>
                    ))
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
            className="space-y-6"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Factory className="text-blue-500" size={20} />
                Machine Status (Blowers & Bays)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {machines.map((m) => (
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
                      <div className="flex-1">
                        {editingMachineId === m.id ? (
                          <div className="space-y-2 pr-2">
                            <input
                              type="text"
                              value={editMachineFormData.name}
                              onChange={(e) => setEditMachineFormData({ ...editMachineFormData, name: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-bold text-slate-200 outline-none focus:border-blue-500"
                              placeholder="Machine Name"
                            />
                            <input
                              type="text"
                              value={editMachineFormData.bay}
                              onChange={(e) => setEditMachineFormData({ ...editMachineFormData, bay: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-400 outline-none focus:border-blue-500 uppercase tracking-widest"
                              placeholder="Bay Name"
                            />
                          </div>
                        ) : (
                          <>
                            <h4 className="font-bold text-slate-200">{m.name}</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{m.bay}</p>
                          </>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          m.status === 'clean' ? "bg-emerald-500/10 text-emerald-500" : 
                          m.status === 'in_production' ? "bg-blue-500/10 text-blue-500" : 
                          "bg-rose-500/10 text-rose-500"
                        )}>
                          {m.status === 'in_production' ? <Fan className="animate-spin-slow" size={16} /> : <Factory size={16} />}
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1">
                            {editingMachineId === m.id ? (
                              <>
                                <button
                                  onClick={handleSaveMachineEdit}
                                  className="p-1 bg-emerald-600/20 text-emerald-500 rounded hover:bg-emerald-600/30 transition-colors"
                                  title="Save"
                                >
                                  <Save size={12} />
                                </button>
                                <button
                                  onClick={handleCancelMachineEdit}
                                  className="p-1 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 transition-colors"
                                  title="Cancel"
                                >
                                  <X size={12} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleEditMachine(m)}
                                className="p-1 bg-blue-600/20 text-blue-500 rounded hover:bg-blue-600/30 transition-colors"
                                title="Edit Machine"
                              >
                                <Edit2 size={12} />
                              </button>
                            )}
                          </div>
                        )}
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
                      
                      {m.status === 'in_production' && (
                        <div className="pt-2 border-t border-slate-800/50">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Current Bag</p>
                          <p className="text-xs font-bold text-blue-400">{m.currentBagSerialNumber}</p>
                          {m.startTime && (
                            <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              Running: {formatDuration(Math.floor((now - m.startTime) / 1000))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

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
                        onClick={() => handleFinishBlowing(m.id)}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                      >
                        Finish Production
                      </button>
                    )}

                    {m.status === 'clean' && (
                      <div className="w-full py-2 bg-emerald-500/5 text-emerald-500/50 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center border border-emerald-500/10">
                        Ready for Use
                      </div>
                    )}
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
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Duration</th>
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
                            {record.bagSerialNumber}
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
                          <td className="px-4 py-4 text-xs text-slate-400 font-mono">
                            {record.duration ? formatDuration(record.duration) : 'N/A'}
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
                            <span className="px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded text-[10px] font-bold uppercase tracking-widest">
                              Boxed
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
