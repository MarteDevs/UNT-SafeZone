import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Box,
  Building2,
  CloudRain,
  Compass,
  Download,
  FileUp,
  Info,
  Layers,
  LocateFixed,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Moon,
  Route,
  Search,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import type {
  BaseMapStyle,
  CampusBuilding,
  CampusSectorFeature,
  DynamicRouteResult,
  EvacuationRouteFeature,
  ExposureAnalysisResult,
  FieldIncidentReport,
  ImportedGeoJsonLayer,
  LatLngTuple,
  LayerFilter,
  MapViewMode,
  OsmBuildingFootprint,
  OsmFootwayPath,
  RainScenario,
  SafeZoneFeature,
} from '../types/gis';
import { CampusMap2D } from './CampusMap2D';
import { Campus3DView } from './Campus3DView';
import { SectorDrawer } from './SectorDrawer';
import { PWAInstallButton } from './PWAInstallButton';
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
  darkMode: boolean;
  onToggleDarkMode: () => void;
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
  osmBuildings: OsmBuildingFootprint[];
  osmFootways: OsmFootwayPath[];
  osmLoading: boolean;
  showOsmGeometry: boolean;
  onToggleOsmGeometry: () => void;
  dynamicRoute: DynamicRouteResult | null;
  onComputeDynamicRoute: (originId: string) => void;
  onClearDynamicRoute: () => void;
  importedGeoJsonLayers: ImportedGeoJsonLayer[];
  onOpenGeoJsonImporter: () => void;
  verifiedReports: FieldIncidentReport[];
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

