import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { FieldIncidentReport, ModerationStatus, RainScenario } from '../types/gis';
import type {
  CampusStatusState,
  TacticalAlertLevel,
  TacticalLogEntry,
  ZoneOperationalItem,
  ZoneOperationalStatus,
} from '../types/tactical';

export const BOOTSTRAP_ADMIN_EMAIL = 'soumartex@gmail.com';

export const ALERT_PRESETS: Record<
  TacticalAlertLevel,
  {
    label: string;
    scenario: RainScenario;
    advisoryTitle: string;
    advisoryMessage: string;
  }
> = {
  blanco: {
    label: 'BLANCO',
    scenario: 'normal',
    advisoryTitle: 'CONDICIÓN NORMAL',
    advisoryMessage:
      'Circulación habitual por pasadizos del campus. Mantén ubicadas tus zonas seguras cercanas.',
  },
  amarillo: {
    label: 'AMARILLO',
    scenario: 'intensa',
    advisoryTitle: 'MANTENER VIGILANCIA',
    advisoryMessage:
      'Precipitación moderada en curso. Evita estacionar o permanecer en depresiones del sector sur.',
  },
  naranja: {
    label: 'NARANJA',
    scenario: 'intensa',
    advisoryTitle: 'EVACUAR AHORA',
    advisoryMessage:
      'Sal del sótano y de los pasillos bajo nivel. No uses las escaleras que bajan.',
  },
  rojo: {
    label: 'ROJO',
    scenario: 'elnino',
    advisoryTitle: 'EVACUAR DE INMEDIATO',
    advisoryMessage:
      'Anegamiento crítico en zonas bajas. Dirígete a cota alta o segundo piso seguro de inmediato.',
  },
};

export const DEFAULT_CAMPUS_STATUS: CampusStatusState = {
  alertLevel: 'naranja',
  remoteClassesActive: false,
  activeScenario: 'intensa',
  meetingPointName: 'Patio central / Plazuela',
  advisoryTitle: ALERT_PRESETS.naranja.advisoryTitle,
  advisoryMessage: ALERT_PRESETS.naranja.advisoryMessage,
  updatedByLabel: 'Unidad de Seguridad UNT (Demo)',
  updatedTimeLabel: '06:12',
  isSyncedFromCloud: false,
};

export const DEFAULT_ZONE_STATUSES: ZoneOperationalItem[] = [
  {
    zoneId: 'sotanos-bajo-nivel',
    name: 'Sótanos y bajo nivel',
    status: 'desalojado',
    severity: 'amarillo',
    note: 'Evacuación preventiva hacia pisos superiores.',
    linkedSectorId: 'sec-sur-america',
  },
  {
    zoneId: 'pasaje-norte-p1',
    name: 'Pasaje norte (P1)',
    status: 'bloqueado',
    severity: 'rojo',
    note: 'Escorrentía sobre nivel de vereda; ruta alterna por Plazuela.',
    linkedSectorId: 'sec-educacion',
  },
  {
    zoneId: 'patio-central',
    name: 'Patio central',
    status: 'punto_encuentro',
    severity: 'blanco',
    note: 'Cota alta habilitada con acceso despejado.',
    linkedSectorId: 'sec-central-plazuela',
  },
  {
    zoneId: 'acceso-jesus-nazareth',
    name: 'Acceso Jesús de Nazareth',
    status: 'en_vigilancia',
    severity: 'naranja',
    note: 'Monitoreo continuo de drenaje perimetral.',
    linkedSectorId: 'sec-este-juan-pablo',
  },
];

export const DEFAULT_INCIDENT_LOGS: TacticalLogEntry[] = [
  {
    logId: 'log-init-1',
    timeLabel: '06:12',
    message: 'Nivel NARANJA declarado',
    alertLevel: 'naranja',
  },
  {
    logId: 'log-init-2',
    timeLabel: '06:14',
    message: 'Aviso enviado a la comunidad',
    alertLevel: 'naranja',
  },
  {
    logId: 'log-init-3',
    timeLabel: '06:20',
    message: 'Sótanos desalojados',
    alertLevel: 'amarillo',
  },
];

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64);
  return cleaned || `id-${Date.now()}`;
}

