import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Info, 
  X, 
  ChevronLeft,
  HelpCircle,
  BookOpen,
  MousePointer2,
  Camera,
  Upload,
  Ruler,
  Play,
  Brush,
  Eraser,
  Save,
  Trash2,
  Settings2,
  Database,
  Eye
} from 'lucide-react';
import { cn } from '../utils/cn';

interface FibrePageLayoutProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  helpContent?: {
    title: string;
    sections: {
      title: string;
      content: string;
      icon?: React.ReactNode;
    }[];
  };
}

const FibrePageLayout: React.FC<FibrePageLayoutProps> = ({
  title,
  subtitle,
  icon,
  onBack,
  actions,
  children,
  sidebar,
  helpContent
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl hover:bg-slate-800 hover:text-white transition-all shadow-lg active:scale-95"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="flex items-center gap-4">
              <div className="bg-emerald-600/20 p-3 rounded-2xl border border-emerald-500/20 shadow-inner">
                {icon}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-none mb-1.5">
                  {title}
                </h1>
                <p className="text-slate-500 text-xs md:text-sm font-medium">{subtitle}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {actions}
            {helpContent && (
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg whitespace-nowrap",
                  showHelp 
                    ? "bg-emerald-600 text-white shadow-emerald-900/20" 
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <HelpCircle size={18} />
                {showHelp ? 'Hide Help' : 'Help'}
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Main Content Area */}
          <main className="lg:col-span-8 space-y-6">
            {children}
          </main>

          {/* Sidebar Area */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Help Panel (Mobile/Desktop) */}
            <AnimatePresence>
              {showHelp && helpContent && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-emerald-600/5 border border-emerald-500/20 rounded-3xl p-6 shadow-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <BookOpen className="text-emerald-500" size={20} />
                      <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-500">
                        {helpContent.title}
                      </h3>
                    </div>
                    <button onClick={() => setShowHelp(false)} className="text-slate-500 hover:text-white transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="space-y-6">
                    {helpContent.sections.map((section, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wide">
                          {section.icon}
                          {section.title}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                          {section.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {sidebar}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default FibrePageLayout;
