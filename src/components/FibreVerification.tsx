import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Box as BoxIcon,
  ClipboardCheck,
  ArrowRight,
  History,
  Minus,
  Search,
  PlusCircle,
  AlertCircle,
  Play,
  CheckSquare,
  ChevronRight
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import WheelDatePicker from './WheelDatePicker';
import { cn } from '../utils/cn';
import FibrePageLayout from './FibrePageLayout';

// --- Types ---

interface FibreType {
  id: string;
  name: string;
  colour: string;
  colorVisibility?: 'Visible' | 'Invisible UV' | 'Visible & Invisible' | 'Invisible UV SW' | 'Invisible UV LW';
  length: string;
  pitch: string;
  cutType: string;
  gsm: string;
}

interface Inspection {
  quantityChecked: number;
  defects: Record<string, number>;
  conformity: boolean;
  observations: string;
  timestamp: string;
}

interface Box {
  id: string;
  boxNumber: string;
  inspection?: Inspection;
}

interface DeliveryJob {
  id: string;
  customer: string;
  po: string;
  dn: string;
  collectionDate: string;
  fibreTypeId: string;
  boxes: Box[];
  status: 'draft' | 'completed';
  createdAt: string;
}

interface FibreVerificationProps {
  customers: { id: string; name: string }[];
  products: FibreType[];
  onSave?: (job: DeliveryJob) => void;
  onAddProduct?: (product: FibreType) => void;
  sessions?: DeliveryJob[];
}

// --- Constants ---

const DEFECT_CATEGORIES = [
  { id: 'doubles', label: 'Doubles' },
  { id: 'doublesBroke', label: 'Doubles broke up in water' },
  { id: 'chains', label: 'Chains' },
  { id: 'pulpEvidence', label: 'Pulp Evidence' },
  { id: 'dustEvidence', label: 'Dust Evidence' },
  { id: 'short', label: 'Short' },
  { id: 'long', label: 'Long' },
  { id: 'thin', label: 'Thin' },
  { id: 'wide', label: 'Wide' },
  { id: 'inRegistration', label: 'In Registration', isBinary: true },
];

// --- Component ---

