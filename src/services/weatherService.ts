import type { WeatherForecastDay, WeatherSnapshot } from '../types/gis';

const OPEN_METEO_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=-8.114656&longitude=-79.038595&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=America%2FLima&forecast_days=4';

interface OpenMeteoResponse {
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    rain: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
  };
}

function mapWmoWeather(code: number): {
  label: string;
  iconKind: WeatherForecastDay['iconKind'];
} {
  if (code >= 95) return { label: 'Tormenta eléctrica', iconKind: 'storm' };
  if (code >= 61 || (code >= 80 && code <= 82)) return { label: 'Lluvia moderada/fuerte', iconKind: 'cloud-rain' };
  if (code >= 51 && code <= 57) return { label: 'Llovizna costera', iconKind: 'cloud-rain' };
  if (code === 0 || code === 1) return { label: 'Despejado / Parcial', iconKind: 'sun' };
  return { label: 'Nublado parcial', iconKind: 'cloud-sun' };
}

function formatDayLabel(isoDate: string, idx: number): { dayLabel: string; dateLabel: string } {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return {
    dayLabel: idx === 0 ? 'Hoy' : dayNames[dt.getDay()],
    dateLabel: `${d} ${monthNames[(m || 1) - 1]}`,
  };
}

export async function fetchLiveTrujilloWeather(signal?: AbortSignal): Promise<WeatherSnapshot> {
  const response = await fetch(OPEN_METEO_URL, { signal });
  if (!response.ok) {
    throw new Error(`Open-Meteo HTTP ${response.status}`);
  }
  const data = (await response.json()) as OpenMeteoResponse;
  if (!data.current || !data.daily) {
    throw new Error('Respuesta meteorológica incompleta');
  }

  const curr = data.current;
  const daily = data.daily;
  const currWmo = mapWmoWeather(curr.weather_code);
  const rainRate = Number((curr.rain ?? curr.precipitation ?? 0).toFixed(1));
  const todayPrecipProb = daily.precipitation_probability_max?.[0] ?? 10;

  const forecast: WeatherForecastDay[] = daily.time.slice(0, 4).map((iso, idx) => {
    const wmo = mapWmoWeather(daily.weather_code[idx] ?? 2);
    const labels = formatDayLabel(iso, idx);
    return {
      dayLabel: labels.dayLabel,
      dateLabel: labels.dateLabel,
      condition: wmo.label,
      iconKind: wmo.iconKind,
      tempMaxC: Math.round(daily.temperature_2m_max[idx] ?? 24),
      tempMinC: Math.round(daily.temperature_2m_min[idx] ?? 17),
      precipProbPct: Math.round(daily.precipitation_probability_max[idx] ?? 10),
      rainMm: Number((daily.precipitation_sum[idx] ?? 0).toFixed(1)),
    };
  });

  const nowStr = new Date().toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isHeavyRain = rainRate >= 4 || todayPrecipProb >= 70;

  return {
    locationName: 'Trujillo — Ciudad Universitaria UNT',
    updatedAt: `${nowStr} PET`,
    sourceLabel: 'Open-Meteo (Pronóstico real para Trujillo · No conectado a SENAMHI)',
    isLiveApiConnected: true,
    currentTempC: curr.temperature_2m,
    feelsLikeC: curr.apparent_temperature,
    precipProbabilityPct: todayPrecipProb,
    rainIntensityLabel: currWmo.label,
    rainRateMmH: rainRate,
    humidityPct: Math.round(curr.relative_humidity_2m),
    windKmh: Math.round(curr.wind_speed_10m),
    advisoryTitle: isHeavyRain
      ? 'Precaución por probabilidad de lluvia en Trujillo'
      : 'Condiciones meteorológicas actuales en Trujillo',
    advisorySummary: isHeavyRain
      ? 'El pronóstico real registra precipitaciones o probabilidad elevada. Verifica rutas seguras en el visor antes de desplazarte por el campus.'
      : 'Lectura meteorológica en tiempo real para el campus UNT. Puedes activar el simulador de lluvia intensa o El Niño arriba para probar escenarios extremos.',
    forecast,
  };
}
