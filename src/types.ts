export type RawMaterialType = 'Paper Reel' | 'Ink' | 'Other';
export type InkType = 'Visible' | 'Invisible UV' | 'Magnetic' | 'Security' | 'Other';
export type PaperReelStatus = 'Available' | 'Consumed';
export type InkCanStatus = 'Available' | 'In Use' | 'Empty';
export type PrintedReelStatus = 'Available for Cutting' | 'In Cutting' | 'Cut' | 'Archived';
export type FreshCutBagStatus = 'Available for Blowing' | 'In Blowing' | 'Blown' | 'Archived';
export type BlownBagStatus = 'Available for Shaking' | 'In Shaking' | 'Shaken' | 'Boxed' | 'D-Bag' | 'Archived';
export type ShakenBagStatus = 'Available for Boxing' | 'Boxed' | 'D-Bag' | 'In Shaking';
export type BoxStatus = 'Filling' | 'Completed';

export interface RawMaterialCode {
  code: string;
  name: string;
  type: RawMaterialType;
  supplier: string;
  defaultGsm?: number;
  inkColour?: string;
  inkType?: InkType;
  notes?: string;
}

export interface ProductCode {
  code: string;
  name: string;
  description: string;
  numColours: number;
  defaultGsm: number;
  notes?: string;
}

export interface BOM {
  id: string;
  productCode: string;
  requiredGsm: number;
  inks: string[]; // Material codes of inks
  additionalMaterials?: string[];
  notes?: string;
}

export interface PaperReel {
  serialNumber: string;
  weight: number;
  gsm: number;
  receivedDate: number;
  supplier?: string;
  location: string;
  status: PaperReelStatus;
}

export interface InkCan {
  serialNumber: string;
  supplier: string;
  colour: string;
  type: InkType;
  volume: number;
  remainingVolume: number;
  receivedDate: number;
  location: string;
  status: InkCanStatus;
}

export interface PrintedPaperReel {
  serialNumber: string;
  customer: string;
  colour: string;
  productCode?: string;
  sourceReelSerial: string;
  inksUsed: { serial: string; consumption: number }[];
  finalWeight: number;
  productionDate: number;
  status: PrintedReelStatus;
  defects?: string;
  defectsQty?: number;
  cutWaste?: number;
  printWaste?: number;
  usedEntireSourceReel: boolean;
  notes?: string;
}

export interface FreshCutBag {
  id: string;
  parentReelSerial: string;
  customer: string;
  colour: string;
  productCode?: string;
  weight: number;
  cuttingDate: number;
  machineId?: string;
  status: FreshCutBagStatus;
  notes?: string;
}

export interface BlownBag {
  id: string;
  parentBagIds: string[];
  sourceBags: { id: string; weightUsed: number; usedEntirely: boolean }[];
  customer: string;
  colour: string;
  productCode?: string;
  weight: number;
  blowingDate: number;
  startTime: number;
  finishTime: number;
  duration: number;
  blowingPasses?: number;
  machineId?: string;
  status: BlownBagStatus;
  notes?: string;
}

export interface ShakenBag {
  id: string;
  parentBlownBagId: string;
  customer: string;
  colour: string;
  productCode?: string;
  usableWeight: number;
  wasteWeight: number;
  dustWeight?: number;
  cardboardWeight?: number;
  dBagWeight?: number;
  dBagLevel?: number; // 1 to 9
  shakingDate: number;
  startTime: number;
  finishTime: number;
  duration: number;
  machineId?: string;
  status: ShakenBagStatus;
  notes?: string;
}

export interface FinalBox {
  boxNumber: string;
  customer: string;
  colour: string;
  productCode?: string;
  bags: { bagId: string; weightAdded: number; type: 'Shaken' }[];
  totalWeight: number;
  packingDate: number;
  notes?: string;
  status: BoxStatus;
}
