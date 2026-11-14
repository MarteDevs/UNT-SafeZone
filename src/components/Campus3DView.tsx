import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Compass, Eye, Shield, Tag } from 'lucide-react';
import type {
  CampusBuilding,
  CampusSectorFeature,
  EvacuationRouteFeature,
  LayerFilter,
  RainScenario,
  SafeZoneFeature,
} from '../types/gis';
import {
  createCampus3DScene,
  latLngToLocal3D,
  type CameraPresetKey,
  type Campus3DHandle,
} from '../three/campusScene';

interface Campus3DViewProps {
  buildings: CampusBuilding[];
  sectors: CampusSectorFeature[];
  safeZones: SafeZoneFeature[];
  routes: EvacuationRouteFeature[];
  rainScenario: RainScenario;
  activeFilter: LayerFilter;
  selectedId: string | null;
  darkMode: boolean;
  focusTargetCoords?: { lat: number; lng: number } | null;
  dynamicRouteCoords?: [number, number][] | null;
  onSelectSector: (id: string) => void;
  onSelectSafeZone: (id: string) => void;
}

export function Campus3DView({
  buildings,
  sectors,
  safeZones,
  routes,
  rainScenario,
  activeFilter,
  selectedId,
  darkMode,
  focusTargetCoords,
  dynamicRouteCoords,
  onSelectSector,
  onSelectSafeZone,
}: Campus3DViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<Campus3DHandle | null>(null);
  const labelElsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const callbacksRef = useRef({ onSelectSector, onSelectSafeZone });
  callbacksRef.current = { onSelectSector, onSelectSafeZone };

  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<CameraPresetKey>('general');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [labelsEnabled, setLabelsEnabled] = useState(true);

  const labelItems = useMemo(
    () => [
      ...buildings.map((b) => ({
        id: b.id,
        label: b.shortName,
        kind: 'building' as const,
        linkedSectorId: b.linkedSectorId,
        coords: b.coords,
      })),
      ...safeZones.map((z) => ({
        id: z.id,
        label: z.type === 'zona_segura' ? `S · ${z.name.split('—')[0].trim()}` : `E · ${z.name.split('(')[0].trim()}`,
        kind: 'safeZone' as const,
        isEnabled: z.isEnabled,
        safeZoneType: z.type,
      })),
    ],
    [buildings, safeZones],
  );

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const sceneHandle = createCampus3DScene(container, {
      buildings,
      sectors,
      safeZones,
      routes,
      onSelectSector: (id) => callbacksRef.current.onSelectSector(id),
      onSelectSafeZone: (id) => callbacksRef.current.onSelectSafeZone(id),
      onHoverLabel: (label) => setHoveredLabel(label),
      onProjectLabels: (projected) => {
        for (let i = 0; i < projected.length; i++) {
          const item = projected[i];
          const el = labelElsRef.current[item.id];
          if (!el) continue;
          if (!item.visible) {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
          } else {
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
            el.style.transform = `translate3d(${item.x.toFixed(1)}px, ${item.y.toFixed(1)}px, 0) translate(-50%, -100%)`;
          }
        }
      },
    });

    handleRef.current = sceneHandle;
    sceneHandle.updateState({
      rainScenario,
      activeFilter,
      selectedId,
      dynamicRouteCoords,
      nightMode: darkMode,
      labelsEnabled,
    });

    return () => {
      sceneHandle.dispose();
      handleRef.current = null;
    };
    // Initialize WebGL scene once on mount to prevent context teardown on UI state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handleRef.current?.updateState({
      rainScenario,
      activeFilter,
      selectedId,
      dynamicRouteCoords,
      nightMode: darkMode,
      labelsEnabled,
    });
  }, [rainScenario, activeFilter, selectedId, dynamicRouteCoords, darkMode, labelsEnabled]);

  useEffect(() => {
    if (!focusTargetCoords || !handleRef.current) return;
    const [lx, lz] = latLngToLocal3D(focusTargetCoords.lat, focusTargetCoords.lng);
    handleRef.current.focusPoint(lx, lz);
  }, [focusTargetCoords]);

  const handlePreset = (preset: CameraPresetKey) => {
    setActivePreset(preset);
    handleRef.current?.setCameraPreset(preset);
  };

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        darkMode ? 'bg-[#0B1626]' : 'bg-[#DCE8F2]'
      }`}
    >
      {/* Isolated WebGL mount container */}
      <div ref={mountRef} className="h-full w-full" aria-label="Gemelo digital 3D del campus UNT" />

      {/* Projected floating 3D landmark labels (solid rgba surfaces, no backdrop-filter) */}
      {labelsEnabled && (
        <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
          {labelItems.map((item) => {
            const isSafe = item.kind === 'safeZone';
            return (
              <button
                key={item.id}
                ref={(el) => {
                  labelElsRef.current[item.id] = el;
                }}
                type="button"
                onClick={() => {
                  if (item.kind === 'safeZone') {
                    onSelectSafeZone(item.id);
                  } else if (item.linkedSectorId) {
                    onSelectSector(item.linkedSectorId);
                  }
                }}
                style={{ opacity: 0, left: 0, top: 0 }}
                className={`absolute max-w-[170px] truncate rounded border px-1.5 py-0.5 text-[10px] font-semibold shadow-sm transition-colors ${
                  isSafe
                    ? item.isEnabled
                      ? item.safeZoneType === 'zona_segura'
                        ? 'border-emerald-700 bg-emerald-600/95 text-white hover:bg-emerald-700'
                        : 'border-blue-700 bg-blue-600/95 text-white hover:bg-blue-700'
                      : 'border-slate-600 bg-slate-600/95 text-slate-100'
                    : darkMode
                      ? 'border-slate-700 bg-slate-900/92 text-slate-100 hover:bg-slate-800'
                      : 'border-slate-300 bg-white/95 text-[#0F172A] hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Static top-left orientation label (no backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-[#0F2942]/92 px-3 py-1.5 text-xs font-medium text-white shadow-sm">
          <Compass className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
          <span>Gemelo 3D Procedural · Ciudad Universitaria UNT</span>
        </div>
        {hoveredLabel && (
          <div className="inline-flex max-w-xs items-center rounded-md border border-slate-200 bg-white/95 px-2.5 py-1 text-xs font-medium text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100">
            <span className="truncate">{hoveredLabel}</span>
          </div>
        )}
      </div>

      {/* Collapsible bottom camera dock (no backdrop-filter over WebGL, solid/rgba surface) */}
      <div className="pointer-events-auto absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="mb-1.5 inline-flex min-h-[32px] items-center gap-1.5 rounded-t-lg border border-slate-700 bg-[#0F2942]/95 px-3 py-1 text-[11px] font-medium text-slate-100 shadow-sm hover:bg-[#1E3A5F]"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Mostrar vistas 3D</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ocultar dock 3D</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-[#0F2942]/95 px-2.5 py-2 shadow-lg">
            <button
              type="button"
              onClick={() => handlePreset('general')}
              className={`min-h-[36px] whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activePreset === 'general'
                  ? 'bg-white text-[#0F2942]'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              Vista general
            </button>
            <button
              type="button"
              onClick={() => handlePreset('sur')}
              className={`min-h-[36px] whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activePreset === 'sur'
                  ? 'bg-white text-[#0F2942]'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              Sector Sur (Riesgo)
            </button>
            <button
              type="button"
              onClick={() => handlePreset('seguras')}
              className={`inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activePreset === 'seguras'
                  ? 'bg-white text-[#0F2942]'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              <span>Zonas seguras</span>
            </button>
            <button
              type="button"
              onClick={() => handlePreset('aerea')}
              className={`inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activePreset === 'aerea'
                  ? 'bg-white text-[#0F2942]'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              <Eye className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
              <span>Planta aérea</span>
            </button>

            <span className="hidden h-5 w-px bg-slate-700 sm:inline-block" aria-hidden="true" />

            <button
              type="button"
              onClick={() => setLabelsEnabled((v) => !v)}
              aria-pressed={labelsEnabled}
              className={`inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                labelsEnabled
                  ? 'bg-sky-500/25 text-sky-200 ring-1 ring-sky-400/50'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <Tag className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Etiquetas 3D</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
