export interface DisruptionSource {
  title: string;
  url: string;
}

export interface Disruption {
  id: string;
  title: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  type: 'Conflict' | 'Weather' | 'Strike' | 'Accident' | 'Regulatory' | 'Other';
  locationName: string;
  coordinates: [number, number]; // [longitude, latitude] for D3
  date: string;
  sources?: DisruptionSource[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AppState {
  disruptions: Disruption[];
  selectedDisruptionId: string | null;
  loading: boolean;
  lastUpdated: Date | null;
  sources: GroundingSource[];
  error: string | null;
}

export interface GeoJSONFeature {
  type: "Feature";
  properties: {
    name: string;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: any[];
  };
}

export interface WorldGeoJSON {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}