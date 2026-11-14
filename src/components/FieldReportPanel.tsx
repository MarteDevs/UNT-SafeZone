import { useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  MessageSquareWarning,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import type {
  CampusBuilding,
  FieldIncidentKind,
  FieldIncidentReport,
  LatLngTuple,
} from '../types/gis';

interface FieldReportPanelProps {
  buildings: CampusBuilding[];
  reports: FieldIncidentReport[];
  userCoords: LatLngTuple | null;
  onAddReport: (report: FieldIncidentReport) => void;
  onModerateReport: (id: string, status: 'verificado' | 'descartado') => void;
  onFocusCoords: (coords: LatLngTuple) => void;
}

const INCIDENT_KINDS: { id: FieldIncidentKind; label: string }[] = [
  { id: 'acumulacion', label: 'Acumulación de agua en patio / vía' },
  { id: 'sumidero_tapado', label: 'Sumidero o canaleta obstruida' },
  { id: 'pasadizo_resbaladizo', label: 'Pasadizo o rampa resbaladiza' },
  { id: 'acceso_bloqueado', label: 'Acceso o salida temporalmente bloqueada' },
];

export function FieldReportPanel({
  buildings,
  reports,
  userCoords,
  onAddReport,
  onModerateReport,
  onFocusCoords,
}: FieldReportPanelProps) {
  const [kind, setKind] = useState<FieldIncidentKind>('acumulacion');
  const [buildingId, setBuildingId] = useState<string>(buildings[3]?.id ?? buildings[0].id);
  const [useGps, setUseGps] = useState(false);
  const [description, setDescription] = useState('');
  const [moderationMode, setModerationMode] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) return;

    const refBuilding = buildings.find((b) => b.id === buildingId) ?? buildings[0];
    const coords = useGps && userCoords ? userCoords : refBuilding.coords;
    const kindObj = INCIDENT_KINDS.find((k) => k.id === kind)!;

    const newReport: FieldIncidentReport = {
      id: `rep-${Date.now()}`,
      kind,
      title: kindObj.label,
      description: trimmed,
      coords,
      sectorName: useGps && userCoords ? 'Ubicación GPS del reportante' : refBuilding.shortName,
      createdAt: new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      moderationStatus: 'pendiente',
      reporterRole: 'Estudiante / Comunidad UNT (Prototipo)',
    };

    onAddReport(newReport);
    setDescription('');
    setSubmittedNotice(
      'Reporte registrado en estado "Pendiente de validación". Activa "Vista de moderación" para simular su verificación.',
    );
  };

  const visibleReports = moderationMode
    ? reports
    : reports.filter((r) => r.moderationStatus === 'verificado');

  return (
    <section className="no-print border-b border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end dark:border-slate-800">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Vigilancia comunitaria moderada · Flujo para brigadistas y autoridades
            </div>
            <h2 className="mt-1 text-balance text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl dark:text-white">
              Reportes de campo con validación previa
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Registra observaciones puntuales (sumideros obstruidos o aniegos locales). Ningún
              reporte ciudadano aparece como confirmado en el mapa sin pasar por moderación.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModerationMode((v) => !v)}
            className={`inline-flex min-h-[42px] shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
              moderationMode
                ? 'border-[#0F2942] bg-[#0F2942] text-white dark:border-sky-500 dark:bg-sky-600'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            <span>
              {moderationMode
                ? 'Vista de moderación activa'
                : `Vista de moderación (${reports.filter((r) => r.moderationStatus === 'pendiente').length} pendientes)`}
            </span>
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 lg:col-span-5 dark:border-slate-800 dark:bg-slate-950"
          >
            <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
              Enviar observación en campo
            </h3>

            <div>
              <label
                htmlFor="report-kind"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Tipo de incidencia
              </label>
              <select
                id="report-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as FieldIncidentKind)}
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-[#0F2942] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {INCIDENT_KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="report-bld"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Sector o pabellón cercano
              </label>
              <select
                id="report-bld"
                value={buildingId}
                disabled={useGps && Boolean(userCoords)}
                onChange={(e) => setBuildingId(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-[#0F2942] focus:outline-none disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              {userCoords && (
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={useGps}
                    onChange={(e) => setUseGps(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#0F2942]"
                  />
                  <span>Usar mi coordenada GPS actual</span>
                </label>
              )}
            </div>

            <div>
              <label
                htmlFor="report-desc"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Descripción breve de lo observado
              </label>
              <textarea
                id="report-desc"
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Agua acumulada frente a la rampa norte del pabellón tras lluvia continua."
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F2942] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            {submittedNotice && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                {submittedNotice}
              </div>
            )}

            <button
              type="submit"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E3A5F] dark:bg-sky-600 dark:hover:bg-sky-700"
            >
              <MessageSquareWarning className="h-4 w-4" aria-hidden="true" />
              <span>Registrar observación (Para moderación)</span>
            </button>
          </form>

          {/* Feed & Moderation Queue */}
          <div className="space-y-3 lg:col-span-7">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                {moderationMode
                  ? 'Mostrando todos los reportes (pendientes, verificados y descartados)'
                  : 'Mostrando únicamente reportes verificados visibles en el mapa'}
              </span>
              <span className="font-mono tabular-nums">{visibleReports.length} registros</span>
            </div>

            {visibleReports.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-[#F8FAFC] p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                No hay reportes verificados en este momento.
              </div>
            ) : (
              visibleReports.map((rep) => (
                <article
                  key={rep.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-start dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`font-semibold ${
                          rep.moderationStatus === 'verificado'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : rep.moderationStatus === 'pendiente'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {rep.moderationStatus === 'verificado'
                          ? 'Verificado (Visible en mapa)'
                          : rep.moderationStatus === 'pendiente'
                            ? 'Pendiente de validación'
                            : 'Descartado'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-500 dark:text-slate-400">{rep.sectorName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-500 tabular-nums dark:text-slate-400">
                        {rep.createdAt}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">{rep.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{rep.description}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Origen: {rep.reporterRole}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onFocusCoords(rep.coords)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <MapPin className="h-3.5 w-3.5 text-[#0F2942] dark:text-sky-400" aria-hidden="true" />
                      <span>Ubicar</span>
                    </button>

                    {moderationMode && rep.moderationStatus !== 'verificado' && (
                      <button
                        type="button"
                        onClick={() => onModerateReport(rep.id, 'verificado')}
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Verificar</span>
                      </button>
                    )}

                    {moderationMode && rep.moderationStatus !== 'descartado' && (
                      <button
                        type="button"
                        onClick={() => onModerateReport(rep.id, 'descartado')}
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <XCircle className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                        <span>Descartar</span>
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}

            {!moderationMode && (
              <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                <ShieldAlert
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#0F2942] dark:text-sky-400"
                  aria-hidden="true"
                />
                <span>
                  Los reportes verificados son registros demostrativos de campo y no reemplazan una
                  inspección estructural oficial.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
