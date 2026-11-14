import type { OsmBuildingFootprint, OsmFootwayPath } from '../types/gis';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const CACHE_KEY = 'unt_safezone_osm_campus_v1';

// Ciudad Universitaria UNT bounding box (south, west, north, east)
const UNT_BBOX = '-8.1182,-79.0422,-8.1112,-79.0348';

interface OverpassElement {
  type: 'way' | 'node' | 'relation';
  id: number;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
}

export interface OsmCampusGeometryResult {
  buildings: OsmBuildingFootprint[];
  footways: OsmFootwayPath[];
  fetchedAt: string;
  fromCache: boolean;
}

export async function fetchUntOsmGeometry(
  signal?: AbortSignal,
): Promise<OsmCampusGeometryResult> {
  try {
    const cachedRaw = sessionStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw) as OsmCampusGeometryResult;
      if (parsed.buildings && parsed.buildings.length > 0) {
        return { ...parsed, fromCache: true };
      }
    }
  } catch {
    // Ignore sessionStorage errors in restricted environments
  }

  const query = `
[out:json][timeout:14];
(
  way["building"](${UNT_BBOX});
  way["highway"~"^(footway|path|pedestrian|steps)$"](${UNT_BBOX});
);
out geom;
  `.trim();

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 14000);
  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass HTTP ${response.status}`);
    }

    const json = (await response.json()) as { elements?: OverpassElement[] };
    const elements = json.elements ?? [];

    const buildings: OsmBuildingFootprint[] = [];
    const footways: OsmFootwayPath[] = [];

    for (const el of elements) {
      if (el.type !== 'way' || !el.geometry || el.geometry.length < 2) continue;

      if (el.tags?.building && el.geometry.length >= 3) {
        buildings.push({
          id: `osm-bld-${el.id}`,
          name: el.tags.name || el.tags['addr:housename'] || undefined,
          buildingType: el.tags.building !== 'yes' ? el.tags.building : undefined,
          polygon: el.geometry.map((pt) => [pt.lat, pt.lon]),
        });
      } else if (el.tags?.highway) {
        footways.push({
          id: `osm-path-${el.id}`,
          coordinates: el.geometry.map((pt) => [pt.lat, pt.lon]),
        });
      }
    }

    const result: OsmCampusGeometryResult = {
      buildings,
      footways,
      fetchedAt: new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      fromCache: false,
    };

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch {
      // Ignore quota errors
    }

    return result;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
