import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Cloud,
  LogIn,
  LogOut,
  MapPin,
  Radio,
  ShieldAlert,
  Smartphone,
  Terminal,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type {
  CampusBuilding,
  CampusSectorFeature,
  DynamicRouteResult,
  LatLngTuple,
  SafeZoneFeature,
} from '../types/gis';
import {
  latLngToUtm17L,
  type CampusStatusState,
  type TacticalAlertLevel,
  type TacticalLogEntry,
  type ZoneOperationalItem,
  type ZoneOperationalStatus,
} from '../types/tactical';
import { PWAInstallButton } from './PWAInstallButton';

interface TacticalEmergencySuiteProps {
  campusStatus: CampusStatusState;
  zoneStatuses: ZoneOperationalItem[];
  incidentLogs: TacticalLogEntry[];
  buildings: CampusBuilding[];
  sectors: CampusSectorFeature[];
  safeZones: SafeZoneFeature[];
  userLocation: { coords: LatLngTuple; accuracyMeters?: number } | null;
  dynamicRoute: DynamicRouteResult | null;
  selectedOriginId: string;
  onSelectOrigin: (originId: string) => void;
  onRequestGeolocation: () => void;
  onChangeAlertLevel: (level: TacticalAlertLevel) => void;
  onCycleZoneStatus: (zoneId: string) => void;
  onToggleRemoteClasses: () => void;
  onAddCustomLog: (message: string) => void;
  onOpenFullMap: () => void;
  firebaseUser: User | null;
  isAuthorizedAdmin: boolean;
  authBusy: boolean;
  cloudError: string | null;
  onSignInGoogle: () => void;
  onSignOutGoogle: () => void;
  onSeedCloud: () => void;
}

type TacticalTab = 'alerta' | 'ruta' | 'operador';

const ALERT_THEME: Record<
  TacticalAlertLevel,
  {
    bannerBg: string;
    bannerText: string;
    label: string;
    squareBg: string;
    squareBorder: string;
    headline: string;
    badgeText: string;
  }
> = {
  blanco: {
    bannerBg: 'bg-slate-200',
    bannerText: 'text-slate-900',
    label: 'BLANCO',
    squareBg: 'bg-white',
    squareBorder: 'border-white',
    headline: 'CONDICIÓN NORMAL',
    badgeText: 'text-slate-200',
  },
  amarillo: {
    bannerBg: 'bg-[#EAB308]',
    bannerText: 'text-[#14181E]',
    label: 'AMARILLO',
    squareBg: 'bg-[#EAB308]',
    squareBorder: 'border-[#EAB308]',
    headline: 'MANTENER VIGILANCIA',
    badgeText: 'text-amber-300',
  },
  naranja: {
    bannerBg: 'bg-[#F58220]',
    bannerText: 'text-[#14181E]',
    label: 'NARANJA',
    squareBg: 'bg-[#F58220]',
    squareBorder: 'border-[#F58220]',
    headline: 'EVACUAR AHORA',
    badgeText: 'text-orange-400',
  },
  rojo: {
    bannerBg: 'bg-[#EF4444]',
    bannerText: 'text-white',
    label: 'ROJO',
    squareBg: 'bg-[#EF4444]',
    squareBorder: 'border-[#EF4444]',
    headline: 'EVACUACIÓN INMEDIATA',
    badgeText: 'text-red-400',
  },
};

const ZONE_STATUS_META: Record<
  ZoneOperationalStatus,
  { label: string; squareColor: string; textColor: string }
> = {
  desalojado: {
    label: 'DESALOJADO',
    squareColor: 'bg-[#EAB308]',
    textColor: 'text-[#EAB308]',
  },
  bloqueado: {
    label: 'BLOQUEADO',
    squareColor: 'bg-[#EF4444]',
    textColor: 'text-[#EF4444]',
  },
  punto_encuentro: {
    label: 'PUNTO DE ENCUENTRO',
    squareColor: 'bg-white',
    textColor: 'text-white',
  },
  en_vigilancia: {
    label: 'EN VIGILANCIA',
    squareColor: 'bg-[#F58220]',
    textColor: 'text-[#F58220]',
  },
  habilitado: {
    label: 'HABILITADO',
    squareColor: 'bg-emerald-500',
    textColor: 'text-emerald-400',
  },
};

