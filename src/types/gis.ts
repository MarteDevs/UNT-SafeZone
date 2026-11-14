export type RiskLevel = 'muy_alto' | 'alto' | 'medio' | 'bajo';

export type HazardType =
  | 'inundacion'
  | 'acumulacion'
  | 'lluvia_intensa'
  | 'infraestructura';

export type TechnicalCategory = 'susceptibilidad' | 'peligro' | 'riesgo';

export type ValidationStatus =
  | 'demostrativo'
  | 'referencial'
  | 'validado_institucional'
  | 'pendiente_validacion';

export type RainScenario = 'normal' | 'intensa' | 'elnino';

export type LayerFilter =
  | 'todos'
  | 'inundacion'
  | 'acumulacion'
  | 'lluvia_intensa'
  | 'zonas_seguras'
  | 'puntos_encuentro'
  | 'rutas_evacuacion';

export type MapViewMode = '2d' | '3d';
export type BaseMapStyle = 'carto' | 'satelital';

export interface LatLngTuple {
  lat: number;
  lng: number;
}

export interface CampusBuilding {
  id: string;
  name: string;
  shortName: string;
  facultyOrUse: string;
  coords: LatLngTuple;
  /** Local metric coordinates (meters from campus center) for the 3D twin */
  local3D: {
    x: number;
    z: number;
    width: number;
    depth: number;
    height: number;
    rotationY?: number;
    kind: 'academic' | 'stadium' | 'library' | 'gate' | 'admin';
  };
  linkedSectorId?: string;
}

export interface CampusSectorFeature {
  id: string;
  name: string;
  sectorCode: string;
  hazardType: HazardType;
  technicalCategory: TechnicalCategory;
  riskLevel: RiskLevel;
  validationStatus: ValidationStatus;
  isDemoData: boolean;
  description: string;
  possibleConsequences: string[];
  recommendations: string[];
  source: string;
  updatedAt: string;
  /** GeoJSON-compatible polygon ring [lat, lng][] */
  polygon: [number, number][];
  center: LatLngTuple;
  /** Base flood depth in meters for 3D simulation scaling */
  baseWaterDepthM: number;
  /** Which simulation scenarios activate or intensify this zone */
  intensityMultiplier: Record<RainScenario, number>;
  nearbyBuildings: string[];
}

export interface SafeZoneFeature {
  id: string;
  name: string;
  type: 'zona_segura' | 'punto_encuentro';
  coords: LatLngTuple;
  local3D: { x: number; z: number };
  validationStatus: ValidationStatus;
  isDemoData: boolean;
  capacityLabel: string;
  accessibility: string;
  isEnabled: boolean;
  elevationNote: string;
  description: string;
  recommendations: string[];
  source: string;
  updatedAt: string;
  validatedRouteId?: string;
}

export interface EvacuationRouteFeature {
  id: string;
  name: string;
  originSectorName: string;
  targetSafeZoneId: string;
  targetSafeZoneName: string;
  /** Routes are ONLY drawn as official evacuation paths when validatedByAuthority === true */
  validatedByAuthority: boolean;
  validationNote: string;
  estimatedMinutes: number;
  distanceMeters: number;
  coordinates: [number, number][];
  source: string;
  updatedAt: string;
}

export interface AlertItem {
  id: string;
  title: string;
  alertType: string;
  severity: 'critica' | 'alta' | 'preventiva';
  affectedZone: string;
  timestamp: string;
  description: string;
  actionRecommendation: string;
  isSimulatedPrototype: boolean;
  source: string;
  activeScenarios: RainScenario[];
}

export interface WeatherForecastDay {
  dayLabel: string;
  dateLabel: string;
  condition: string;
  iconKind: 'cloud-rain' | 'cloud-sun' | 'sun' | 'storm';
  tempMaxC: number;
  tempMinC: number;
  precipProbPct: number;
  rainMm: number;
}

export interface WeatherSnapshot {
  locationName: string;
  updatedAt: string;
  sourceLabel: string;
  isLiveApiConnected: boolean;
  currentTempC: number;
  feelsLikeC: number;
  precipProbabilityPct: number;
  rainIntensityLabel: string;
  rainRateMmH: number;
  humidityPct: number;
  windKmh: number;
  advisoryTitle: string;
  advisorySummary: string;
  forecast: WeatherForecastDay[];
}

export interface ExposureAnalysisResult {
  status: 'inside_risk' | 'near_safe_zone' | 'outside_coverage';
  coords: LatLngTuple;
  accuracyMeters?: number;
  isSimulatedLocation?: boolean;
  matchedSector?: CampusSectorFeature;
  nearestSafeZone?: {
    zone: SafeZoneFeature;
    distanceMeters: number;
  };
  message: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  note: string;
}

export interface OsmBuildingFootprint {
  id: string;
  name?: string;
  buildingType?: string;
  polygon: [number, number][];
}

export interface OsmFootwayPath {
  id: string;
  coordinates: [number, number][];
}

export interface DynamicRouteResult {
  originLabel: string;
  targetSafeZone: SafeZoneFeature;
  coordinates: [number, number][];
  waypoints: string[];
  distanceMeters: number;
  estimatedMinutes: number;
  avoidedRiskSectors: string[];
  isAlgorithmicPrototype: true;
  disclaimer: string;
}

export interface GeoJsonFeatureLike {
  type: 'Feature';
  id?: string | number;
  properties?: Record<string, unknown> | null;
  geometry: {
    type: string;
    coordinates: unknown;
  } | null;
}

export interface GeoJsonFeatureCollectionLike {
  type: 'FeatureCollection';
  name?: string;
  features: GeoJsonFeatureLike[];
}

export interface ImportedGeoJsonLayer {
  id: string;
  fileName: string;
  loadedAt: string;
  featureCount: number;
  visible: boolean;
  collection: GeoJsonFeatureCollectionLike;
}

export type FieldIncidentKind =
  | 'acumulacion'
  | 'sumidero_tapado'
  | 'pasadizo_resbaladizo'
  | 'acceso_bloqueado';

export type ModerationStatus = 'pendiente' | 'verificado' | 'descartado';

export interface FieldIncidentReport {
  id: string;
  kind: FieldIncidentKind;
  title: string;
  description: string;
  coords: LatLngTuple;
  sectorName: string;
  createdAt: string;
  moderationStatus: ModerationStatus;
  reporterRole: string;
}

