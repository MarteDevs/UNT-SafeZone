import type {
  CampusSectorFeature,
  DynamicRouteResult,
  LatLngTuple,
  RainScenario,
  SafeZoneFeature,
} from '../types/gis';
import { distanceMetersBetween, isPointInPolygon } from './gisAdapters';

interface WalkwayNode {
  id: string;
  label: string;
  coords: LatLngTuple;
  safeZoneId?: string;
}

const WALKWAY_NODES: WalkwayNode[] = [
  { id: 'n-puerta-ppal', label: 'Puerta Principal (Av. Juan Pablo II)', coords: { lat: -8.11352, lng: -79.04072 } },
  { id: 'n-agro', label: 'Pabellón 100 — Cs. Agropecuarias', coords: { lat: -8.11282, lng: -79.03945 } },
  { id: 'n-puerta-naz', label: 'Acceso Av. Jesús de Nazareth', coords: { lat: -8.11258, lng: -79.03745 }, safeZoneId: 'pe-puerta-nazareth' },
  { id: 'n-derecho', label: 'Pabellón 200 — Derecho', coords: { lat: -8.11378, lng: -79.03892 } },
  { id: 'n-economicas', label: 'Pabellón 300 — Cs. Económicas', coords: { lat: -8.11442, lng: -79.03835 } },
  { id: 'n-plazuela', label: 'Plazuela Cívica Central', coords: { lat: -8.11392, lng: -79.03805 }, safeZoneId: 'sz-plazuela-central' },
  { id: 'n-biblioteca', label: 'Explanada Alta — Biblioteca Central', coords: { lat: -8.11428, lng: -79.03968 }, safeZoneId: 'sz-explanada-biblioteca' },
  { id: 'n-farmacia', label: 'Farmacia y Cs. Biológicas', coords: { lat: -8.11358, lng: -79.03725 } },
  { id: 'n-fisica', label: 'Cs. Físicas y Matemáticas', coords: { lat: -8.11486, lng: -79.03655 } },
  { id: 'n-educacion', label: 'Pabellón 400 — Educación', coords: { lat: -8.11505, lng: -79.03762 } },
  { id: 'n-ingenieria', label: 'Complejo de Ingeniería', coords: { lat: -8.11548, lng: -79.03932 } },
  { id: 'n-estadio', label: 'Estadio Universitario UNT', coords: { lat: -8.11625, lng: -79.03815 } },
  // Intermediate pedestrian junctions
  { id: 'n-cruce-oeste', label: 'Paseo Peatonal Oeste', coords: { lat: -8.11455, lng: -79.04005 } },
  { id: 'n-cruce-central', label: 'Eje Central Norte', coords: { lat: -8.11325, lng: -79.03845 } },
  { id: 'n-cruce-sur', label: 'Pasarela Sur', coords: { lat: -8.11512, lng: -79.03885 } },
];

const WALKWAY_EDGES: [string, string][] = [
  ['n-puerta-ppal', 'n-biblioteca'],
  ['n-puerta-ppal', 'n-cruce-oeste'],
  ['n-puerta-ppal', 'n-agro'],
  ['n-agro', 'n-cruce-central'],
  ['n-agro', 'n-puerta-naz'],
  ['n-cruce-central', 'n-puerta-naz'],
  ['n-cruce-central', 'n-derecho'],
  ['n-cruce-central', 'n-plazuela'],
  ['n-cruce-central', 'n-farmacia'],
  ['n-derecho', 'n-biblioteca'],
  ['n-derecho', 'n-economicas'],
  ['n-derecho', 'n-plazuela'],
  ['n-plazuela', 'n-economicas'],
  ['n-plazuela', 'n-farmacia'],
  ['n-farmacia', 'n-puerta-naz'],
  ['n-farmacia', 'n-fisica'],
  ['n-fisica', 'n-educacion'],
  ['n-fisica', 'n-plazuela'],
  ['n-economicas', 'n-educacion'],
  ['n-economicas', 'n-cruce-sur'],
  ['n-biblioteca', 'n-cruce-oeste'],
  ['n-biblioteca', 'n-cruce-sur'],
  ['n-cruce-oeste', 'n-ingenieria'],
  ['n-cruce-sur', 'n-ingenieria'],
  ['n-cruce-sur', 'n-educacion'],
  ['n-ingenieria', 'n-estadio'],
  ['n-educacion', 'n-estadio'],
];

function findSegmentRiskPenalty(
  a: LatLngTuple,
  b: LatLngTuple,
  sectors: CampusSectorFeature[],
  scenario: RainScenario,
): { penaltyMultiplier: number; touchedSectors: string[] } {
  const sampleFractions = [0.25, 0.5, 0.75];
  let worstMultiplier = 1;
  const touched = new Set<string>();

  for (const t of sampleFractions) {
    const samplePt: LatLngTuple = {
      lat: a.lat + (b.lat - a.lat) * t,
      lng: a.lng + (b.lng - a.lng) * t,
    };

    for (const sector of sectors) {
      if (!isPointInPolygon(samplePt, sector.polygon)) continue;

      const waterDepth = sector.baseWaterDepthM * sector.intensityMultiplier[scenario];
      // Higher penalty under intensa / elnino so Dijkstra steers around flooded corridors
      if (scenario === 'elnino' && (sector.riskLevel === 'muy_alto' || waterDepth >= 0.35)) {
        worstMultiplier = Math.max(worstMultiplier, 12);
        touched.add(sector.name);
      } else if (
        scenario === 'intensa' &&
        (sector.riskLevel === 'muy_alto' || sector.riskLevel === 'alto')
      ) {
        worstMultiplier = Math.max(worstMultiplier, 6);
        touched.add(sector.name);
      } else if (sector.riskLevel === 'muy_alto') {
        worstMultiplier = Math.max(worstMultiplier, 3);
        touched.add(sector.name);
      }
    }
  }

  return { penaltyMultiplier: worstMultiplier, touchedSectors: [...touched] };
}

