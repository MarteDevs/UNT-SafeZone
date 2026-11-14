import { LocateFixed, Phone, ShieldCheck, X } from 'lucide-react';
import { EMERGENCY_CONTACTS } from '../data/untCampusData';

interface EmergencyQuickModalProps {
  open: boolean;
  onClose: () => void;
  onLocateMe: () => void;
  onFindSafeZone: () => void;
}

export function EmergencyQuickModal({
  open,
  onClose,
  onLocateMe,
  onFindSafeZone,
}: EmergencyQuickModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
      className="fixed inset-0 z-[700] flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4"
    >
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-xs font-semibold text-red-700">Orientación rápida ante emergencia</div>
            <h3 id="emergency-modal-title" className="text-lg font-bold text-[#0F172A]">
              Números y acciones inmediatas
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de emergencia"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLocateMe();
              }}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-[#0F2942] px-3 py-2 text-xs font-semibold text-white"
            >
              <LocateFixed className="h-4 w-4 text-sky-300" aria-hidden="true" />
              <span>¿Dónde estoy?</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onFindSafeZone();
              }}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-3 py-2 text-xs font-semibold text-white"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Zona segura</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {EMERGENCY_CONTACTS.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5"
              >
                <div>
                  <div className="text-sm font-bold text-[#0F172A]">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.role}</div>
                  <p className="mt-1 text-xs text-slate-600">{c.note}</p>
                </div>
                {c.phone.length <= 5 ? (
                  <a
                    href={`tel:${c.phone}`}
                    className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 font-mono text-sm font-bold text-white tabular-nums"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{c.phone}</span>
                  </a>
                ) : (
                  <span className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700">
                    Módulo UNT
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
