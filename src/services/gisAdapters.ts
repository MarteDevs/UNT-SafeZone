import type {
  CampusSectorFeature,
  ExposureAnalysisResult,
  LatLngTuple,
  RainScenario,
  SafeZoneFeature,
} from '../types/gis';

/**
 * Ray-casting point-in-polygon check for GeoJSON-style [lat, lng] rings.
 */
export function isPointInPolygon(point: LatLngTuple, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect =
      yi > point.lng !== yj > point.lng &&
      point.lat < ((xj - xi) * (point.lng - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Computes approximate geodesic distance in meters using the Haversine formula.
 */
export function distanceMetersBetween(a: LatLngTuple, b: LatLngTuple): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return Math.round(2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

/**
 * Evaluates user coordinates against demo campus risk polygons and safe zones.
 * Explicitly reports insufficient coverage when outside the mapped campus perimeter.
 */
export function evaluateUserExposure(
  coords: LatLngTuple,
  sectors: CampusSectorFeature[],
  safeZones: SafeZoneFeature[],
  _scenario: RainScenario,
  accuracyMeters?: number,
  isSimulatedLocation = false,
): ExposureAnalysisResult {
  const enabledSafeZones = safeZones.filter((z) => z.isEnabled);
  let nearestSafeZone: ExposureAnalysisResult['nearestSafeZone'];

  for (const zone of enabledSafeZones) {
    const dist = distanceMetersBetween(coords, zone.coords);
    if (!nearestSafeZone || dist < nearestSafeZone.distanceMeters) {
      nearestSafeZone = { zone, distanceMeters: dist };
    }
  }

  // Check if within ~600m of Ciudad Universitaria center
  const distanceFromCampus = distanceMetersBetween(coords, {
    lat: -8.114656,
    lng: -79.038595,
  });

  if (distanceFromCampus > 750) {
    return {
      status: 'outside_coverage',
      coords,
      accuracyMeters,
      isSimulatedLocation,
      nearestSafeZone,
      message:
        'Tu ubicación actual se encuentra fuera del perímetro de la Ciudad Universitaria UNT. No existe información cartográfica suficiente en esta ubicación para determinar tu nivel de exposición dentro del campus.',
    };
  }

  const matchedSector = sectors.find((sector) => isPointInPolygon(coords, sector.polygon));

  if (matchedSector) {
    return {
      status: 'inside_risk',
      coords,
      accuracyMeters,
      isSimulatedLocation,
      matchedSector,
      nearestSafeZone,
      message: `Te encuentras dentro de un sector referencial identificado: ${matchedSector.name}. Revisa las recomendaciones preventivas y la zona segura más cercana.`,
    };
  }

  if (nearestSafeZone && nearestSafeZone.distanceMeters <= 45) {
    return {
      status: 'near_safe_zone',
      coords,
      accuracyMeters,
      isSimulatedLocation,
      nearestSafeZone,
      message: `Tu ubicación está próxima al espacio referencial "${nearestSafeZone.zone.name}" (a ${nearestSafeZone.distanceMeters} m). Verifica señalización física en campo.`,
    };
  }

  return {
    status: 'outside_coverage',
    coords,
    accuracyMeters,
    isSimulatedLocation,
    nearestSafeZone,
    message:
      'Estás dentro o muy cerca del campus UNT, pero este punto específico no coincide con un polígono de riesgo mapeado. No hay información suficiente para asignar un nivel de exposición exacto.',
  };
}

/**
 * Exports current campus sectors into standard RFC 7946 GeoJSON FeatureCollection,
 * enabling seamless future interoperability with CENEPRED / institutional GIS layers.
 */
export function exportSectorsAsGeoJSON(sectors: CampusSectorFeature[]) {
  return {
    type: 'FeatureCollection' as const,
    name: 'UNT_SafeZone_Demo_Sectors',
    features: sectors.map((sector) => ({
      type: 'Feature' as const,
      id: sector.id,
      properties: {
        name: sector.name,
        sectorCode: sector.sectorCode,
        hazardType: sector.hazardType,
        technicalCategory: sector.technicalCategory,
        riskLevel: sector.riskLevel,
        validationStatus: sector.validationStatus,
        isDemoData: sector.isDemoData,
        source: sector.source,
        updatedAt: sector.updatedAt,
      },
      geometry: {
        type: 'Polygon' as const,
        // GeoJSON coordinates are [lng, lat]
        coordinates: [
          [
            ...sector.polygon.map(([lat, lng]) => [lng, lat]),
            [sector.polygon[0][1], sector.polygon[0][0]],
          ],
        ],
      },
    })),
  };
}
