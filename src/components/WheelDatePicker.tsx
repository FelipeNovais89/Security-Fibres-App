import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

interface WheelDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: string) => void;
  initialDate?: string;
}

const WheelDatePicker = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  initialDate 
}: WheelDatePickerProps) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const years = Array.from({ length: 2035 - 2020 + 1 }, (_, i) => 2020 + i);
  
  // Parse initial date or use today (2026-03-05 based on metadata)
  const today = new Date(2026, 2, 5); 
  const [day, setDay] = useState(today.getDate());
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const dayRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  const daysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth(month, year) }, (_, i) => i + 1);

  // Center the initial values on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const centerScroll = (ref: React.RefObject<HTMLDivElement | null>, index: number) => {
          if (ref.current) {
            ref.current.scrollTop = index * 48; // 48px is the height of each item (h-12)
          }
        };
        centerScroll(dayRef, day - 1);
        centerScroll(monthRef, month);
        centerScroll(yearRef, years.indexOf(year));
      }, 100);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const formattedDate = `${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
    onSelect(formattedDate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-[320px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Select Date</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="relative h-64 flex items-center justify-center px-4 bg-slate-950/50">
          {/* Gradient Overlays */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900 to-transparent z-10 pointer-events-none" />
          
          {/* Selection Highlight */}
          <div className="absolute inset-x-4 h-12 border-y border-emerald-500/30 bg-emerald-500/5 pointer-events-none z-0" />
          
          <div className="flex w-full h-full overflow-hidden">
            {/* Days */}
            <div 
              ref={dayRef}
              className="flex-1 h-full overflow-y-auto scroll-smooth snap-y snap-mandatory no-scrollbar py-24"
            >
              {days.map(d => (
                <div 
                  key={d} 
                  onClick={() => setDay(d)}
                  className={cn(
                    "h-12 flex items-center justify-center snap-center cursor-pointer transition-all duration-200",
                    day === d ? "text-emerald-400 font-bold text-lg" : "text-slate-600 text-sm"
                  )}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Months */}
            <div 
              ref={monthRef}
              className="flex-1 h-full overflow-y-auto scroll-smooth snap-y snap-mandatory no-scrollbar py-24"
            >
              {months.map((m, i) => (
                <div 
                  key={m} 
                  onClick={() => setMonth(i)}
                  className={cn(
                    "h-12 flex items-center justify-center snap-center cursor-pointer transition-all duration-200",
                    month === i ? "text-emerald-400 font-bold text-lg" : "text-slate-600 text-sm"
                  )}
                >
                  {m}
                </div>
              ))}
            </div>

            {/* Years */}
            <div 
              ref={yearRef}
              className="flex-1 h-full overflow-y-auto scroll-smooth snap-y snap-mandatory no-scrollbar py-24"
            >
              {years.map(y => (
                <div 
                  key={y} 
                  onClick={() => setYear(y)}
                  className={cn(
                    "h-12 flex items-center justify-center snap-center cursor-pointer transition-all duration-200",
                    year === y ? "text-emerald-400 font-bold text-lg" : "text-slate-600 text-sm"
                  )}
                >
                  {y}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default WheelDatePicker;