const QUICK_FACULTIES: { id: string; label: string }[] = [
  { id: 'bld-derecho', label: 'Derecho' },
  { id: 'bld-economicas', label: 'Cs. Económicas' },
  { id: 'bld-educacion', label: 'Educación' },
  { id: 'bld-ingenieria', label: 'Ingeniería' },
  { id: 'bld-biblioteca', label: 'Biblioteca' },
  { id: 'bld-estadio', label: 'Estadio' },
  { id: 'bld-agro', label: 'Agropecuarias' },
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
  darkMode,
  onToggleDarkMode,
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
  osmBuildings,
  osmFootways,
  osmLoading,
  showOsmGeometry,
  onToggleOsmGeometry,
  dynamicRoute,
  onComputeDynamicRoute,
  onClearDynamicRoute,
  importedGeoJsonLayers,
  onOpenGeoJsonImporter,
  verifiedReports,
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
  const [routeOriginId, setRouteOriginId] = useState<string>('bld-educacion');
  const [activeQuickBuildingId, setActiveQuickBuildingId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Escape exits fullscreen visor and restores body scroll
  useEffect(() => {
    if (!isFullscreen) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen]);

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

  const handleQuickFacultyClick = (buildingId: string) => {
    const bld = buildings.find((b) => b.id === buildingId);
    if (!bld) return;
    setActiveQuickBuildingId(buildingId);
    setRouteOriginId(buildingId);
    onFocusSearchTarget(bld.coords, bld.linkedSectorId);
  };

  const activeQuickBuilding = useMemo(
    () => buildings.find((b) => b.id === activeQuickBuildingId) ?? null,
    [buildings, activeQuickBuildingId],
  );

  return (
    <section
      id="mapa"
      className="border-b border-slate-200 bg-[#F8FAFC] py-8 lg:py-10 dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Workspace Header & Controls */}
        <div className="no-print mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-[#0F2942] dark:text-sky-300">
                Visor Geográfico Interactivo
              </span>
              <span aria-hidden="true">·</span>
              <span>Capas demostrativas listas para datos CENEPRED/UNT</span>
            </div>
            <h2 className="mt-0.5 text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">
              Mapa de riesgos y gemelo 3D del campus UNT
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 2D / 3D Switcher */}
            <div
              role="group"
              aria-label="Modo de visualización geográfica"
              className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
            >
              <button
                type="button"
                onClick={() => onChangeViewMode('2d')}
                className={`inline-flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  viewMode === '2d'
                    ? 'bg-[#0F2942] text-white dark:bg-sky-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
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
                    ? 'bg-[#0F2942] text-white dark:bg-sky-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <Box className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Gemelo 3D (Three.js)</span>
              </button>
            </div>

            {/* Institutional Light / Night Emergency Theme Switch */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-pressed={darkMode}
              title="Alternar tema institucional claro o modo nocturno de emergencia"
              className="inline-flex min-h-[42px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {darkMode ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                  <span>Modo claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-[#0F2942]" aria-hidden="true" />
                  <span>Modo nocturno</span>
                </>
              )}
            </button>

            <PWAInstallButton />

            <button
              type="button"
              onClick={() => setIsFullscreen((v) => !v)}
              className="inline-flex min-h-[42px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Pantalla completa</span>
            </button>

            <button
              type="button"
              onClick={onOpenSafeZoneFinder}
              className="inline-flex min-h-[42px] items-center gap-2 whitespace-nowrap rounded-lg bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Encontrar zona segura</span>
            </button>

            <button
              type="button"
              onClick={onOpenGeoJsonImporter}
              className="inline-flex min-h-[42px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FileUp className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
              <span>
                Importar GeoJSON
                {importedGeoJsonLayers.length > 0 ? ` (${importedGeoJsonLayers.length})` : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadGeoJSON}
              title="Exportar capas demostrativas en formato estándar GeoJSON"
              className="inline-flex min-h-[42px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Exportar GeoJSON</span>
            </button>
          </div>
        </div>

        {/* Search + Rain/Flood Simulator Bar */}
        <div className="no-print mb-3 grid gap-3 rounded-xl border border-slate-200 bg-white p-3.5 lg:grid-cols-12 lg:items-center dark:border-slate-800 dark:bg-slate-900">
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
              className="h-11 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] pr-9 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F2942] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:bg-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute top-1/2 right-2.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            {searchResults.length > 0 && (
              <ul
                role="listbox"
                className="absolute right-0 left-0 z-[500] mt-1.5 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900"
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
                      className="flex w-full flex-col rounded-md px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {item.subtitle}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Rain & Flood Intensity Simulator */}
          <div className="flex flex-wrap items-center justify-between gap-2 lg:col-span-7 lg:justify-end">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              <CloudRain className="h-4 w-4 text-[#0F2942] dark:text-sky-400" aria-hidden="true" />
              <span>Simulador de lluvia (Demostrativo):</span>
            </div>
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
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
                          : 'bg-[#0F2942] text-white dark:bg-sky-600'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Faculty Quick-Access Bar ("¿En qué pabellón estás?") */}
        <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F2942] dark:text-sky-300">
              <Compass className="h-3.5 w-3.5" aria-hidden="true" />
              <span>¿En qué pabellón estás?</span>
            </span>
            {QUICK_FACULTIES.map((fac) => {
              const isActive = activeQuickBuildingId === fac.id;
              return (
                <button
                  key={fac.id}
                  type="button"
                  onClick={() => handleQuickFacultyClick(fac.id)}
                  className={`min-h-[34px] whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? 'border-[#0F2942] bg-[#0F2942] text-white dark:border-sky-500 dark:bg-sky-600'
                      : 'border-slate-200 bg-[#F8FAFC] text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {fac.label}
                </button>
              );
            })}
          </div>

          {activeQuickBuilding && (
            <button
              type="button"
              onClick={() => onComputeDynamicRoute(activeQuickBuilding.id)}
              className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
            >
              <Route className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ruta segura desde {activeQuickBuilding.shortName}</span>
            </button>
          )}
        </div>

        {/* Interactive Layer Filter Strip + OSM Footprints Toggle */}
        <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1">
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
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
                    ? 'border-[#0F2942] bg-[#0F2942] text-white dark:border-sky-500 dark:bg-sky-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onToggleOsmGeometry}
            className={`inline-flex min-h-[36px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              showOsmGeometry
                ? 'border-[#0F2942] bg-slate-100 text-[#0F2942] dark:border-sky-500 dark:bg-slate-800 dark:text-sky-300'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {osmLoading
                ? 'Cargando huellas OSM...'
                : osmBuildings.length > 0
                  ? `Huellas reales OSM (${osmBuildings.length})`
                  : 'Huellas reales OSM'}
            </span>
          </button>
        </div>

        {/* Dynamic Safe Route Calculator Bar + Step-by-Step Waypoints */}
        <div className="no-print mb-4 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F2942] dark:text-sky-300">
                <Route className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                <span>Ruta dinámica evitando anegamientos:</span>
              </span>
              <label htmlFor="route-origin-select" className="sr-only">
                Punto de partida en el campus
              </label>
              <select
                id="route-origin-select"
                value={routeOriginId}
                onChange={(e) => setRouteOriginId(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-[#F8FAFC] px-3 text-xs font-medium text-slate-800 focus:border-[#0F2942] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {userLocation && <option value="user-gps">Mi ubicación GPS actual</option>}
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    Desde: {b.shortName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onComputeDynamicRoute(routeOriginId)}
                className="inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800"
              >
                <span>Calcular ruta segura</span>
              </button>
            </div>

            {dynamicRoute && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="text-slate-700 dark:text-slate-200">
                  <strong className="font-mono font-semibold text-teal-800 tabular-nums dark:text-teal-300">
                    {dynamicRoute.distanceMeters} m · ~{dynamicRoute.estimatedMinutes} min
                  </strong>{' '}
                  hasta {dynamicRoute.targetSafeZone.name} (Sugerencia algorítmica)
                </div>
                <button
                  type="button"
                  onClick={onClearDynamicRoute}
                  className="font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Limpiar ruta
                </button>
              </div>
            )}
          </div>

          {dynamicRoute && dynamicRoute.waypoints.length > 0 && (
            <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-[#0F2942] dark:text-sky-300">
                  Recorrido sugerido:
                </span>
                {dynamicRoute.waypoints.map((wp, idx) => (
                  <span key={`${wp}-${idx}`} className="inline-flex items-center gap-1.5">
                    {idx > 0 && (
                      <ArrowRight
                        className="h-3 w-3 text-teal-600 dark:text-teal-400"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={
                        idx === dynamicRoute.waypoints.length - 1
                          ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                          : ''
                      }
                    >
                      {wp}
                    </span>
                  </span>
                ))}
              </div>
              {dynamicRoute.avoidedRiskSectors.length > 0 && (
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Corredores de mayor riesgo evitados en este escenario:{' '}
                  {dynamicRoute.avoidedRiskSectors.join(' · ')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Geolocation Exposure Feedback Banner */}
        {(exposureResult || geoError) && (
          <div
            role="status"
            className={`no-print mb-4 flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${
              geoError
                ? 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200'
                : exposureResult?.status === 'inside_risk'
                  ? 'border-red-200 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200'
                  : exposureResult?.status === 'near_safe_zone'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                    : 'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {exposureResult?.status === 'inside_risk' ? (
                <AlertTriangle
                  className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
                  aria-hidden="true"
                />
              ) : (
                <Info
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#0F2942] dark:text-sky-400"
                  aria-hidden="true"
                />
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
                  className="min-h-[38px] whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  Simular ubicación en campus
                </button>
              )}
              {exposureResult?.matchedSector && (
                <button
                  type="button"
                  onClick={() => onSelectSector(exposureResult.matchedSector!.id)}
                  className="min-h-[38px] whitespace-nowrap rounded-lg bg-[#0F2942] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E3A5F] dark:bg-sky-600 dark:hover:bg-sky-700"
                >
                  Ver recomendaciones
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main GIS/3D Viewport + Lateral Detail Drawer (Supports Fullscreen Visor Mode) */}
        <div
          className={
            isFullscreen
              ? 'fixed inset-0 z-[600] flex flex-col bg-[#F8FAFC] p-3 sm:p-4 dark:bg-slate-950'
              : ''
          }
        >
          {isFullscreen && (
            <div className="no-print mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0F2942] dark:text-sky-300">
                <span>Visor expandido UNT SafeZone</span>
                <span aria-hidden="true">·</span>
                <span className="font-normal text-slate-500 dark:text-slate-400">
                  Pulsa Esc para salir
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChangeViewMode(viewMode === '2d' ? '3d' : '2d')}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {viewMode === '2d' ? 'Cambiar a Gemelo 3D' : 'Cambiar a Mapa 2D'}
                </button>

                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {darkMode ? 'Modo claro' : 'Modo nocturno'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[#0F2942] px-3 py-1 text-xs font-semibold text-white hover:bg-[#1E3A5F] dark:bg-sky-600"
                >
                  <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Salir de pantalla completa</span>
                </button>
              </div>
            </div>
          )}

          <div
            className={`flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:flex-row dark:border-slate-800 dark:bg-slate-900 ${
              isFullscreen ? 'min-h-0 flex-1' : 'lg:h-[640px]'
            }`}
          >
            <div
              className={`no-print relative flex-1 ${
                isFullscreen ? 'min-h-[360px] h-full' : 'h-[500px] sm:h-[560px] lg:h-full'
              }`}
            >
              {viewMode === '2d' ? (
                <CampusMap2D
                  baseStyle={baseStyle}
                  onChangeBaseStyle={onChangeBaseStyle}
                  darkMode={darkMode}
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
                  osmBuildings={osmBuildings}
                  osmFootways={osmFootways}
                  showOsmGeometry={showOsmGeometry}
                  dynamicRoute={dynamicRoute}
                  importedGeoJsonLayers={importedGeoJsonLayers}
                  verifiedReports={verifiedReports}
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
                  darkMode={darkMode}
                  focusTargetCoords={focusTargetCoords}
                  dynamicRouteCoords={dynamicRoute?.coordinates ?? null}
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
                  className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-[#0F2942] px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-[#1E3A5F] disabled:opacity-60 dark:border-slate-700"
                >
                  <LocateFixed className="h-4 w-4 text-sky-300" aria-hidden="true" />
                  <span>{geoLoading ? 'Localizando...' : 'Encontrar mi ubicación'}</span>
                </button>
              </div>

              {/* Geographic Legend */}
              <div className="pointer-events-auto absolute bottom-4 left-3 z-[450] max-w-[260px] rounded-xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
                <button
                  type="button"
                  onClick={() => setLegendExpanded((v) => !v)}
                  className="flex w-full items-center justify-between gap-4 px-3 py-2 text-xs font-bold text-[#0F2942] dark:text-slate-100"
                >
                  <span>Leyenda geográfica</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {legendExpanded ? 'Ocultar' : 'Mostrar'}
                  </span>
                </button>
                {legendExpanded && (
                  <ul className="space-y-1.5 border-t border-slate-100 px-3 py-2.5 text-[11px] text-slate-700 dark:border-slate-800 dark:text-slate-200">
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
                    {dynamicRoute && (
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-3.5 shrink-0 bg-[#0D9488]" />
                        <span>Línea turquesa: Ruta sugerida (Prototipo)</span>
                      </li>
                    )}
                    {importedGeoJsonLayers.some((l) => l.visible) && (
                      <li className="flex items-center gap-2">
                        <span className="h-3 w-3 shrink-0 rounded-sm bg-[#7C3AED]" />
                        <span>Violeta: Capa GeoJSON externa</span>
                      </li>
                    )}
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
        </div>

        {/* Data Governance Disclaimer */}
        <p className="no-print mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Nota metodológica: Los polígonos de inundación, acumulación pluvial y rutas mostradas en
          este visor corresponden a{' '}
          <strong className="font-semibold text-slate-700 dark:text-slate-200">
            datos demostrativos
          </strong>{' '}
          con fines de orientación y prueba funcional sobre la cartografía de referencia de la UNT.
          Las capas oficiales requieren validación técnica de Defensa Civil UNT, CENEPRED e INDECI.
        </p>
      </div>
    </section>
  );
}