export default function FibreVerification({ customers, products, onSave, onAddProduct, sessions = [] }: FibreVerificationProps) {
  const [step, setStep] = useState<'HISTORY' | 'JOB_REG' | 'FIBRE_TYPE' | 'BOX_REG' | 'BOX_SEL' | 'INSPECT'>('HISTORY');
  const [jobs, setJobs] = useState<DeliveryJob[]>(sessions);
  const [fibreTypes, setFibreTypes] = useState<FibreType[]>(products);

  const helpContent = {
    title: "Fibre Verification Guide",
    sections: [
      {
        title: "1. Workflow Overview",
        content: "The verification process follows a structured path: Job Registration -> Fibre Type Selection -> Box Registration -> Individual Box Inspection -> Final Job Completion.",
        icon: <Play size={14} />
      },
      {
        title: "2. Box Inspection",
        content: "During inspection, count the number of defects found in a specific sample size (usually 100 fibres). The system calculates the percentage automatically.",
        icon: <ClipboardCheck size={14} />
      },
      {
        title: "3. Conformity",
        content: "Mark each box as OK or NOT OK based on your quality standards. You can add observations for any anomalies found.",
        icon: <CheckCircle2 size={14} />
      }
    ]
  };

  const [currentJob, setCurrentJob] = useState<Partial<DeliveryJob>>({});
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCreatingFibreType, setIsCreatingFibreType] = useState(false);
  const [newFibreType, setNewFibreType] = useState<Partial<FibreType>>({
    cutType: 'Random',
    colorVisibility: 'Invisible UV'
  });

  // Sync with props
  useEffect(() => {
    setJobs(sessions);
  }, [sessions]);

  useEffect(() => {
    setFibreTypes(products);
  }, [products]);

  const startNewJob = () => {
    setCurrentJob({
      id: uuidv4(),
      customer: '',
      po: '',
      dn: '',
      collectionDate: '',
      boxes: [],
      status: 'draft',
      createdAt: new Date().toISOString()
    });
    setStep('JOB_REG');
  };

  const handleJobRegNext = () => {
    if (currentJob.customer && currentJob.po) {
      setStep('FIBRE_TYPE');
    }
  };

  const handleFibreTypeSelect = (id: string) => {
    setCurrentJob(prev => ({ ...prev, fibreTypeId: id }));
  };

  const handleCreateFibreType = () => {
    if (newFibreType.name && newFibreType.colour) {
      const type: FibreType = {
        id: uuidv4(),
        name: newFibreType.name!,
        colour: newFibreType.colour!,
        colorVisibility: newFibreType.colorVisibility || 'Invisible UV',
        length: newFibreType.length || '',
        pitch: newFibreType.pitch || '',
        cutType: newFibreType.cutType || 'Random',
        gsm: newFibreType.gsm || ''
      };
      onAddProduct?.(type);
      setCurrentJob(prev => ({ ...prev, fibreTypeId: type.id }));
      setIsCreatingFibreType(false);
      setNewFibreType({ cutType: 'Random', colorVisibility: 'Invisible UV' });
    }
  };

  const addBox = (boxNumber: string) => {
    if (!boxNumber.trim()) return;
    const newBox: Box = {
      id: uuidv4(),
      boxNumber: boxNumber.trim()
    };
    setCurrentJob(prev => ({
      ...prev,
      boxes: [...(prev.boxes || []), newBox]
    }));
  };

  const removeBox = (id: string) => {
    setCurrentJob(prev => ({
      ...prev,
      boxes: (prev.boxes || []).filter(b => b.id !== id)
    }));
  };

  const startInspection = (boxId: string) => {
    setSelectedBoxId(boxId);
    const box = currentJob.boxes?.find(b => b.id === boxId);
    if (box && !box.inspection) {
      // Initialize inspection if it doesn't exist
      const initialInspection: Inspection = {
        quantityChecked: 100,
        defects: {},
        conformity: true,
        observations: '',
        timestamp: new Date().toISOString()
      };
      DEFECT_CATEGORIES.forEach(cat => {
        initialInspection.defects[cat.id] = 0;
      });
      updateBoxInspection(boxId, initialInspection);
    }
    setStep('INSPECT');
  };

  const updateBoxInspection = (boxId: string, inspection: Inspection) => {
    setCurrentJob(prev => ({
      ...prev,
      boxes: (prev.boxes || []).map(b => b.id === boxId ? { ...b, inspection } : b)
    }));
  };

  const saveJob = () => {
    if (currentJob.id) {
      const jobToSave = { ...currentJob, status: 'completed' } as DeliveryJob;
      onSave?.(jobToSave);
      setStep('HISTORY');
      setCurrentJob({});
    }
  };

  const sidebar = (
    <div className="space-y-6">
      {currentJob.id && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Current Job</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Customer:</span>
              <span className="text-white font-bold">{currentJob.customer || '---'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">PO:</span>
              <span className="text-white font-bold">{currentJob.po || '---'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Boxes:</span>
              <span className="text-white font-bold">{currentJob.boxes?.length || 0}</span>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-2">
                <span>Progress</span>
                <span>{Math.round(((currentJob.boxes?.filter(b => b.inspection).length || 0) / (currentJob.boxes?.length || 1)) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${((currentJob.boxes?.filter(b => b.inspection).length || 0) / (currentJob.boxes?.length || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'INSPECT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Inspection Summary</h3>
          <div className="space-y-2">
            {DEFECT_CATEGORIES.map(cat => {
              const box = currentJob.boxes?.find(b => b.id === selectedBoxId);
              const count = box?.inspection?.defects[cat.id] || 0;
              if (count === 0) return null;
              return (
                <div key={cat.id} className="flex justify-between text-xs">
                  <span className="text-slate-500">{cat.label}:</span>
                  <span className="text-rose-500 font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // --- Sub-components for Steps ---

  const HistoryView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map(job => {
          const fibreType = fibreTypes.find(t => t.id === job.fibreTypeId);
          return (
            <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/50 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-800 p-2 rounded-lg">
                  <ClipboardCheck className="text-emerald-500" size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider bg-emerald-500/10 text-emerald-500">
                  {job.status}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1">{job.customer}</h3>
              <p className="text-xs text-slate-500 mb-2">PO: {job.po} • DN: {job.dn || 'N/A'}</p>
              <p className="text-xs text-slate-400 mb-4">{fibreType?.name || 'Unknown Fibre'}</p>
              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-4">
                <span>{job.boxes.length} Boxes</span>
                <button 
                  onClick={() => {
                    setCurrentJob(job);
                    setStep('BOX_SEL');
                  }}
                  className="text-emerald-500 font-bold hover:underline flex items-center gap-1"
                >
                  View Details <ArrowRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
        {jobs.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl">
            <History className="mx-auto text-slate-700 mb-4" size={48} />
            <p className="text-slate-500">No inspection history found.</p>
            <button onClick={startNewJob} className="mt-4 text-emerald-500 font-bold hover:underline">Start your first inspection</button>
          </div>
        )}
      </div>
    </div>
  );

  const JobRegistration = () => (
    <div className="max-w-2xl">
      <button onClick={() => setStep('HISTORY')} className="flex items-center gap-2 text-slate-500 hover:text-white mb-6 transition-colors">
        <ChevronLeft size={20} /> Back to History
      </button>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Step 1: Delivery Registration</h2>
          <p className="text-slate-400 text-sm">Enter the general information for this inspection job.</p>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Customer *</label>
            <select 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={currentJob.customer}
              onChange={(e) => setCurrentJob(prev => ({ ...prev, customer: e.target.value }))}
            >
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">PO *</label>
            <input 
              type="text" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={currentJob.po}
              onChange={(e) => setCurrentJob(prev => ({ ...prev, po: e.target.value }))}
              placeholder="Purchase Order Number"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">DN (Optional)</label>
              <input 
                type="text" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={currentJob.dn}
                onChange={(e) => setCurrentJob(prev => ({ ...prev, dn: e.target.value }))}
                placeholder="Delivery Note"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Collection Date</label>
              <button 
                onClick={() => setIsDatePickerOpen(true)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 text-left text-sm"
              >
                {currentJob.collectionDate || "Select Date"}
              </button>
            </div>
          </div>
        </div>

        <WheelDatePicker 
          isOpen={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          onSelect={(date) => setCurrentJob(prev => ({ ...prev, collectionDate: date }))}
        />

        <button 
          onClick={handleJobRegNext}
          disabled={!currentJob.customer || !currentJob.po}
          className="w-full mt-10 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
        >
          Next: Fibre Type <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  const FibreTypeSelection = () => (
    <div className="max-w-4xl">
      <button onClick={() => setStep('JOB_REG')} className="flex items-center gap-2 text-slate-500 hover:text-white mb-6 transition-colors">
        <ChevronLeft size={20} /> Back to Registration
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-1">Step 2: Fibre Type</h2>
            <p className="text-slate-400 text-sm">Select an existing type or create a new one.</p>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {fibreTypes.map(type => (
              <button
                key={type.id}
                onClick={() => handleFibreTypeSelect(type.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition-all",
                  currentJob.fibreTypeId === type.id 
                    ? "bg-emerald-600/10 border-emerald-500 text-emerald-400" 
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold">{type.name}</span>
                  {currentJob.fibreTypeId === type.id && <CheckCircle2 size={16} />}
                </div>
                <p className="text-[10px] opacity-60 mt-1">{type.colour} • {type.length} • {type.pitch}</p>
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsCreatingFibreType(true)}
            className="w-full mt-6 border border-dashed border-slate-700 hover:border-emerald-500 text-slate-500 hover:text-emerald-500 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle size={20} /> Create New Fibre Type
          </button>

          <button 
            onClick={() => setStep('BOX_REG')}
            disabled={!currentJob.fibreTypeId}
            className="w-full mt-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
          >
            Next: Register Boxes <ArrowRight size={20} />
          </button>
        </div>

        {isCreatingFibreType && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold mb-6">New Fibre Type</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Name / Description</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none"
                  value={newFibreType.name}
                  onChange={(e) => setNewFibreType(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Colour</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none"
                    value={newFibreType.colour}
                    onChange={(e) => setNewFibreType(prev => ({ ...prev, colour: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Visibility</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none"
                    value={newFibreType.colorVisibility || 'Invisible UV'}
                    onChange={(e) => setNewFibreType(prev => ({ ...prev, colorVisibility: e.target.value as any }))}
                  >
                    <option value="Invisible UV">Invisible UV</option>
                    <option value="Visible">Visible</option>
                    <option value="Visible & Invisible">Visible & Invisible</option>
                    <option value="Invisible UV SW">Invisible UV (Short Wave)</option>
                    <option value="Invisible UV LW">Invisible UV (Long Wave)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Length</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none"
                    value={newFibreType.length}
                    onChange={(e) => setNewFibreType(prev => ({ ...prev, length: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pitch (Width)</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none"
                    value={newFibreType.pitch}
                    onChange={(e) => setNewFibreType(prev => ({ ...prev, pitch: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cut Type</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none"
                    value={newFibreType.cutType}
                    onChange={(e) => setNewFibreType(prev => ({ ...prev, cutType: e.target.value }))}
                  >
                    <option value="Random">Random</option>
                    <option value="Register">Register</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">GSM</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none"
                    value={newFibreType.gsm}
                    onChange={(e) => setNewFibreType(prev => ({ ...prev, gsm: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsCreatingFibreType(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateFibreType}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all"
                >
                  Save Type
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const BoxRegistration = () => {
    const [boxInput, setBoxInput] = useState('');
    return (
      <div className="max-w-3xl">
        <button onClick={() => setStep('FIBRE_TYPE')} className="flex items-center gap-2 text-slate-500 hover:text-white mb-6 transition-colors">
          <ChevronLeft size={20} /> Back to Fibre Type
        </button>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Step 3: Delivery Boxes</h2>
            <p className="text-slate-400 text-sm">Register all the boxes received in this delivery.</p>
          </div>

          <div className="flex gap-3 mb-8">
            <input 
              type="text" 
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Enter box number (e.g. 210324/01)"
              value={boxInput}
              onChange={(e) => setBoxInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addBox(boxInput);
                  setBoxInput('');
                }
              }}
            />
            <button 
              onClick={() => {
                addBox(boxInput);
                setBoxInput('');
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-xl font-bold transition-all"
            >
              Add Box
            </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 mb-8">
            {currentJob.boxes?.map((box, idx) => (
              <div key={box.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl group">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-600 font-mono">#{idx + 1}</span>
                  <span className="font-mono font-bold">{box.boxNumber}</span>
                </div>
                <button 
                  onClick={() => removeBox(box.id)}
                  className="p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {(!currentJob.boxes || currentJob.boxes.length === 0) && (
              <div className="text-center py-12 text-slate-600 italic border border-dashed border-slate-800 rounded-2xl">
                No boxes added yet.
              </div>
            )}
          </div>

          <button 
            onClick={() => setStep('BOX_SEL')}
            disabled={!currentJob.boxes || currentJob.boxes.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
          >
            Next: Select Box for Inspection <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const BoxSelection = () => (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => setStep('BOX_REG')} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
          <ChevronLeft size={20} /> Back to Box Registration
        </button>
        <div className="text-right">
          <h2 className="text-xl font-bold">{currentJob.customer}</h2>
          <p className="text-xs text-slate-500">PO: {currentJob.po} • {currentJob.boxes?.length} Boxes</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Step 4: Box Selection</h2>
          <p className="text-slate-400 text-sm">Select which box you want to inspect.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {currentJob.boxes?.map((box) => (
            <button
              key={box.id}
              onClick={() => setSelectedBoxId(box.id)}
              className={cn(
                "p-6 rounded-2xl border transition-all text-left relative overflow-hidden group",
                selectedBoxId === box.id 
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20" 
                  : box.inspection 
                    ? "bg-slate-900 border-emerald-500/30 text-slate-200"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
              )}
            >
              <div className="relative z-10">
                <BoxIcon className={cn("mb-3", selectedBoxId === box.id ? "text-white" : "text-emerald-500")} size={24} />
                <p className="font-mono font-bold text-lg">{box.boxNumber}</p>
                {box.inspection && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400">
                    <CheckCircle2 size={12} /> Inspected
                  </div>
                )}
              </div>
              {selectedBoxId === box.id && (
                <div className="absolute top-0 right-0 p-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              )}
            </button>
          ))}
        </div>

        <button 
          onClick={() => selectedBoxId && startInspection(selectedBoxId)}
          disabled={!selectedBoxId}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
        >
          Start Inspection <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  const InspectionForm = () => {
    const box = currentJob.boxes?.find(b => b.id === selectedBoxId);
    if (!box || !box.inspection) return null;

    const inspection = box.inspection;

    const updateDefect = (id: string, delta: number) => {
      const newVal = Math.max(0, (inspection.defects[id] || 0) + delta);
      updateBoxInspection(selectedBoxId!, {
        ...inspection,
        defects: { ...inspection.defects, [id]: newVal }
      });
    };

    const setDefect = (id: string, val: string) => {
      const num = parseInt(val) || 0;
      updateBoxInspection(selectedBoxId!, {
        ...inspection,
        defects: { ...inspection.defects, [id]: Math.max(0, num) }
      });
    };

    const setQuantityChecked = (val: string) => {
      const num = parseInt(val) || 0;
      updateBoxInspection(selectedBoxId!, {
        ...inspection,
        quantityChecked: Math.max(1, num)
      });
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setStep('BOX_SEL')} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
            <ChevronLeft size={20} /> Back to Box Selection
          </button>
          <div className="text-right">
            <h2 className="text-xl font-bold">Box: {box.boxNumber}</h2>
            <p className="text-xs text-slate-500">{currentJob.customer} • PO: {currentJob.po}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">Step 5: Fibre Inspection</h3>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quantity Checked</label>
                  <input 
                    type="number" 
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-lg font-bold text-emerald-500 w-32 text-center outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={inspection.quantityChecked}
                    onChange={(e) => setQuantityChecked(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {DEFECT_CATEGORIES.map(cat => {
                const count = inspection.defects[cat.id] || 0;
                const percentage = ((count / inspection.quantityChecked) * 100).toFixed(2);
                
                if (cat.isBinary) {
                  return (
                    <div key={cat.id} className="space-y-3">
                      <label className="text-sm font-bold text-slate-300">{cat.label}</label>
                      <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                        <button 
                          onClick={() => setDefect(cat.id, "1")}
                          className={cn(
                            "flex-1 py-2 rounded-lg font-bold text-sm transition-all",
                            count === 1 ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-300"
                          )}
                        >
                          Yes
                        </button>
                        <button 
                          onClick={() => setDefect(cat.id, "0")}
                          className={cn(
                            "flex-1 py-2 rounded-lg font-bold text-sm transition-all",
                            count === 0 ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                          )}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={cat.id} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <label className="text-sm font-bold text-slate-300">{cat.label}</label>
                      <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {percentage}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => updateDefect(cat.id, -1)}
                        className="w-12 h-12 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all active:scale-90"
                      >
                        <Minus size={20} />
                      </button>
                      <input 
                        type="number" 
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3 text-center text-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={count}
                        onChange={(e) => setDefect(cat.id, e.target.value)}
                      />
                      <button 
                        onClick={() => updateDefect(cat.id, 1)}
                        className="w-12 h-12 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all active:scale-90"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="text-amber-500" size={18} />
              Conformity & Notes
            </h4>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3">Overall Result</label>
                <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button 
                    onClick={() => updateBoxInspection(selectedBoxId!, { ...inspection, conformity: true })}
                    className={cn(
                      "flex-1 py-2 rounded-lg font-bold text-sm transition-all",
                      inspection.conformity ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    OK
                  </button>
                  <button 
                    onClick={() => updateBoxInspection(selectedBoxId!, { ...inspection, conformity: false })}
                    className={cn(
                      "flex-1 py-2 rounded-lg font-bold text-sm transition-all",
                      !inspection.conformity ? "bg-red-600 text-white" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    NOT OK
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Observations</label>
                <textarea 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[150px]"
                  placeholder="Add any additional notes here..."
                  value={inspection.observations}
                  onChange={(e) => updateBoxInspection(selectedBoxId!, { ...inspection, observations: e.target.value })}
                />
              </div>

              <button 
                onClick={() => setStep('BOX_SEL')}
                className="w-full bg-slate-100 hover:bg-white text-slate-950 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} /> Finish Box Inspection
              </button>

              {currentJob.boxes?.every(b => b.inspection) && (
                <button 
                  onClick={saveJob}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                >
                  <Save size={20} /> Complete Full Job
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Main Render ---

  return (
    <FibrePageLayout
      title="Fibre Verification"
      subtitle="Digitized workflow for finished goods fibre quality inspection."
      icon={<CheckSquare className="text-emerald-500" size={24} />}
      helpContent={helpContent}
      sidebar={sidebar}
      actions={step === 'HISTORY' ? (
        <button 
          onClick={startNewJob}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
        >
          <Plus size={20} />
          New Inspection Job
        </button>
      ) : null}
    >
      {step === 'HISTORY' && <HistoryView />}
      {step === 'JOB_REG' && <JobRegistration />}
      {step === 'FIBRE_TYPE' && <FibreTypeSelection />}
      {step === 'BOX_REG' && <BoxRegistration />}
      {step === 'BOX_SEL' && <BoxSelection />}
      {step === 'INSPECT' && <InspectionForm />}
    </FibrePageLayout>
  );
}
