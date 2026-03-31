import React, { useRef, useEffect, useState } from 'react';
import { FibreObject, Calibration } from '../types/fibre';
import { motion } from 'motion/react';
import { ZoomIn, ZoomOut, Maximize, MousePointer2, Plus, Trash2, Scissors, Combine, Info } from 'lucide-react';

interface FibreCanvasOverlayProps {
  imageSrc: string;
  objects: FibreObject[];
  onUpdateObjects: (objects: FibreObject[]) => void;
  mode: 'view' | 'add' | 'delete' | 'split' | 'merge' | 'calibrate';
  selectedIds: string[];
  onSelectObjects: (ids: string[]) => void;
  calibrationLine?: { start: { x: number, y: number }, end: { x: number, y: number } } | null;
  onCalibrationLineUpdate?: (line: { start: { x: number, y: number }, end: { x: number, y: number } } | null) => void;
  onAddFibre?: (points: { x: number, y: number }[]) => void;
  onSplitFibre?: (objectId: string, splitLine: { start: { x: number, y: number }, end: { x: number, y: number } }) => void;
  showLabels?: boolean;
  showMeasurements?: boolean;
  topIgnorePx?: number;
}

const FibreCanvasOverlay: React.FC<FibreCanvasOverlayProps> = ({
  imageSrc,
  objects,
  onUpdateObjects,
  mode,
  selectedIds,
  onSelectObjects,
  calibrationLine,
  onCalibrationLineUpdate,
  onAddFibre,
  onSplitFibre,
  showLabels = true,
  showMeasurements = true,
  topIgnorePx = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tempLine, setTempLine] = useState<{ start: { x: number, y: number }, end: { x: number, y: number } } | null>(null);
  const [tempPoints, setTempPoints] = useState<{ x: number, y: number }[]>([]);

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Objects
      objects.forEach(obj => {
        if (obj.status === 'deleted') return;

        const isHovered = obj.id === hoveredId;
        const isSelected = selectedIds.includes(obj.id);

        // Draw Contour
        ctx.beginPath();
        ctx.lineWidth = 2 / scale;
        ctx.strokeStyle = isSelected ? '#3b82f6' : isHovered ? '#10b981' : '#10b98188';
        
        if (obj.points.length > 0) {
          ctx.moveTo(obj.points[0].x, obj.points[0].y);
          obj.points.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.closePath();
        }
        ctx.stroke();

        if (isSelected || isHovered) {
          ctx.fillStyle = isSelected ? '#3b82f622' : '#10b98122';
          ctx.fill();
        }

        // Labels
        if (showLabels) {
          ctx.font = `${12 / scale}px Inter, sans-serif`;
          ctx.fillStyle = 'white';
          const label = `${obj.suggestedLabel} #${obj.id.slice(0, 4)}`;
          ctx.fillText(label, obj.centroid.x, obj.centroid.y);
          
          if (showMeasurements) {
            const measure = `${obj.lengthMm.toFixed(2)}mm x ${obj.widthMm.toFixed(2)}mm`;
            ctx.fillText(measure, obj.centroid.x, obj.centroid.y + (15 / scale));
          }
        }
      });

      // Draw Calibration Line
      if (mode === 'calibrate' && calibrationLine) {
        ctx.beginPath();
        ctx.lineWidth = 3 / scale;
        ctx.strokeStyle = '#f59e0b';
        ctx.moveTo(calibrationLine.start.x, calibrationLine.start.y);
        ctx.lineTo(calibrationLine.end.x, calibrationLine.end.y);
        ctx.stroke();

        // End points
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(calibrationLine.start.x, calibrationLine.start.y, 5 / scale, 0, Math.PI * 2);
        ctx.arc(calibrationLine.end.x, calibrationLine.end.y, 5 / scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Temp Line (Split/Add)
      if (tempLine) {
        ctx.beginPath();
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([5 / scale, 5 / scale]);
        ctx.strokeStyle = mode === 'split' ? '#f43f5e' : '#10b981';
        ctx.moveTo(tempLine.start.x, tempLine.start.y);
        ctx.lineTo(tempLine.end.x, tempLine.end.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Temp Points (Add)
      if (tempPoints.length > 0) {
        ctx.beginPath();
        ctx.lineWidth = 3 / scale;
        ctx.strokeStyle = '#10b981';
        ctx.moveTo(tempPoints[0].x, tempPoints[0].y);
        tempPoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }
    };

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.style.width = `${img.width}px`;
      canvas.style.height = `${img.height}px`;
      
      // Auto-fit on first load
      if (containerRef.current && scale === 1 && offset.x === 0 && offset.y === 0) {
        const container = containerRef.current;
        const scaleX = (container.clientWidth - 40) / img.width;
        const scaleY = (container.clientHeight - 40) / (img.height - topIgnorePx);
        const newScale = Math.min(scaleX, scaleY, 1);
        setScale(newScale);
        
        // Center it
        const centerX = (container.clientWidth - img.width * newScale) / 2;
        const centerY = (container.clientHeight - (img.height - topIgnorePx) * newScale) / 2;
        setOffset({ x: centerX, y: centerY });
      }
      
      draw();
    };
    img.src = imageSrc;
  }, [imageSrc, objects, scale, hoveredId, selectedIds, mode, calibrationLine, showLabels, showMeasurements, topIgnorePx, tempLine, tempPoints]);

  const getEventCoords = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('changedTouches' in e && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = 0;
        clientY = 0;
      }
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return { clientX, clientY };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const { clientX, clientY } = getEventCoords(e);
    
    const isLeftClick = !('touches' in e) && (e as React.MouseEvent).button === 0;
    const isMiddleClick = !('touches' in e) && (e as React.MouseEvent).button === 1;
    const isTouch = 'touches' in e;

    if (isMiddleClick || (isLeftClick && mode === 'view') || (isTouch && mode === 'view')) {
      setIsDragging(true);
      setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (clientX - rect.left) / (rect.width / canvasRef.current!.width);
    const y = (clientY - rect.top) / (rect.height / canvasRef.current!.height);

    if (mode === 'calibrate' && onCalibrationLineUpdate) {
      onCalibrationLineUpdate({ start: { x, y }, end: { x, y } });
      setIsDragging(true);
    } else if (mode === 'delete') {
      const hit = findObjectAt(x, y);
      if (hit) {
        onUpdateObjects(objects.map(o => o.id === hit.id ? { ...o, status: 'deleted' } : o));
      }
    } else if (mode === 'merge' || mode === 'view') {
      const hit = findObjectAt(x, y);
      if (hit) {
        const isShift = !('touches' in e) && (e as React.MouseEvent).shiftKey;
        if (isShift || mode === 'merge') {
          if (selectedIds.includes(hit.id)) {
            onSelectObjects(selectedIds.filter(id => id !== hit.id));
          } else {
            onSelectObjects([...selectedIds, hit.id]);
          }
        } else {
          onSelectObjects([hit.id]);
        }
      } else {
        onSelectObjects([]);
      }
    } else if (mode === 'split') {
      const hit = findObjectAt(x, y);
      if (hit) {
        setTempLine({ start: { x, y }, end: { x, y } });
        setIsDragging(true);
      }
    } else if (mode === 'add') {
      setTempPoints([{ x, y }]);
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const { clientX, clientY } = getEventCoords(e);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (clientX - rect.left) / (rect.width / canvasRef.current!.width);
    const y = (clientY - rect.top) / (rect.height / canvasRef.current!.height);

    if (isDragging) {
      if (mode === 'calibrate' && calibrationLine && onCalibrationLineUpdate) {
        onCalibrationLineUpdate({ ...calibrationLine, end: { x, y } });
      } else if (mode === 'split') {
        setTempLine(prev => prev ? { ...prev, end: { x, y } } : null);
      } else if (mode === 'add') {
        setTempPoints(prev => [...prev, { x, y }]);
      } else {
        setOffset({ x: clientX - dragStart.x, y: clientY - dragStart.y });
      }
      return;
    }

    const hit = findObjectAt(x, y);
    setHoveredId(hit?.id || null);
  };

  const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode === 'split' && tempLine && onSplitFibre) {
      const hit = findObjectAt(tempLine.start.x, tempLine.start.y);
      if (hit) {
        onSplitFibre(hit.id, tempLine);
      }
      setTempLine(null);
    } else if (mode === 'add' && tempPoints.length > 5 && onAddFibre) {
      onAddFibre(tempPoints);
      setTempPoints([]);
    }
    setIsDragging(false);
  };

  const isPointInPolygon = (x: number, y: number, points: { x: number, y: number }[]) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const findObjectAt = (x: number, y: number) => {
    // First try precise point-in-polygon check
    const preciseHit = objects.find(obj => {
      if (obj.status === 'deleted') return false;
      if (obj.points && obj.points.length > 2) {
        return isPointInPolygon(x, y, obj.points);
      }
      return false;
    });

    if (preciseHit) return preciseHit;

    // Fallback to bounding box with small padding for easier selection of thin lines
    const padding = 5 / scale;
    return objects.find(obj => {
      if (obj.status === 'deleted') return false;
      return x >= obj.boundingBox.x - padding && x <= obj.boundingBox.x + obj.boundingBox.width + padding &&
             y >= obj.boundingBox.y - padding && y <= obj.boundingBox.y + obj.boundingBox.height + padding;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = -e.deltaY;
    const factor = 1.1;
    const newScale = delta > 0 ? scale * factor : scale / factor;
    setScale(Math.min(Math.max(newScale, 0.1), 10));
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 overflow-hidden cursor-crosshair rounded-2xl border border-slate-800"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      onWheel={handleWheel}
    >
      <div 
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
        className="absolute top-0 left-0"
      >
        <div className="relative" style={{ marginTop: -topIgnorePx }}>
          <img 
            src={imageSrc} 
            alt="Fibre" 
            className="block pointer-events-none max-w-none" 
          />
          <canvas 
            ref={canvasRef}
            className="absolute top-0 left-0 pointer-events-none max-w-none"
          />
          {/* OSD Ignore Area Indicator */}
          <div 
            className="absolute top-0 left-0 right-0 bg-rose-500/10 border-b border-rose-500/30 pointer-events-none z-10 flex items-center justify-center" 
            style={{ 
              top: topIgnorePx, 
              height: 20, 
              marginTop: -20,
              width: canvasRef.current?.width || '100%'
            }}
          >
            <span className="text-[8px] font-bold text-rose-500/50 uppercase tracking-widest">OSD Boundary</span>
          </div>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button onClick={() => setScale(s => s * 1.2)} className="p-2 bg-slate-900/80 backdrop-blur text-white rounded-lg border border-slate-700 hover:bg-slate-800"><ZoomIn size={18} /></button>
        <button onClick={() => setScale(s => s / 1.2)} className="p-2 bg-slate-900/80 backdrop-blur text-white rounded-lg border border-slate-700 hover:bg-slate-800"><ZoomOut size={18} /></button>
        <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} className="p-2 bg-slate-900/80 backdrop-blur text-white rounded-lg border border-slate-700 hover:bg-slate-800"><Maximize size={18} /></button>
      </div>

      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-700 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Mode: {mode} • Zoom: {(scale * 100).toFixed(0)}%
      </div>
    </div>
  );
};

export default FibreCanvasOverlay;
