import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { LocateFixed, Minus, Plus, RotateCcw } from 'lucide-react';
import type {
  BaseMapStyle,
  CampusBuilding,
  CampusSectorFeature,
  EvacuationRouteFeature,
  LatLngTuple,
  LayerFilter,
  RainScenario,
  SafeZoneFeature,
} from '../types/gis';
import { UNT_CAMPUS_CENTER } from '../data/untCampusData';

interface CampusMap2DProps {
  baseStyle: BaseMapStyle;
  onChangeBaseStyle: (style: BaseMapStyle) => void;
  buildings: CampusBuilding[];
  sectors: CampusSectorFeature[];
  safeZones: SafeZoneFeature[];
  routes: EvacuationRouteFeature[];
  rainScenario: RainScenario;
  activeFilter: LayerFilter;
  selectedId: string | null;
  userLocation: { coords: LatLngTuple; accuracyMeters?: number } | null;
  focusTargetCoords?: LatLngTuple | null;
  highlightedRouteId?: string | null;
  onSelectSector: (id: string) => void;
  onSelectSafeZone: (id: string) => void;
}

const RISK_COLORS: Record<string, { stroke: string; fill: string }> = {
  muy_alto: { stroke: '#B91C1C', fill: '#DC2626' },
  alto: { stroke: '#C2410C', fill: '#EA580C' },
  medio: { stroke: '#A16207', fill: '#CA8A04' },
  bajo: { stroke: '#15803D', fill: '#16A34A' },
};

