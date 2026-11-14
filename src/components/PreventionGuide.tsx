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
    <section id="recomendaciones" className="border-b border-slate-200 bg-[#F8FAFC] py-12">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="border-b border-slate-200 pb-6">
          <div className="text-xs font-medium text-slate-500">
            Guía práctica de prevención · Comunidad universitaria UNT
          </div>
          <h2 className="mt-1 text-balance text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
            Cómo actuar antes, durante y después de lluvias intensas
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Recomendaciones concretas para estudiantes, docentes y personal administrativo dentro de
            pabellones, laboratorios y espacios abiertos.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Left: 4 Preventive Protocols */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7">
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
                        ? 'border-[#0F2942] bg-[#0F2942] text-white'
                        : 'border-slate-200 bg-[#F8FAFC] text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="leading-snug">{topic.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="text-xs font-medium text-slate-500">{activeTopic.subtitle}</div>
              <h3 className="mt-1 text-lg font-bold text-[#0F172A]">{activeTopic.title}</h3>

              <ol className="mt-4 space-y-3">
                {activeTopic.steps.map((step, idx) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-[#F8FAFC] p-3 text-sm leading-relaxed text-slate-700"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0F2942] font-mono text-xs font-bold text-white tabular-nums">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900">
                <strong className="font-semibold">Idea clave: </strong>
                {activeTopic.keyReminder}
              </div>
            </div>
          </div>

          {/* Right: Emergency Backpack Interactive Checklist */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F2942] text-white">
                    <Backpack className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A]">
                      Mochila de emergencia
                    </h3>
                    <p className="text-xs text-slate-500">
                      Lista interactiva de verificación personal
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold text-[#0F2942] tabular-nums">
                  {checkedCount}/{EMERGENCY_BACKPACK_ITEMS.length}
                </span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
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
                            ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <CheckCircle2
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            checked ? 'text-emerald-600' : 'text-slate-300'
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

            <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              Recomendación alineada a lineamientos generales de preparación familiar y comunitaria
              INDECI.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
