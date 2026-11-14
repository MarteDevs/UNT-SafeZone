import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Database,
  Info,
  Navigation,
  Printer,
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
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  alto: {
    label: 'Riesgo Alto',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  medio: {
    label: 'Riesgo Medio',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  bajo: {
    label: 'Riesgo Bajo',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
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

  const handlePrintSheet = () => {
    window.print();
  };

  if (selectedSector) {
    const riskStyle = RISK_META[selectedSector.riskLevel] ?? RISK_META.medio;
    const catInfo = CATEGORY_NOTES[selectedSector.technicalCategory];
    const simDepth = (
      selectedSector.baseWaterDepthM * selectedSector.intensityMultiplier[rainScenario]
    ).toFixed(2);

    return (
      <aside
        aria-label="Detalle del sector seleccionado"
        className="print-sheet flex h-full w-full flex-col overflow-y-auto border-t border-slate-200 bg-white lg:w-[390px] lg:border-t-0 lg:border-l dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                {selectedSector.sectorCode}
              </span>
              <span aria-hidden="true">·</span>
              <span>{selectedSector.isDemoData ? 'Datos demostrativos' : 'Capa oficial'}</span>
            </div>
            <h3 className="mt-1 text-base font-bold leading-snug text-[#0F172A] dark:text-white">
              {selectedSector.name}
            </h3>
          </div>
          <div className="no-print flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrintSheet}
              title="Imprimir ficha técnica del sector"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Imprimir ficha</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de sector"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 p-5">
          {/* Risk Level & Hazard */}
          <div className={`rounded-lg border p-3.5 ${riskStyle.bg} ${riskStyle.border}`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${riskStyle.text}`}>
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{riskStyle.label}</span>
              </span>
              <span className="font-mono text-xs font-medium text-slate-700 tabular-nums dark:text-slate-200">
                Lámina sim.: ~{simDepth} m
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              Peligro: {HAZARD_LABELS[selectedSector.hazardType]}
            </p>
          </div>

          {/* Technical distinction: Susceptibilidad vs Peligro vs Riesgo */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F2942] dark:text-sky-300">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Clasificación técnica: {catInfo.title}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {catInfo.note}
            </p>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Descripción del sector
            </h4>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {selectedSector.description}
            </p>
            {selectedSector.nearbyBuildings.length > 0 && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Referencia próxima: {selectedSector.nearbyBuildings.join(' · ')}
              </p>
            )}
          </div>

          {/* Possible Consequences */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Posibles consecuencias
            </h4>
            <ul className="mt-2 space-y-1.5">
              {selectedSector.possibleConsequences.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Recommendations */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Recomendaciones preventivas
            </h4>
            <ul className="mt-2 space-y-2">
              {selectedSector.recommendations.map((rec) => (
                <li
                  key={rec}
                  className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Source & Updated timestamp */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
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
        className="print-sheet flex h-full w-full flex-col overflow-y-auto border-t border-slate-200 bg-white lg:w-[390px] lg:border-t-0 lg:border-l dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>{isSafe ? 'Zona Segura' : 'Punto de Encuentro'}</span>
              <span aria-hidden="true">·</span>
              <span>
                {selectedSafeZone.isEnabled ? 'Habilitado (Ref.)' : 'Pendiente de validación'}
              </span>
            </div>
            <h3 className="mt-1 text-base font-bold leading-snug text-[#0F172A] dark:text-white">
              {selectedSafeZone.name}
            </h3>
          </div>
          <div className="no-print flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrintSheet}
              title="Imprimir ficha técnica de zona segura"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Imprimir ficha</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de zona segura"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 p-5">
          <div
            className={`rounded-lg border p-3.5 ${
              selectedSafeZone.isEnabled
                ? isSafe
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200'
                : 'border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
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

          <div className="space-y-2 rounded-lg border border-slate-200 p-3.5 text-sm dark:border-slate-800">
            <div className="flex justify-between gap-3 border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Capacidad</span>
              <span className="text-right font-medium text-slate-900 dark:text-slate-100">
                {selectedSafeZone.capacityLabel}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500 dark:text-slate-400">Accesibilidad</span>
              <span className="text-right font-medium text-slate-900 dark:text-slate-100">
                {selectedSafeZone.accessibility}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Descripción
            </h4>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {selectedSafeZone.description}
            </p>
          </div>

          {linkedRoute && linkedRoute.validatedByAuthority ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3.5 dark:border-blue-800 dark:bg-blue-950/40">
              <div className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                Ruta de evacuación disponible
              </div>
              <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">{linkedRoute.name}</p>
              <p className="mt-1 font-mono text-[11px] text-blue-700 tabular-nums dark:text-blue-300">
                {linkedRoute.distanceMeters} m · ~{linkedRoute.estimatedMinutes} min a pie
              </p>
              <button
                type="button"
                onClick={() => onHighlightRoute(linkedRoute.id)}
                className="no-print mt-2.5 inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Resaltar ruta en el mapa</span>
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
              No se muestra una ruta oficial hacia este punto porque aún requiere validación por
              las autoridades responsables.
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Indicaciones en campo
            </h4>
            <ul className="mt-2 space-y-2">
              {selectedSafeZone.recommendations.map((rec) => (
                <li
                  key={rec}
                  className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
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