function clampText(raw: string, maxLen: number, fallback: string): string {
  const trimmed = raw.trim().slice(0, maxLen);
  return trimmed.length >= 2 ? trimmed : fallback;
}

function formatServerTime(ts: unknown, fallback: string): string {
  if (ts && typeof ts === 'object' && 'toDate' in ts && typeof (ts as Timestamp).toDate === 'function') {
    return (ts as Timestamp).toDate().toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return fallback;
}

export function subscribeCampusStatus(
  onData: (status: CampusStatusState) => void,
  onError?: (err: unknown) => void,
): Unsubscribe {
  const ref = doc(db, 'campus_status', 'current');
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData({ ...DEFAULT_CAMPUS_STATUS, isSyncedFromCloud: true });
        return;
      }
      const d = snap.data();
      onData({
        alertLevel: (d.alertLevel as TacticalAlertLevel) || 'naranja',
        remoteClassesActive: Boolean(d.remoteClassesActive),
        activeScenario: (d.activeScenario as RainScenario) || 'intensa',
        meetingPointName: String(d.meetingPointName || DEFAULT_CAMPUS_STATUS.meetingPointName),
        advisoryTitle: String(d.advisoryTitle || DEFAULT_CAMPUS_STATUS.advisoryTitle),
        advisoryMessage: String(d.advisoryMessage || DEFAULT_CAMPUS_STATUS.advisoryMessage),
        updatedByLabel: String(d.updatedByLabel || 'Unidad de Seguridad UNT'),
        updatedTimeLabel: formatServerTime(d.updatedAt, DEFAULT_CAMPUS_STATUS.updatedTimeLabel),
        isSyncedFromCloud: true,
      });
    },
    (error) => {
      onError?.(error);
    },
  );
}

