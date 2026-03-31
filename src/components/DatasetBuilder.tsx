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
  Database,
  Minus,
  Plus
} from 'lucide-react';
import { FibreLabel, DatasetSample, Calibration, FibreColorProfile, FibreType, ColourBand } from '../types/fibre';
import { FibreDatasetService } from '../services/fibreDatasetService';
import { FibreDetectionService } from '../services/fibreDetectionService';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../utils/cn';
import { auth } from '../firebase';
import FibrePageLayout from './FibrePageLayout';

interface DatasetBuilderProps {
  onBack: () => void;
  topIgnorePx?: number;
  activeCalibration?: Calibration | null;
  products?: FibreType[];
}

type Tool = 'brush' | 'eraser' | 'pan' | 'length' | 'thickness';

const DatasetBuilder: React.FC<DatasetBuilderProps> = ({ onBack, topIgnorePx = 0, activeCalibration, products = [] }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<FibreLabel>('fibre');
  const [notes, setNotes] = useState('');
  const [operator, setOperator] = useState(auth.currentUser?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error' | 'saving'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [samplesSavedCount, setSamplesSavedCount] = useState(0);
  
  // New Metadata State
  const [selectedFibreTypeId, setSelectedFibreTypeId] = useState<string>('');
  const [fibreName, setFibreName] = useState('');
  const [colorPattern, setColorPattern] = useState('');
  const [nominalLengthMm, setNominalLengthMm] = useState('');
  const [nominalWidthMm, setNominalWidthMm] = useState('');
  const [cutType, setCutType] = useState('');
  const [visualStyle, setVisualStyle] = useState('');
  const [visibility, setVisibility] = useState('');
  const [gsm, setGsm] = useState('');
  
  // New Structured Color Pattern State
  const [numberOfColours, setNumberOfColours] = useState<number>(1);
  const [colourBands, setColourBands] = useState<ColourBand[]>([{ colour: '', lengthMm: 0 }]);
  const [colourBandLengthMm, setColourBandLengthMm] = useState<number>(0);
  
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

  useEffect(() => {
    console.log('DatasetBuilder Version: 1.0.5 - With Band Buttons and 180s Timeout');
  }, []);

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

  const handleFibreTypeSelect = (typeId: string) => {
    setSelectedFibreTypeId(typeId);
    const selectedType = products.find(p => p.id === typeId);
    if (selectedType) {
      setFibreName(selectedType.name);
      setColorPattern(selectedType.colour);
      setVisibility(selectedType.colorVisibility || 'Visible');
      setCutType(selectedType.cutType);
      setNominalLengthMm(selectedType.length.replace(' mm', ''));
      setNominalWidthMm(selectedType.pitch.replace(' mm', ''));
      setGsm(selectedType.gsm.replace(' GSM', ''));
      
      // Pre-fill structured fields if they exist in the type
      if (selectedType.numberOfColours) {
        setNumberOfColours(selectedType.numberOfColours);
      }
      if (selectedType.colourBands && selectedType.colourBands.length > 0) {
        setColourBands(selectedType.colourBands);
      } else {
        // Default to number of colours if bands not defined
        const count = selectedType.numberOfColours || 1;
        setColourBands(Array(count).fill(null).map(() => ({ colour: '', lengthMm: 0 })));
      }
      if (selectedType.colourBandLengthMm) setColourBandLengthMm(selectedType.colourBandLengthMm);
    }
  };

  const handleNumberOfColoursChange = (count: number) => {
    setNumberOfColours(count);
    setColourBands(prev => {
      const newBands = [...prev];
      if (count > prev.length) {
        // Add more bands
        for (let i = prev.length; i < count; i++) {
          newBands.push({ colour: '', lengthMm: 0 });
        }
      } else if (count < prev.length) {
        // Remove bands
        return newBands.slice(0, count);
      }
      return newBands;
    });
  };

  const updateColourBand = (index: number, field: keyof ColourBand, value: string | number) => {
    setColourBands(prev => {
      const newBands = [...prev];
      newBands[index] = { ...newBands[index], [field]: value };
      return newBands;
    });
  };

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

  const runSmartDetection = async () => {
    if (!capturedImage || !activeCalibration) return;
    
    const profile: FibreColorProfile = {
      id: 'default',
      name: 'Standard Fibre',
      selectedColors: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'magenta', 'cyan', 'gray', 'light'],
      combineColors: true,
      excludeColors: ['black'],
      intensityThreshold: 20,
      minArea: 50,
      morphologyClose: 2
    };

    setIsSaving(true);
    try {
      const objects = await FibreDetectionService.analyzeImage(
        capturedImage,
        activeCalibration,
        'dataset-builder-temp',
        { colorProfile: profile }
      );

      const canvas = maskCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#10b981';

      objects.forEach(obj => {
        obj.points.forEach(p => {
          ctx.fillRect(p.x, p.y, 1, 1);
        });
      });

      saveToHistory();
    } catch (err) {
      console.error("Smart Detection Error:", err);
    } finally {
      setIsSaving(false);
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
    setErrorMessage(null);

    try {
      const id = uuidv4();
      const maskCanvas = maskCanvasRef.current;
      const imageCanvas = imageCanvasRef.current;
      
      let maskDataUrl: string = '';
      let previewDataUrl: string = '';

      if (maskCanvas && imageCanvas) {
        maskDataUrl = maskCanvas.toDataURL('image/png');
        
        // Create an annotated preview
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = maskCanvas.width;
        previewCanvas.height = maskCanvas.height;
        const pCtx = previewCanvas.getContext('2d');
        if (pCtx) {
          pCtx.drawImage(imageCanvas, 0, 0);
          pCtx.globalAlpha = 0.5;
          pCtx.drawImage(maskCanvas, 0, 0);
          pCtx.globalAlpha = 1.0;
          
          // Draw lines
          if (lengthLine) {
            pCtx.strokeStyle = '#3b82f6';
            pCtx.lineWidth = 5;
            pCtx.beginPath();
            pCtx.moveTo(lengthLine.start.x, lengthLine.start.y);
            pCtx.lineTo(lengthLine.end.x, lengthLine.end.y);
            pCtx.stroke();
          }
          
          if (thicknessLine) {
            pCtx.strokeStyle = '#f59e0b';
            pCtx.lineWidth = 5;
            pCtx.beginPath();
            pCtx.moveTo(thicknessLine.start.x, thicknessLine.start.y);
            pCtx.lineTo(thicknessLine.end.x, thicknessLine.end.y);
            pCtx.stroke();
          }
        }
        previewDataUrl = previewCanvas.toDataURL('image/jpeg', 0.8);
      } else {
        // Fallback if canvases are not available
        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 1;
        dummyCanvas.height = 1;
        maskDataUrl = dummyCanvas.toDataURL('image/png');
        previewDataUrl = capturedImage || maskDataUrl;
      }

      const lengthPx = lengthLine ? Math.sqrt(Math.pow(lengthLine.end.x - lengthLine.start.x, 2) + Math.pow(lengthLine.end.y - lengthLine.start.y, 2)) : 0;
      const widthPx = thicknessLine ? Math.sqrt(Math.pow(thicknessLine.end.x - thicknessLine.start.x, 2) + Math.pow(thicknessLine.end.y - thicknessLine.start.y, 2)) : 0;
      
      const pixelsPerMm = activeCalibration?.pixelsPerMm || 0;
      const lengthMm = pixelsPerMm > 0 ? lengthPx / pixelsPerMm : 0;
      const widthMm = pixelsPerMm > 0 ? widthPx / pixelsPerMm : 0;

      const sample: DatasetSample = {
        id,
        timestamp: new Date().toISOString(),
        label: selectedLabel,
        originalImageUrl: capturedImage,
        maskImageUrl: maskDataUrl,
        annotatedPreviewUrl: previewDataUrl,
        operator: auth.currentUser?.displayName || 'Unknown',
        notes: `Fibre: ${fibreName}, Pattern: ${numberOfColours} colours, Bands: ${colourBands.map(b => `${b.colour}(${b.lengthMm}mm)`).join(', ')}`,
        sourceType: stream ? 'microscope' : 'upload',
        cameraId: activeCalibration?.cameraId,
        calibrationId: activeCalibration?.id,
        pixelsPerMm,
        lengthAxis: lengthLine ? [lengthLine.start, lengthLine.end] : [],
        thicknessLine: thicknessLine ? [thicknessLine.start, thicknessLine.end] : [],
        lengthPx,
        widthPx,
        lengthMm,
        widthMm,
        realLengthManual: manualRealLength ? parseFloat(manualRealLength) : undefined,
        realThicknessManual: manualRealThickness ? parseFloat(manualRealThickness) : undefined,
        
        // New structured fields
        selectedFibreTypeId,
        fibreName,
        colorPattern,
        primaryColors: colourBands.map(b => b.colour).filter(c => c),
        nominalLengthMm: parseFloat(nominalLengthMm) || undefined,
        nominalWidthMm: parseFloat(nominalWidthMm) || undefined,
        cutType,
        visualStyle,
        visibility,
        gsm,
        numberOfColours,
        colourBands,
        colourBandLengthMm,
      };

      setSaveStatus('saving');
      await FibreDatasetService.saveToDataset(sample);
      
      setSaveStatus('success');
      setSamplesSavedCount(prev => prev + 1);
      
      // Clear status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
      
      // Clear specific fields
      setLengthLine(null);
      setThicknessLine(null);
      setManualRealLength('');
      setManualRealThickness('');
      
    } catch (err: any) {
      console.error('Save Error:', err);
      setSaveStatus('error');
      
      let msg = 'Unknown error';
      if (err instanceof Error) {
        msg = err.message;
        // Try to parse JSON error if it's from handleFirestoreError
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) msg = parsed.error;
        } catch {
          // Not JSON, use as is
        }
      }
      
      setErrorMessage(msg);
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
          {/* Status Indicators */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Samples Saved</span>
                <span className="text-xs font-mono text-emerald-500 font-bold">{samplesSavedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Detection Mode</span>
                <span className="text-xs font-bold text-blue-500">Heuristic</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">AI Model</span>
                <span className="text-xs font-bold text-slate-600 italic">Not yet integrated</span>
              </div>
            </div>
          </div>

          {/* Calibration Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Calibration</h3>
              {activeCalibration ? (
                <div className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 size={12} />
                  <span className="text-[10px] font-bold uppercase">Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-500">
                  <AlertCircle size={12} />
                  <span className="text-[10px] font-bold uppercase">Missing</span>
                </div>
              )}
            </div>
            
            {activeCalibration ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 uppercase font-bold">Scale</span>
                  <span className="text-white font-mono">{activeCalibration.pixelsPerMm.toFixed(2)} px/mm</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 uppercase font-bold">Camera</span>
                  <span className="text-white font-mono truncate max-w-[100px]">{activeCalibration.cameraId}</span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 italic">
                No active calibration found. Measurements will be in pixels only.
              </p>
            )}
          </div>

          {/* Fibre Configuration (Unified Block) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500">Fibre Configuration</h3>
              <Database size={14} className="text-slate-500" />
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Select Registered Fibre</label>
                <select 
                  value={selectedFibreTypeId}
                  onChange={(e) => handleFibreTypeSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-emerald-500/50 outline-none transition-all"
                >
                  <option value="">-- Select Fibre --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} | {p.colour} | {p.length} | {p.pitch} | {p.cutType}
                    </option>
                  ))}
                </select>
              </div>

              {selectedFibreTypeId && (
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase block">Visibility</span>
                      <span className="text-xs text-white font-bold">{visibility}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 uppercase block">GSM</span>
                      <span className="text-xs text-white font-bold">{gsm} GSM</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 min-w-0">
                      <span className="text-[8px] text-slate-500 uppercase block truncate">Length</span>
                      <span className="text-[10px] text-white font-bold truncate">{nominalLengthMm} mm</span>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-[8px] text-slate-500 uppercase block truncate">Pitch</span>
                      <span className="text-[10px] text-white font-bold truncate">{nominalWidthMm} mm</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Number of Colours</label>
                    <span className="text-sm font-bold text-white">{numberOfColours}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    value={numberOfColours || 1}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) handleNumberOfColoursChange(val);
                    }}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="space-y-3">
                  {colourBands.map((band, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-3 p-3 bg-slate-950/30 border border-slate-800/50 rounded-2xl animate-in fade-in slide-in-from-top-1">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Colour {idx + 1}</label>
                        <input 
                          type="text" 
                          value={band.colour}
                          onChange={(e) => updateColourBand(idx, 'colour', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                          placeholder="e.g. Blue"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Band Length (mm)</label>
                        <div className="flex items-center gap-1">
                          <button 
                            type="button"
                            onClick={() => updateColourBand(idx, 'lengthMm', Math.max(0, (band.lengthMm || 0) - 0.5))}
                            className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors shrink-0"
                          >
                            <Minus size={12} />
                          </button>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={band.lengthMm === 0 ? '' : band.lengthMm.toString()}
                            onChange={(e) => {
                              const raw = e.target.value.replace(',', '.');
                              if (raw === '') {
                                updateColourBand(idx, 'lengthMm', 0);
                                return;
                              }
                              const val = parseFloat(raw);
                              if (!isNaN(val)) {
                                updateColourBand(idx, 'lengthMm', val);
                              }
                            }}
                            className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1.5 text-white text-[10px] font-mono text-center"
                            placeholder="0.00"
                          />
                          <button 
                            type="button"
                            onClick={() => updateColourBand(idx, 'lengthMm', (band.lengthMm || 0) + 0.5)}
                            className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors shrink-0"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tools & Measurements (Unified Block) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Tools & Measurements</h3>
              <Ruler size={14} className="text-slate-500" />
            </div>
            <div className="space-y-6">
              {/* Manual Measurements */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Real Length (mm)</label>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button"
                        onClick={() => {
                          const val = parseFloat(manualRealLength) || 0;
                          setManualRealLength(Math.max(0, val - 0.5).toString());
                        }}
                        className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors shrink-0"
                      >
                        <Minus size={12} />
                      </button>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={manualRealLength === '0' ? '' : manualRealLength}
                        onChange={(e) => {
                          const val = e.target.value.replace(',', '.');
                          if (val === '' || !isNaN(parseFloat(val)) || val === '.') {
                            setManualRealLength(val);
                          }
                        }}
                        className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1.5 text-white font-mono text-[10px] text-center"
                        placeholder="0.00"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const val = parseFloat(manualRealLength) || 0;
                          setManualRealLength((val + 0.5).toString());
                        }}
                        className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors shrink-0"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Real Width (mm)</label>
                    <div className="flex items-center gap-1">
                      <button 
                        type="button"
                        onClick={() => {
                          const val = parseFloat(manualRealThickness) || 0;
                          setManualRealThickness(Math.max(0, val - 0.05).toString());
                        }}
                        className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors shrink-0"
                      >
                        <Minus size={12} />
                      </button>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={manualRealThickness === '0' ? '' : manualRealThickness}
                        onChange={(e) => {
                          const val = e.target.value.replace(',', '.');
                          if (val === '' || !isNaN(parseFloat(val)) || val === '.') {
                            setManualRealThickness(val);
                          }
                        }}
                        className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1.5 text-white font-mono text-[10px] text-center"
                        placeholder="0.00"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const val = parseFloat(manualRealThickness) || 0;
                          setManualRealThickness((val + 0.05).toString());
                        }}
                        className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors shrink-0"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
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

              {/* Tool Settings */}
              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Brush Size</label>
                    <span className="text-[10px] font-mono text-white">{brushSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="100" 
                    value={brushSize || 20}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setBrushSize(val);
                    }}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Smart Brush</label>
                  <button 
                    onClick={() => setSmartBrush(!smartBrush)}
                    className={cn(
                      "w-10 h-5 rounded-full transition-all relative",
                      smartBrush ? "bg-emerald-600" : "bg-slate-800"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                      smartBrush ? "left-6" : "left-1"
                    )} />
                  </button>
                </div>
                
                {smartBrush && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Intensity Threshold</label>
                      <span className="text-[10px] font-mono text-white">{intensityThreshold}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="255" 
                      value={intensityThreshold || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) setIntensityThreshold(val);
                      }}
                      className="w-full accent-emerald-500"
                    />
                    <p className="text-[9px] text-slate-500 italic">
                      Brush only paints on pixels brighter than this threshold.
                    </p>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Mask Opacity</label>
                    <span className="text-[10px] font-mono text-white">{Math.round(maskOpacity * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    value={maskOpacity || 0.5}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) setMaskOpacity(val);
                    }}
                    className="w-full accent-emerald-500"
                  />
                </div>
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
            {saveStatus === 'saving' ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                Saving Sample...
              </>
            ) : saveStatus === 'success' ? (
              <>
                <CheckCircle2 size={20} />
                Sample Saved!
              </>
            ) : saveStatus === 'error' ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <AlertCircle size={20} />
                  <span>Error Saving</span>
                </div>
                {errorMessage && (
                  <span className="text-[10px] font-normal opacity-80 max-w-full truncate px-2">
                    {errorMessage}
                  </span>
                )}
              </div>
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
          {isSaving && (
            <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <Database className="absolute inset-0 m-auto text-emerald-500 animate-pulse" size={24} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-white font-bold text-lg">Saving Sample...</p>
                <p className="text-slate-400 text-sm">Uploading high-resolution data to cloud</p>
              </div>
            </div>
          )}
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
                onClick={clearMask}
                className="p-2.5 md:p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                title="Clear Mask"
              >
                <Trash2 size={18} />
              </button>
              <button 
                onClick={runSmartDetection}
                disabled={isSaving || !activeCalibration}
                className="p-2.5 md:p-3 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all disabled:opacity-20"
                title="Smart Detection (Color Based)"
              >
                <RefreshCw className={cn(isSaving && "animate-spin")} size={18} />
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
                value={brushSize || 20}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setBrushSize(val);
                }}
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
                value={maskOpacity || 0.5}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) setMaskOpacity(val);
                }}
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
                  value={intensityThreshold || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setIntensityThreshold(val);
                  }}
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

