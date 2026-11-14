import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Compass, Eye, Shield } from 'lucide-react';
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
  focusTargetCoords?: { lat: number; lng: number } | null;
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
  focusTargetCoords,
  onSelectSector,
  onSelectSafeZone,
}: Campus3DViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<Campus3DHandle | null>(null);
  const callbacksRef = useRef({ onSelectSector, onSelectSafeZone });
  callbacksRef.current = { onSelectSector, onSelectSafeZone };

  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<CameraPresetKey>('general');
  const [dockCollapsed, setDockCollapsed] = useState(false);

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
    });

    handleRef.current = sceneHandle;
    sceneHandle.updateState({ rainScenario, activeFilter, selectedId });

    return () => {
      sceneHandle.dispose();
      handleRef.current = null;
    };
    // Initialize WebGL scene once on mount to prevent context teardown on UI state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    handleRef.current?.updateState({ rainScenario, activeFilter, selectedId });
  }, [rainScenario, activeFilter, selectedId]);

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
    <div className="relative h-full w-full overflow-hidden bg-[#DCE8F2]">
      {/* Isolated WebGL mount container */}
      <div ref={mountRef} className="h-full w-full" aria-label="Gemelo digital 3D del campus UNT" />

      {/* Static top-left orientation label (no backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-[#0F2942]/92 px-3 py-1.5 text-xs font-medium text-white shadow-sm">
          <Compass className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
          <span>Gemelo 3D Procedural · Ciudad Universitaria UNT</span>
        </div>
        {hoveredLabel && (
          <div className="inline-flex max-w-xs items-center rounded-md border border-slate-200 bg-white/95 px-2.5 py-1 text-xs font-medium text-slate-900 shadow-sm">
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
          </div>
        )}
      </div>
    </div>
  );
}
