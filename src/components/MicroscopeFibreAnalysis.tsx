import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Maximize, 
  RefreshCw, 
  Play, 
  Save, 
  Trash2, 
  Plus, 
  Scissors, 
  Combine, 
  CheckCircle2, 
  AlertCircle,
  Ruler,
  Settings2,
  Database,
  Info,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  History
} from 'lucide-react';
import { FibreObject, Calibration, FibreAnalysis, FibreModule } from '../types/fibre';
import { FibreDetectionService } from '../services/fibreDetectionService';
import { FibreDatasetService } from '../services/fibreDatasetService';
import { auth } from '../firebase';
import FibreCanvasOverlay from './FibreCanvasOverlay';
import DatasetBuilder from './DatasetBuilder';
import FibrePageLayout from './FibrePageLayout';
import { cn } from '../utils/cn';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'firebase/auth';

const FibreCrop: React.FC<{ imageSrc: string, object: FibreObject }> = ({ imageSrc, object }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y, width, height } = object.boundingBox;
      const padding = 20;
      canvas.width = width + padding * 2;
      canvas.height = height + padding * 2;
      
      ctx.drawImage(
        img,
        x - padding, y - padding, width + padding * 2, height + padding * 2,
        0, 0, canvas.width, canvas.height
      );
    };
    img.src = imageSrc;
  }, [imageSrc, object]);

  return (
    <div className="group relative bg-slate-950 rounded-xl border border-slate-800 overflow-hidden hover:border-emerald-500/50 transition-all">
      <canvas ref={canvasRef} className="w-full aspect-square object-contain" />
      <div className="absolute inset-x-0 bottom-0 bg-slate-900/90 backdrop-blur-sm p-2 translate-y-full group-hover:translate-y-0 transition-transform">
        <p className="text-[10px] font-bold text-white truncate">{object.suggestedLabel}</p>
        <p className="text-[9px] text-slate-400">{object.lengthMm.toFixed(2)}mm x {object.widthMm.toFixed(2)}mm</p>
      </div>
    </div>
  );
};

interface MicroscopeFibreAnalysisProps {
  user: User;
}

