import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Play,
  Save, 
  Trash2, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Tag,
  Undo,
  Redo,
  Eraser,
  Brush,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  ChevronLeft,
  Settings2,
  User as UserIcon,
  FileText,
  Ruler,
  Database
} from 'lucide-react';
import { FibreLabel, DatasetSample } from '../types/fibre';
import { FibreDatasetService } from '../services/fibreDatasetService';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../utils/cn';
import { auth } from '../firebase';
import FibrePageLayout from './FibrePageLayout';

interface DatasetBuilderProps {
  onBack: () => void;
  topIgnorePx?: number;
}

type Tool = 'brush' | 'eraser' | 'pan' | 'length' | 'thickness';

const DatasetBuilder: React.FC<DatasetBuilderProps> = ({ onBack, topIgnorePx = 0 }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<FibreLabel>('fibre');
  const [notes, setNotes] = useState('');
  const [operator, setOperator] = useState(auth.currentUser?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Annotation State
  const [tool, setTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(20);
  const [showMask, setShowMask] = useState(true);
  const [maskOpacity, setMaskOpacity] = useState(0.5);
  const [smartBrush, setSmartBrush] = useState(false);
  const [intensityThreshold, setIntensityThreshold] = useState(20); // 0-255
  
  // Measurement State
  const [lengthLine, setLengthLine] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } } | null>(null);
  const [thicknessLine, setThicknessLine] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } } | null>(null);
  const [manualRealLength, setManualRealLength] = useState('');
  const [manualRealThickness, setManualRealThickness] = useState('');
  const [tempLine, setTempLine] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } } | null>(null);
  
  // Canvas Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // History for Undo/Redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Pan/Zoom State
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);

  const labels: { value: FibreLabel; label: string; color: string }[] = [
    { value: 'fibre', label: 'Single Fibre', color: 'bg-emerald-500' },
    { value: 'double', label: 'Double/Merged', color: 'bg-blue-500' },
    { value: 'chain', label: 'Chain', color: 'bg-indigo-500' },
    { value: 'pulp', label: 'Pulp/Mass', color: 'bg-purple-500' },
    { value: 'broken', label: 'Broken Fibre', color: 'bg-amber-500' },
    { value: 'wide', label: 'Wide/Thick', color: 'bg-orange-500' },
    { value: 'thin', label: 'Thin/Fine', color: 'bg-cyan-500' },
    { value: 'noise', label: 'Noise/Dust', color: 'bg-rose-500' },
    { value: 'few_fibres', label: 'Few Fibres', color: 'bg-slate-500' },
    { value: 'mixed', label: 'Mixed Content', color: 'bg-yellow-500' },
    { value: 'other', label: 'Other/Unknown', color: 'bg-gray-500' },
  ];

  // Initialize Mask Canvas when image is captured
  useEffect(() => {
    if (capturedImage) {
      const img = new Image();
      img.onload = () => {
        const imgCanvas = imageCanvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        if (!imgCanvas || !maskCanvas || !overlayCanvas) return;

        imgCanvas.width = img.width;
        imgCanvas.height = img.height;
        maskCanvas.width = img.width;
        maskCanvas.height = img.height;
        overlayCanvas.width = img.width;
        overlayCanvas.height = img.height;

        const ctx = imgCanvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);

        // Clear mask
        const maskCtx = maskCanvas.getContext('2d');
        if (maskCtx) {
          maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
          saveToHistory();
        }
        
        // Fit to screen
        if (containerRef.current) {
          const container = containerRef.current;
          const scaleW = container.clientWidth / img.width;
          const scaleH = container.clientHeight / img.height;
          const initialScale = Math.min(scaleW, scaleH, 1) * 0.9;
          setScale(initialScale);
          setOffset({
            x: (container.clientWidth - img.width * initialScale) / 2,
            y: (container.clientHeight - img.height * initialScale) / 2
          });
        }
      };
      img.src = capturedImage;
    }
  }, [capturedImage]);

  // Handle drawing overlay (lines)
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Length Line
    if (lengthLine) {
      ctx.strokeStyle = '#3b82f6'; // blue-500
      ctx.lineWidth = 4 / scale;
      ctx.beginPath();
      ctx.moveTo(lengthLine.start.x, lengthLine.start.y);
      ctx.lineTo(lengthLine.end.x, lengthLine.end.y);
      ctx.stroke();
      
      // Draw endpoints
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(lengthLine.start.x, lengthLine.start.y, 6 / scale, 0, Math.PI * 2);
      ctx.arc(lengthLine.end.x, lengthLine.end.y, 6 / scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Thickness Line
    if (thicknessLine) {
      ctx.strokeStyle = '#f59e0b'; // amber-500
      ctx.lineWidth = 4 / scale;
      ctx.beginPath();
      ctx.moveTo(thicknessLine.start.x, thicknessLine.start.y);
      ctx.lineTo(thicknessLine.end.x, thicknessLine.end.y);
      ctx.stroke();

      // Draw endpoints
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(thicknessLine.start.x, thicknessLine.start.y, 6 / scale, 0, Math.PI * 2);
      ctx.arc(thicknessLine.end.x, thicknessLine.end.y, 6 / scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Temp Line
    if (tempLine) {
      ctx.strokeStyle = tool === 'length' ? '#3b82f6' : '#f59e0b';
      ctx.setLineDash([5 / scale, 5 / scale]);
      ctx.lineWidth = 2 / scale;
      ctx.beginPath();
      ctx.moveTo(tempLine.start.x, tempLine.start.y);
      ctx.lineTo(tempLine.end.x, tempLine.end.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [lengthLine, thicknessLine, tempLine, scale, tool]);

  const saveToHistory = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, dataUrl];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const img = new Image();
      img.onload = () => {
        const canvas = maskCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newIndex];
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const img = new Image();
      img.onload = () => {
        const canvas = maskCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[newIndex];
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1920, height: 1080 } 
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.95));
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;
    
    return { x, y };
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool === 'pan') return;
    
    const canvas = maskCanvasRef.current;
    const imgCanvas = imageCanvasRef.current;
    if (!canvas || !imgCanvas) return;
    const ctx = canvas.getContext('2d');
    const imgCtx = imgCanvas.getContext('2d');
    if (!ctx || !imgCtx) return;

    const { x, y } = getCanvasCoords(e);

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = brushSize / scale;
    
    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#10b981'; // Emerald 500
      
      if (smartBrush) {
        // Smart brush logic: check intensity under the brush
        // For simplicity, we check the pixel at the center
        const pixel = imgCtx.getImageData(x, y, 1, 1).data;
        const intensity = (pixel[0] + pixel[1] + pixel[2]) / 3;
        if (intensity < intensityThreshold) return;
      }
    } else {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.beginPath();
    ctx.moveTo(lastMousePos.x, lastMousePos.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setLastMousePos({ x, y });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === 'pan' || e.button === 1) {
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (tool === 'length' || tool === 'thickness') {
      const coords = getCanvasCoords(e);
      setTempLine({ start: coords, end: coords });
      setIsDrawing(true);
    } else {
      setIsDrawing(true);
      setLastMousePos(getCanvasCoords(e));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (isDrawing) {
      if (tool === 'length' || tool === 'thickness') {
        const coords = getCanvasCoords(e);
        setTempLine(prev => prev ? { ...prev, end: coords } : null);
      } else {
        draw(e);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      if (tool === 'length') {
        setLengthLine(tempLine);
        setTempLine(null);
      } else if (tool === 'thickness') {
        setThicknessLine(tempLine);
        setTempLine(null);
      } else {
        saveToHistory();
      }
    }
    setIsDrawing(false);
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(10, scale * delta));
    
    // Zoom towards mouse position
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const dx = (mouseX - offset.x) / scale;
      const dy = (mouseY - offset.y) / scale;
      
      setOffset({
        x: mouseX - dx * newScale,
        y: mouseY - dy * newScale
      });
      setScale(newScale);
    }
  };

  const clearMask = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
    }
  };

  const saveSample = async () => {
    if (!capturedImage) return;
    
    if (!auth.currentUser) {
      alert("You must be logged in to save samples.");
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const maskCanvas = maskCanvasRef.current;
      let maskData: string | undefined = undefined;
      let areaPx = 0;

      if (maskCanvas) {
        maskData = maskCanvas.toDataURL();
        // Calculate areaPx by counting non-transparent pixels
        const ctx = maskCanvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
          const data = imageData.data;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) areaPx++;
          }
        }
      }

      const sample: DatasetSample = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        label: selectedLabel,
        image: capturedImage,
        mask: maskData,
        lengthLine: lengthLine || undefined,
        thicknessLine: thicknessLine || undefined,
        metadata: {
          areaPx,
          lengthPx: lengthLine ? Math.sqrt(Math.pow(lengthLine.end.x - lengthLine.start.x, 2) + Math.pow(lengthLine.end.y - lengthLine.start.y, 2)) : 0,
          widthPx: thicknessLine ? Math.sqrt(Math.pow(thicknessLine.end.x - thicknessLine.start.x, 2) + Math.pow(thicknessLine.end.y - thicknessLine.start.y, 2)) : 0,
          pixelsPerMm: 0,
          manualRealLength: manualRealLength ? parseFloat(manualRealLength) : undefined,
          manualRealThickness: manualRealThickness ? parseFloat(manualRealThickness) : undefined,
          notes,
          operator,
          source: stream ? 'camera' : 'upload'
        }
      };

      await FibreDatasetService.saveToDataset(sample);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Save Error:', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const helpContent = {
    title: "Dataset Builder Guide",
    sections: [
      {
        title: "1. Image Source",
        content: "Capture a live image from your microscope or upload an existing file to start annotating.",
        icon: <Camera size={14} />
      },
      {
        title: "2. Manual Annotation",
        content: "Use the Brush tool to draw a mask over the fibre. The 'Smart Brush' helps you stay within boundaries by using an intensity threshold.",
        icon: <Brush size={14} />
      },
      {
        title: "3. Measurements",
        content: "Draw lines to define the fibre's length and thickness. Enter the real-world values in mm for high-quality training data.",
        icon: <Ruler size={14} />
      },
      {
        title: "4. Metadata",
        content: "Select the fibre type and provide any additional observations before saving the sample to the dataset.",
        icon: <Database size={14} />
      }
    ]
  };

  return (
    <FibrePageLayout
      title="Dataset Builder"
      subtitle="Create high-quality ground truth for AI models."
      icon={<Database className="text-emerald-500" size={20} />}
      onBack={onBack}
      helpContent={helpContent}
      actions={
        <>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800 transition-all text-sm font-bold shadow-lg"
          >
            <Upload size={18} />
            Upload
          </button>
          {capturedImage && (
            <button 
              onClick={() => setCapturedImage(null)}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all text-sm font-bold shadow-lg"
            >
              <Trash2 size={18} />
              Discard
            </button>
          )}
        </>
      }
      sidebar={
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Metadata</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <UserIcon size={12} />
                  Operator
                </label>
                <input 
                  type="text" 
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500/50 outline-none transition-all"
                  placeholder="Operator Name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                  <FileText size={12} />
                  Notes
                </label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500/50 outline-none transition-all min-h-[80px] resize-none"
                  placeholder="Additional observations..."
                />
              </div>
            </div>
          </div>

          {/* Measurements Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Manual Measurements</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Real Length (mm)</label>
                  <input 
                    type="number" 
                    value={manualRealLength}
                    onChange={(e) => setManualRealLength(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs"
                    placeholder="e.g. 1.2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Real Width (mm)</label>
                  <input 
                    type="number" 
                    value={manualRealThickness}
                    onChange={(e) => setManualRealThickness(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs"
                    placeholder="e.g. 0.05"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTool('length')}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2",
                    tool === 'length' ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  <Ruler size={14} />
                  Length Axis
                </button>
                <button 
                  onClick={() => setTool('thickness')}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2",
                    tool === 'thickness' ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  <Maximize size={14} className="rotate-45" />
                  Thickness Line
                </button>
              </div>
            </div>
          </div>

          {/* Labeling Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Select Label</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
              {labels.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setSelectedLabel(l.value)}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left",
                    selectedLabel === l.value 
                      ? "bg-emerald-600/10 border-emerald-500/50 ring-1 ring-emerald-500/50" 
                      : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full shrink-0", l.color)} />
                  <span className={cn("text-[10px] font-bold", selectedLabel === l.value ? "text-white" : "text-slate-400")}>
                    {l.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!capturedImage || isSaving}
            onClick={saveSample}
            className={cn(
              "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl",
              capturedImage && !isSaving
                ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/20"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : saveStatus === 'success' ? (
              <>
                <CheckCircle2 size={20} />
                Sample Saved!
              </>
            ) : saveStatus === 'error' ? (
              <>
                <AlertCircle size={20} />
                Error Saving
              </>
            ) : (
              <>
                <Save size={20} />
                Save to Dataset
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div 
          ref={containerRef}
          className="aspect-video bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden relative shadow-2xl cursor-crosshair group"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          onWheel={handleWheel}
        >
          {!capturedImage ? (
            <div className="w-full h-full relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute top-0 left-0 right-0 bg-rose-500/10 border-b border-rose-500/30 pointer-events-none z-10 flex items-center justify-center" style={{ height: `${(topIgnorePx / 1080) * 100}%` }}>
                <span className="text-[8px] font-bold text-rose-500/50 uppercase tracking-widest">Ignored Area (OSD)</span>
              </div>
              {!stream ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-slate-950/50 backdrop-blur-sm">
                  <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-500 shadow-xl">
                    <Camera size={40} />
                  </div>
                  <button 
                    onClick={startCamera}
                    className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20 flex items-center gap-3"
                  >
                    <Play size={20} />
                    Connect Camera
                  </button>
                </div>
              ) : (
                <button 
                  onClick={captureImage}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full border-8 border-slate-300 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
                >
                  <div className="w-14 h-14 bg-white rounded-full border-4 border-slate-900 group-hover:bg-slate-50" />
                </button>
              )}
            </div>
          ) : (
            <div 
              className="absolute origin-top-left touch-none"
              style={{ 
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` 
              }}
            >
              <canvas ref={imageCanvasRef} className="block" />
              <canvas 
                ref={maskCanvasRef} 
                className="absolute top-0 left-0 block pointer-events-none transition-opacity"
                style={{ opacity: showMask ? maskOpacity : 0 }}
              />
              <canvas 
                ref={overlayCanvasRef}
                className="absolute top-0 left-0 block pointer-events-none"
              />
            </div>
          )}

          {/* Floating Toolbar */}
          {capturedImage && (
            <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-col gap-2 bg-slate-950/80 backdrop-blur-md p-1.5 md:p-2 rounded-2xl border border-slate-800 shadow-2xl z-20">
              <button 
                onClick={() => setTool('brush')}
                className={cn("p-2.5 md:p-3 rounded-xl transition-all", tool === 'brush' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "text-slate-400 hover:bg-slate-800")}
                title="Brush Tool"
              >
                <Brush size={18} />
              </button>
              <button 
                onClick={() => setTool('eraser')}
                className={cn("p-2.5 md:p-3 rounded-xl transition-all", tool === 'eraser' ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20" : "text-slate-400 hover:bg-slate-800")}
                title="Eraser Tool"
              >
                <Eraser size={18} />
              </button>
              <button 
                onClick={() => setTool('pan')}
                className={cn("p-2.5 md:p-3 rounded-xl transition-all", tool === 'pan' ? "bg-slate-700 text-white shadow-lg shadow-slate-900/20" : "text-slate-400 hover:bg-slate-800")}
                title="Pan Tool"
              >
                <Maximize size={18} />
              </button>
              <div className="w-full h-px bg-slate-800 my-1" />
              <button 
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2.5 md:p-3 text-slate-400 hover:bg-slate-800 rounded-xl disabled:opacity-20 transition-all"
                title="Undo"
              >
                <Undo size={18} />
              </button>
              <button 
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2.5 md:p-3 text-slate-400 hover:bg-slate-800 rounded-xl disabled:opacity-20 transition-all"
                title="Redo"
              >
                <Redo size={18} />
              </button>
              <div className="w-full h-px bg-slate-800 my-1" />
              <button 
                onClick={() => setShowMask(!showMask)}
                className={cn("p-2.5 md:p-3 rounded-xl transition-all", showMask ? "text-emerald-500" : "text-slate-500")}
                title="Toggle Mask Visibility"
              >
                {showMask ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          )}

          {/* Brush Size Indicator */}
          {isDrawing && (tool === 'brush' || tool === 'eraser') && (
            <div 
              className="absolute pointer-events-none border border-white/50 rounded-full bg-emerald-500/20 z-50"
              style={{
                width: brushSize,
                height: brushSize,
                left: lastMousePos.x * scale + offset.x - brushSize / 2,
                top: lastMousePos.y * scale + offset.y - brushSize / 2,
              }}
            />
          )}
        </div>

        {/* Bottom Toolbar */}
        {capturedImage && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-slate-900/50 border border-slate-800 p-4 rounded-3xl shadow-xl">
            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Brush Size</span>
                <span className="text-emerald-500 font-mono">{brushSize}px</span>
              </div>
              <input 
                type="range" 
                min="2" 
                max="100" 
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Mask Opacity</span>
                <span className="text-emerald-500 font-mono">{Math.round(maskOpacity * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01"
                value={maskOpacity}
                onChange={(e) => setMaskOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
              <Settings2 size={16} className="text-slate-500" />
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={smartBrush}
                  onChange={(e) => setSmartBrush(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 transition-all"
                />
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">Smart Brush</span>
              </label>
              {smartBrush && (
                <input 
                  type="range" 
                  min="0" 
                  max="255" 
                  value={intensityThreshold}
                  onChange={(e) => setIntensityThreshold(parseInt(e.target.value))}
                  className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  title="Intensity Threshold"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </FibrePageLayout>
  );
};

export default DatasetBuilder;

