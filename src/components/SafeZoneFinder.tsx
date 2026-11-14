import {
  Accessibility,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { EvacuationRouteFeature, LatLngTuple, SafeZoneFeature } from '../types/gis';
import { distanceMetersBetween } from '../services/gisAdapters';

interface SafeZoneFinderProps {
  safeZones: SafeZoneFeature[];
  routes: EvacuationRouteFeature[];
  userCoords: LatLngTuple | null;
  selectedZoneId: string | null;
  onLocateSafeZoneOnMap: (zone: SafeZoneFeature, routeId?: string) => void;
}

export function SafeZoneFinder({
  safeZones,
  routes,
  userCoords,
  selectedZoneId,
  onLocateSafeZoneOnMap,
}: SafeZoneFinderProps) {
  const sortedZones = [...safeZones].sort((a, b) => {
    if (a.isEnabled !== b.isEnabled) return a.isEnabled ? -1 : 1;
    if (!userCoords) return 0;
    return (
      distanceMetersBetween(userCoords, a.coords) -
      distanceMetersBetween(userCoords, b.coords)
    );
  });

  return (
    <section
      id="zonas-seguras"
      className="no-print border-b border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end dark:border-slate-800">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Orientación y resguardo · Datos referenciales sujetos a validación técnica
            </div>
            <h2 className="mt-1 text-balance text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl dark:text-white">
              Encuentra una zona segura o punto de encuentro
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Consulta los espacios disponibles dentro de la Ciudad Universitaria, su accesibilidad,
              aforo referencial y si cuentan con una ruta de evacuación validada.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>
              Las rutas de evacuación solo se habilitan cuando cuentan con validación técnica.
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {sortedZones.map((zone) => {
            const isSafe = zone.type === 'zona_segura';
            const linkedRoute = routes.find((r) => r.id === zone.validatedRouteId);
            const hasValidatedRoute = Boolean(linkedRoute && linkedRoute.validatedByAuthority);
            const distanceM = userCoords
              ? distanceMetersBetween(userCoords, zone.coords)
              : null;
            const isSelected = selectedZoneId === zone.id;

            return (
              <article
                key={zone.id}
                className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
                  isSelected
                    ? 'border-[#0F2942] bg-slate-50 dark:border-sky-500 dark:bg-slate-800/70'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {isSafe ? 'Zona segura referencial' : 'Punto de encuentro'}
                      <span aria-hidden="true"> · </span>
                      {zone.isEnabled ? 'Habilitado (Prototipo)' : 'Inhabilitado / En evaluación'}
                    </span>
                    {distanceM !== null && (
                      <span className="font-mono text-xs font-semibold text-[#0F2942] tabular-nums dark:text-sky-300">
                        A {distanceM} m
                      </span>
                    )}
                  </div>

                  <h3 className="mt-1.5 flex items-start gap-2 text-lg font-bold text-[#0F172A] dark:text-white">
                    {zone.isEnabled ? (
                      <CheckCircle2
                        className={`mt-1 h-4 w-4 shrink-0 ${
                          isSafe ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                        }`}
                        aria-hidden="true"
                      />
                    ) : (
                      <ShieldAlert
                        className="mt-1 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400"
                        aria-hidden="true"
                      />
                    )}
                    <span>{zone.name}</span>
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {zone.description}
                  </p>

                  <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                      <div>
                        <dt className="inline font-semibold text-slate-800 dark:text-slate-100">
                          Capacidad:{' '}
                        </dt>
                        <dd className="inline">{zone.capacityLabel}</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Accessibility
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                      <div>
                        <dt className="inline font-semibold text-slate-800 dark:text-slate-100">
                          Accesibilidad:{' '}
                        </dt>
                        <dd className="inline">{zone.accessibility}</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                      <div>
                        <dt className="inline font-semibold text-slate-800 dark:text-slate-100">
                          Cota / Drenaje:{' '}
                        </dt>
                        <dd className="inline">{zone.elevationNote}</dd>
                      </div>
                    </div>
                  </dl>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onLocateSafeZoneOnMap(zone)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#0F2942] dark:text-sky-400" aria-hidden="true" />
                    <span>Ver ubicación en el mapa</span>
                  </button>

                  {hasValidatedRoute && linkedRoute ? (
                    <button
                      type="button"
                      onClick={() => onLocateSafeZoneOnMap(zone, linkedRoute.id)}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Ver ruta ({linkedRoute.distanceMeters} m)</span>
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Ruta pendiente de validación oficial
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
