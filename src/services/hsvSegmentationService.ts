import { FibreColorProfile } from '../types/fibre';

export interface ColorRange {
  name: string;
  h: [number, number];
  s: [number, number];
  v: [number, number];
}

export const COLOR_RANGES: ColorRange[] = [
  { name: 'red', h: [0, 10], s: [100, 255], v: [100, 255] },
  { name: 'red2', h: [170, 180], s: [100, 255], v: [100, 255] },
  { name: 'orange', h: [11, 25], s: [100, 255], v: [100, 255] },
  { name: 'yellow', h: [26, 35], s: [100, 255], v: [100, 255] },
  { name: 'green', h: [36, 85], s: [100, 255], v: [100, 255] },
  { name: 'cyan', h: [86, 100], s: [100, 255], v: [100, 255] },
  { name: 'blue', h: [101, 130], s: [100, 255], v: [100, 255] },
  { name: 'purple', h: [131, 150], s: [100, 255], v: [100, 255] },
  { name: 'magenta', h: [151, 169], s: [100, 255], v: [100, 255] },
  { name: 'gray', h: [0, 180], s: [0, 50], v: [50, 200] },
  { name: 'light', h: [0, 180], s: [0, 50], v: [201, 255] },
  { name: 'black', h: [0, 180], s: [0, 255], v: [0, 50] },
];

export class HSVSegmentationService {
  static rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [Math.round(h * 180), Math.round(s * 255), Math.round(v * 255)];
  }

  static createMask(
    imageData: ImageData,
    profile: FibreColorProfile
  ): Uint8Array {
    const { width, height, data } = imageData;
    const mask = new Uint8Array(width * height);
    
    const selectedRanges = COLOR_RANGES.filter(r => profile.selectedColors.includes(r.name));
    const excludedRanges = COLOR_RANGES.filter(r => profile.excludeColors.includes(r.name));

    for (let i = 0; i < data.length; i += 4) {
      const hsv = this.rgbToHsv(data[i], data[i + 1], data[i + 2]);
      const [h, s, v] = hsv;
      const idx = i / 4;

      let isSelected = false;
      for (const range of selectedRanges) {
        if (h >= range.h[0] && h <= range.h[1] &&
            s >= range.s[0] && s <= range.s[1] &&
            v >= range.v[0] && v <= range.v[1]) {
          isSelected = true;
          break;
        }
      }

      if (isSelected) {
        let isExcluded = false;
        for (const range of excludedRanges) {
          if (h >= range.h[0] && h <= range.h[1] &&
              s >= range.s[0] && s <= range.s[1] &&
              v >= range.v[0] && v <= range.v[1]) {
            isExcluded = true;
            break;
          }
        }
        if (!isExcluded) {
          mask[idx] = 1;
        }
      }
    }
    return mask;
  }

  static getDominantColor(points: {x: number, y: number}[], imageData: ImageData): {h: number, s: number, v: number, name: string} {
    let sumH = 0, sumS = 0, sumV = 0;
    const { width, data } = imageData;

    points.forEach(p => {
      const idx = (Math.round(p.y) * width + Math.round(p.x)) * 4;
      const hsv = this.rgbToHsv(data[idx], data[idx+1], data[idx+2]);
      sumH += hsv[0];
      sumS += hsv[1];
      sumV += hsv[2];
    });

    const avgH = sumH / points.length;
    const avgS = sumS / points.length;
    const avgV = sumV / points.length;

    let closestColor = 'unknown';
    let minDist = Infinity;

    COLOR_RANGES.forEach(range => {
      const midH = (range.h[0] + range.h[1]) / 2;
      const midS = (range.s[0] + range.s[1]) / 2;
      const midV = (range.v[0] + range.v[1]) / 2;

      const dist = Math.sqrt((avgH - midH)**2 + (avgS - midS)**2 + (avgV - midV)**2);
      if (dist < minDist) {
        minDist = dist;
        closestColor = range.name;
      }
    });

    return { h: avgH, s: avgS, v: avgV, name: closestColor };
  }
}
