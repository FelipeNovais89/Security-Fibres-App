import { User } from 'firebase/auth';

export type FibreModule = 'home' | 'production' | 'logistics' | 'labels' | 'database' | 'timeclock' | 'fibre-analysis' | 'dataset-builder';

export interface Calibration {
  id: string;
  cameraId: string;
  timestamp: string;
  imageWidth: number;
  imageHeight: number;
  drawnLinePx: number;
  realWorldLength: number;
  unit: 'mm' | 'um';
  pixelsPerMm: number;
  mmPerPixel: number;
  isDefault: boolean;
}

export type FibreLabel = 'fibre' | 'double' | 'chain' | 'pulp' | 'broken' | 'wide' | 'thin' | 'noise' | 'few_fibres' | 'mixed' | 'other';

export type ValidationStatus = 'auto' | 'confirmed' | 'deleted' | 'added' | 'split' | 'merged' | 'noise' | 'defect';

export interface FibreObject {
  id: string;
  analysisId: string;
  points: { x: number; y: number }[]; // Contour points
  boundingBox: { x: number; y: number; width: number; height: number };
  centroid: { x: number; y: number };
  areaPx: number;
  lengthPx: number;
  widthPx: number;
  lengthMm: number;
  widthMm: number;
  angle: number;
  confidence: number;
  suggestedLabel: FibreLabel;
  finalLabel: FibreLabel;
  status: ValidationStatus;
  source: 'auto' | 'manual' | 'merged' | 'split';
  parentIds?: string[]; // IDs of objects that were merged or split to create this one
  notes?: string;
}

export interface FibreAnalysis {
  id: string;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  cameraId: string;
  calibrationId: string;
  pixelsPerMm: number;
  originalImage: string; // Base64 or URL
  annotatedImage?: string;
  stats: {
    totalAuto: number;
    totalConfirmed: number;
    totalDeleted: number;
    totalAdded: number;
    totalNoise: number;
    totalDefects: number;
  };
  status: 'pending' | 'completed' | 'saved_to_dataset';
}

export interface DatasetSample {
  id: string;
  timestamp: string;
  label: FibreLabel;
  image: string; // Original image
  mask?: string; // Binary mask data URL
  lengthLine?: { start: { x: number, y: number }, end: { x: number, y: number } };
  thicknessLine?: { start: { x: number, y: number }, end: { x: number, y: number } };
  metadata: {
    areaPx: number;
    lengthPx: number;
    widthPx: number;
    pixelsPerMm: number;
    lengthMm?: number;
    widthMm?: number;
    manualRealLength?: number;
    manualRealThickness?: number;
    operator?: string;
    notes?: string;
    source?: 'camera' | 'upload';
    cameraId?: string;
    calibrationId?: string;
  };
}