function createSvgDivIcon(html: string, size = 32): L.DivIcon {
  return L.divIcon({
    className: 'unt-marker-icon',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function CampusMap2D({
  baseStyle,
  onChangeBaseStyle,
  buildings,
  sectors,
  safeZones,
  routes,
  rainScenario,
  activeFilter,
  selectedId,
  userLocation,
  focusTargetCoords,
  highlightedRouteId,
  onSelectSector,
  onSelectSafeZone,
}: CampusMap2DProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const callbacksRef = useRef({ onSelectSector, onSelectSafeZone });
  callbacksRef.current = { onSelectSector, onSelectSafeZone };

  // Initialize Leaflet map once
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const map = L.map(container, {
      center: [UNT_CAMPUS_CENTER.lat, UNT_CAMPUS_CENTER.lng],
      zoom: 16,
      minZoom: 14,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true,
    });

    const overlays = L.layerGroup().addTo(map);
    const userGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    overlayLayerGroupRef.current = overlays;
    userLayerGroupRef.current = userGroup;

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      overlayLayerGroupRef.current = null;
      userLayerGroupRef.current = null;
    };
  }, []);

  // Switch between OpenStreetMap cartographic & Satellite imagery
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const layer =
      baseStyle === 'satelital'
        ? L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
              maxZoom: 19,
              attribution: 'Imágenes © Esri, Maxar · Referencia UNT SafeZone',
            },
          )
        : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors · UNT SafeZone',
          });

    layer.addTo(map);
    tileLayerRef.current = layer;
  }, [baseStyle]);

  // Render GIS Polygons, Safe Zones, Buildings & Validated Evacuation Routes
  useEffect(() => {
    const group = overlayLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    const showRiskPolygons =
      activeFilter === 'todos' ||
      activeFilter === 'inundacion' ||
      activeFilter === 'acumulacion' ||
      activeFilter === 'lluvia_intensa';

    // 1. Risk Polygons (Demo Data)
    if (showRiskPolygons) {
      for (const sector of sectors) {
        if (activeFilter !== 'todos' && sector.hazardType !== activeFilter) continue;

        const palette = RISK_COLORS[sector.riskLevel] ?? RISK_COLORS.medio;
        const mult = sector.intensityMultiplier[rainScenario];
        const isSelected = selectedId === sector.id;
        const fillOpacity = Math.min(0.62, (isSelected ? 0.42 : 0.24) + mult * 0.16);

        const poly = L.polygon(sector.polygon, {
          color: palette.stroke,
          weight: isSelected ? 3 : 1.75,
          dashArray: sector.isDemoData && !isSelected ? '5 4' : undefined,
          fillColor: palette.fill,
          fillOpacity,
        });

        poly.bindTooltip(
          `<div style="font-weight:600;font-size:12px;">${sector.name}</div><div style="font-size:11px;color:#475569;">Datos demostrativos · Clic para ver detalle</div>`,
          { sticky: true, direction: 'top' },
        );

        poly.on('click', () => {
          callbacksRef.current.onSelectSector(sector.id);
        });

        poly.addTo(group);
      }
    }

    // 2. Validated Evacuation Routes (ONLY rendered if validatedByAuthority === true)
    const showRoutes =
      activeFilter === 'todos' ||
      activeFilter === 'rutas_evacuacion' ||
      Boolean(highlightedRouteId);

    if (showRoutes) {
      for (const route of routes) {
        if (!route.validatedByAuthority) continue;
        const isHighlighted = highlightedRouteId === route.id;

        const polyline = L.polyline(route.coordinates, {
          color: isHighlighted ? '#1D4ED8' : '#2563EB',
          weight: isHighlighted ? 6 : 4,
          opacity: isHighlighted ? 0.98 : 0.85,
          dashArray: '10 6',
        });

        polyline.bindPopup(
          `<div>
            <div style="font-weight:600;color:#0F2942;margin-bottom:4px;">${route.name}</div>
            <div style="font-size:12px;color:#334155;">Distancia aprox.: <strong>${route.distanceMeters} m</strong> · ${route.estimatedMinutes} min</div>
            <div style="font-size:11px;color:#64748B;margin-top:4px;">${route.validationNote}</div>
          </div>`,
        );

        polyline.addTo(group);
      }
    }

    // 3. Campus Reference Buildings
    for (const bld of buildings) {
      const icon = createSvgDivIcon(
        `<div style="display:flex;align-items:center;gap:4px;white-space:nowrap;">
          <span style="width:10px;height:10px;border-radius:3px;background:#0F2942;border:1.5px solid #FFFFFF;display:inline-block;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></span>
          <span style="background:rgba(255,255,255,0.92);color:#0F172A;border:1px solid #CBD5E1;border-radius:4px;padding:1px 5px;font-size:10px;font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,0.08);">${bld.shortName}</span>
        </div>`,
        18,
      );

      const marker = L.marker([bld.coords.lat, bld.coords.lng], { icon });
      marker.on('click', () => {
        if (bld.linkedSectorId) {
          callbacksRef.current.onSelectSector(bld.linkedSectorId);
        }
      });
      marker.bindPopup(
        `<div>
          <div style="font-weight:600;color:#0F2942;">${bld.name}</div>
          <div style="font-size:12px;color:#475569;margin-top:2px;">${bld.facultyOrUse}</div>
        </div>`,
      );
      marker.addTo(group);
    }

    // 4. Safe Zones & Meeting Points
    const showSafeLayer =
      activeFilter === 'todos' ||
      activeFilter === 'zonas_seguras' ||
      activeFilter === 'puntos_encuentro' ||
      activeFilter === 'rutas_evacuacion';

    if (showSafeLayer) {
      for (const zone of safeZones) {
        if (activeFilter === 'zonas_seguras' && zone.type !== 'zona_segura') continue;
        if (activeFilter === 'puntos_encuentro' && zone.type !== 'punto_encuentro') continue;

        const isSafe = zone.type === 'zona_segura';
        const bgColor = !zone.isEnabled ? '#64748B' : isSafe ? '#16A34A' : '#2563EB';
        const ringColor = selectedId === zone.id ? '#0F2942' : '#FFFFFF';
        const symbol = isSafe ? 'S' : 'E';

        const icon = createSvgDivIcon(
          `<div style="width:30px;height:30px;border-radius:999px;background:${bgColor};border:2.5px solid ${ringColor};color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 3px 8px rgba(15,23,42,0.28);">${symbol}</div>`,
          30,
        );

        const marker = L.marker([zone.coords.lat, zone.coords.lng], { icon, zIndexOffset: 300 });
        marker.bindTooltip(
          `<div style="font-weight:600;font-size:12px;">${zone.name}</div><div style="font-size:11px;color:#475569;">${zone.isEnabled ? 'Habilitado (Ref.)' : 'Pendiente de validación'}</div>`,
          { direction: 'top', offset: [0, -12] },
        );
        marker.on('click', () => {
          callbacksRef.current.onSelectSafeZone(zone.id);
        });
        marker.addTo(group);
      }
    }
  }, [
    buildings,
    sectors,
    safeZones,
    routes,
    rainScenario,
    activeFilter,
    selectedId,
    highlightedRouteId,
  ]);

  // Render User Geolocation Marker
  useEffect(() => {
    const userGroup = userLayerGroupRef.current;
    const map = mapRef.current;
    if (!userGroup || !map) return;
    userGroup.clearLayers();

    if (!userLocation) return;

    const { lat, lng } = userLocation.coords;
    if (userLocation.accuracyMeters) {
      L.circle([lat, lng], {
        radius: Math.min(userLocation.accuracyMeters, 90),
        color: '#2563EB',
        weight: 1.5,
        fillColor: '#3B82F6',
        fillOpacity: 0.14,
      }).addTo(userGroup);
    }

    const userIcon = createSvgDivIcon(
      `<div style="width:18px;height:18px;border-radius:999px;background:#2563EB;border:3px solid #FFFFFF;box-shadow:0 0 0 4px rgba(37,99,235,0.25);"></div>`,
      18,
    );
    L.marker([lat, lng], { icon: userIcon, zIndexOffset: 600 })
      .bindTooltip('Tu ubicación aproximada', { direction: 'top' })
      .addTo(userGroup);
  }, [userLocation]);

  // Fly to focused coords
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusTargetCoords) return;
    map.flyTo([focusTargetCoords.lat, focusTargetCoords.lng], 17, { duration: 0.65 });
  }, [focusTargetCoords]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetView = () => {
    mapRef.current?.flyTo([UNT_CAMPUS_CENTER.lat, UNT_CAMPUS_CENTER.lng], 16, { duration: 0.55 });
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Base layer switch: Cartográfico OSM vs Satelital */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-1 rounded-lg border border-slate-200 bg-white/95 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onChangeBaseStyle('carto')}
          className={`min-h-[34px] whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            baseStyle === 'carto'
              ? 'bg-[#0F2942] text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Cartográfico (OSM)
        </button>
        <button
          type="button"
          onClick={() => onChangeBaseStyle('satelital')}
          className={`min-h-[34px] whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            baseStyle === 'satelital'
              ? 'bg-[#0F2942] text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Vista Satelital
        </button>
      </div>

      {/* Custom Zoom & Recenter Controls */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5">
        <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-sm">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Acercar mapa"
            className="flex h-10 w-10 items-center justify-center border-b border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Alejar mapa"
            className="flex h-10 w-10 items-center justify-center border-b border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            aria-label="Centrar en Ciudad Universitaria UNT"
            title="Centrar en campus UNT"
            className="flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {userLocation && (
          <button
            type="button"
            onClick={() =>
              mapRef.current?.flyTo([userLocation.coords.lat, userLocation.coords.lng], 17, {
                duration: 0.5,
              })
            }
            aria-label="Centrar en mi ubicación"
            title="Ir a mi ubicación"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-white/95 text-blue-600 shadow-sm hover:bg-blue-50"
          >
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
