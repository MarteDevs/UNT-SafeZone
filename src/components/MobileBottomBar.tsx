import { Bell, Map, PhoneCall, ShieldCheck } from 'lucide-react';

interface MobileBottomBarProps {
  onGoToMap: () => void;
  onGoToSafeZones: () => void;
  onGoToAlerts: () => void;
  onOpenEmergency: () => void;
}

export function MobileBottomBar({
  onGoToMap,
  onGoToSafeZones,
  onGoToAlerts,
  onOpenEmergency,
}: MobileBottomBarProps) {
  return (
    <nav
      aria-label="Acceso rápido móvil"
      className="no-print fixed right-0 bottom-0 left-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden dark:border-slate-800 dark:bg-slate-900/95"
    >
      <div className="grid h-16 grid-cols-4 items-center">
        <button
          type="button"
          onClick={onGoToMap}
          className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-[#0F2942] dark:text-sky-300"
        >
          <Map className="h-5 w-5" aria-hidden="true" />
          <span className="text-[11px] font-semibold">Mapa</span>
        </button>

        <button
          type="button"
          onClick={onGoToSafeZones}
          className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-slate-700 dark:text-slate-200"
        >
          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span className="text-[11px] font-medium">Zonas</span>
        </button>

        <button
          type="button"
          onClick={onGoToAlerts}
          className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-slate-700 dark:text-slate-200"
        >
          <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" aria-hidden="true" />
          <span className="text-[11px] font-medium">Alertas</span>
        </button>

        <button
          type="button"
          onClick={onOpenEmergency}
          className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 text-red-700 dark:text-red-400"
        >
          <PhoneCall className="h-5 w-5" aria-hidden="true" />
          <span className="text-[11px] font-bold">Emergencia</span>
        </button>
      </div>
    </nav>
  );
}