const MicroscopeFibreAnalysis: React.FC<MicroscopeFibreAnalysisProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'dataset'>('analysis');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [objects, setObjects] = useState<FibreObject[]>([]);
  const [calibration, setCalibration] = useState<Calibration | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [editMode, setEditMode] = useState<'view' | 'add' | 'delete' | 'split' | 'merge' | 'calibrate'>('view');
  const [calibrationLine, setCalibrationLine] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } } | null>(null);
  const [realLength, setRealLength] = useState<string>('1.0');
  const [showLabels, setShowLabels] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [topIgnorePx, setTopIgnorePx] = useState(80); // Default 80px for OSD
  const [showSettings, setShowSettings] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'discard' | 'delete' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [history, setHistory] = useState<FibreObject[][]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const helpContent = {
    title: "Smart Fibre QC Guide",
    sections: [
      {
        title: "1. Calibration",
        content: "Before analysis, draw a line over a known distance (e.g., a scale bar) and enter its real-world length in mm. This ensures accurate measurements.",
        icon: <Ruler size={14} />
      },
      {
        title: "2. Image Capture",
        content: "Connect your microscope and capture a clear, focused image of the fibres. Ensure the lighting is consistent for best detection results.",
        icon: <Camera size={14} />
      },
      {
        title: "3. Analysis",
        content: "Click 'Run Analysis' to automatically detect fibres. You can then manually split, merge, or delete objects to refine the results.",
        icon: <Play size={14} />
      },
      {
        title: "4. Dataset Building",
        content: "Use the 'Dataset Builder' button to manually annotate images for AI training. This is crucial for improving the model's accuracy over time.",
        icon: <Database size={14} />
      }
    ]
  };

  useEffect(() => {
    // Load default calibration if exists
    const loadCalibration = async () => {
      const cals = await FibreDatasetService.getCalibrations('microscope_default');
      if (cals.length > 0) setCalibration(cals[0]);
    };
    loadCalibration();
  }, []);

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
        setObjects([]);
      }
    }
  };

  const handleApplyCalibration = async () => {
    if (!calibrationLine || !capturedImage) return;

    const dx = calibrationLine.end.x - calibrationLine.start.x;
    const dy = calibrationLine.end.y - calibrationLine.start.y;
    const pxLength = Math.sqrt(dx * dx + dy * dy);
    const realVal = parseFloat(realLength);

    const newCal: Calibration = {
      id: uuidv4(),
      cameraId: 'microscope_default',
      timestamp: new Date().toISOString(),
      imageWidth: 0, // Would be from image
      imageHeight: 0,
      drawnLinePx: pxLength,
      realWorldLength: realVal,
      unit: 'mm',
      pixelsPerMm: pxLength / realVal,
      mmPerPixel: realVal / pxLength,
      isDefault: true
    };

    setCalibration(newCal);
    setIsCalibrating(false);
    setEditMode('view');
    setCalibrationLine(null);
    await FibreDatasetService.saveCalibration(newCal);
  };

  const runAnalysis = async () => {
    if (!capturedImage || !calibration) return;
    setIsAnalyzing(true);
    try {
      const results = await FibreDetectionService.analyzeImage(capturedImage, calibration, uuidv4(), topIgnorePx);
      setObjects(results);
      setHistory([results]);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addToHistory = (newObjects: FibreObject[]) => {
    setHistory(prev => [...prev, newObjects]);
    setObjects(newObjects);
  };

  const undo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setHistory(newHistory);
      setObjects(newHistory[newHistory.length - 1]);
    }
  };

  const handleMerge = () => {
    if (selectedIds.length < 2 || !calibration) return;
    
    const objectsToMerge = objects.filter(o => selectedIds.includes(o.id));
    const points = objectsToMerge.flatMap(o => o.points);
    
    const minX = Math.min(...objectsToMerge.map(o => o.boundingBox.x));
    const minY = Math.min(...objectsToMerge.map(o => o.boundingBox.y));
    const maxX = Math.max(...objectsToMerge.map(o => o.boundingBox.x + o.boundingBox.width));
    const maxY = Math.max(...objectsToMerge.map(o => o.boundingBox.y + o.boundingBox.height));

    // Simple centroid
    let sumX = 0, sumY = 0;
    points.forEach(p => { sumX += p.x; sumY += p.y; });
    const centroid = { x: sumX / points.length, y: sumY / points.length };

    const widthPx = maxX - minX;
    const heightPx = maxY - minY;
    const lengthPx = Math.sqrt(widthPx * widthPx + heightPx * heightPx);
    const areaPx = points.length;
    const avgWidthPx = areaPx / lengthPx;

    const mergedObject: FibreObject = {
      id: uuidv4(),
      analysisId: objectsToMerge[0].analysisId,
      points,
      boundingBox: { x: minX, y: minY, width: widthPx, height: heightPx },
      centroid,
      areaPx,
      lengthPx,
      widthPx: avgWidthPx,
      lengthMm: lengthPx * calibration.mmPerPixel,
      widthMm: avgWidthPx * calibration.mmPerPixel,
      angle: Math.atan2(heightPx, widthPx) * (180 / Math.PI),
      confidence: 1.0,
      suggestedLabel: 'fibre',
      finalLabel: 'fibre',
      status: 'merged',
      source: 'merged',
      parentIds: selectedIds
    };

    const newObjects = objects.map(o => 
      selectedIds.includes(o.id) ? { ...o, status: 'deleted' as const } : o
    );
    
    addToHistory([...newObjects, mergedObject]);
    setSelectedIds([]);
  };

  const handleSplit = (objectId: string, splitLine: { start: { x: number, y: number }, end: { x: number, y: number } }) => {
    if (!calibration) return;
    const target = objects.find(o => o.id === objectId);
    if (!target) return;

    // Simple split logic: divide points based on which side of the line they are
    const pointsA: { x: number, y: number }[] = [];
    const pointsB: { x: number, y: number }[] = [];

    // Line equation: (y2-y1)x - (x2-x1)y + x2y1 - y2x1 = 0
    const { start, end } = splitLine;
    const a = end.y - start.y;
    const b = start.x - end.x;
    const c = end.x * start.y - end.y * start.x;

    target.points.forEach(p => {
      if (a * p.x + b * p.y + c > 0) {
        pointsA.push(p);
      } else {
        pointsB.push(p);
      }
    });

    if (pointsA.length < 10 || pointsB.length < 10) return;

    const createFromPoints = (pts: { x: number, y: number }[]): FibreObject => {
      const minX = Math.min(...pts.map(p => p.x));
      const minY = Math.min(...pts.map(p => p.y));
      const maxX = Math.max(...pts.map(p => p.x));
      const maxY = Math.max(...pts.map(p => p.y));
      const w = maxX - minX;
      const h = maxY - minY;
      const len = Math.sqrt(w * w + h * h);
      const area = pts.length;
      
      let sX = 0, sY = 0;
      pts.forEach(p => { sX += p.x; sY += p.y; });

      return {
        id: uuidv4(),
        analysisId: target.analysisId,
        points: pts,
        boundingBox: { x: minX, y: minY, width: w, height: h },
        centroid: { x: sX / pts.length, y: sY / pts.length },
        areaPx: area,
        lengthPx: len,
        widthPx: area / len,
        lengthMm: len * calibration.mmPerPixel,
        widthMm: (area / len) * calibration.mmPerPixel,
        angle: Math.atan2(h, w) * (180 / Math.PI),
        confidence: 1.0,
        suggestedLabel: 'fibre',
        finalLabel: 'fibre',
        status: 'split',
        source: 'split',
        parentIds: [target.id]
      };
    };

    const objA = createFromPoints(pointsA);
    const objB = createFromPoints(pointsB);

    const newObjects = objects.map(o => o.id === target.id ? { ...o, status: 'deleted' as const } : o);
    addToHistory([...newObjects, objA, objB]);
  };

  const handleAddFibre = (points: { x: number, y: number }[]) => {
    if (!calibration) return;
    
    const minX = Math.min(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxX = Math.max(...points.map(p => p.x));
    const maxY = Math.max(...points.map(p => p.y));
    const w = maxX - minX;
    const h = maxY - minY;
    const len = Math.sqrt(w * w + h * h);
    const area = points.length;
    
    let sX = 0, sY = 0;
    points.forEach(p => { sX += p.x; sY += p.y; });

    const newFibre: FibreObject = {
      id: uuidv4(),
      analysisId: objects[0]?.analysisId || uuidv4(),
      points,
      boundingBox: { x: minX, y: minY, width: w, height: h },
      centroid: { x: sX / points.length, y: sY / points.length },
      areaPx: area,
      lengthPx: len,
      widthPx: area / len,
      lengthMm: len * calibration.mmPerPixel,
      widthMm: (area / len) * calibration.mmPerPixel,
      angle: Math.atan2(h, w) * (180 / Math.PI),
      confidence: 1.0,
      suggestedLabel: 'fibre',
      finalLabel: 'fibre',
      status: 'added',
      source: 'manual'
    };

    addToHistory([...objects, newFibre]);
  };

  const handleDiscardAnalysis = () => {
    setObjects([]);
    setEditMode('view');
    setConfirmAction(null);
  };

  const handleDeleteImage = () => {
    setCapturedImage(null);
    setObjects([]);
    setEditMode('view');
    setCalibrationLine(null);
    setConfirmAction(null);
    if (!stream) startCamera();
  };

  const saveResults = async () => {
    if (!capturedImage || !calibration) return;
    
    if (!auth.currentUser) {
      alert("You must be logged in to save analysis results.");
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const analysis: FibreAnalysis = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        operatorId: user.uid,
        operatorName: user.displayName || 'Unknown',
        cameraId: 'microscope_default',
        calibrationId: calibration.id,
        pixelsPerMm: calibration.pixelsPerMm,
        originalImage: capturedImage,
        stats: {
          totalAuto: objects.filter(o => o.status === 'auto').length,
          totalConfirmed: objects.filter(o => o.status === 'confirmed').length,
          totalDeleted: objects.filter(o => o.status === 'deleted').length,
          totalAdded: objects.filter(o => o.status === 'added').length,
          totalNoise: objects.filter(o => o.status === 'noise').length,
          totalDefects: objects.filter(o => o.status === 'defect').length,
        },
        status: 'completed'
      };

      await FibreDatasetService.saveAnalysis(analysis, objects);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving analysis:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (activeTab === 'dataset') {
    return <DatasetBuilder onBack={() => setActiveTab('analysis')} topIgnorePx={topIgnorePx} />;
  }

  const sidebar = (
    <div className="space-y-6">
      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-hidden"
          >
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Analysis Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ignore Top Area (OSD)</label>
                  <span className="text-[10px] font-mono text-emerald-500">{topIgnorePx}px</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="300" 
                  value={topIgnorePx}
                  onChange={(e) => setTopIgnorePx(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <p className="text-[9px] text-slate-500 leading-relaxed">
                  Adjust this to exclude camera info/OSD from the analysis. The rose-shaded area in the preview will be ignored.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calibration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Calibration</h3>
          {calibration && (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
          )}
        </div>

        {!isCalibrating ? (
          <div className="space-y-4">
            {calibration ? (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Factor:</span>
                  <span className="text-white font-mono">{calibration.pixelsPerMm.toFixed(2)} px/mm</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Resolution:</span>
                  <span className="text-white font-mono">{(calibration.mmPerPixel * 1000).toFixed(2)} um/px</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3">
                <AlertCircle className="text-amber-500 shrink-0" size={18} />
                <p className="text-[10px] text-slate-400 leading-relaxed">System not calibrated. Measurements will be in pixels.</p>
              </div>
            )}
            <button 
              disabled={!capturedImage}
              onClick={() => { setIsCalibrating(true); setEditMode('calibrate'); }}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Ruler size={16} />
              Calibrate Scale
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[10px] text-slate-400">Draw a line over a known object (e.g., a ruler or 1mm fiber).</p>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Real Length (mm)</label>
              <input 
                type="number" 
                value={realLength}
                onChange={(e) => setRealLength(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setIsCalibrating(false); setEditMode('view'); }} className="flex-1 py-2 bg-slate-800 text-slate-400 rounded-xl font-bold text-xs">Cancel</button>
              <button onClick={handleApplyCalibration} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs">Apply</button>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Analysis</h3>
        
        <div className="space-y-4">
          <button 
            disabled={!capturedImage || !calibration || isAnalyzing}
            onClick={runAnalysis}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} />}
            Analyze Fibres
          </button>

          {objects.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Raw Detected</p>
                  <p className="text-2xl font-bold text-white">{objects.filter(o => o.source === 'auto').length}</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Final Count</p>
                  <p className="text-2xl font-bold text-emerald-500">{objects.filter(o => o.status !== 'deleted').length}</p>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Avg Length</p>
                  <p className="text-2xl font-bold text-white">
                    {objects.filter(o => o.status !== 'deleted').length > 0 
                      ? (objects.filter(o => o.status !== 'deleted').reduce((acc, o) => acc + o.lengthMm, 0) / objects.filter(o => o.status !== 'deleted').length).toFixed(2)
                      : '0.00'}
                    <span className="text-xs text-slate-500 ml-1">mm</span>
                  </p>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Manual Edits</p>
                  <p className="text-2xl font-bold text-blue-500">{objects.filter(o => o.source !== 'auto').length}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <button 
                    onClick={saveResults}
                    disabled={isSaving}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2",
                      saveStatus === 'success' ? "bg-emerald-600 text-white" :
                      saveStatus === 'error' ? "bg-rose-600 text-white" :
                      "bg-blue-600 text-white hover:bg-blue-500"
                    )}
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={16} /> : 
                     saveStatus === 'success' ? <CheckCircle2 size={16} /> :
                     saveStatus === 'error' ? <AlertCircle size={16} /> :
                     <Save size={16} />}
                    {saveStatus === 'success' ? 'Saved!' : 
                     saveStatus === 'error' ? 'Error' : 'Save'}
                  </button>
                  
                  {confirmAction === 'discard' ? (
                    <div className="flex-1 flex gap-1">
                      <button 
                        onClick={handleDiscardAnalysis}
                        className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-[10px]"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => setConfirmAction(null)}
                        className="px-2 bg-slate-800 text-slate-400 rounded-xl"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setConfirmAction('discard')}
                      className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold hover:bg-slate-700 transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Discard
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {capturedImage && (
            <div className="space-y-2">
              {confirmAction === 'delete' ? (
                <div className="flex gap-2">
                  <button 
                    onClick={handleDeleteImage}
                    className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm"
                  >
                    Confirm Delete Image
                  </button>
                  <button 
                    onClick={() => setConfirmAction(null)}
                    className="px-4 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setConfirmAction('delete')}
                  className="w-full py-3 border border-rose-500/20 text-rose-500 rounded-xl font-bold hover:bg-rose-500/5 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Camera size={16} />
                  New Capture
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fibre Gallery */}
      {objects.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex justify-between items-center">
            Fibre Gallery
            <span className="text-[10px] text-emerald-500">{objects.filter(o => o.status !== 'deleted').length} items</span>
          </h3>
          <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {objects.filter(o => o.status !== 'deleted').map((obj) => (
              <FibreCrop key={obj.id} imageSrc={capturedImage!} object={obj} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <FibrePageLayout
      title="Smart Fibre QC"
      subtitle="Advanced microscope analysis & dataset builder."
      icon={<Eye className="text-emerald-500" size={24} />}
      helpContent={helpContent}
      sidebar={sidebar}
      actions={
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('dataset')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all text-sm font-bold"
          >
            <Database size={16} />
            Dataset Builder
          </button>
          <button className="p-2 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700"><History size={20} /></button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="aspect-video bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden relative shadow-2xl">
            {!capturedImage ? (
              <div className="w-full h-full relative">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                {/* OSD Ignore Area Indicator */}
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
                      Connect Microscope
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
              <FibreCanvasOverlay 
                imageSrc={capturedImage}
                objects={objects}
                onUpdateObjects={addToHistory}
                mode={editMode}
                selectedIds={selectedIds}
                onSelectObjects={setSelectedIds}
                calibrationLine={calibrationLine}
                onCalibrationLineUpdate={setCalibrationLine}
                onAddFibre={handleAddFibre}
                onSplitFibre={handleSplit}
                showLabels={showLabels}
                showMeasurements={showMeasurements}
                topIgnorePx={topIgnorePx}
              />
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50">
                <RefreshCw className="text-emerald-500 animate-spin" size={48} />
                <p className="text-white font-bold tracking-widest uppercase text-xs animate-pulse">Analyzing Fibres...</p>
              </div>
            )}
          </div>

          {/* View Controls */}
          <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={cn("p-2 rounded-lg transition-all", showSettings ? "bg-emerald-500/10 text-emerald-500" : "text-slate-500 hover:bg-slate-800")}
                title="Analysis Settings"
              >
                <Settings2 size={20} />
              </button>
              <button 
                onClick={() => setShowLabels(!showLabels)}
                className={cn("p-2 rounded-lg transition-all", showLabels ? "bg-emerald-500/10 text-emerald-500" : "text-slate-500 hover:bg-slate-800")}
                title="Toggle Labels"
              >
                {showLabels ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
              <button 
                onClick={() => setShowMeasurements(!showMeasurements)}
                className={cn("p-2 rounded-lg transition-all", showMeasurements ? "bg-emerald-500/10 text-emerald-500" : "text-slate-500 hover:bg-slate-800")}
                title="Toggle Measurements"
              >
                <Ruler size={20} />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setEditMode('view')}
                className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", editMode === 'view' ? "bg-slate-700 text-white" : "text-slate-500 hover:bg-slate-800")}
              >
                Pan/Zoom
              </button>
              <button 
                onClick={() => setEditMode('add')}
                className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2", editMode === 'add' ? "bg-emerald-500 text-white" : "text-slate-500 hover:bg-slate-800")}
              >
                <Plus size={14} />
                Add
              </button>
              <button 
                onClick={() => setEditMode('merge')}
                className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2", editMode === 'merge' ? "bg-blue-500 text-white" : "text-slate-500 hover:bg-slate-800")}
              >
                <Combine size={14} />
                Merge
              </button>
              <button 
                onClick={() => setEditMode('split')}
                className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2", editMode === 'split' ? "bg-amber-500 text-white" : "text-slate-500 hover:bg-slate-800")}
              >
                <Scissors size={14} />
                Split
              </button>
              <button 
                onClick={() => setEditMode('delete')}
                className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2", editMode === 'delete' ? "bg-rose-500 text-white" : "text-slate-500 hover:bg-slate-800")}
              >
                <Trash2 size={14} />
                Remove
              </button>
              
              <div className="w-px h-6 bg-slate-800 mx-2" />
              
              <button 
                onClick={undo}
                disabled={history.length <= 1}
                className="p-2 text-slate-500 hover:bg-slate-800 rounded-lg disabled:opacity-30"
                title="Undo"
              >
                <RefreshCw size={18} className="scale-x-[-1]" />
              </button>

              {editMode === 'merge' && selectedIds.length >= 2 && (
                <button 
                  onClick={handleMerge}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold animate-pulse"
                >
                  Confirm Merge ({selectedIds.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </FibrePageLayout>
    );
  };

export default MicroscopeFibreAnalysis;
