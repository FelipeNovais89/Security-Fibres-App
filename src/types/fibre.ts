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

export interface FibreColorProfile {
  id: string;
  name: string;
  selectedColors: string[]; // e.g. ['red', 'blue', 'yellow']
  combineColors: boolean;
  excludeColors: string[];
  intensityThreshold?: number;
  minArea?: number;
  morphologyClose?: number;
}

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
  source: 'auto' | 'manual' | 'merged' | 'split' | 'corrected';
  parentIds?: string[]; // IDs of objects that were merged or split to create this one
  notes?: string;
  
  // Color features
  h_mean?: number;
  s_mean?: number;
  v_mean?: number;
  detectedColor?: string;
  
  // Advanced geometric features
  perimeterPx?: number;
  solidity?: number;
  elongation?: number;
  aspectRatio?: number;
  orientation?: number;
  skeletonLengthPx?: number;
}

export interface FibreAnalysis {
  id: string;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  cameraId: string;
  calibrationId: string;
  pixelsPerMm: number;
  originalImage: string; // URL (Storage)
  annotatedImage?: string; // URL (Storage)
  colorProfileId?: string;
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

export interface ColourBand {
  colour: string;
  lengthMm: number;
}

export interface FibreType {
  id: string;
  name: string;
  colour: string;
  colorVisibility?: 'Visible' | 'Invisible UV' | 'Visible & Invisible' | 'Invisible UV SW' | 'Invisible UV LW';
  length: string;
  pitch: string;
  cutType: string;
  gsm: string;
  
  // New structured fields for color patterns
  numberOfColours?: number;
  colourBands?: ColourBand[];
  colourBandLengthMm?: number;
}

export interface DatasetSample {
  id: string;
  timestamp: string;
  label: FibreLabel;
  originalImageUrl: string; // URL (Storage)
  maskImageUrl: string; // URL (Storage)
  annotatedPreviewUrl?: string; // URL (Storage)
  operator: string;
  notes: string;
  sourceType: 'microscope' | 'upload';
  cameraId?: string;
  calibrationId?: string;
  pixelsPerMm: number;
  lengthAxis: { x: number, y: number }[]; // Points defining the length
  thicknessLine: { x: number, y: number }[]; // Points defining the thickness
  lengthPx: number;
  widthPx: number;
  lengthMm: number;
  widthMm: number;
  realLengthManual?: number;
  realThicknessManual?: number;
  
  // New descriptive fields
  selectedFibreTypeId?: string;
  fibreName?: string;
  colorPattern?: string;
  primaryColors?: string[];
  nominalLengthMm?: number;
  nominalWidthMm?: number;
  cutType?: string;
  visualStyle?: string;
  visibility?: string;
  gsm?: string;
  
  // Structured color pattern fields
  numberOfColours?: number;
  colourBands?: ColourBand[];
  colourBandLengthMm?: number;
}
