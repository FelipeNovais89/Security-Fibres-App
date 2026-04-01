import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, 
  CheckSquare, 
  Droplets, 
  Database,
  ArrowRight,
  Factory,
  ShieldCheck,
  ClipboardList,
  Truck,
  Settings,
  Wrench,
  Zap,
  Users,
  HardHat,
  Cpu,
  Clock,
  Layout,
  Eye,
  EyeOff,
  GripVertical,
  RotateCcw,
  X
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';

import { User } from 'firebase/auth';

interface HomeProps {
  onSelectModule: (module: 'labels' | 'fibre' | 'ink' | 'database' | 'timeclock' | 'production' | 'fibre-analysis') => void;
  printerStatus: 'disconnected' | 'connecting' | 'connected_bt' | 'connected_usb';
  connectedDeviceName: string | null;
  onConnectPrinter: () => void;
  user: User;
}

const DEFAULT_AREAS = [
  {
    id: 'production',
    title: 'Production',
    subtitle: 'Manufacturing & Labels',
    icon: Factory,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    gridClass: 'md:col-span-2 md:row-span-2',
    modules: [
      {
        id: 'production',
        title: 'Production Process',
        description: 'Cutting and Blowing management.',
        icon: Factory,
        active: true
      },
      {
        id: 'labels',
        title: 'Label Printing',
        description: 'Thermal labels for boxes and products.',
        icon: Printer,
        active: true
      }
    ]
  },
  {
    id: 'quality',
    title: 'Quality',
    subtitle: 'QC & Compliance',
    icon: ShieldCheck,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    gridClass: 'md:col-span-2 md:row-span-2',
    modules: [
      {
        id: 'fibre',
        title: 'Fibre Verification',
        description: 'Inspection workflow for fibre delivery.',
        icon: CheckSquare,
        active: true
      },
      {
        id: 'ink',
        title: 'Ink Check',
        description: 'Verification of ink batches.',
        icon: Droplets,
        active: false
      },
      {
        id: 'fibre-analysis',
        title: 'Microscope Lab',
        description: 'Advanced fibre analysis and dataset building.',
        icon: Cpu,
        active: true
      }
    ]
  },
  {
    id: 'planning',
    title: 'Planning',
    subtitle: 'Planning & Resources',
    icon: ClipboardList,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    gridClass: 'md:col-span-2',
    modules: [
      {
        id: 'database',
        title: 'Database',
        description: 'Manage customers and specs.',
        icon: Database,
        active: true
      }
    ]
  },
  {
    id: 'logistics',
    title: 'Logistics',
    subtitle: 'Shipping & Receiving',
    icon: Truck,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    gridClass: 'md:col-span-1',
    modules: [
      {
        id: 'shipping',
        title: 'Dispatch',
        description: 'Outgoing shipments.',
        icon: Truck,
        active: false
      }
    ]
  },
  {
    id: 'maintenance',
    title: 'Maintenance',
    subtitle: 'Asset Management',
    icon: Wrench,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    gridClass: 'md:col-span-1',
    modules: [
      {
        id: 'assets',
        title: 'Assets',
        description: 'Preventive maintenance.',
        icon: Settings,
        active: false
      }
    ]
  },
  {
    id: 'engineering',
    title: 'Engineering',
    subtitle: 'R&D & Projects',
    icon: Cpu,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    gridClass: 'md:col-span-1',
    modules: []
  },
  {
    id: 'hse',
    title: 'Safety',
    subtitle: 'Health & Safety',
    icon: HardHat,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    gridClass: 'md:col-span-1',
    modules: []
  },
  {
    id: 'admin',
    title: 'Admin',
    subtitle: 'HR & Management',
    icon: Users,
    color: 'text-slate-400',
    bgColor: 'bg-slate-400/10',
    gridClass: 'md:col-span-2',
    modules: [
      {
        id: 'timeclock',
        title: 'Time Clock',
        description: 'Clock in/out and overtime tracking.',
        icon: Clock,
        active: true
      }
    ]
  }
];

