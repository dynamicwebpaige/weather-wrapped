
export interface LocationInfo {
  name: string;
  lat: number;
  lon: number;
  address: string;
}

export interface TileCoords {
  row: number;
  col: number;
  zoom: number;
}

export interface WrappedData {
  location: LocationInfo;
  tile: TileCoords;
  dates: string[];
}

export enum AppState {
  IDLE,
  GEOCODING,
  FETCHING_IMAGES,
  VIEWING_WRAPPED
}
