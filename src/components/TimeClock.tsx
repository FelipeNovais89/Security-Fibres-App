import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Coffee, 
  LogOut, 
  LogIn, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  History,
  Save,
  Trash2,
  CheckCircle2,
  Settings,
  X,
  Edit2,
  Plus
} from 'lucide-react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addDays, 
  subDays,
  startOfMonth,
  endOfMonth,
  isWeekend,
  differenceInMinutes,
  parseISO,
  isAfter,
  isBefore,
  setHours,
  setMinutes,
  addWeeks
} from 'date-fns';
import { cn } from '../utils/cn';

// --- Types ---

interface TimeEntry {
  id: string;
  date: string; // ISO date string
  clockIn: string | null; // ISO time string
  clockOut: string | null; // ISO time string
  breakTaken: boolean;
  notes: string;
}

// --- Helpers ---

const getLastBusinessDayOfMonth = (date: Date): Date => {
  let lastDay = endOfMonth(date);
  while (isWeekend(lastDay)) {
    lastDay = subDays(lastDay, 1);
  }
  return lastDay;
};

const getOvertimeCutoff = (date: Date): Date => {
  const lastBD = getLastBusinessDayOfMonth(date);
  // Based on user example: March 31 (Tue) -> March 23 (Mon)
  // This is 8 days before. 
  // "um dia útil uma semana antes do último dia útil"
  // If we take 7 days before (one week), it's the 24th. 
  // If the user wants the 23rd, maybe they mean "the business day before the day that is 7 days before"?
  // Or simply 8 days before.
  let cutoff = subDays(lastBD, 8);
  while (isWeekend(cutoff)) {
    cutoff = subDays(cutoff, 1);
  }
  return cutoff;
};

const DAILY_TARGET_MINUTES = 8 * 60; // 8h standard day

const calculateOvertime = (date: string, duration: number): number => {
  const d = parseISO(date);
  if (isWeekend(d)) {
    return duration; // 100% OT on weekends
  }
  return Math.max(0, duration - DAILY_TARGET_MINUTES);
};

const calculateDuration = (start: string | null, end: string | null, breakTaken: boolean, now: Date = new Date()): number => {
  if (!start) return 0;
  const s = parseISO(start);
  const e = end ? parseISO(end) : now;
  let diff = differenceInMinutes(e, s);
  if (breakTaken) {
    diff -= 30; // 30 min break
  }
  return Math.max(0, diff);
};

const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

// --- Component ---