const Home: React.FC<HomeProps> = ({ onSelectModule, printerStatus, connectedDeviceName, onConnectPrinter, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [orderedAreaIds, setOrderedAreaIds] = useState<string[]>([]);
  const [hiddenAreaIds, setHiddenAreaIds] = useState<string[]>([]);

  // Load layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem(`sf_user_layout_${user.uid}`);
    const savedHidden = localStorage.getItem(`sf_user_hidden_${user.uid}`);
    
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        // Ensure all default areas are present (in case new ones were added)
        const allIds = DEFAULT_AREAS.map(a => a.id);
        const merged = [...parsed, ...allIds.filter(id => !parsed.includes(id))];
        setOrderedAreaIds(merged);
      } catch (e) {
        setOrderedAreaIds(DEFAULT_AREAS.map(a => a.id));
      }
    } else {
      setOrderedAreaIds(DEFAULT_AREAS.map(a => a.id));
    }

    if (savedHidden) {
      try {
        setHiddenAreaIds(JSON.parse(savedHidden));
      } catch (e) {
        setHiddenAreaIds([]);
      }
    }
  }, [user.uid]);

  // Save layout to localStorage
  const saveLayout = (newOrder: string[], newHidden: string[]) => {
    localStorage.setItem(`sf_user_layout_${user.uid}`, JSON.stringify(newOrder));
    localStorage.setItem(`sf_user_hidden_${user.uid}`, JSON.stringify(newHidden));
  };

  const handleReorder = (newOrder: string[]) => {
    setOrderedAreaIds(newOrder);
    saveLayout(newOrder, hiddenAreaIds);
  };

  const toggleVisibility = (id: string) => {
    const newHidden = hiddenAreaIds.includes(id) 
      ? hiddenAreaIds.filter(hid => hid !== id)
      : [...hiddenAreaIds, id];
    setHiddenAreaIds(newHidden);
    saveLayout(orderedAreaIds, newHidden);
  };

  const resetLayout = () => {
    const defaultIds = DEFAULT_AREAS.map(a => a.id);
    setOrderedAreaIds(defaultIds);
    setHiddenAreaIds([]);
    localStorage.removeItem(`sf_user_layout_${user.uid}`);
    localStorage.removeItem(`sf_user_hidden_${user.uid}`);
  };

  const visibleAreas = useMemo(() => {
    const areasMap = new Map(DEFAULT_AREAS.map(a => [a.id, a]));
    return orderedAreaIds
      .map(id => areasMap.get(id))
      .filter((a): a is typeof DEFAULT_AREAS[0] => !!a && (isEditing || !hiddenAreaIds.includes(a.id)));
  }, [orderedAreaIds, hiddenAreaIds, isEditing]);

  return (
    <div className="min-h-full py-6 px-4 max-w-[1600px] mx-auto">
      {/* Top Navigation / Status Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl p-2 shadow-lg flex items-center justify-center shrink-0">
            <img 
              src="https://media.licdn.com/dms/image/v2/C4E0BAQEm03RiTKqcpA/company-logo_200_200/company-logo_200_200/0/1630648866973/security_fibres_uk_limited_logo?e=2147483647&v=beta&t=R0VL_C7Lva5nqAjdK4OjOGPZK4hGJs3nFM5pwYIm40Q" 
              alt="Security Fibres Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
              Welcome, <span className="text-emerald-500">{user.displayName?.split(' ')[0]}</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                {user.email} • Factory Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800/50">
          {/* Customization Controls */}
          <div className="flex items-center gap-1 pr-3 border-r border-slate-800">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider",
                isEditing 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              )}
            >
              <Layout size={14} />
              {isEditing ? "Finish Editing" : "Personalize"}
            </button>
            {isEditing && (
              <button
                onClick={resetLayout}
                className="p-2 bg-slate-800 text-slate-400 hover:text-rose-500 rounded-xl transition-colors"
                title="Reset Layout"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          <button 
            onClick={onConnectPrinter}
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-xl transition-all border",
              printerStatus !== 'disconnected' 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500"
            )}
          >
            <Printer size={16} className={cn(printerStatus !== 'disconnected' ? "text-emerald-500" : "text-slate-500")} />
            <div className="text-left">
              <p className="text-[9px] uppercase font-bold tracking-wider opacity-60">Printer</p>
              <p className="text-[11px] font-mono leading-none mt-0.5">
                {printerStatus === 'connecting' ? "Connecting..." : 
                 printerStatus !== 'disconnected' ? (connectedDeviceName || "Connected") : "Disconnected"}
              </p>
            </div>
          </button>
          <div className="px-4 py-2 border-l border-slate-800 hidden sm:block">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Shift Status</p>
            <p className="text-xs text-white font-mono">Shift A • 06:00 - 14:00</p>
          </div>
          <div className="px-4 py-2 hidden sm:block">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Efficiency</p>
            <p className="text-xs text-emerald-500 font-mono font-bold">94.2%</p>
          </div>
        </div>
      </div>

      {/* Bento Grid with Reorder Support */}
      {isEditing ? (
        <Reorder.Group 
          axis="y" 
          values={orderedAreaIds} 
          onReorder={handleReorder}
          className="flex flex-col gap-4"
        >
          {visibleAreas.map((area) => (
            <Reorder.Item
              key={area.id}
              value={area.id}
              className={cn(
                "relative bg-slate-900/60 border rounded-[2rem] p-6 flex items-center justify-between gap-6 transition-all",
                hiddenAreaIds.includes(area.id) ? "border-slate-800 opacity-40" : "border-emerald-500/30 shadow-lg shadow-emerald-500/5"
              )}
            >
              <div className="flex items-center gap-6 flex-1 min-w-0">
                <div className="cursor-grab active:cursor-grabbing p-2 text-slate-600 hover:text-slate-400">
                  <GripVertical size={20} />
                </div>
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", area.bgColor)}>
                  <area.icon className={area.color} size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-white uppercase tracking-tight leading-none truncate">{area.title}</h2>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">{area.subtitle}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleVisibility(area.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all",
                    hiddenAreaIds.includes(area.id)
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                  )}
                >
                  {hiddenAreaIds.includes(area.id) ? (
                    <><Eye size={14} /> Show</>
                  ) : (
                    <><EyeOff size={14} /> Hide</>
                  )}
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 auto-rows-fr">
          {visibleAreas.map((area, index) => (
            <motion.div
              key={area.id}
              layoutId={area.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "relative group bg-slate-900/40 border border-slate-800/50 rounded-[2rem] p-6 flex flex-col transition-all duration-500 hover:bg-slate-900/60 hover:border-slate-700/50 overflow-hidden",
                // Responsive col spans to prevent overlap
                area.id === 'production' || area.id === 'quality' ? "sm:col-span-2 lg:row-span-2" : "col-span-1"
              )}
            >
              {/* Area Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0", area.bgColor)}>
                    <area.icon className={area.color} size={24} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-white uppercase tracking-tight leading-none truncate break-words">{area.title}</h2>
                    <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">{area.subtitle}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Zap size={14} className="text-slate-700" />
                </div>
              </div>

              {/* Modules Container */}
              <div className="flex-1 flex flex-col gap-3">
                {area.modules.length > 0 ? (
                  area.modules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => module.active && onSelectModule(module.id as any)}
                      disabled={!module.active}
                      className={cn(
                        "group/btn w-full p-4 rounded-2xl border transition-all duration-300 text-left flex items-center gap-4 relative overflow-hidden",
                        module.active 
                          ? "bg-slate-900/80 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800" 
                          : "bg-slate-900/20 border-slate-800/30 opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        module.active ? "bg-slate-800 text-emerald-500" : "bg-slate-800/50 text-slate-600"
                      )}>
                        <module.icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{module.title}</h3>
                        <p className="text-[10px] text-slate-500 truncate">{module.description}</p>
                      </div>
                      {module.active ? (
                        <ArrowRight size={14} className="text-emerald-500 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                      ) : (
                        <span className="text-[8px] uppercase tracking-tighter text-slate-600 font-bold">Soon</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800/50 rounded-2xl min-h-[80px]">
                    <p className="text-[10px] text-slate-700 uppercase font-bold tracking-widest">No Active Modules</p>
                  </div>
                )}
              </div>

              {/* Decorative Background Element */}
              <div className="absolute -bottom-4 -right-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <area.icon size={120} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-800/50 pt-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Server Location</span>
            <span className="text-xs text-slate-400 font-mono">UK-SOUTH-01</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Last Sync</span>
            <span className="text-xs text-slate-400 font-mono">Just Now</span>
          </div>
        </div>
        <p className="text-slate-600 text-[9px] font-mono uppercase tracking-[0.3em]">
          Security Fibres UK Limited • Enterprise Resource Control
        </p>
      </div>
    </div>
  );
};

export default Home;