// Map campus WGS84 bounds to clean 300x340 tactical dark SVG canvas
const MAP_BOUNDS = {
  minLat: -8.1173,
  maxLat: -8.1116,
  minLng: -79.0414,
  maxLng: -79.0358,
};

function projectToTacticalSvg(lat: number, lng: number): { x: number; y: number } {
  const xNorm = (lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng);
  const yNorm = (MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);
  return {
    x: Math.max(16, Math.min(284, 16 + xNorm * 268)),
    y: Math.max(16, Math.min(324, 16 + yNorm * 308)),
  };
}

export function TacticalEmergencySuite({
  campusStatus,
  zoneStatuses,
  incidentLogs,
  buildings,
  sectors,
  safeZones,
  userLocation,
  dynamicRoute,
  selectedOriginId,
  onSelectOrigin,
  onRequestGeolocation,
  onChangeAlertLevel,
  onCycleZoneStatus,
  onToggleRemoteClasses,
  onAddCustomLog,
  onOpenFullMap,
  firebaseUser,
  isAuthorizedAdmin,
  authBusy,
  cloudError,
  onSignInGoogle,
  onSignOutGoogle,
  onSeedCloud,
}: TacticalEmergencySuiteProps) {
  const [activeTab, setActiveTab] = useState<TacticalTab>('alerta');
  const [customLogText, setCustomLogText] = useState('');

  const theme = ALERT_THEME[campusStatus.alertLevel];

  const activeOrigin = useMemo(() => {
    if (selectedOriginId === 'user-gps' && userLocation) {
      return { coords: userLocation.coords, label: 'Tu ubicación GPS' };
    }
    const found = buildings.find((b) => b.id === selectedOriginId) ?? buildings[0];
    return {
      coords: found?.coords ?? { lat: -8.11575, lng: -79.03795 },
      label: found?.shortName ?? 'Campus UNT',
    };
  }, [buildings, selectedOriginId, userLocation]);

  const utmLabel = useMemo(
    () => latLngToUtm17L(activeOrigin.coords.lat, activeOrigin.coords.lng),
    [activeOrigin.coords],
  );

  const activeRouteSummary = useMemo(() => {
    if (dynamicRoute) {
      return {
        targetName: dynamicRoute.targetSafeZone.name,
        distanceMeters: dynamicRoute.distanceMeters,
        estimatedMinutes: dynamicRoute.estimatedMinutes,
        points: dynamicRoute.coordinates.map(([lat, lng]) => projectToTacticalSvg(lat, lng)),
        targetCoords: dynamicRoute.targetSafeZone.coords,
      };
    }
    const fallbackZone =
      safeZones.find((z) => z.id === 'sz-plazuela') ?? safeZones[0];
    const originPt = projectToTacticalSvg(activeOrigin.coords.lat, activeOrigin.coords.lng);
    const targetPt = projectToTacticalSvg(fallbackZone.coords.lat, fallbackZone.coords.lng);
    return {
      targetName: campusStatus.meetingPointName || fallbackZone.name,
      distanceMeters: 180,
      estimatedMinutes: 3,
      points: [originPt, targetPt],
      targetCoords: fallbackZone.coords,
    };
  }, [activeOrigin.coords, campusStatus.meetingPointName, dynamicRoute, safeZones]);

  const originSvg = useMemo(
    () => projectToTacticalSvg(activeOrigin.coords.lat, activeOrigin.coords.lng),
    [activeOrigin.coords],
  );

  const targetSvg = useMemo(
    () => projectToTacticalSvg(activeRouteSummary.targetCoords.lat, activeRouteSummary.targetCoords.lng),
    [activeRouteSummary.targetCoords],
  );

  const activeHazardPoints = useMemo(() => {
    return sectors
      .filter((s) => s.riskLevel === 'muy_alto' || s.riskLevel === 'alto')
      .slice(0, 3)
      .map((s) => ({
        id: s.id,
        name: s.name,
        ...projectToTacticalSvg(s.center.lat, s.center.lng),
      }));
  }, [sectors]);

  const polylineString = activeRouteSummary.points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const quickOrigins = useMemo(
    () => buildings.slice(0, 5),
    [buildings],
  );

  return (
    <section
      id="app-tactica"
      aria-label="Aplicación Táctica Móvil y Panel del Operador UNT SafeZone"
      className="no-print border-b border-slate-800 bg-[#0D1217] py-12 text-slate-100"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex flex-col justify-between gap-4 border-b border-[#25303C] pb-6 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-sky-400">
              <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
              <span>App Móvil PWA / APK · Sincronizada con Firebase</span>
            </div>
            <h2 className="mt-1.5 text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Modo Táctico de Emergencia y Panel del Operador
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-300">
              Vistas operativas de alto contraste diseñadas para respuesta inmediata en campo y
              gestión centralizada en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs ${
                campusStatus.isSyncedFromCloud
                  ? 'border-emerald-700/60 bg-emerald-950/60 text-emerald-300'
                  : 'border-slate-700 bg-[#161E26] text-slate-300'
              }`}
            >
              <Cloud className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {campusStatus.isSyncedFromCloud ? 'Firebase Firestore en vivo' : 'Modo local activo'}
              </span>
            </span>

            <PWAInstallButton compact />
          </div>
        </div>

        {/* Mobile/Tablet Tabs (below xl) */}
        <div className="mt-6 flex gap-2 lg:hidden" role="tablist" aria-label="Pantallas de la app táctica">
          {(
            [
              { id: 'alerta', label: '01 · Alerta' },
              { id: 'ruta', label: '02 · Mapa y Ruta' },
              { id: 'operador', label: '03 · Operador' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg border px-3 py-2.5 font-mono text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-white bg-white text-[#111820]'
                  : 'border-[#2B3846] bg-[#161E26] text-slate-300 hover:bg-[#1E2934]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 3-Screen Showcase Grid on Desktop, Tabbed on Mobile */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* PANTALLA 01 · ALERTA */}
          <div
            className={`lg:col-span-3 ${activeTab === 'alerta' ? 'block' : 'hidden lg:block'}`}
          >
            <article className="mx-auto flex h-full max-w-[390px] flex-col justify-between overflow-hidden rounded-3xl border border-[#2B3846] bg-[#19222C] shadow-2xl">
              <div>
                {/* Alert Banner */}
                <div className={`px-6 py-5 ${theme.bannerBg} ${theme.bannerText}`}>
                  <div className="font-mono text-[11px] font-semibold uppercase tracking-widest opacity-85">
                    AVISO SENAMHI
                  </div>
                  <div className="mt-0.5 text-4xl font-extrabold tracking-tight">{theme.label}</div>
                  <div className="mt-1 text-sm font-medium opacity-90">
                    {campusStatus.activeScenario === 'normal'
                      ? 'Monitoreo regular · Campus UNT'
                      : campusStatus.activeScenario === 'elnino'
                        ? 'Evento El Niño · Campus UNT'
                        : 'Lluvia intensa · Campus UNT'}
                  </div>
                </div>

                {/* Alert Body */}
                <div className="p-6">
                  {/* 4-Level Square Indicator */}
                  <div className="flex items-center gap-2" aria-label={`Nivel ${theme.label}`}>
                    {(['blanco', 'amarillo', 'naranja', 'rojo'] as const).map((lvl) => {
                      const isActive = campusStatus.alertLevel === lvl;
                      const squareColor =
                        lvl === 'blanco'
                          ? 'border-slate-300'
                          : lvl === 'amarillo'
                            ? 'border-[#EAB308]'
                            : lvl === 'naranja'
                              ? 'border-[#F58220]'
                              : 'border-[#EF4444]';
                      const fillClass = isActive
                        ? lvl === 'blanco'
                          ? 'bg-white'
                          : lvl === 'amarillo'
                            ? 'bg-[#EAB308]'
                            : lvl === 'naranja'
                              ? 'bg-[#F58220]'
                              : 'bg-[#EF4444]'
                        : 'bg-transparent';
                      return (
                        <span
                          key={lvl}
                          className={`h-5 w-5 border-2 ${squareColor} ${fillClass}`}
                        />
                      );
                    })}
                  </div>

                  <h3 className="mt-5 text-3xl font-extrabold leading-[1.05] tracking-tight text-white">
                    {campusStatus.advisoryTitle}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {campusStatus.advisoryMessage}
                  </p>

                  {campusStatus.remoteClassesActive && (
                    <div className="mt-3 rounded-lg border border-sky-500/40 bg-sky-950/60 px-3 py-2 font-mono text-[11px] font-semibold text-sky-300">
                      CLASES REMOTAS ACTIVAS · CONTINUIDAD ACADÉMICA
                    </div>
                  )}

                  {/* Meeting Point Box */}
                  <div className="mt-5 rounded-xl border border-[#32404F] bg-[#131A22] px-4 py-3.5">
                    <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      TU PUNTO DE ENCUENTRO
                    </div>
                    <div className="mt-1 text-base font-bold text-white tabular-nums">
                      {activeRouteSummary.targetName} · {activeRouteSummary.distanceMeters} m
                    </div>
                  </div>

                  {/* Primary Action CTA */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectOrigin(selectedOriginId);
                      setActiveTab('ruta');
                    }}
                    className="mt-4 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold tracking-wide text-[#111820] transition-colors hover:bg-slate-200"
                  >
                    <span>VER MI RUTA</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Footer Telemetry */}
              <div className="border-t border-[#26323F] px-6 py-4">
                <div className="font-mono text-xs text-slate-400 tabular-nums">
                  <div>{utmLabel}</div>
                  <div className="mt-0.5">Actualizado {campusStatus.updatedTimeLabel}</div>
                </div>
                <div className="mt-3 text-center font-mono text-[10px] tracking-widest text-slate-500">
                  PANTALLA 01 · ALERTA
                </div>
              </div>
            </article>
          </div>

          {/* PANTALLA 02 · MAPA Y RUTA */}
          <div
            className={`lg:col-span-3 ${activeTab === 'ruta' ? 'block' : 'hidden lg:block'}`}
          >
            <article className="mx-auto flex h-full max-w-[390px] flex-col justify-between overflow-hidden rounded-3xl border border-[#2B3846] bg-[#19222C] shadow-2xl">
              {/* Top Alert Bar */}
              <div className={`px-4 py-3.5 font-mono text-xs font-bold ${theme.bannerBg} ${theme.bannerText}`}>
                {theme.label} · EVACUAR A {activeRouteSummary.targetName.toUpperCase()}
              </div>

              {/* Origin Quick Switch */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-[#26323F] bg-[#141B23] px-3 py-2">
                <button
                  type="button"
                  onClick={onRequestGeolocation}
                  className="rounded border border-sky-500/40 bg-sky-500/15 px-2 py-1 font-mono text-[10px] font-semibold text-sky-300 hover:bg-sky-500/25"
                >
                  GPS
                </button>
                {quickOrigins.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onSelectOrigin(b.id)}
                    className={`rounded border px-2 py-1 font-mono text-[10px] transition-colors ${
                      selectedOriginId === b.id
                        ? 'border-white bg-white font-bold text-[#111820]'
                        : 'border-[#2B3846] bg-[#1A232D] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {b.shortName}
                  </button>
                ))}
              </div>

              {/* Dark Tactical Vector Map */}
              <div className="relative bg-[#172029] p-2">
                <svg
                  viewBox="0 0 300 340"
                  className="h-auto w-full rounded-xl border border-[#24313E] bg-[#172029]"
                  role="img"
                  aria-label="Mapa táctico de evacuación evitando sectores de riesgo"
                >
                  <defs>
                    <pattern id="tactical-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path
                        d="M 30 0 L 0 0 0 30"
                        fill="none"
                        stroke="#22303D"
                        strokeWidth="0.8"
                      />
                    </pattern>
                  </defs>
                  <rect width="300" height="340" fill="url(#tactical-grid)" />

                  {/* Campus Building Footprints */}
                  {buildings.map((b) => {
                    const pt = projectToTacticalSvg(b.coords.lat, b.coords.lng);
                    const w = Math.max(22, Math.min(64, b.local3D.width * 0.65));
                    const h = Math.max(18, Math.min(48, b.local3D.depth * 0.65));
                    return (
                      <rect
                        key={b.id}
                        x={pt.x - w / 2}
                        y={pt.y - h / 2}
                        width={w}
                        height={h}
                        fill="#1E2A36"
                        stroke="#3A4C5E"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Active Hazard Zones */}
                  {activeHazardPoints.map((hz, i) => (
                    <g key={hz.id}>
                      <ellipse
                        cx={hz.x}
                        cy={hz.y}
                        rx="34"
                        ry="24"
                        fill="#EF4444"
                        opacity="0.82"
                      />
                      <ellipse cx={hz.x} cy={hz.y} rx="22" ry="15" fill="#451218" />
                      {i === 0 && (
                        <text
                          x={hz.x}
                          y={hz.y + 3.5}
                          textAnchor="middle"
                          fill="#F87171"
                          fontSize="9"
                          fontFamily="JetBrains Mono, monospace"
                          fontWeight="700"
                        >
                          RIESGO
                        </text>
                      )}
                    </g>
                  ))}

                  {/* Evacuation Route Polyline */}
                  {activeRouteSummary.points.length >= 2 && (
                    <polyline
                      points={polylineString}
                      fill="none"
                      stroke="#F8FAFC"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Origin Marker ("ESTÁS AQUÍ") */}
                  <circle
                    cx={originSvg.x}
                    cy={originSvg.y}
                    r="8"
                    fill="#3B82F6"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  />
                  <text
                    x={Math.min(205, originSvg.x + 12)}
                    y={originSvg.y + 3}
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                  >
                    ESTÁS AQUÍ
                  </text>

                  {/* Target Safe Zone ("PUNTO DE ENCUENTRO") */}
                  <circle cx={targetSvg.x} cy={targetSvg.y} r="8" fill="#F8FAFC" />
                  <text
                    x={Math.max(90, Math.min(200, targetSvg.x))}
                    y={Math.max(20, targetSvg.y - 13)}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                  >
                    PUNTO DE ENCUENTRO
                  </text>
                </svg>
              </div>

              {/* Bottom Summary */}
              <div className="border-t border-[#26323F] p-4">
                <div className="rounded-xl border border-[#32404F] bg-[#131A22] px-4 py-3">
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    RUTA REFERENCIAL · EVITA ZONAS DE RIESGO
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-lg font-extrabold text-white tabular-nums">
                      {activeRouteSummary.distanceMeters} m · {activeRouteSummary.estimatedMinutes} min a pie
                    </span>
                    <button
                      type="button"
                      onClick={onOpenFullMap}
                      className="rounded-md border border-slate-600 px-2 py-1 text-[11px] font-semibold text-sky-300 hover:bg-slate-800"
                    >
                      Visor 2D/3D
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-center font-mono text-[10px] tracking-widest text-slate-500">
                  PANTALLA 02 · MAPA Y RUTA
                </div>
              </div>
            </article>
          </div>

          {/* PANTALLA 03 · PANEL DEL OPERADOR */}
          <div
            className={`lg:col-span-6 ${activeTab === 'operador' ? 'block' : 'hidden lg:block'}`}
          >
            <article className="flex h-full flex-col justify-between rounded-3xl border border-[#2B3846] bg-[#19222C] p-6 shadow-2xl">
              <div>
                {/* Operator Header & Auth Bar */}
                <div className="flex flex-col justify-between gap-3 border-b border-[#2A3745] pb-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-orange-400" aria-hidden="true" />
                      <h3 className="text-lg font-extrabold tracking-tight text-white">
                        RUTASEGURA UNT · PANEL
                      </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Unidad responsable de seguridad · Ciudad Universitaria
                    </p>
                  </div>

                  {/* Firebase Auth Action */}
                  <div className="flex flex-wrap items-center gap-2">
                    {firebaseUser ? (
                      <>
                        <span
                          className={`rounded-md border px-2 py-1 font-mono text-[11px] ${
                            isAuthorizedAdmin
                              ? 'border-emerald-600/60 bg-emerald-950/60 text-emerald-300'
                              : 'border-amber-600/60 bg-amber-950/60 text-amber-300'
                          }`}
                        >
                          {isAuthorizedAdmin ? 'Operador verificado' : 'Solo lectura nube'}
                        </span>
                        {isAuthorizedAdmin && (
                          <button
                            type="button"
                            onClick={onSeedCloud}
                            className="rounded-md border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/20"
                          >
                            Sincronizar base
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={onSignOutGoogle}
                          disabled={authBusy}
                          className="inline-flex items-center gap-1 rounded-md border border-[#354454] bg-[#131A22] px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-[#1E2934]"
                        >
                          <LogOut className="h-3 w-3" aria-hidden="true" />
                          <span>Salir</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={onSignInGoogle}
                        disabled={authBusy}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-sky-500/50 bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
                      >
                        <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{authBusy ? 'Conectando...' : 'Acceso Operador (Google)'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {cloudError && (
                  <div className="mt-3 rounded-lg border border-amber-700/60 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
                    {cloudError}
                  </div>
                )}

                {!isAuthorizedAdmin && (
                  <div className="mt-3 rounded-lg border border-[#2F3E4E] bg-[#131A22] px-3 py-2 text-[11px] text-slate-300">
                    <ShieldAlert className="mr-1.5 inline h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                    Los cambios sin sesión de operador autorizado se prueban localmente en este dispositivo; inicia sesión con Google para emitir alertas a toda la comunidad en Firebase.
                  </div>
                )}

                {/* Alert Level Selector */}
                <div className="mt-5">
                  <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    NIVEL DE ALERTA (AVISO SENAMHI)
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {(['blanco', 'amarillo', 'naranja', 'rojo'] as const).map((lvl) => {
                      const active = campusStatus.alertLevel === lvl;
                      const styleMap: Record<TacticalAlertLevel, string> = {
                        blanco: active
                          ? 'border-white bg-white text-[#111820]'
                          : 'border-white/75 bg-[#131A22] text-white hover:bg-white/10',
                        amarillo: active
                          ? 'border-[#EAB308] bg-[#EAB308] text-[#111820]'
                          : 'border-[#EAB308] bg-[#131A22] text-[#EAB308] hover:bg-[#EAB308]/10',
                        naranja: active
                          ? 'border-[#F58220] bg-[#F58220] text-[#111820]'
                          : 'border-[#F58220] bg-[#131A22] text-[#F58220] hover:bg-[#F58220]/10',
                        rojo: active
                          ? 'border-[#EF4444] bg-[#EF4444] text-white'
                          : 'border-[#EF4444] bg-[#131A22] text-[#EF4444] hover:bg-[#EF4444]/10',
                      };
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => onChangeAlertLevel(lvl)}
                          aria-pressed={active}
                          className={`min-h-[46px] rounded-xl border-2 px-3 py-2 text-xs font-extrabold tracking-wide transition-colors ${styleMap[lvl]}`}
                        >
                          {ALERT_THEME[lvl].label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2-Column Operational Board */}
                <div className="mt-6 grid gap-4 md:grid-cols-12">
                  {/* Left: Zone Status List */}
                  <div className="md:col-span-7">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        ESTADO POR ZONA
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        Toca para cambiar estado
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-2">
                      {zoneStatuses.map((zone) => {
                        const meta = ZONE_STATUS_META[zone.status];
                        return (
                          <button
                            key={zone.zoneId}
                            type="button"
                            onClick={() => onCycleZoneStatus(zone.zoneId)}
                            className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#2B3846] bg-[#141B23] px-3.5 py-2.5 text-left transition-colors hover:border-slate-500"
                          >
                            <span className="truncate text-xs font-medium text-slate-100">
                              {zone.name}
                            </span>
                            <span className="inline-flex shrink-0 items-center gap-2 font-mono text-[10px] font-bold">
                              <span className={`h-3 w-3 ${meta.squareColor}`} />
                              <span className={meta.textColor}>{meta.label}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Academic Continuity + Log */}
                  <div className="flex flex-col gap-3 md:col-span-5">
                    <div className="rounded-xl border border-[#2B3846] bg-[#141B23] p-4">
                      <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        CONTINUIDAD ACADÉMICA
                      </div>
                      <button
                        type="button"
                        onClick={onToggleRemoteClasses}
                        aria-pressed={campusStatus.remoteClassesActive}
                        className={`mt-3 flex min-h-[46px] w-full items-center justify-center rounded-xl px-3 py-2.5 text-xs font-extrabold tracking-wide transition-colors ${
                          campusStatus.remoteClassesActive
                            ? 'bg-emerald-500 text-[#0B141C] hover:bg-emerald-400'
                            : 'bg-white text-[#111820] hover:bg-slate-200'
                        }`}
                      >
                        {campusStatus.remoteClassesActive
                          ? 'CLASES REMOTAS ACTIVAS'
                          : 'ACTIVAR CLASES REMOTAS'}
                      </button>
                    </div>

                    <div className="flex-1 rounded-xl border border-[#2B3846] bg-[#141B23] p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          REGISTRO
                        </span>
                        <Terminal className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                      </div>

                      <ul className="mt-2.5 max-h-[120px] space-y-1.5 overflow-y-auto pr-1 font-mono text-[11px] text-slate-300">
                        {incidentLogs.slice(0, 6).map((entry) => (
                          <li key={entry.logId} className="flex items-start gap-2.5">
                            <span className="shrink-0 text-slate-500 tabular-nums">
                              {entry.timeLabel}
                            </span>
                            <span className="leading-snug text-slate-200">{entry.message}</span>
                          </li>
                        ))}
                      </ul>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const trimmed = customLogText.trim();
                          if (!trimmed) return;
                          onAddCustomLog(trimmed);
                          setCustomLogText('');
                        }}
                        className="mt-3 flex gap-1.5"
                      >
                        <input
                          type="text"
                          value={customLogText}
                          onChange={(e) => setCustomLogText(e.target.value)}
                          maxLength={140}
                          placeholder="Registrar acción..."
                          className="min-w-0 flex-1 rounded-lg border border-[#2B3846] bg-[#0F151C] px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-[#354454] bg-[#1D2834] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#263443]"
                        >
                          Enviar
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer note */}
              <div className="mt-5 flex flex-col justify-between gap-2 border-t border-[#26323F] pt-3 sm:flex-row sm:items-center">
                <p className="text-[11px] text-slate-400">
                  <MapPin className="mr-1 inline h-3 w-3 text-slate-500" aria-hidden="true" />
                  Prototipo conectado a Firebase Firestore · Validar acciones con Defensa Civil UNT
                </p>
                <span className="font-mono text-[10px] tracking-widest text-slate-500">
                  PANTALLA 03 · PANEL DEL OPERADOR
                </span>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
