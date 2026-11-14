import type { RainScenario, SafeZoneFeature, WeatherSnapshot } from '../types/gis';

interface SituationalStripProps {
  sectorCount: number;
  safeZones: SafeZoneFeature[];
  rainScenario: RainScenario;
  weather: WeatherSnapshot;
  onJumpToSection: (id: string) => void;
}

const SCENARIO_DISPLAY: Record<RainScenario, { title: string; detail: string; accent: string }> = {
  normal: {
    title: 'Condición normal',
    detail: 'Lectura base sin estrés hídrico',
    accent: 'text-emerald-700 dark:text-emerald-400',
  },
  intensa: {
    title: 'Lluvia intensa (Sim.)',
    detail: 'Escorrentía y aniego moderado',
    accent: 'text-orange-700 dark:text-orange-400',
  },
  elnino: {
    title: 'El Niño (Sim.)',
    detail: 'Acumulación alta en cota sur',
    accent: 'text-red-700 dark:text-red-400',
  },
};

export function SituationalStrip({
  sectorCount,
  safeZones,
  rainScenario,
  weather,
  onJumpToSection,
}: SituationalStripProps) {
  const enabledCount = safeZones.filter((z) => z.isEnabled).length;
  const scMeta = SCENARIO_DISPLAY[rainScenario];

  return (
    <section
      aria-label="Resumen situacional del campus UNT"
      className="no-print border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 divide-y divide-slate-200 px-4 sm:grid-cols-2 sm:divide-y-0 sm:px-6 lg:grid-cols-4 lg:divide-x lg:px-8 dark:divide-slate-800">
        <button
          type="button"
          onClick={() => onJumpToSection('mapa')}
          className="flex flex-col items-start py-4 text-left transition-colors hover:bg-slate-50 sm:pr-6 dark:hover:bg-slate-800/50"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Sectores mapeados
          </span>
          <span className="mt-1 font-mono text-2xl font-bold text-[#0F172A] tabular-nums dark:text-white">
            {sectorCount}
          </span>
          <span className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
            Polígonos demostrativos · Clic para explorar
          </span>
        </button>

        <button
          type="button"
          onClick={() => onJumpToSection('zonas-seguras')}
          className="flex flex-col items-start py-4 text-left transition-colors hover:bg-slate-50 sm:px-6 dark:hover:bg-slate-800/50"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Espacios seguros habilitados
          </span>
          <span className="mt-1 font-mono text-2xl font-bold text-emerald-700 tabular-nums dark:text-emerald-400">
            {enabledCount} de {safeZones.length}
          </span>
          <span className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
            Zonas altas y puntos de encuentro
          </span>
        </button>

        <button
          type="button"
          onClick={() => onJumpToSection('mapa')}
          className="flex flex-col items-start py-4 text-left transition-colors hover:bg-slate-50 sm:pr-6 lg:px-6 dark:hover:bg-slate-800/50"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Escenario activo en visor
          </span>
          <span className={`mt-1 text-lg font-bold leading-8 ${scMeta.accent}`}>
            {scMeta.title}
          </span>
          <span className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{scMeta.detail}</span>
        </button>

        <button
          type="button"
          onClick={() => onJumpToSection('clima')}
          className="flex flex-col items-start py-4 text-left transition-colors hover:bg-slate-50 sm:pl-6 dark:hover:bg-slate-800/50"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Fuente meteorológica
          </span>
          <span className="mt-1 font-mono text-2xl font-bold text-[#0F172A] tabular-nums dark:text-white">
            {weather.currentTempC.toFixed(1)} °C · {weather.precipProbabilityPct}%
          </span>
          <span className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-300">
            {weather.isLiveApiConnected ? 'Open-Meteo Trujillo en vivo' : 'Escenario simulado'}
          </span>
        </button>
      </div>
    </section>
  );
}