export default function TimeClock() {
  const [entries, setEntries] = useState<TimeEntry[]>(() => {
    const saved = localStorage.getItem('fiberqc_time_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date()); // For the calendar view
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // Persist entries
  useEffect(() => {
    localStorage.setItem('fiberqc_time_entries', JSON.stringify(entries));
  }, [entries]);

  // Update current time for real-time display
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 10000); // Update every 10 seconds for better responsiveness
    return () => clearInterval(interval);
  }, []);

  const todayStr = format(currentDate, 'yyyy-MM-dd');
  const todayEntry = entries.find(e => e.date === todayStr);

  const handleClockIn = () => {
    const now = new Date();
    const newEntry: TimeEntry = {
      id: crypto.randomUUID(),
      date: todayStr,
      clockIn: now.toISOString(),
      clockOut: null,
      breakTaken: false,
      notes: ''
    };
    setEntries(prev => [...prev, newEntry]);
  };

  const handleClockOut = () => {
    if (!todayEntry) return;
    const now = new Date();
    setEntries(prev => prev.map(e => 
      e.id === todayEntry.id ? { ...e, clockOut: now.toISOString() } : e
    ));
  };

  const toggleBreak = () => {
    if (!todayEntry) return;
    setEntries(prev => prev.map(e => 
      e.id === todayEntry.id ? { ...e, breakTaken: !e.breakTaken } : e
    ));
  };

  const deleteEntry = (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const saveEditedEntry = (updated: TimeEntry) => {
    setEntries(prev => {
      const exists = prev.find(e => e.id === updated.id);
      if (exists) {
        return prev.map(e => e.id === updated.id ? updated : e);
      } else {
        return [...prev, updated];
      }
    });
    setEditingEntry(null);
  };

  const startManualEntry = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const existing = entries.find(e => e.date === dayStr);
    
    if (existing) {
      setEditingEntry(existing);
    } else {
      // Create a default entry for that day
      const baseDate = setMinutes(setHours(day, 8), 0); // 08:00
      const endDate = setMinutes(setHours(day, 17), 0); // 17:00
      
      setEditingEntry({
        id: crypto.randomUUID(),
        date: dayStr,
        clockIn: baseDate.toISOString(),
        clockOut: endDate.toISOString(),
        breakTaken: true,
        notes: ''
      });
    }
  };

  // --- Stats ---

  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(viewDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekEntries = entries.filter(e => {
    const d = parseISO(e.date);
    return d >= weekStart && d <= weekEnd;
  });

  const weekOvertimeMinutes = weekEntries.reduce((acc, e) => {
    const duration = calculateDuration(e.clockIn, e.clockOut, e.breakTaken, now);
    return acc + calculateOvertime(e.date, duration);
  }, 0);

  const weekTotalMinutes = weekEntries.reduce((acc, e) => acc + calculateDuration(e.clockIn, e.clockOut, e.breakTaken, now), 0);
  const weekRegularMinutes = weekTotalMinutes - weekOvertimeMinutes;
  
  const weekTargetMinutes = 40 * 60; // 40h
  const weekDaysWorked = weekEntries.filter(e => !isWeekend(parseISO(e.date))).length;

  const cutoffDate = getOvertimeCutoff(viewDate);
  const isCutoffPassed = isAfter(currentDate, cutoffDate) && currentDate.getMonth() === viewDate.getMonth();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Time Clock</h2>
          <p className="text-slate-400">Track your work hours, breaks, and overtime.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border",
              isAdminMode 
                ? "bg-amber-500/10 border-amber-500 text-amber-500" 
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
            )}
          >
            <Settings size={18} />
            {isAdminMode ? "Exit Admin Mode" : "Admin Mode"}
          </button>
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setViewDate(subDays(viewDate, 7))}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 py-1 text-sm font-bold flex items-center gap-2">
            <Calendar size={16} className="text-emerald-500" />
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </div>
          <button 
            onClick={() => setViewDate(addDays(viewDate, 7))}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                todayEntry ? (todayEntry.clockOut ? "bg-slate-500" : "bg-emerald-500") : "bg-red-500"
              )} />
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold mb-1">Today's Session</h3>
              <p className="text-slate-500 text-sm">{format(currentDate, 'EEEE, MMMM do')}</p>
            </div>

            <div className="space-y-4">
              {!todayEntry ? (
                <button 
                  onClick={handleClockIn}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex flex-col items-center gap-2 group"
                >
                  <LogIn size={32} className="group-hover:scale-110 transition-transform" />
                  <span>Clock In</span>
                </button>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">In</p>
                      <p className="text-xl font-mono font-bold text-emerald-500">
                        {format(parseISO(todayEntry.clockIn!), 'HH:mm')}
                      </p>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Out</p>
                      <p className="text-xl font-mono font-bold text-slate-400">
                        {todayEntry.clockOut ? format(parseISO(todayEntry.clockOut), 'HH:mm') : '--:--'}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={toggleBreak}
                    disabled={!!todayEntry.clockOut}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 border-2",
                      todayEntry.breakTaken 
                        ? "bg-amber-500/10 border-amber-500 text-amber-500" 
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    )}
                  >
                    <Coffee size={20} />
                    {todayEntry.breakTaken ? "Break Taken (30m)" : "Take Break"}
                  </button>

                      {!todayEntry.clockOut ? (
                        <button 
                          onClick={handleClockOut}
                          className="w-full bg-red-600 hover:bg-red-500 text-white py-6 rounded-2xl font-bold transition-all shadow-lg shadow-red-900/20 flex flex-col items-center gap-2 group"
                        >
                          <LogOut size={32} className="group-hover:scale-110 transition-transform" />
                          <div className="text-center">
                            <span className="block">Clock Out</span>
                            <span className="text-xs opacity-80 font-mono">
                              Current: {formatDuration(calculateDuration(todayEntry.clockIn, todayEntry.clockOut, todayEntry.breakTaken, now))}
                            </span>
                          </div>
                        </button>
                      ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                          <p className="text-emerald-500 font-bold flex items-center justify-center gap-2">
                            <CheckCircle2 size={20} /> Shift Completed
                          </p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-2">
                            Total: {formatDuration(calculateDuration(todayEntry.clockIn, todayEntry.clockOut, todayEntry.breakTaken, now))}
                            {calculateOvertime(todayEntry.date, calculateDuration(todayEntry.clockIn, todayEntry.clockOut, todayEntry.breakTaken, now)) > 0 && (
                              <span className="text-amber-500 font-bold">
                                (+{formatDuration(calculateOvertime(todayEntry.date, calculateDuration(todayEntry.clockIn, todayEntry.clockOut, todayEntry.breakTaken, now)))} OT)
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={18} />
              Monthly Cutoff
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Cutoff Date</span>
                <span className="text-sm font-bold text-amber-500">{format(cutoffDate, 'EEEE, MMM d')}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Payment Date</span>
                <span className="text-sm font-bold text-slate-200">{format(getLastBusinessDayOfMonth(viewDate), 'MMM d')}</span>
              </div>
              {isCutoffPassed && (
                <div className="flex gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <AlertCircle className="text-amber-500 shrink-0" size={18} />
                  <p className="text-[10px] text-amber-200 leading-tight">
                    The overtime cutoff for this month has passed. New overtime will be counted for the next period.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Weekly Overview */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Regular Hours</p>
              <p className="text-2xl font-bold">{formatDuration(weekRegularMinutes)}</p>
              <div className="mt-2 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (weekRegularMinutes / weekTargetMinutes) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Target: 40h / week</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Weekly Overtime</p>
              <p className={cn("text-2xl font-bold", weekOvertimeMinutes > 0 ? "text-amber-500" : "text-slate-400")}>
                {formatDuration(weekOvertimeMinutes)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Includes weekends & daily OT</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Days Worked</p>
              <p className="text-2xl font-bold">{weekDaysWorked} / 5</p>
              <p className="text-[10px] text-slate-500 mt-1">Mon - Fri only</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <History className="text-slate-400" size={20} />
              Weekly Log
            </h3>
            
            <div className="space-y-3">
              {weekDays.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const entry = entries.find(e => e.date === dayStr);
                const isToday = isSameDay(day, currentDate);
                const isWeekendDay = isWeekend(day);

                return (
                  <div 
                    key={dayStr}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all",
                      isToday ? "bg-emerald-600/5 border-emerald-500/30" : "bg-slate-950 border-slate-800",
                      isWeekendDay && !entry && "opacity-40 grayscale"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex flex-col items-center justify-center",
                        isToday ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
                      )}>
                        <span className="text-[10px] font-bold uppercase leading-none">{format(day, 'EEE')}</span>
                        <span className="text-sm font-bold leading-none mt-0.5">{format(day, 'd')}</span>
                      </div>
                      <div>
                        {entry ? (
                          <>
                            <p className="text-sm font-bold">
                              {format(parseISO(entry.clockIn!), 'HH:mm')} - {entry.clockOut ? format(parseISO(entry.clockOut), 'HH:mm') : 'Active'}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {entry.breakTaken ? "30m Break included" : "No break recorded"}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-slate-600 italic">
                            {isWeekendDay ? 'Weekend' : 'No entry'}
                          </p>
                        )}
                      </div>
                    </div>

                        <div className="flex items-center gap-6">
                          {entry ? (
                            <>
                              <div className="text-right flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2">
                                  {calculateOvertime(entry.date, calculateDuration(entry.clockIn, entry.clockOut, entry.breakTaken, now)) > 0 && (
                                    <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black rounded border border-amber-500/20 uppercase tracking-wider">
                                      +{formatDuration(calculateOvertime(entry.date, calculateDuration(entry.clockIn, entry.clockOut, entry.breakTaken, now)))} OT
                                    </span>
                                  )}
                                  <p className="text-sm font-mono font-bold text-slate-300">
                                    {formatDuration(calculateDuration(entry.clockIn, entry.clockOut, entry.breakTaken, now))}
                                  </p>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Total</p>
                              </div>
                          <div className="flex items-center gap-1">
                            {isAdminMode && (
                              <button 
                                onClick={() => setEditingEntry(entry)}
                                className="p-2 text-slate-600 hover:text-emerald-500 transition-colors"
                                title="Edit Entry"
                              >
                                <Edit2 size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => deleteEntry(entry.id)}
                              className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                              title="Delete Entry"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </>
                      ) : (
                        isAdminMode && (
                          <button 
                            onClick={() => startManualEntry(day)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all"
                          >
                            <Plus size={14} /> Add Entry
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-bottom border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Edit Time Entry</h3>
                <p className="text-slate-400 text-sm">{format(parseISO(editingEntry.date), 'EEEE, MMMM do')}</p>
              </div>
              <button 
                onClick={() => setEditingEntry(null)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Clock In</label>
                  <input 
                    type="time" 
                    value={editingEntry.clockIn ? format(parseISO(editingEntry.clockIn), 'HH:mm') : ''}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':');
                      const newDate = setMinutes(setHours(parseISO(editingEntry.date), parseInt(h)), parseInt(m));
                      setEditingEntry({ ...editingEntry, clockIn: newDate.toISOString() });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Clock Out</label>
                  <input 
                    type="time" 
                    value={editingEntry.clockOut ? format(parseISO(editingEntry.clockOut), 'HH:mm') : ''}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':');
                      const newDate = setMinutes(setHours(parseISO(editingEntry.date), parseInt(h)), parseInt(m));
                      setEditingEntry({ ...editingEntry, clockOut: newDate.toISOString() });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <Coffee className="text-amber-500" size={20} />
                  <div>
                    <p className="text-sm font-bold">Mandatory Break</p>
                    <p className="text-[10px] text-slate-500">Deduct 30 minutes from total</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingEntry({ ...editingEntry, breakTaken: !editingEntry.breakTaken })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    editingEntry.breakTaken ? "bg-emerald-600" : "bg-slate-800"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    editingEntry.breakTaken ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setEditingEntry(null)}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => saveEditedEntry(editingEntry)}
                  className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
