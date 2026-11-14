import {
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';
import type { WeatherForecastDay, WeatherSnapshot } from '../types/gis';

interface WeatherSectionProps {
  weather: WeatherSnapshot;
}

function ForecastIcon({ kind }: { kind: WeatherForecastDay['iconKind'] }) {
  if (kind === 'storm') return <CloudLightning className="h-5 w-5 text-red-600" aria-hidden="true" />;
  if (kind === 'cloud-rain') return <CloudRain className="h-5 w-5 text-blue-600" aria-hidden="true" />;
  if (kind === 'sun') return <Sun className="h-5 w-5 text-amber-500" aria-hidden="true" />;
  return <CloudSun className="h-5 w-5 text-slate-600" aria-hidden="true" />;
}

export function WeatherSection({ weather }: WeatherSectionProps) {
  return (
    <section className="border-b border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-6 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-medium text-slate-500">
              {weather.sourceLabel}
              <span aria-hidden="true"> · </span>
              <span className="font-mono tabular-nums">Actualizado: {weather.updatedAt}</span>
            </div>
            <h2 className="mt-1 text-balance text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
              Condiciones y pronóstico meteorológico
            </h2>
          </div>

          <span className="text-xs font-medium text-slate-500">
            Nota: El pronóstico climático no equivale a un mapa oficial de riesgo geográfico.
          </span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Primary Rain Warning Card */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#0F2942] p-6 text-white lg:col-span-5">
            <div>
              <div className="text-xs font-medium text-sky-200">
                {weather.locationName} · Aviso meteorológico referencial
              </div>
              <h3 className="mt-2 text-xl font-bold leading-snug">{weather.advisoryTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                {weather.advisorySummary}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/15 pt-5 sm:grid-cols-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <Thermometer className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Temperatura</span>
                </div>
                <div className="mt-1 font-mono text-xl font-bold tabular-nums">
                  {weather.currentTempC.toFixed(1)} °C
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Prob. lluvia</span>
                </div>
                <div className="mt-1 font-mono text-xl font-bold tabular-nums">
                  {weather.precipProbabilityPct}%
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <CloudRain className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Intensidad</span>
                </div>
                <div className="mt-1 font-mono text-xl font-bold tabular-nums">
                  {weather.rainRateMmH} mm/h
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <Wind className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Viento</span>
                </div>
                <div className="mt-1 font-mono text-xl font-bold tabular-nums">
                  {weather.windKmh} km/h
                </div>
              </div>
            </div>
          </div>

          {/* 4-Day Forecast & Intensity Detail */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#F8FAFC] p-6 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Pronóstico referencial para los próximos días
                </h3>
                <p className="text-xs text-slate-500">
                  Intensidad estimada actual: {weather.rainIntensityLabel} · Humedad{' '}
                  <span className="font-mono tabular-nums">{weather.humidityPct}%</span>
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500">
                Arquitectura lista para integración SENAMHI
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {weather.forecast.map((day) => (
                <div
                  key={day.dayLabel}
                  className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-[#0F172A]">{day.dayLabel}</div>
                      <div className="text-xs text-slate-500">{day.dateLabel}</div>
                    </div>
                    <ForecastIcon kind={day.iconKind} />
                  </div>

                  <div className="mt-3 text-xs font-medium text-slate-700">{day.condition}</div>

                  <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-2.5 font-mono text-xs tabular-nums">
                    <span className="font-bold text-[#0F172A]">
                      {day.tempMaxC}° / {day.tempMinC}°
                    </span>
                    <span className="text-blue-700">{day.precipProbPct}%</span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-slate-500 tabular-nums">
                    Acumulado: {day.rainMm} mm
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
