import { FibreObject, FibreLabel, Calibration, ValidationStatus, FibreColorProfile } from '../types/fibre';
import { v4 as uuidv4 } from 'uuid';
import { HSVSegmentationService } from './hsvSegmentationService';

export interface DetectionParams {
  thresholdOffset: number; // For adaptive thresholding
  minAreaPx: number;
  maxAreaPx: number;
  autoMergeGapMm: number;
  autoMergeAngleToleranceDeg: number;
  autoMergeWidthTolerance: number;
  autoMergeContinuityScoreMin: number;
  topIgnorePx: number;
  colorProfile?: FibreColorProfile;
}

const DEFAULT_PARAMS: DetectionParams = {
  thresholdOffset: 15,
  minAreaPx: 50,
  maxAreaPx: 50000,
  autoMergeGapMm: 3.0,
  autoMergeAngleToleranceDeg: 20,
  autoMergeWidthTolerance: 0.5, // 50% difference allowed
  autoMergeContinuityScoreMin: 0.7,
  topIgnorePx: 80
};

export class FibreDetectionService {
  /**
   * Performs an improved image processing pipeline to detect fibers.
   * Now supports HSV color-based segmentation if a color profile is provided.
   */
  static async analyzeImage(
    imageSrc: string,
    calibration: Calibration,
    analysisId: string,
    params: Partial<DetectionParams> = {}
  ): Promise<FibreObject[]> {
    const p = { ...DEFAULT_PARAMS, ...params };

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve([]);

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        let binary: Uint8Array;

        if (p.colorProfile && p.colorProfile.selectedColors.length > 0) {
          // 1. HSV Color Segmentation (Colab approach)
          binary = HSVSegmentationService.createMask(imageData, p.colorProfile);
          
          // Apply morphological closing to fill gaps (Colab approach)
          const closeSize = p.colorProfile.morphologyClose || 2;
          for (let i = 0; i < closeSize; i++) {
            this.morphologicalClosing(binary, width, height);
          }
        } else {
          // Fallback to Adaptive Thresholding
          binary = this.adaptiveThreshold(data, width, height, p.thresholdOffset, p.topIgnorePx);
          this.morphologicalOpening(binary, width, height);
          this.morphologicalClosing(binary, width, height);
        }

        // 3. Connected Components (8-connectivity)
        const visited = new Uint8Array(binary.length);
        const rawObjects: FibreObject[] = [];

        for (let y = p.topIgnorePx; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            if (binary[idx] === 1 && !visited[idx]) {
              const component = this.floodFill8(binary, visited, x, y, width, height);
              const minArea = p.colorProfile?.minArea || p.minAreaPx;
              if (component.points.length >= minArea && component.points.length <= p.maxAreaPx) {
                const obj = this.calculateObjectProperties(component, calibration, analysisId, imageData);
                if (obj) rawObjects.push(obj);
              }
            }
          }
        }

        // 4. Improved Auto-merge
        const mergedObjects = this.improvedAutoMerge(rawObjects, calibration, p, imageData);

        // 5. Final Heuristic Classification
        const finalObjects = mergedObjects.map(obj => this.classifyHeuristically(obj));

