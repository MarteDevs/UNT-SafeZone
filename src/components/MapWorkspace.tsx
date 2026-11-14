import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Box,
  CloudRain,
  Download,
  Info,
  Layers,
  LocateFixed,
  Map as MapIcon,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import type {
  BaseMapStyle,
  CampusBuilding,
  CampusSectorFeature,
  EvacuationRouteFeature,
  ExposureAnalysisResult,
  LatLngTuple,
  LayerFilter,
  MapViewMode,
  RainScenario,
  SafeZoneFeature,
} from '../types/gis';
import { CampusMap2D } from './CampusMap2D';
import { Campus3DView } from './Campus3DView';
import { SectorDrawer } from './SectorDrawer';
import { exportSectorsAsGeoJSON } from '../services/gisAdapters';

interface MapWorkspaceProps {
  viewMode: MapViewMode;
  onChangeViewMode: (mode: MapViewMode) => void;
  baseStyle: BaseMapStyle;
  onChangeBaseStyle: (style: BaseMapStyle) => void;
  rainScenario: RainScenario;
  onChangeRainScenario: (scenario: RainScenario) => void;
  activeFilter: LayerFilter;
  onChangeFilter: (filter: LayerFilter) => void;
  buildings: CampusBuilding[];
  sectors: CampusSectorFeature[];
  safeZones: SafeZoneFeature[];
  routes: EvacuationRouteFeature[];
  selectedSectorId: string | null;
  selectedSafeZoneId: string | null;
  highlightedRouteId: string | null;
  focusTargetCoords: LatLngTuple | null;
  userLocation: { coords: LatLngTuple; accuracyMeters?: number } | null;
  exposureResult: ExposureAnalysisResult | null;
  geoError: string | null;
  geoLoading: boolean;
  onSelectSector: (id: string) => void;
  onSelectSafeZone: (id: string) => void;
  onClearSelection: () => void;
  onHighlightRoute: (routeId: string | null) => void;
  onFocusSearchTarget: (coords: LatLngTuple, sectorId?: string) => void;
  onRequestGeolocation: () => void;
  onSimulateCampusLocation: () => void;
  onOpenSafeZoneFinder: () => void;
}

const FILTER_OPTIONS: { id: LayerFilter; label: string }[] = [
  { id: 'todos', label: 'Todos los riesgos' },
  { id: 'inundacion', label: 'Inundaciones' },
  { id: 'acumulacion', label: 'Acumulación de agua' },
  { id: 'lluvia_intensa', label: 'Lluvias intensas' },
  { id: 'zonas_seguras', label: 'Zonas seguras' },
  { id: 'puntos_encuentro', label: 'Puntos de encuentro' },
  { id: 'rutas_evacuacion', label: 'Rutas de evacuación' },
];

const SCENARIO_OPTIONS: { id: RainScenario; label: string; summary: string }[] = [
  { id: 'normal', label: 'Condición normal', summary: 'Sin acumulación relevante' },
  { id: 'intensa', label: 'Lluvia intensa (Sim.)', summary: 'Escorrentía moderada' },
  { id: 'elnino', label: 'El Niño (Sim.)', summary: 'Estrés hídrico alto' },
];