/**
 * Computes shortest/safest pedestrian path using Dijkstra over the UNT campus walkway graph,
 * steering away from flooded/high-risk sectors according to the active rain scenario.
 */
export function computeDynamicSafeRoute(
  originCoords: LatLngTuple,
  originLabel: string,
  sectors: CampusSectorFeature[],
  safeZones: SafeZoneFeature[],
  rainScenario: RainScenario,
): DynamicRouteResult | null {
  const enabledZones = safeZones.filter((z) => z.isEnabled);
  if (enabledZones.length === 0) return null;

  // Snap origin to nearest walkway node
  let startNode = WALKWAY_NODES[0];
  let bestOriginDist = Infinity;
  for (const node of WALKWAY_NODES) {
    const d = distanceMetersBetween(originCoords, node.coords);
    if (d < bestOriginDist) {
      bestOriginDist = d;
      startNode = node;
    }
  }

  // Build adjacency list
  const nodeMap = new Map(WALKWAY_NODES.map((n) => [n.id, n]));
  const adj = new Map<
    string,
    { to: string; cost: number; meters: number; touchedSectors: string[] }[]
  >();
  for (const n of WALKWAY_NODES) adj.set(n.id, []);

  for (const [uId, vId] of WALKWAY_EDGES) {
    const u = nodeMap.get(uId);
    const v = nodeMap.get(vId);
    if (!u || !v) continue;
    const meters = distanceMetersBetween(u.coords, v.coords);
    const riskInfo = findSegmentRiskPenalty(u.coords, v.coords, sectors, rainScenario);
    const cost = meters * riskInfo.penaltyMultiplier;

    adj.get(uId)!.push({ to: vId, cost, meters, touchedSectors: riskInfo.touchedSectors });
    adj.get(vId)!.push({ to: uId, cost, meters, touchedSectors: riskInfo.touchedSectors });
  }

  // Dijkstra
  const dist = new Map<string, number>();
  const realMeters = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const n of WALKWAY_NODES) {
    dist.set(n.id, Infinity);
    realMeters.set(n.id, Infinity);
    prev.set(n.id, null);
  }
  dist.set(startNode.id, 0);
  realMeters.set(startNode.id, 0);

  while (visited.size < WALKWAY_NODES.length) {
    let currId: string | null = null;
    let currBest = Infinity;
    for (const [id, dVal] of dist.entries()) {
      if (!visited.has(id) && dVal < currBest) {
        currBest = dVal;
        currId = id;
      }
    }
    if (!currId || currBest === Infinity) break;
    visited.add(currId);

    for (const edge of adj.get(currId) ?? []) {
      if (visited.has(edge.to)) continue;
      const alt = currBest + edge.cost;
      if (alt < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, alt);
        realMeters.set(edge.to, (realMeters.get(currId) ?? 0) + edge.meters);
        prev.set(edge.to, currId);
      }
    }
  }

  // Pick reachable enabled Safe Zone with lowest weighted cost
  let bestTargetNode: WalkwayNode | null = null;
  let bestZone: SafeZoneFeature | null = null;
  let bestCost = Infinity;

  for (const zone of enabledZones) {
    const targetNode = WALKWAY_NODES.find((n) => n.safeZoneId === zone.id);
    if (!targetNode) continue;
    const c = dist.get(targetNode.id) ?? Infinity;
    if (c < bestCost) {
      bestCost = c;
      bestTargetNode = targetNode;
      bestZone = zone;
    }
  }

  if (!bestTargetNode || !bestZone) return null;

  // Reconstruct node sequence
  const pathNodes: WalkwayNode[] = [];
  let cursor: string | null = bestTargetNode.id;
  while (cursor) {
    const n = nodeMap.get(cursor);
    if (n) pathNodes.unshift(n);
    cursor = prev.get(cursor) ?? null;
  }

  const coordinates: [number, number][] = [];
  if (bestOriginDist > 12) {
    coordinates.push([originCoords.lat, originCoords.lng]);
  }
  for (const n of pathNodes) {
    coordinates.push([n.coords.lat, n.coords.lng]);
  }

  const totalMeters = Math.max(
    15,
    Math.round((realMeters.get(bestTargetNode.id) ?? 0) + (bestOriginDist > 12 ? bestOriginDist : 0)),
  );
  const estimatedMinutes = Math.max(1, Math.ceil(totalMeters / 75)); // ~1.25 m/s walking pace

  // Identify high-risk sectors avoided in the current scenario
  const avoidedRiskSectors = sectors
    .filter((s) => {
      const mult = s.intensityMultiplier[rainScenario];
      return s.baseWaterDepthM * mult >= 0.32 || s.riskLevel === 'muy_alto';
    })
    .map((s) => s.name);

  const waypoints = pathNodes.map((n) => n.label);

  return {
    originLabel,
    targetSafeZone: bestZone,
    coordinates,
    waypoints,
    distanceMeters: totalMeters,
    estimatedMinutes,
    avoidedRiskSectors,
    isAlgorithmicPrototype: true,
    disclaimer:
      'Ruta calculada algorítmicamente sobre el grafo peatonal referencial evitando sectores con mayor anegamiento simulado. Sujeta a validación oficial de Defensa Civil UNT.',
  };
}
