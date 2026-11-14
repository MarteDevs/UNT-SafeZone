import { useState } from 'react';
import {
  Backpack,
  CheckCircle2,
  CloudRain,
  Compass,
  ShieldCheck,
  Waves,
} from 'lucide-react';
import { EMERGENCY_BACKPACK_ITEMS, PREVENTION_TOPICS } from '../data/untCampusData';

const TOPIC_ICONS: Record<string, typeof ShieldCheck> = {
  antes: ShieldCheck,
  durante: CloudRain,
  inundando: Waves,
  evacuar: Compass,
};

export function PreventionGuide() {
  const [activeTopicId, setActiveTopicId] = useState(PREVENTION_TOPICS[0].id);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    'bp-water': true,
    'bp-doc': true,
  });

  const activeTopic =
    PREVENTION_TOPICS.find((t) => t.id === activeTopicId) ?? PREVENTION_TOPICS[0];
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section
      id="recomendaciones"
      className="no-print border-b border-slate-200 bg-[#F8FAFC] py-12 dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Guía práctica de prevención · Comunidad universitaria UNT
          </div>
          <h2 className="mt-1 text-balance text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl dark:text-white">
            Cómo actuar antes, durante y después de lluvias intensas
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Recomendaciones concretas para estudiantes, docentes y personal administrativo dentro de
            pabellones, laboratorios y espacios abiertos.
          </p>
        </div>

        {/* 3 Visual Educational Diagrams */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <figure className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <svg
              viewBox="0 0 320 118"
              className="h-auto w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-100"
              role="img"
              aria-label="Diagrama comparativo de profundidad segura frente a corriente peligrosa mayor a 15 centímetros"
            >
              {/* Ground sidewalk & curb */}
              <rect x="0" y="88" width="145" height="30" fill="#CBD5E1" />
              <rect x="145" y="76" width="175" height="42" fill="#94A3B8" />
              {/* Safe shallow puddle */}
              <rect x="10" y="82" width="120" height="6" rx="2" fill="#38BDF8" opacity="0.65" />
              <text x="20" y="24" fill="#15803D" fontSize="11" fontWeight="700">
                Hasta 5 cm · Transitable
              </text>
              <text x="20" y="39" fill="#475569" fontSize="9.5">
                Visibilidad de veredas y rejillas
              </text>
              {/* Hazardous runoff */}
              <path
                d="M155 56 Q180 50 205 56 T255 56 T305 56 L305 76 L155 76 Z"
                fill="#DC2626"
                opacity="0.35"
              />
              <line x1="155" y1="56" x2="305" y2="56" stroke="#DC2626" strokeWidth="2" />
              <line x1="150" y1="56" x2="150" y2="76" stroke="#B91C1C" strokeWidth="1.5" />
              <text x="160" y="24" fill="#B91C1C" fontSize="11" fontWeight="700">
                +15 cm en movimiento · No cruzar
              </text>
              <text x="160" y="39" fill="#475569" fontSize="9.5">
                Oculta desniveles y riesgo eléctrico
              </text>
            </svg>
            <figcaption className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <strong className="font-semibold text-[#0F172A] dark:text-white">
                Umbral de seguridad peatonal:
              </strong>{' '}
              Evita caminar por agua en movimiento por encima del tobillo (~15 cm).
            </figcaption>
          </figure>

          <figure className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <svg
              viewBox="0 0 320 118"
              className="h-auto w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-100"
              role="img"
              aria-label="Diagrama de evacuación ascendente hacia explanada o segundo nivel seguro"
            >
              {/* Low basin to high terrace profile */}
              <path d="M12 96 L112 96 L190 62 L308 62 L308 112 L12 112 Z" fill="#CBD5E1" />
              {/* Accumulated water on low sector */}
              <rect x="12" y="84" width="102" height="12" fill="#0284C7" opacity="0.45" />
              {/* Arrow upward */}
              <path
                d="M115 78 L178 48"
                stroke="#2563EB"
                strokeWidth="3"
                strokeDasharray="5 4"
                fill="none"
              />
              <polygon points="184,45 172,44 177,54" fill="#2563EB" />
              {/* Safe zone marker on top plateau */}
              <circle cx="248" cy="48" r="12" fill="#16A34A" />
              <text x="248" y="52" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700">
                S
              </text>
              <text x="22" y="24" fill="#0F2942" fontSize="11" fontWeight="700">
                Desplazamiento hacia cota alta
              </text>
              <text x="22" y="39" fill="#475569" fontSize="9.5">
                Plazuela Central, Explanada Biblioteca o 2.º piso
              </text>
            </svg>
            <figcaption className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <strong className="font-semibold text-[#0F172A] dark:text-white">
                Evacuación en pendiente positiva:
              </strong>{' '}
              Prioriza pasadizos elevados o pisos superiores en vez de patios bajos.
            </figcaption>
          </figure>

          <figure className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <svg
              viewBox="0 0 320 118"
              className="h-auto w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-100"
              role="img"
              aria-label="Esquema técnico de compartimentos esenciales de la mochila de emergencia"
            >
              {/* Backpack silhouette */}
              <rect
                x="24"
                y="22"
                width="68"
                height="80"
                rx="14"
                fill="#0F2942"
                stroke="#334155"
                strokeWidth="2"
              />
              <path
                d="M44 22 C44 11 72 11 72 22"
                fill="none"
                stroke="#0F2942"
                strokeWidth="4"
              />
              <rect x="34" y="54" width="48" height="36" rx="6" fill="#1E3A5F" />
              <circle cx="58" cy="39" r="8" fill="#16A34A" />
              <path d="M58 35 V43 M54 39 H62" stroke="#FFFFFF" strokeWidth="2" />
              {/* Callout checklist lines */}
              <text x="110" y="30" fill="#0F2942" fontSize="10.5" fontWeight="700">
                Kit mínimo universitario (24 h)
              </text>
              <text x="110" y="49" fill="#334155" fontSize="9.5">
                1. Agua sellada (1 L) + barra energética
              </text>
              <text x="110" y="66" fill="#334155" fontSize="9.5">
                2. DNI / carné en bolsa hermética
              </text>
              <text x="110" y="83" fill="#334155" fontSize="9.5">
                3. Linterna, silbato y batería externa
              </text>
              <text x="110" y="100" fill="#334155" fontSize="9.5">
                4. Botiquín básico y poncho impermeable
              </text>
            </svg>
            <figcaption className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <strong className="font-semibold text-[#0F172A] dark:text-white">
                Autonomía inmediata:
              </strong>{' '}
              Mantén tus documentos y equipo electrónico protegidos de la lluvia.
            </figcaption>
          </figure>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Left: 4 Preventive Protocols */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
            <div
              role="tablist"
              aria-label="Protocolos preventivos"
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              {PREVENTION_TOPICS.map((topic) => {
                const Icon = TOPIC_ICONS[topic.id] ?? ShieldCheck;
                const isSelected = topic.id === activeTopic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveTopicId(topic.id)}
                    className={`flex min-h-[48px] items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'border-[#0F2942] bg-[#0F2942] text-white dark:border-sky-500 dark:bg-sky-600'
                        : 'border-slate-200 bg-[#F8FAFC] text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="leading-snug">{topic.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {activeTopic.subtitle}
              </div>
              <h3 className="mt-1 text-lg font-bold text-[#0F172A] dark:text-white">
                {activeTopic.title}
              </h3>

              <ol className="mt-4 space-y-3">
                {activeTopic.steps.map((step, idx) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-[#F8FAFC] p-3 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0F2942] font-mono text-xs font-bold text-white tabular-nums dark:bg-sky-600">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                <strong className="font-semibold">Idea clave: </strong>
                {activeTopic.keyReminder}
              </div>
            </div>
          </div>

          {/* Right: Emergency Backpack Interactive Checklist */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F2942] text-white dark:bg-sky-600">
                    <Backpack className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                      Mochila de emergencia
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Lista interactiva de verificación personal
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold text-[#0F2942] tabular-nums dark:text-sky-300">
                  {checkedCount}/{EMERGENCY_BACKPACK_ITEMS.length}
                </span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-[#16A34A] transition-all duration-200"
                  style={{
                    width: `${(checkedCount / EMERGENCY_BACKPACK_ITEMS.length) * 100}%`,
                  }}
                />
              </div>

              <ul className="mt-4 space-y-2">
                {EMERGENCY_BACKPACK_ITEMS.map((item) => {
                  const checked = Boolean(checkedItems[item.id]);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        aria-pressed={checked}
                        className={`flex min-h-[44px] w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-xs leading-relaxed transition-colors ${
                          checked
                            ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <CheckCircle2
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            checked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'
                          }`}
                          aria-hidden="true"
                        />
                        <span className={checked ? 'font-medium' : ''}>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Recomendación alineada a lineamientos generales de preparación familiar y comunitaria
              INDECI.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
