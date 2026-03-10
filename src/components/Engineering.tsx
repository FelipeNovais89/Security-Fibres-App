import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Search, 
  Layers, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { ProductCode, RawMaterialCode, BOM, RawMaterialType, InkType } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface EngineeringProps {
  productCodes: ProductCode[];
  setProductCodes: React.Dispatch<React.SetStateAction<ProductCode[]>>;
  rawMaterialCodes: RawMaterialCode[];
  setRawMaterialCodes: React.Dispatch<React.SetStateAction<RawMaterialCode[]>>;
  boms: BOM[];
  setBoms: React.Dispatch<React.SetStateAction<BOM[]>>;
}

const Engineering: React.FC<EngineeringProps> = ({ 
  productCodes, setProductCodes, 
  rawMaterialCodes, setRawMaterialCodes, 
  boms, setBoms 
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'materials' | 'bom'>('products');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [isAddingBOM, setIsAddingBOM] = useState(false);

  // --- Product Form State ---
  const [newProduct, setNewProduct] = useState<Partial<ProductCode>>({
    code: '',
    name: '',
    description: '',
    numColours: 1,
    defaultGsm: 20
  });

  // --- Material Form State ---
  const [newMaterial, setNewMaterial] = useState<Partial<RawMaterialCode>>({
    code: '',
    name: '',
    type: 'Paper Reel',
    supplier: '',
    defaultGsm: 20,
    inkColour: '',
    inkType: 'Visible'
  });

  // --- BOM Form State ---
  const [newBOM, setNewBOM] = useState<Partial<BOM>>({
    productCode: '',
    requiredGsm: 20,
    inks: [],
    additionalMaterials: []
  });

  const handleAddProduct = () => {
    if (!newProduct.code || !newProduct.name) return;
    setProductCodes(prev => [...prev, newProduct as ProductCode]);
    setNewProduct({ code: '', name: '', description: '', numColours: 1, defaultGsm: 20 });
    setIsAddingProduct(false);
  };

  const handleAddMaterial = () => {
    if (!newMaterial.code || !newMaterial.name) return;
    setRawMaterialCodes(prev => [...prev, newMaterial as RawMaterialCode]);
    setNewMaterial({ code: '', name: '', type: 'Paper Reel', supplier: '', defaultGsm: 20, inkColour: '', inkType: 'Visible' });
    setIsAddingMaterial(false);
  };

  const handleAddBOM = () => {
    if (!newBOM.productCode) return;
    setBoms(prev => [...prev, { ...newBOM, id: uuidv4() } as BOM]);
    setNewBOM({ productCode: '', requiredGsm: 20, inks: [], additionalMaterials: [] });
    setIsAddingBOM(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-100">Engineering</h2>
          <p className="text-slate-400">Product & Material Master Data Management</p>
        </div>
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('products')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'products' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Product Codes
          </button>
          <button 
            onClick={() => setActiveTab('materials')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'materials' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Raw Materials
          </button>
          <button 
            onClick={() => setActiveTab('bom')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'bom' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
            )}
          >
            BOM
          </button>
        </div>
      </header>

      {/* --- Product Codes Tab --- */}
      {activeTab === 'products' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <FileText className="text-emerald-500" size={20} />
              Product Database
            </h3>
            <button 
              onClick={() => setIsAddingProduct(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-bottom border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Code</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Colours</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">GSM</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {productCodes.map(p => (
                  <tr key={p.code} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-emerald-400">{p.code}</td>
                    <td className="px-6 py-4 text-sm font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{p.numColours}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{p.defaultGsm}</td>
                    <td className="px-6 py-4">
                      <button className="text-slate-500 hover:text-rose-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {productCodes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">No products defined.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* --- Raw Materials Tab --- */}
      {activeTab === 'materials' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Database className="text-blue-500" size={20} />
              Raw Material Database
            </h3>
            <button 
              onClick={() => setIsAddingMaterial(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
            >
              <Plus size={18} />
              Add Material
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-bottom border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Code</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Supplier</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Details</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rawMaterialCodes.map(m => (
                  <tr key={m.code} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-blue-400">{m.code}</td>
                    <td className="px-6 py-4 text-sm font-medium">{m.name}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        m.type === 'Paper Reel' ? "bg-amber-500/10 text-amber-500" : "bg-indigo-500/10 text-indigo-500"
                      )}>
                        {m.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{m.supplier}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {m.type === 'Paper Reel' ? `${m.defaultGsm} GSM` : `${m.inkColour} (${m.inkType})`}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-slate-500 hover:text-rose-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {rawMaterialCodes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">No materials defined.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* --- BOM Tab --- */}
      {activeTab === 'bom' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Layers className="text-indigo-500" size={20} />
              Bill of Materials (BOM)
            </h3>
            <button 
              onClick={() => setIsAddingBOM(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
            >
              <Plus size={18} />
              Create BOM
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boms.map(bom => {
              const product = productCodes.find(p => p.code === bom.productCode);
              return (
                <div key={bom.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-indigo-500/50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-slate-100">{product?.name || bom.productCode}</h4>
                      <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">{bom.productCode}</p>
                    </div>
                    <button className="text-slate-600 hover:text-rose-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg">
                      <span className="text-xs text-slate-500">Required GSM</span>
                      <span className="text-xs font-bold text-slate-200">{bom.requiredGsm}</span>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Required Inks</p>
                      <div className="flex flex-wrap gap-2">
                        {bom.inks.map(inkCode => {
                          const ink = rawMaterialCodes.find(m => m.code === inkCode);
                          return (
                            <span key={inkCode} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-bold">
                              {ink?.name || inkCode}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* --- Add Product Modal --- */}
      <AnimatePresence>
        {isAddingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Add New Product</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Product Code</label>
                  <input 
                    type="text" 
                    value={newProduct.code}
                    onChange={e => setNewProduct({...newProduct, code: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="e.g. PRD-3CR"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Product Name</label>
                  <input 
                    type="text" 
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    placeholder="e.g. 3 Col Rainbow"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Colours</label>
                    <input 
                      type="number" 
                      value={newProduct.numColours}
                      onChange={e => setNewProduct({...newProduct, numColours: parseInt(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Default GSM</label>
                    <select 
                      value={newProduct.defaultGsm}
                      onChange={e => setNewProduct({...newProduct, defaultGsm: parseInt(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                    >
                      <option value={20}>20 GSM</option>
                      <option value={23}>23 GSM</option>
                      <option value={25}>25 GSM</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsAddingProduct(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddProduct}
                    className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20"
                  >
                    Save Product
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Add Material Modal --- */}
      <AnimatePresence>
        {isAddingMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Add Raw Material</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Material Type</label>
                    <select 
                      value={newMaterial.type}
                      onChange={e => setNewMaterial({...newMaterial, type: e.target.value as RawMaterialType})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="Paper Reel">Paper Reel</option>
                      <option value="Ink">Ink</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Code</label>
                    <input 
                      type="text" 
                      value={newMaterial.code}
                      onChange={e => setNewMaterial({...newMaterial, code: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="e.g. MAT-001"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Material Name</label>
                  <input 
                    type="text" 
                    value={newMaterial.name}
                    onChange={e => setNewMaterial({...newMaterial, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="e.g. UV Red Ink"
                  />
                </div>
                
                {newMaterial.type === 'Paper Reel' ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Default GSM</label>
                    <select 
                      value={newMaterial.defaultGsm}
                      onChange={e => setNewMaterial({...newMaterial, defaultGsm: parseInt(e.target.value)})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value={20}>20 GSM</option>
                      <option value={23}>23 GSM</option>
                      <option value={25}>25 GSM</option>
                    </select>
                  </div>
                ) : newMaterial.type === 'Ink' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Ink Colour</label>
                      <input 
                        type="text" 
                        value={newMaterial.inkColour}
                        onChange={e => setNewMaterial({...newMaterial, inkColour: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="e.g. Red"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Ink Type</label>
                      <select 
                        value={newMaterial.inkType}
                        onChange={e => setNewMaterial({...newMaterial, inkType: e.target.value as InkType})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="Visible">Visible</option>
                        <option value="Invisible UV">Invisible UV</option>
                        <option value="Magnetic">Magnetic</option>
                        <option value="Security">Security</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Supplier</label>
                  <input 
                    type="text" 
                    value={newMaterial.supplier}
                    onChange={e => setNewMaterial({...newMaterial, supplier: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="e.g. BASF"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsAddingMaterial(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddMaterial}
                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
                  >
                    Save Material
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Add BOM Modal --- */}
      <AnimatePresence>
        {isAddingBOM && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Create Bill of Materials</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Select Product</label>
                  <select 
                    value={newBOM.productCode}
                    onChange={e => {
                      const product = productCodes.find(p => p.code === e.target.value);
                      setNewBOM({
                        ...newBOM, 
                        productCode: e.target.value,
                        requiredGsm: product?.defaultGsm || 20
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="">Select a product...</option>
                    {productCodes.map(p => (
                      <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Required Paper GSM</label>
                  <select 
                    value={newBOM.requiredGsm}
                    onChange={e => setNewBOM({...newBOM, requiredGsm: parseInt(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value={20}>20 GSM</option>
                    <option value={23}>23 GSM</option>
                    <option value={25}>25 GSM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">Select Required Inks</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800 custom-scrollbar">
                    {rawMaterialCodes.filter(m => m.type === 'Ink').map(ink => (
                      <label key={ink.code} className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={newBOM.inks?.includes(ink.code)}
                          onChange={e => {
                            const inks = e.target.checked 
                              ? [...(newBOM.inks || []), ink.code]
                              : (newBOM.inks || []).filter(c => c !== ink.code);
                            setNewBOM({...newBOM, inks});
                          }}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-300">{ink.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsAddingBOM(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-800 text-slate-400 font-bold hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddBOM}
                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20"
                  >
                    Save BOM
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Engineering;
