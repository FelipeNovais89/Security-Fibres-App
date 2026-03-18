import { FibreObject, FibreLabel, Calibration } from '../types/fibre';
import { v4 as uuidv4 } from 'uuid';

export class FibreDetectionService {
  /**
   * Performs basic image processing to detect fiber-like objects.
   * This uses a thresholding + connected components approach.
   */
  static async analyzeImage(
    imageSrc: string,
    calibration: Calibration,
    analysisId: string,
    topIgnorePx: number = 0
  ): Promise<FibreObject[]> {
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

        // 1. Grayscale + Thresholding (Assuming dark background)
        // We look for bright pixels on dark background
        const binary = new Uint8Array(canvas.width * canvas.height);
        for (let i = 0; i < data.length; i += 4) {
          const pixelIdx = i / 4;
          const y = Math.floor(pixelIdx / canvas.width);
          
          // Ignore top area
          if (y < topIgnorePx) {
            binary[pixelIdx] = 0;
            continue;
          }

          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const avg = (r + g + b) / 3;
          // Simple threshold - in a real app this would be adaptive
          binary[pixelIdx] = avg > 60 ? 1 : 0; 
        }

        // 2. Basic Connected Components (Simplified)
        const visited = new Uint8Array(binary.length);
        const objects: FibreObject[] = [];

        for (let y = topIgnorePx; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = y * canvas.width + x;
            if (binary[idx] === 1 && !visited[idx]) {
              const component = this.floodFill(binary, visited, x, y, canvas.width, canvas.height);
              if (component.points.length > 50) { // Filter noise by area
                const obj = this.calculateObjectProperties(component, calibration, analysisId);
                if (obj) objects.push(obj);
              }
            }
          }
        }

        // 3. Post-processing: Auto-merge fragmented fibres
        const mergedObjects = this.postProcessMerge(objects, calibration);

        resolve(mergedObjects);
      };
      img.src = imageSrc;
    });
  }

  /**
   * Merges objects that are likely parts of the same fibre.
   */
  private static postProcessMerge(objects: FibreObject[], calibration: Calibration): FibreObject[] {
    if (objects.length < 2) return objects;

    const gapThresholdPx = 30 / calibration.mmPerPixel; // ~30mm gap threshold? No, calibration is mmPerPixel.
    // Let's say 2mm gap is acceptable for auto-merge if collinear
    const gapThresholdMm = 2.0; 
    const angleTolerance = 15; // degrees

    let currentObjects = [...objects];
    let mergedAny = true;

    while (mergedAny) {
      mergedAny = false;
      const nextObjects: FibreObject[] = [];
      const mergedIndices = new Set<number>();

      for (let i = 0; i < currentObjects.length; i++) {
        if (mergedIndices.has(i)) continue;

        let bestMatchIdx = -1;
        let bestDist = Infinity;

        for (let j = i + 1; j < currentObjects.length; j++) {
          if (mergedIndices.has(j)) continue;

          const objA = currentObjects[i];
          const objB = currentObjects[j];

          // Check distance between centroids
          const dx = objA.centroid.x - objB.centroid.x;
          const dy = objA.centroid.y - objB.centroid.y;
          const distPx = Math.sqrt(dx * dx + dy * dy);
          const distMm = distPx * calibration.mmPerPixel;

          if (distMm < gapThresholdMm) {
            // Check orientation similarity
            const angleDiff = Math.abs(objA.angle - objB.angle);
            const normalizedAngleDiff = Math.min(angleDiff, 180 - angleDiff);

            // Check if the vector between centroids is also aligned with the fibre angles
            const vectorAngle = Math.atan2(dy, dx) * (180 / Math.PI);
            const alignA = Math.min(Math.abs(objA.angle - vectorAngle), 180 - Math.abs(objA.angle - vectorAngle));
            const alignB = Math.min(Math.abs(objB.angle - vectorAngle), 180 - Math.abs(objB.angle - vectorAngle));

            if (normalizedAngleDiff < angleTolerance && alignA < angleTolerance && alignB < angleTolerance) {
              if (distMm < bestDist) {
                bestDist = distMm;
                bestMatchIdx = j;
              }
            }
          }
        }

        if (bestMatchIdx !== -1) {
          const merged = this.mergeTwoObjects(currentObjects[i], currentObjects[bestMatchIdx], calibration);
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

  private static mergeTwoObjects(a: FibreObject, b: FibreObject, calibration: Calibration): FibreObject {
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

    const merged = this.calculateObjectProperties(component, calibration, a.analysisId);
    return {
      ...merged!,
      id: uuidv4(),
      status: 'auto',
      source: 'merged',
      parentIds: [a.id, b.id]
    };
  }

  private static floodFill(
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

      const neighbors: [number, number][] = [
        [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = ny * width + nx;
          if (binary[nidx] === 1 && !visited[nidx]) {
            visited[nidx] = 1;
            stack.push([nx, ny]);
          }
        }
      }
    }

    return { points, minX, maxX, minY, maxY };
  }

  private static calculateObjectProperties(
    component: any,
    calibration: Calibration,
    analysisId: string
  ): FibreObject | null {
    const { points, minX, maxX, minY, maxY } = component;
    const widthPx = maxX - minX;
    const heightPx = maxY - minY;
    
    // Simple centroid
    let sumX = 0, sumY = 0;
    points.forEach((p: any) => {
      sumX += p.x;
      sumY += p.y;
    });
    const centroid = { x: sumX / points.length, y: sumY / points.length };

    // Heuristic for length: diagonal of bounding box for now (simplified)
    const lengthPx = Math.sqrt(widthPx * widthPx + heightPx * heightPx);
    const areaPx = points.length;
    
    // Average thickness heuristic
    const avgWidthPx = areaPx / lengthPx;

    const lengthMm = lengthPx * calibration.mmPerPixel;
    const widthMm = avgWidthPx * calibration.mmPerPixel;

    // Classification heuristics
    let label: FibreLabel = 'fibre';
    let confidence = 0.8;

    if (lengthMm < 0.1) {
      label = 'noise';
      confidence = 0.6;
    } else if (widthMm > 0.2) {
      label = 'wide';
      confidence = 0.7;
    }

    return {
      id: uuidv4(),
      analysisId,
      points,
      boundingBox: { x: minX, y: minY, width: widthPx, height: heightPx },
      centroid,
      areaPx,
      lengthPx,
      widthPx: avgWidthPx,
      lengthMm,
      widthMm,
      angle: Math.atan2(heightPx, widthPx) * (180 / Math.PI),
      confidence,
      suggestedLabel: label,
      finalLabel: label,
      status: 'auto',
      source: 'auto'
    };
  }
}
