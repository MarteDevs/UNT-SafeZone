import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Database,
  Info,
  Navigation,
  ShieldCheck,
  X,
} from 'lucide-react';
import type {
  CampusSectorFeature,
  EvacuationRouteFeature,
  RainScenario,
  SafeZoneFeature,
} from '../types/gis';

interface SectorDrawerProps {
  selectedSector: CampusSectorFeature | null;
  selectedSafeZone: SafeZoneFeature | null;
  routes: EvacuationRouteFeature[];
  rainScenario: RainScenario;
  onClose: () => void;
  onHighlightRoute: (routeId: string | null) => void;
}

const RISK_META: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  muy_alto: {
    label: 'Riesgo Muy Alto',
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
  },
  alto: {
    label: 'Riesgo Alto',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
  },
  medio: {
    label: 'Riesgo Medio',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  bajo: {
    label: 'Riesgo Bajo',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
};

const HAZARD_LABELS: Record<string, string> = {
  inundacion: 'Inundación por escorrentía',
  acumulacion: 'Acumulación de agua pluvial',
  lluvia_intensa: 'Afectación por lluvias intensas',
  infraestructura: 'Vulnerabilidad física puntual',
};

const CATEGORY_NOTES: Record<string, { title: string; note: string }> = {
  susceptibilidad: {
    title: 'Susceptibilidad física',
    note: 'Predisposición del terreno o infraestructura a acumular agua por su pendiente y drenaje.',
  },
  peligro: {
    title: 'Peligro hidrometeorológico',
    note: 'Probabilidad de ocurrencia de lluvia intensa o escorrentía con determinada intensidad.',
  },
  riesgo: {
    title: 'Riesgo estimado (Demostrativo)',
    note: 'Combinación de peligro y vulnerabilidad de las personas o infraestructura expuesta.',
  },
};

export function SectorDrawer({
  selectedSector,
  selectedSafeZone,
  routes,
  rainScenario,
  onClose,
  onHighlightRoute,
}: SectorDrawerProps) {
  if (!selectedSector && !selectedSafeZone) return null;

  if (selectedSector) {
    const riskStyle = RISK_META[selectedSector.riskLevel] ?? RISK_META.medio;
    const catInfo = CATEGORY_NOTES[selectedSector.technicalCategory];
    const simDepth = (
      selectedSector.baseWaterDepthM * selectedSector.intensityMultiplier[rainScenario]
    ).toFixed(2);

    return (
      <aside
        aria-label="Detalle del sector seleccionado"
        className="flex h-full w-full flex-col overflow-y-auto border-t border-slate-200 bg-white lg:w-[390px] lg:border-t-0 lg:border-l"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span className="font-mono font-medium text-slate-700">
                {selectedSector.sectorCode}
              </span>
              <span aria-hidden="true">·</span>
              <span>{selectedSector.isDemoData ? 'Datos demostrativos' : 'Capa oficial'}</span>
            </div>
            <h3 className="mt-1 text-base font-bold leading-snug text-[#0F172A]">
              {selectedSector.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de sector"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-5 p-5">
          {/* Risk Level & Hazard */}
          <div className={`rounded-lg border p-3.5 ${riskStyle.bg} ${riskStyle.border}`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${riskStyle.text}`}>
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{riskStyle.label}</span>
              </span>
              <span className="font-mono text-xs font-medium text-slate-700 tabular-nums">
                Lámina sim.: ~{simDepth} m
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-700">
              Peligro: {HAZARD_LABELS[selectedSector.hazardType]}
            </p>
          </div>

          {/* Technical distinction: Susceptibilidad vs Peligro vs Riesgo */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F2942]">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Clasificación técnica: {catInfo.title}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{catInfo.note}</p>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Descripción del sector
            </h4>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
              {selectedSector.description}
            </p>
            {selectedSector.nearbyBuildings.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                Referencia próxima: {selectedSector.nearbyBuildings.join(' · ')}
              </p>
            )}
          </div>

          {/* Possible Consequences */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Posibles consecuencias
            </h4>
            <ul className="mt-2 space-y-1.5">
              {selectedSector.possibleConsequences.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Recommendations */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recomendaciones preventivas
            </h4>
            <ul className="mt-2 space-y-2">
              {selectedSector.recommendations.map((rec) => (
                <li
                  key={rec}
                  className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Source & Updated timestamp */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{selectedSector.source}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-mono tabular-nums">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Actualizado: {selectedSector.updatedAt}</span>
          </div>
        </div>
      </aside>
    );
  }

  // Safe Zone or Meeting Point Drawer
  if (selectedSafeZone) {
    const isSafe = selectedSafeZone.type === 'zona_segura';
    const linkedRoute = routes.find((r) => r.id === selectedSafeZone.validatedRouteId);

    return (
      <aside
        aria-label="Detalle de espacio seguro"
        className="flex h-full w-full flex-col overflow-y-auto border-t border-slate-200 bg-white lg:w-[390px] lg:border-t-0 lg:border-l"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span>{isSafe ? 'Zona Segura' : 'Punto de Encuentro'}</span>
              <span aria-hidden="true">·</span>
              <span>
                {selectedSafeZone.isEnabled ? 'Habilitado (Ref.)' : 'Pendiente de validación'}
              </span>
            </div>
            <h3 className="mt-1 text-base font-bold leading-snug text-[#0F172A]">
              {selectedSafeZone.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de zona segura"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-5 p-5">
          <div
            className={`rounded-lg border p-3.5 ${
              selectedSafeZone.isEnabled
                ? isSafe
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-blue-200 bg-blue-50 text-blue-900'
                : 'border-slate-300 bg-slate-100 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {selectedSafeZone.isEnabled
                  ? 'Espacio referencial habilitado en prototipo'
                  : 'Espacio inhabilitado — Validación técnica pendiente'}
              </span>
            </div>
            <p className="mt-1 text-xs">{selectedSafeZone.elevationNote}</p>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 p-3.5 text-sm">
            <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
              <span className="text-slate-500">Capacidad</span>
              <span className="text-right font-medium text-slate-900">
                {selectedSafeZone.capacityLabel}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Accesibilidad</span>
              <span className="text-right font-medium text-slate-900">
                {selectedSafeZone.accessibility}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Descripción
            </h4>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
              {selectedSafeZone.description}
            </p>
          </div>

          {linkedRoute && linkedRoute.validatedByAuthority ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3.5">
              <div className="text-xs font-semibold text-blue-900">
                Ruta de evacuación disponible
              </div>
              <p className="mt-1 text-xs text-blue-800">{linkedRoute.name}</p>
              <p className="mt-1 text-[11px] text-blue-700">
                {linkedRoute.distanceMeters} m · ~{linkedRoute.estimatedMinutes} min a pie
              </p>
              <button
                type="button"
                onClick={() => onHighlightRoute(linkedRoute.id)}
                className="mt-2.5 inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Resaltar ruta en el mapa</span>
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              No se muestra una ruta oficial hacia este punto porque aún requiere validación por
              las autoridades responsables.
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Indicaciones en campo
            </h4>
            <ul className="mt-2 space-y-2">
              {selectedSafeZone.recommendations.map((rec) => (
                <li
                  key={rec}
                  className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{selectedSafeZone.source}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-mono tabular-nums">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Actualizado: {selectedSafeZone.updatedAt}</span>
          </div>
        </div>
      </aside>
    );
  }

  return null;
}