export function MapWorkspace({
  viewMode,
  onChangeViewMode,
  baseStyle,
  onChangeBaseStyle,
  rainScenario,
  onChangeRainScenario,
  activeFilter,
  onChangeFilter,
  buildings,
  sectors,
  safeZones,
  routes,
  selectedSectorId,
  selectedSafeZoneId,
  highlightedRouteId,
  focusTargetCoords,
  userLocation,
  exposureResult,
  geoError,
  geoLoading,
  onSelectSector,
  onSelectSafeZone,
  onClearSelection,
  onHighlightRoute,
  onFocusSearchTarget,
  onRequestGeolocation,
  onSimulateCampusLocation,
  onOpenSafeZoneFinder,
}: MapWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [legendExpanded, setLegendExpanded] = useState(true);

  const selectedSector = useMemo(
    () => sectors.find((s) => s.id === selectedSectorId) ?? null,
    [sectors, selectedSectorId],
  );
  const selectedSafeZone = useMemo(
    () => safeZones.find((z) => z.id === selectedSafeZoneId) ?? null,
    [safeZones, selectedSafeZoneId],
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const matchedBuildings = buildings
      .filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.shortName.toLowerCase().includes(q) ||
          b.facultyOrUse.toLowerCase().includes(q),
      )
      .map((b) => ({
        id: b.id,
        title: b.name,
        subtitle: b.facultyOrUse,
        coords: b.coords,
        kind: 'building' as const,
        linkedSectorId: b.linkedSectorId,
      }));

    const matchedSectors = sectors
      .filter((s) => s.name.toLowerCase().includes(q) || s.sectorCode.toLowerCase().includes(q))
      .map((s) => ({
        id: s.id,
        title: s.name,
        subtitle: `Sector de riesgo demostrativo · ${s.sectorCode}`,
        coords: s.center,
        kind: 'sector' as const,
        linkedSectorId: s.id,
      }));

    const matchedZones = safeZones
      .filter((z) => z.name.toLowerCase().includes(q))
      .map((z) => ({
        id: z.id,
        title: z.name,
        subtitle: z.type === 'zona_segura' ? 'Zona segura referencial' : 'Punto de encuentro',
        coords: z.coords,
        kind: 'safeZone' as const,
      }));

    return [...matchedBuildings, ...matchedSectors, ...matchedZones].slice(0, 7);
  }, [searchQuery, buildings, sectors, safeZones]);

  const handleDownloadGeoJSON = () => {
    const geojson = exportSectorsAsGeoJSON(sectors);
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/geo+json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unt-safezone-sectores-demostrativos.geojson';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="mapa" className="border-b border-slate-200 bg-[#F8FAFC] py-8 lg:py-10">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Workspace Header & Controls */}
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-[#0F2942]">Visor Geográfico Interactivo</span>
              <span aria-hidden="true">·</span>
              <span>Capas demostrativas listas para datos CENEPRED/UNT</span>
            </div>
            <h2 className="mt-0.5 text-2xl font-bold tracking-tight text-[#0F172A]">
              Mapa de riesgos y gemelo 3D del campus UNT
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 2D / 3D Switcher */}
            <div
              role="group"
              aria-label="Modo de visualización geográfica"
              className="inline-flex rounded-lg border border-slate-200 bg-white p-1"
            >
              <button
                type="button"
                onClick={() => onChangeViewMode('2d')}
                className={`inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  viewMode === '2d'
                    ? 'bg-[#0F2942] text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Mapa 2D (OSM)</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode('3d')}
                className={`inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  viewMode === '3d'
                    ? 'bg-[#0F2942] text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Box className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Gemelo 3D (Three.js)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenSafeZoneFinder}
              className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-lg bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Encontrar zona segura</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadGeoJSON}
              title="Exportar capas demostrativas en formato estándar GeoJSON"
              className="inline-flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>GeoJSON</span>
            </button>
          </div>
        </div>

        {/* Search + Rain/Flood Simulator Bar */}
        <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-3.5 lg:grid-cols-12 lg:items-center">
          {/* Search Faculties / Buildings / Sectors */}
          <div className="relative lg:col-span-5">
            <label htmlFor="campus-search" className="sr-only">
              Buscar facultades, edificios y sectores
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="campus-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar facultad, pabellón, biblioteca, estadio o sector..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] pr-9 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F2942] focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute top-1/2 right-2.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            {searchResults.length > 0 && (
              <ul
                role="listbox"
                className="absolute right-0 left-0 z-[500] mt-1.5 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg"
              >
                {searchResults.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.kind === 'safeZone') {
                          onSelectSafeZone(item.id);
                          onFocusSearchTarget(item.coords);
                        } else if (item.kind === 'sector') {
                          onSelectSector(item.id);
                          onFocusSearchTarget(item.coords, item.id);
                        } else {
                          onFocusSearchTarget(item.coords, item.linkedSectorId);
                        }
                        setSearchQuery('');
                      }}
                      className="flex w-full flex-col rounded-md px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                      <span className="text-xs text-slate-500">{item.subtitle}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Rain & Flood Intensity Simulator */}
          <div className="flex flex-wrap items-center justify-between gap-2 lg:col-span-7 lg:justify-end">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <CloudRain className="h-4 w-4 text-[#0F2942]" aria-hidden="true" />
              <span>Simulador de lluvia (Demostrativo):</span>
            </div>
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
              {SCENARIO_OPTIONS.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => onChangeRainScenario(sc.id)}
                  title={sc.summary}
                  className={`min-h-[36px] whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    rainScenario === sc.id
                      ? sc.id === 'elnino'
                        ? 'bg-[#DC2626] text-white'
                        : sc.id === 'intensa'
                          ? 'bg-[#EA580C] text-white'
                          : 'bg-[#0F2942] text-white'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Layer Filter Strip */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Capas:</span>
          </span>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeFilter(opt.id)}
              className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === opt.id
                  ? 'border-[#0F2942] bg-[#0F2942] text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Geolocation Exposure Feedback Banner */}
        {(exposureResult || geoError) && (
          <div
            role="status"
            className={`mb-4 flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${
              geoError
                ? 'border-amber-200 bg-amber-50 text-amber-950'
                : exposureResult?.status === 'inside_risk'
                  ? 'border-red-200 bg-red-50 text-red-950'
                  : exposureResult?.status === 'near_safe_zone'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                    : 'border-slate-200 bg-white text-slate-800'
            }`}
          >
            <div className="flex items-start gap-3">
              {exposureResult?.status === 'inside_risk' ? (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
              ) : (
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0F2942]" aria-hidden="true" />
              )}
              <div className="text-sm">
                {geoError ? (
                  <p className="font-medium">{geoError}</p>
                ) : (
                  <>
                    <p className="font-semibold">
                      {exposureResult?.isSimulatedLocation
                        ? 'Ubicación simulada dentro del campus UNT'
                        : 'Resultado de geolocalización'}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed opacity-90">
                      {exposureResult?.message}
                    </p>
                    {exposureResult?.matchedSector && (
                      <p className="mt-1 text-xs font-semibold">
                        Recomendación inmediata: {exposureResult.matchedSector.recommendations[0]}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {exposureResult?.status === 'outside_coverage' && (
                <button
                  type="button"
                  onClick={onSimulateCampusLocation}
                  className="min-h-[38px] whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Simular ubicación en campus
                </button>
              )}
              {exposureResult?.matchedSector && (
                <button
                  type="button"
                  onClick={() => onSelectSector(exposureResult.matchedSector!.id)}
                  className="min-h-[38px] whitespace-nowrap rounded-lg bg-[#0F2942] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E3A5F]"
                >
                  Ver recomendaciones
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main GIS/3D Viewport + Lateral Detail Drawer */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:h-[640px] lg:flex-row">
          <div className="relative h-[500px] flex-1 sm:h-[560px] lg:h-full">
            {viewMode === '2d' ? (
              <CampusMap2D
                baseStyle={baseStyle}
                onChangeBaseStyle={onChangeBaseStyle}
                buildings={buildings}
                sectors={sectors}
                safeZones={safeZones}
                routes={routes}
                rainScenario={rainScenario}
                activeFilter={activeFilter}
                selectedId={selectedSectorId ?? selectedSafeZoneId}
                userLocation={userLocation}
                focusTargetCoords={focusTargetCoords}
                highlightedRouteId={highlightedRouteId}
                onSelectSector={onSelectSector}
                onSelectSafeZone={onSelectSafeZone}
              />
            ) : (
              <Campus3DView
                buildings={buildings}
                sectors={sectors}
                safeZones={safeZones}
                routes={routes}
                rainScenario={rainScenario}
                activeFilter={activeFilter}
                selectedId={selectedSectorId ?? selectedSafeZoneId}
                focusTargetCoords={focusTargetCoords}
                onSelectSector={onSelectSector}
                onSelectSafeZone={onSelectSafeZone}
              />
            )}

            {/* Floating Geolocation Action ("¿Dónde estoy?") */}
            <div className="pointer-events-auto absolute right-3 bottom-4 z-[450] flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={onRequestGeolocation}
                disabled={geoLoading}
                className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-[#0F2942] px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-[#1E3A5F] disabled:opacity-60"
              >
                <LocateFixed className="h-4 w-4 text-sky-300" aria-hidden="true" />
                <span>{geoLoading ? 'Localizando...' : 'Encontrar mi ubicación'}</span>
              </button>
            </div>

            {/* Geographic Legend */}
            <div className="pointer-events-auto absolute bottom-4 left-3 z-[450] max-w-[260px] rounded-xl border border-slate-200 bg-white/95 shadow-sm">
              <button
                type="button"
                onClick={() => setLegendExpanded((v) => !v)}
                className="flex w-full items-center justify-between gap-4 px-3 py-2 text-xs font-bold text-[#0F2942]"
              >
                <span>Leyenda geográfica</span>
                <span className="text-[11px] font-medium text-slate-500">
                  {legendExpanded ? 'Ocultar' : 'Mostrar'}
                </span>
              </button>
              {legendExpanded && (
                <ul className="space-y-1.5 border-t border-slate-100 px-3 py-2.5 text-[11px] text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm bg-[#DC2626]" />
                    <span>Rojo: Riesgo muy alto (Demo)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm bg-[#EA580C]" />
                    <span>Naranja: Riesgo alto (Demo)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm bg-[#CA8A04]" />
                    <span>Amarillo: Riesgo medio (Demo)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full bg-[#16A34A]" />
                    <span>Verde: Zona segura validada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full bg-[#2563EB]" />
                    <span>Azul: Punto de encuentro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-3.5 shrink-0 bg-[#2563EB]" />
                    <span>Línea azul: Ruta de evacuación validada</span>
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* Lateral Sector / Safe Zone Detail Drawer */}
          <SectorDrawer
            selectedSector={selectedSector}
            selectedSafeZone={selectedSafeZone}
            routes={routes}
            rainScenario={rainScenario}
            onClose={onClearSelection}
            onHighlightRoute={onHighlightRoute}
          />
        </div>

        {/* Data Governance Disclaimer */}
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Nota metodológica: Los polígonos de inundación, acumulación pluvial y rutas mostradas en
          este visor corresponden a <strong className="font-semibold text-slate-700">datos demostrativos</strong>{' '}
          con fines de orientación y prueba funcional sobre la cartografía de referencia de la UNT.
          Las capas oficiales requieren validación técnica de Defensa Civil UNT, CENEPRED e INDECI.
        </p>
      </div>
    </section>
  );
}
