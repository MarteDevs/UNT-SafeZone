import { ArrowDownRight, BookOpen, Map, Smartphone } from 'lucide-react';

interface HeroSectionProps {
  onExploreMap: () => void;
  onJumpToRecommendations: () => void;
  onQuickSelectSector: (sectorId: string) => void;
  onOpenTacticalApp: () => void;
}

export function HeroSection({
  onExploreMap,
  onJumpToRecommendations,
  onQuickSelectSector,
  onOpenTacticalApp,
}: HeroSectionProps) {
  return (
    <section
      id="inicio"
      className="no-print border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mx-auto grid max-w-[1440px] items-stretch gap-8 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-10">
        {/* Left column: Value proposition & dual actions */}
        <div className="flex flex-col justify-center lg:col-span-7">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-[#0F2942] dark:text-sky-300">
              Universidad Nacional de Trujillo
            </span>
            <span aria-hidden="true">·</span>
            <span>Ciudad Universitaria (Av. Juan Pablo II s/n)</span>
            <span aria-hidden="true">·</span>
            <span>Estado demostrativo de prototipo</span>
          </div>

          <h1 className="max-w-2xl text-balance text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl lg:text-[44px] lg:leading-[1.12] dark:text-white">
            Tu seguridad comienza con la información.
          </h1>

          <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Conoce las zonas de riesgo, identifica espacios seguros y descubre cómo actuar ante
            lluvias intensas e inundaciones dentro de la Universidad Nacional de Trujillo.
          </p>

          <p className="mt-2.5 text-sm font-semibold text-[#0F2942] dark:text-sky-300">
            Conoce tu entorno. Identifica los riesgos. Encuentra un lugar seguro.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onExploreMap}
              className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-lg bg-[#0F2942] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E3A5F] dark:bg-sky-600 dark:hover:bg-sky-700"
            >
              <Map className="h-4 w-4" aria-hidden="true" />
              <span>Explorar mapa interactivo</span>
            </button>

            <button
              type="button"
              onClick={onOpenTacticalApp}
              className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-lg border border-orange-500/40 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-900 transition-colors hover:bg-orange-100 dark:border-orange-500/50 dark:bg-orange-950/50 dark:text-orange-200 dark:hover:bg-orange-900/60"
            >
              <Smartphone className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden="true" />
              <span>Modo App Táctica</span>
            </button>

            <button
              type="button"
              onClick={onJumpToRecommendations}
              className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>Conocer recomendaciones</span>
            </button>
          </div>
        </div>

        {/* Right column: Interactive cartographic campus illustration */}
        <div className="flex flex-col justify-center lg:col-span-5">
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-[#0F2942] dark:text-sky-300">
                Esquema geográfico referencial · Campus UNT
              </span>
              <span className="font-mono tabular-nums">8°06&apos;53&quot;S 79°02&apos;19&quot;O</span>
            </div>

            <svg
              viewBox="0 0 520 300"
              className="h-auto w-full rounded-lg border border-slate-200 bg-[#EEF3F8] dark:border-slate-800"
              role="img"
              aria-label="Ilustración geográfica esquemática de la Ciudad Universitaria UNT con sectores demostrativos de riesgo y puntos seguros"
            >
              {/* Topographic contour lines */}
              <path
                d="M20 75 Q180 55 340 85 T500 70"
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <path
                d="M20 155 Q190 135 350 165 T500 150"
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <path
                d="M40 235 Q210 215 380 245 T500 225"
                fill="none"
                stroke="#93C5FD"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />

              {/* Campus perimeter avenues */}
              <polygon
                points="78,46 436,36 462,248 64,256"
                fill="#FFFFFF"
                stroke="#64748B"
                strokeWidth="5"
                strokeLinejoin="round"
              />
              {/* Green quads */}
              <rect x="108" y="64" width="120" height="72" rx="4" fill="#DCFCE7" opacity="0.7" />
              <rect x="268" y="58" width="136" height="78" rx="4" fill="#DCFCE7" opacity="0.7" />
              <rect x="104" y="158" width="124" height="76" rx="4" fill="#DCFCE7" opacity="0.65" />

              {/* Demo Risk Sector: Medium Central */}
              <polygon
                points="206,102 308,100 310,162 204,164"
                fill="#CA8A04"
                fillOpacity="0.24"
                stroke="#A16207"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                className="cursor-pointer hover:fill-opacity-40"
                onClick={() => onQuickSelectSector('sec-eje-central')}
              />

              {/* Demo Risk Sector: High West */}
              <polygon
                points="74,90 130,90 132,162 72,162"
                fill="#EA580C"
                fillOpacity="0.28"
                stroke="#C2410C"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                className="cursor-pointer hover:fill-opacity-45"
                onClick={() => onQuickSelectSector('sec-acceso-juan-pablo')}
              />

              {/* Demo Risk Sector: Very High South */}
              <polygon
                points="224,186 382,182 390,242 220,244"
                fill="#DC2626"
                fillOpacity="0.28"
                stroke="#B91C1C"
                strokeWidth="1.75"
                strokeDasharray="4 3"
                className="cursor-pointer hover:fill-opacity-45"
                onClick={() => onQuickSelectSector('sec-sur-america')}
              />

              {/* Internal walkways */}
              <line x1="252" y1="46" x2="256" y2="250" stroke="#CBD5E1" strokeWidth="5" />
              <line x1="78" y1="146" x2="448" y2="142" stroke="#CBD5E1" strokeWidth="5" />

              {/* Validated demo evacuation route */}
              <polyline
                points="236,204 214,174 176,148"
                fill="none"
                stroke="#2563EB"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
              <polyline
                points="392,164 332,138 292,126"
                fill="none"
                stroke="#2563EB"
                strokeWidth="3"
                strokeDasharray="6 4"
              />

              {/* Reference buildings */}
              <rect x="214" y="108" width="32" height="14" rx="2" fill="#0F2942" />
              <rect x="266" y="114" width="34" height="14" rx="2" fill="#0F2942" />
              <rect x="164" y="132" width="24" height="18" rx="2" fill="#1E3A5F" />
              <ellipse cx="308" cy="214" rx="34" ry="18" fill="#1E3A5F" opacity="0.85" />

              {/* Safe Zone markers */}
              <g>
                <circle cx="174" cy="146" r="10" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
                <text x="174" y="150" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700">
                  S
                </text>
              </g>
              <g>
                <circle cx="290" cy="124" r="10" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
                <text x="290" y="128" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700">
                  S
                </text>
              </g>
              <g>
                <circle cx="352" cy="64" r="9" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                <text x="352" y="68" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="700">
                  E
                </text>
              </g>

              {/* Avenue Labels */}
              <text x="48" y="150" transform="rotate(-84 48 150)" fill="#475569" fontSize="9.5" fontWeight="600">
                Av. Juan Pablo II
              </text>
              <text x="260" y="274" textAnchor="middle" fill="#475569" fontSize="9.5" fontWeight="600">
                Av. América Sur
              </text>
              <text x="255" y="26" textAnchor="middle" fill="#475569" fontSize="9.5" fontWeight="600">
                Av. Jesús de Nazareth
              </text>
            </svg>

            <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
              <span>Haz clic en un sector del esquema o abre el mapa interactivo completo</span>
              <button
                type="button"
                onClick={onExploreMap}
                className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#0F2942] hover:underline dark:text-sky-300"
              >
                <span>Ir al visor</span>
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
