import { AlertOctagon, AlertTriangle, Bell, CheckCircle2, Info } from 'lucide-react';
import type { AlertItem, RainScenario } from '../types/gis';

interface AlertsSectionProps {
  alerts: AlertItem[];
  rainScenario: RainScenario;
}

const SEVERITY_META = {
  critica: {
    label: 'Severidad Alta / Crítica',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: AlertOctagon,
  },
  alta: {
    label: 'Advertencia Preventiva Alta',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    icon: AlertTriangle,
  },
  preventiva: {
    label: 'Orientación Preventiva',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    icon: Info,
  },
};

export function AlertsSection({ alerts, rainScenario }: AlertsSectionProps) {
  return (
    <section id="alertas" className="border-b border-slate-200 bg-[#F8FAFC] py-12">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Centro de alertas · Distinción entre avisos de prototipo y comunicados oficiales
            </div>
            <h2 className="mt-1 text-balance text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
              Centro de alertas preventivas
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Visualización estructurada de avisos por evento pluvial. Los ejemplos simulados
              responden al escenario de demostración activo sin suplantar alertas oficiales.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
            <Bell className="h-4 w-4 text-[#0F2942]" aria-hidden="true" />
            <span>
              Escenario activo:{' '}
              <strong className="text-[#0F2942]">
                {rainScenario === 'elnino'
                  ? 'El Niño (Simulado)'
                  : rainScenario === 'intensa'
                    ? 'Lluvia intensa (Simulada)'
                    : 'Condición normal'}
              </strong>
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {alerts.map((alert) => {
            const meta = SEVERITY_META[alert.severity];
            const Icon = meta.icon;
            const isActiveInScenario = alert.activeScenarios.includes(rainScenario);

            return (
              <article
                key={alert.id}
                className={`flex flex-col justify-between rounded-xl border bg-white p-5 transition-opacity ${
                  isActiveInScenario ? 'border-slate-200' : 'border-slate-200 opacity-65'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-600">
                      {alert.isSimulatedPrototype
                        ? 'Ejemplo simulado del prototipo'
                        : 'Aviso de referencia institucional'}
                    </span>
                    <span className="font-mono text-slate-500 tabular-nums">{alert.timestamp}</span>
                  </div>

                  <div
                    className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${meta.bg} ${meta.border} ${meta.text}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {alert.alertType} · {meta.label}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold leading-snug text-[#0F172A]">
                    {alert.title}
                  </h3>

                  <p className="mt-1.5 text-xs font-medium text-slate-500">
                    Zona afectada: {alert.affectedZone}
                  </p>

                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                    {alert.description}
                  </p>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="flex items-start gap-2 text-xs leading-relaxed text-slate-700">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="font-semibold text-[#0F2942]">Recomendación: </strong>
                      {alert.actionRecommendation}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">Fuente: {alert.source}</div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