        resolve(finalObjects);
      };
      img.src = imageSrc;
    });
  }

  /**
   * Adaptive thresholding using an integral image for O(1) local mean calculation.
   */
  private static adaptiveThreshold(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    offset: number,
    topIgnorePx: number
  ): Uint8Array {
    const binary = new Uint8Array(width * height);
    const grayscale = new Uint8Array(width * height);

    // 1. Grayscale conversion
    for (let i = 0; i < data.length; i += 4) {
      grayscale[i / 4] = (data[i] + data[i + 1] + data[i + 2]) / 3;
    }

    // 2. Compute Integral Image
    const integral = new Float64Array(width * height);
    for (let y = 0; y < height; y++) {
      let rowSum = 0;
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        rowSum += grayscale[idx];
        if (y === 0) {
          integral[idx] = rowSum;
        } else {
          integral[idx] = integral[idx - width] + rowSum;
        }
      }
    }

    // 3. Adaptive Thresholding using Integral Image
    const s = Math.floor(width / 16); // Window size
    const t = offset;

    for (let y = topIgnorePx; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const x1 = Math.max(0, x - s);
        const x2 = Math.min(width - 1, x + s);
        const y1 = Math.max(0, y - s);
        const y2 = Math.min(height - 1, y + s);
        
        const count = (x2 - x1) * (y2 - y1);
        const sum = integral[y2 * width + x2] - 
                    integral[y1 * width + x2] - 
                    integral[y2 * width + x1] + 
                    integral[y1 * width + x1];
        
        const idx = y * width + x;
        binary[idx] = (grayscale[idx] * count) > (sum * (100 - t) / 100) ? 1 : 0;
      }
    }

    return binary;
  }

  private static morphologicalOpening(binary: Uint8Array, width: number, height: number) {
    this.erode(binary, width, height);
    this.dilate(binary, width, height);
  }

  private static morphologicalClosing(binary: Uint8Array, width: number, height: number) {
    this.dilate(binary, width, height);
    this.erode(binary, width, height);
  }

  private static erode(binary: Uint8Array, width: number, height: number) {
    const temp = new Uint8Array(binary);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (temp[idx] === 1) {
          if (temp[idx - 1] === 0 || temp[idx + 1] === 0 || 
              temp[idx - width] === 0 || temp[idx + width] === 0) {
            binary[idx] = 0;
          }
        }
      }
    }
  }

  private static dilate(binary: Uint8Array, width: number, height: number) {
    const temp = new Uint8Array(binary);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (temp[idx] === 0) {
          if (temp[idx - 1] === 1 || temp[idx + 1] === 1 || 
              temp[idx - width] === 1 || temp[idx + width] === 1) {
            binary[idx] = 1;
          }
        }
      }
    }
  }

  private static floodFill8(
    binary: Uint8Array,
    visited: Uint8Array,
    startX: number,
    startY: number,
    width: number,
    height: number
  ) {
    const points: { x: number; y: number }[] = [];
    const stack: [number, number][] = [[startX, startY]];
    visited[startY * width + startX] = 1;

    let minX = startX, maxX = startX, minY = startY, maxY = startY;

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      points.push({ x, y });

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      // 8-connectivity
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nidx = ny * width + nx;
            if (binary[nidx] === 1 && !visited[nidx]) {
              visited[nidx] = 1;
              stack.push([nx, ny]);
            }
          }
        }
      }
    }

    return { points, minX, maxX, minY, maxY };
  }

  private static calculateObjectProperties(
    component: any,
    calibration: Calibration,
    analysisId: string,
    imageData: ImageData
  ): FibreObject | null {
    const { points, minX, maxX, minY, maxY } = component;
    const widthPx = maxX - minX + 1;
    const heightPx = maxY - minY + 1;
    const areaPx = points.length;

    // Centroid
    let sumX = 0, sumY = 0;
    points.forEach((p: any) => { sumX += p.x; sumY += p.y; });
    const centroid = { x: sumX / areaPx, y: sumY / areaPx };

    // Perimeter (simple boundary pixel count)
    const pointSet = new Set(points.map((p: any) => `${p.x},${p.y}`));
    let perimeterPx = 0;
    points.forEach((p: any) => {
      let isBoundary = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!pointSet.has(`${p.x + dx},${p.y + dy}`)) {
            isBoundary = true;
            break;
          }
        }
        if (isBoundary) break;
      }
      if (isBoundary) perimeterPx++;
    });

    // Orientation and Elongation (using simple moments)
    let m20 = 0, m02 = 0, m11 = 0;
    points.forEach((p: any) => {
      const dx = p.x - centroid.x;
      const dy = p.y - centroid.y;
      m20 += dx * dx;
      m02 += dy * dy;
      m11 += dx * dy;
    });

    const common = Math.sqrt((m20 - m02) ** 2 + 4 * m11 ** 2);
    const majorAxis = Math.sqrt(2 * (m20 + m02 + common) / areaPx);
    const minorAxis = Math.sqrt(2 * (m20 + m02 - common) / areaPx);
    
    const orientation = 0.5 * Math.atan2(2 * m11, m20 - m02);
    const angle = orientation * (180 / Math.PI);
    const elongation = minorAxis > 0 ? majorAxis / minorAxis : majorAxis;
    const solidity = areaPx / (widthPx * heightPx);

    // Skeletonization for length
    const skeletonLengthPx = this.estimateSkeletonLength(points, minX, minY, widthPx, heightPx);
    
    // Width estimation: Area / SkeletonLength
    const avgWidthPx = skeletonLengthPx > 0 ? areaPx / skeletonLengthPx : Math.sqrt(areaPx);

    const lengthMm = skeletonLengthPx * calibration.mmPerPixel;
    const widthMm = avgWidthPx * calibration.mmPerPixel;

    // Color detection (Colab approach)
    const colorInfo = HSVSegmentationService.getDominantColor(points, imageData);

    return {
      id: uuidv4(),
      analysisId,
      points,
      boundingBox: { x: minX, y: minY, width: widthPx, height: heightPx },
      centroid,
      areaPx,
      lengthPx: skeletonLengthPx,
      widthPx: avgWidthPx,
      lengthMm,
      widthMm,
      angle,
      confidence: 0.8,
      suggestedLabel: 'fibre',
      finalLabel: 'fibre',
      status: 'auto',
      source: 'auto',
      h_mean: colorInfo.h,
      s_mean: colorInfo.s,
      v_mean: colorInfo.v,
      detectedColor: colorInfo.name,
      perimeterPx,
      solidity,
      elongation,
      aspectRatio: widthPx / heightPx,
      orientation,
      skeletonLengthPx
    };
  }

  /**
   * Simple skeleton length estimation.
   * For a full skeletonization, Zhang-Suen is better, but here we use a faster proxy:
   * Max distance between any two points in the component (Euclidean distance).
   * This is a good proxy for length of elongated objects.
   */
  private static estimateSkeletonLength(points: {x: number, y: number}[], minX: number, minY: number, w: number, h: number): number {
    if (points.length < 2) return 0;
    
    // For performance, we don't check all pairs (O(N^2)).
    // We check pairs of points that are far from each other (e.g. near the bounding box corners).
    let maxDistSq = 0;
    const samples = points.length > 500 ? 500 : points.length;
    const step = Math.floor(points.length / samples);
    
    for (let i = 0; i < points.length; i += step) {
      for (let j = i + step; j < points.length; j += step) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const distSq = dx * dx + dy * dy;
        if (distSq > maxDistSq) maxDistSq = distSq;
      }
    }
    
    return Math.sqrt(maxDistSq);
  }

  private static classifyHeuristically(obj: FibreObject): FibreObject {
    let label: FibreLabel = 'fibre';
    let status: ValidationStatus = 'auto';
    let confidence = 0.8;

    const { lengthMm, widthMm, elongation, solidity } = obj;

    // Heuristics
    if (lengthMm < 0.05 || obj.areaPx < 100) {
      label = 'noise';
      status = 'noise';
      confidence = 0.9;
    } else if (solidity > 0.7 && elongation < 1.5) {
      label = 'other'; // Likely a dust particle or defect
      status = 'defect';
      confidence = 0.7;
    } else if (widthMm > 0.15) {
      label = 'wide';
      confidence = 0.6;
    } else if (elongation > 5) {
      label = 'fibre';
      confidence = 0.9;
    }

    return { ...obj, suggestedLabel: label, finalLabel: label, status, confidence };
  }

  private static improvedAutoMerge(
    objects: FibreObject[],
    calibration: Calibration,
    p: DetectionParams,
    imageData: ImageData
  ): FibreObject[] {
    if (objects.length < 2) return objects;

    let currentObjects = [...objects];
    let mergedAny = true;

    while (mergedAny) {
      mergedAny = false;
      const nextObjects: FibreObject[] = [];
      const mergedIndices = new Set<number>();

      for (let i = 0; i < currentObjects.length; i++) {
        if (mergedIndices.has(i)) continue;

        let bestMatchIdx = -1;
        let bestScore = -1;

        for (let j = i + 1; j < currentObjects.length; j++) {
          if (mergedIndices.has(j)) continue;

          const objA = currentObjects[i];
          const objB = currentObjects[j];

          // 1. Distance between centroids (proxy for gap)
          const dx = objA.centroid.x - objB.centroid.x;
          const dy = objA.centroid.y - objB.centroid.y;
          const distMm = Math.sqrt(dx * dx + dy * dy) * calibration.mmPerPixel;

          if (distMm > p.autoMergeGapMm * 2) continue; // Too far

          // 2. Angle similarity
          const angleDiff = Math.abs(objA.angle - objB.angle);
          const normAngleDiff = Math.min(angleDiff, 180 - angleDiff);
          if (normAngleDiff > p.autoMergeAngleToleranceDeg) continue;

          // 3. Width compatibility
          const widthRatio = Math.min(objA.widthMm, objB.widthMm) / Math.max(objA.widthMm, objB.widthMm);
          if (widthRatio < (1 - p.autoMergeWidthTolerance)) continue;

          // 4. Continuity score (alignment of centroids with orientation)
          const vectorAngle = Math.atan2(dy, dx) * (180 / Math.PI);
          const alignA = Math.min(Math.abs(objA.angle - vectorAngle), 180 - Math.abs(objA.angle - vectorAngle));
          const alignB = Math.min(Math.abs(objB.angle - vectorAngle), 180 - Math.abs(objB.angle - vectorAngle));
          
          const continuityScore = (1 - normAngleDiff / p.autoMergeAngleToleranceDeg) * 0.4 +
                                  (1 - (alignA + alignB) / (2 * p.autoMergeAngleToleranceDeg)) * 0.4 +
                                  widthRatio * 0.2;

          if (continuityScore > p.autoMergeContinuityScoreMin) {
            if (continuityScore > bestScore) {
              bestScore = continuityScore;
              bestMatchIdx = j;
            }
          }
        }

        if (bestMatchIdx !== -1) {
          const merged = this.mergeTwoObjects(currentObjects[i], currentObjects[bestMatchIdx], calibration, imageData);
          nextObjects.push(merged);
          mergedIndices.add(i);
          mergedIndices.add(bestMatchIdx);
          mergedAny = true;
        } else {
          nextObjects.push(currentObjects[i]);
        }
      }
      currentObjects = nextObjects;
    }

    return currentObjects;
  }

  private static mergeTwoObjects(a: FibreObject, b: FibreObject, calibration: Calibration, imageData: ImageData): FibreObject {
    const points = [...a.points, ...b.points];
    const minX = Math.min(a.boundingBox.x, b.boundingBox.x);
    const minY = Math.min(a.boundingBox.y, b.boundingBox.y);
    const maxX = Math.max(a.boundingBox.x + a.boundingBox.width, b.boundingBox.x + b.boundingBox.width);
    const maxY = Math.max(a.boundingBox.y + a.boundingBox.height, b.boundingBox.y + b.boundingBox.height);

    const component = {
      points,
      minX,
      maxX,
      minY,
      maxY
    };

    const merged = this.calculateObjectProperties(component, calibration, a.analysisId, imageData);
    return {
      ...merged!,
      id: uuidv4(),
      status: 'merged',
      source: 'merged',
      parentIds: [a.id, b.id]
    };
  }
}
