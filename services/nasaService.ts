
import { TileCoords } from '../types';
import { ZOOM_LEVEL, LAYER } from '../constants';

/**
 * Converts Lat/Lon to GIBS MatrixSet Tile Coordinates.
 */
export const getTileCoords = (lat: number, lon: number, zoom: number = ZOOM_LEVEL): TileCoords => {
  const tileWidthDeg = 288.0 / Math.pow(2, zoom);
  const col = Math.floor((lon + 180) / tileWidthDeg);
  const row = Math.floor((90 - lat) / tileWidthDeg);
  return { row, col, zoom };
};

/**
 * Calculates pixel (x, y) of a lat/lon within a specific tile.
 * GIBS tiles are typically 512x512.
 */
export const getPixelCoords = (lat: number, lon: number, row: number, col: number, zoom: number, tileSize: number = 512) => {
  const tileWidthDeg = 288.0 / Math.pow(2, zoom);

  const tileLonStart = (col * tileWidthDeg) - 180;
  const tileLatStart = 90 - (row * tileWidthDeg);

  const lonOffset = lon - tileLonStart;
  const latOffset = tileLatStart - lat;

  const x = Math.floor((lonOffset / tileWidthDeg) * tileSize);
  const y = Math.floor((latOffset / tileWidthDeg) * tileSize);

  return { x, y };
};

/**
 * Generates the GIBS tile URL for a specific date and tile.
 */
export const getGibsUrl = (dateStr: string, row: number, col: number, zoom: number = ZOOM_LEVEL): string => {
  return `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/${LAYER}/default/${dateStr}/250m/${zoom}/${row}/${col}.jpg`;
};

/**
 * Generates a list of dates for the "Wrapped" experience.
 * If 2025 is very early, it pulls from the end of 2024 to ensure a good timelapse.
 */
export const generateWrappedDates = (): string[] => {
  const dates: string[] = [];
  const today = new Date();
  
  // 2-day buffer because "Best" imagery usually has a slight delay
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() - 2);

  // Default start: Jan 1, 2025
  let startDate = new Date(2025, 0, 1);
  
  // If we are currently in 2025 but have fewer than 20 days of data, 
  // look back 60 days from today to provide a meaningful timelapse.
  const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 20) {
    startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 60);
  }

  // Iterate every day for a smoother timelapse
  const current = new Date(startDate);
  while (current <= endDate) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};