export function subscribeZoneStatuses(
  onData: (zones: ZoneOperationalItem[]) => void,
  onError?: (err: unknown) => void,
): Unsubscribe {
  const q = query(collection(db, 'zone_statuses'), where('isPublic', '==', true));
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onData(DEFAULT_ZONE_STATUSES);
        return;
      }
      const items: ZoneOperationalItem[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        const fallback = DEFAULT_ZONE_STATUSES.find((z) => z.zoneId === docSnap.id);
        return {
          zoneId: String(d.zoneId || docSnap.id),
          name: String(d.name || fallback?.name || docSnap.id),
          status: (d.status as ZoneOperationalStatus) || 'en_vigilancia',
          severity: (d.severity as TacticalAlertLevel) || 'amarillo',
          note: String(d.note || ''),
          linkedSectorId: fallback?.linkedSectorId,
        };
      });
      // Keep canonical order when default IDs exist
      items.sort((a, b) => {
        const ia = DEFAULT_ZONE_STATUSES.findIndex((z) => z.zoneId === a.zoneId);
        const ib = DEFAULT_ZONE_STATUSES.findIndex((z) => z.zoneId === b.zoneId);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
      onData(items);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export function subscribeIncidentLogs(
  onData: (logs: TacticalLogEntry[]) => void,
  onError?: (err: unknown) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'incident_logs'),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onData(DEFAULT_INCIDENT_LOGS);
        return;
      }
      const items: TacticalLogEntry[] = snap.docs.slice(0, 12).map((docSnap) => {
        const d = docSnap.data();
        return {
          logId: String(d.logId || docSnap.id),
          timeLabel: String(d.timeLabel || '--:--'),
          message: String(d.message || ''),
          alertLevel: (d.alertLevel as TacticalAlertLevel) || 'naranja',
        };
      });
      onData(items);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export function subscribeCloudFieldReports(
  isAdmin: boolean,
  userUid: string | null,
  onData: (reports: FieldIncidentReport[]) => void,
  onError?: (err: unknown) => void,
): Unsubscribe {
  const baseCol = collection(db, 'field_reports');
  const q = isAdmin
    ? query(baseCol, orderBy('createdAt', 'desc'))
    : userUid
      ? query(baseCol, where('authorUid', '==', userUid), orderBy('createdAt', 'desc'))
      : query(baseCol, where('isPublic', '==', true), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const items: FieldIncidentReport[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: String(d.reportId || docSnap.id),
          kind: d.kind as FieldIncidentReport['kind'],
          title: String(d.title || ''),
          description: String(d.description || ''),
          coords: {
            lat: Number(d.lat || -8.114656),
            lng: Number(d.lng || -79.038595),
          },
          sectorName: String(d.sectorName || 'Campus UNT'),
          createdAt: String(d.timeLabel || '--:--'),
          moderationStatus: (d.moderationStatus as ModerationStatus) || 'pendiente',
          reporterRole: String(d.reporterRole || 'Comunidad UNT'),
        };
      });
      onData(items);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function publishCampusStatus(
  status: CampusStatusState,
  logMessage?: string,
): Promise<void> {
  const path = 'campus_status/current';
  const preset = ALERT_PRESETS[status.alertLevel];
  const payload = {
    alertLevel: status.alertLevel,
    remoteClassesActive: Boolean(status.remoteClassesActive),
    activeScenario: status.activeScenario,
    meetingPointName: clampText(status.meetingPointName, 120, 'Patio central / Plazuela'),
    advisoryTitle: clampText(status.advisoryTitle || preset.advisoryTitle, 100, preset.advisoryTitle),
    advisoryMessage: clampText(
      status.advisoryMessage || preset.advisoryMessage,
      280,
      preset.advisoryMessage,
    ),
    updatedByLabel: clampText(status.updatedByLabel || 'Operador UNT SafeZone', 80, 'Operador UNT'),
    isPublic: true,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'campus_status', 'current'), payload, { merge: false });
    if (logMessage && auth.currentUser) {
      await appendIncidentLog(logMessage, status.alertLevel);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function publishZoneStatus(item: ZoneOperationalItem): Promise<void> {
  const safeId = sanitizeId(item.zoneId);
  const path = `zone_statuses/${safeId}`;
  try {
    await setDoc(doc(db, 'zone_statuses', safeId), {
      zoneId: safeId,
      name: clampText(item.name, 120, safeId),
      status: item.status,
      severity: item.severity,
      note: item.note.trim().slice(0, 240),
      isPublic: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function appendIncidentLog(
  message: string,
  alertLevel: TacticalAlertLevel,
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const logId = sanitizeId(`log-${Date.now()}`);
  const timeLabel = new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const path = `incident_logs/${logId}`;
  try {
    await setDoc(doc(db, 'incident_logs', logId), {
      logId,
      timeLabel: timeLabel.slice(0, 12),
      message: clampText(message, 200, 'Actualización operativa'),
      alertLevel,
      authorUid: sanitizeId(uid),
      isPublic: true,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function seedOperationalCollections(): Promise<void> {
  await publishCampusStatus(DEFAULT_CAMPUS_STATUS);
  await Promise.all(DEFAULT_ZONE_STATUSES.map((z) => publishZoneStatus(z)));
  await appendIncidentLog('Sincronización inicial en Firebase habilitada', DEFAULT_CAMPUS_STATUS.alertLevel);
}

export async function submitFieldReportToCloud(report: FieldIncidentReport): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Inicia sesión con Google para guardar reportes en la nube.');
  const reportId = sanitizeId(report.id);
  const path = `field_reports/${reportId}`;
  try {
    await setDoc(doc(db, 'field_reports', reportId), {
      reportId,
      kind: report.kind,
      title: clampText(report.title, 100, 'Incidencia en campus'),
      description: clampText(report.description, 400, 'Reporte de campo UNT'),
      lat: Math.min(-7.0, Math.max(-9.0, report.coords.lat)),
      lng: Math.min(-78.0, Math.max(-80.0, report.coords.lng)),
      sectorName: clampText(report.sectorName, 120, 'Campus UNT'),
      timeLabel: clampText(report.createdAt, 12, '00:00'),
      moderationStatus: 'pendiente',
      reporterRole: clampText(report.reporterRole, 80, 'Estudiante'),
      authorUid: sanitizeId(uid),
      isPublic: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function moderateFieldReportInCloud(
  reportId: string,
  status: ModerationStatus,
): Promise<void> {
  const safeId = sanitizeId(reportId);
  const path = `field_reports/${safeId}`;
  try {
    await updateDoc(doc(db, 'field_reports', safeId), {
      moderationStatus: status,
      isPublic: status === 'verificado',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
