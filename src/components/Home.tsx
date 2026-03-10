import React from 'react';
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
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';

interface HomeProps {
  onSelectModule: (module: 'labels' | 'fibre' | 'ink' | 'database' | 'timeclock' | 'production') => void;
  printerDevice: any;
  onConnectPrinter: () => void;
}

const Home: React.FC<HomeProps> = ({ onSelectModule, printerDevice, onConnectPrinter }) => {
  const areas = [
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
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">FiberQC <span className="text-emerald-500">Command</span></h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Factory Online • System v2.5</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800/50">
          <button 
            onClick={onConnectPrinter}
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-xl transition-all border",
              printerDevice 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500"
            )}
          >
            <Printer size={16} className={cn(printerDevice ? "text-emerald-500" : "text-slate-500")} />
            <div className="text-left">
              <p className="text-[9px] uppercase font-bold tracking-wider opacity-60">Printer</p>
              <p className="text-[11px] font-mono leading-none mt-0.5">
                {printerDevice ? printerDevice.name : "Disconnected"}
              </p>
            </div>
          </button>
          <div className="px-4 py-2 border-l border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Shift Status</p>
            <p className="text-xs text-white font-mono">Shift A • 06:00 - 14:00</p>
          </div>
          <div className="px-4 py-2">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Efficiency</p>
            <p className="text-xs text-emerald-500 font-mono font-bold">94.2%</p>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-fr">
        {areas.map((area, index) => (
          <motion.div
            key={area.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "relative group bg-slate-900/40 border border-slate-800/50 rounded-[2rem] p-6 flex flex-col transition-all duration-500 hover:bg-slate-900/60 hover:border-slate-700/50",
              area.gridClass
            )}
          >
            {/* Area Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", area.bgColor)}>
                  <area.icon className={area.color} size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight leading-none">{area.title}</h2>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">{area.subtitle}</p>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800/50 rounded-2xl">
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
