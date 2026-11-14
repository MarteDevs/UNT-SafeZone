import type { RainScenario } from './gis';

export type TacticalAlertLevel = 'blanco' | 'amarillo' | 'naranja' | 'rojo';

export type ZoneOperationalStatus =
  | 'desalojado'
  | 'bloqueado'
  | 'punto_encuentro'
  | 'en_vigilancia'
  | 'habilitado';

export interface CampusStatusState {
  alertLevel: TacticalAlertLevel;
  remoteClassesActive: boolean;
  activeScenario: RainScenario;
  meetingPointName: string;
  advisoryTitle: string;
  advisoryMessage: string;
  updatedByLabel: string;
  updatedTimeLabel: string;
  isSyncedFromCloud: boolean;
}

export interface ZoneOperationalItem {
  zoneId: string;
  name: string;
  status: ZoneOperationalStatus;
  severity: TacticalAlertLevel;
  note: string;
  linkedSectorId?: string;
}

export interface TacticalLogEntry {
  logId: string;
  timeLabel: string;
  message: string;
  alertLevel: TacticalAlertLevel;
}

export function latLngToUtm17L(lat: number, lng: number): string {
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const e2 = 2 * f - f * f;
  const ePrime2 = e2 / (1 - e2);
  const k0 = 0.9996;

  const zone = 17;
  const lonOrigin = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180);
  const latRad = lat * (Math.PI / 180);
  const lngRad = lng * (Math.PI / 180);

  const n = a / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));
  const t = Math.tan(latRad) * Math.tan(latRad);
  const c = ePrime2 * Math.cos(latRad) * Math.cos(latRad);
  const bigA = Math.cos(latRad) * (lngRad - lonOrigin);

  const m =
    a *
    ((1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256) * latRad -
      ((3 * e2) / 8 + (3 * e2 * e2) / 32 + (45 * e2 * e2 * e2) / 1024) * Math.sin(2 * latRad) +
      ((15 * e2 * e2) / 256 + (45 * e2 * e2 * e2) / 1024) * Math.sin(4 * latRad) -
      ((35 * e2 * e2 * e2) / 3072) * Math.sin(6 * latRad));

  const easting =
    k0 *
      n *
      (bigA +
        ((1 - t + c) * Math.pow(bigA, 3)) / 6 +
        ((5 - 18 * t + t * t + 72 * c - 58 * ePrime2) * Math.pow(bigA, 5)) / 120) +
    500000.0;

  let northing =
    k0 *
    (m +
      n *
        Math.tan(latRad) *
        ((bigA * bigA) / 2 +
          ((5 - t + 9 * c + 4 * c * c) * Math.pow(bigA, 4)) / 24 +
          ((61 - 58 * t + t * t + 600 * c - 330 * ePrime2) * Math.pow(bigA, 6)) / 720));

  if (lat < 0) northing += 10000000.0;

  return `17L ${Math.round(easting)} ${Math.round(northing)}`;
}
