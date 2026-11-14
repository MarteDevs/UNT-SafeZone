import { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export function PWAInstallButton({ compact = false }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isInstallable) {
            void install();
          } else {
            setShowGuideModal(true);
          }
        }}
        className={`inline-flex items-center gap-1.5 rounded-lg border font-semibold transition-colors ${
          compact
            ? 'min-h-[36px] border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/25'
            : 'min-h-[38px] border-emerald-600/30 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60'
        }`}
      >
        {isInstallable ? (
          <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        )}
        <span>{isInstallable ? 'Instalar App' : 'App móvil / APK'}</span>
      </button>

      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-guide-title"
          className="no-print fixed inset-0 z-[750] flex items-center justify-center bg-slate-950/70 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  UNT SafeZone · App Móvil
                </div>
                <h3
                  id="pwa-install-guide-title"
                  className="mt-0.5 text-lg font-bold text-[#0F172A] dark:text-white"
                >
                  Instalar en celular o compilar APK
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Cerrar instrucciones de instalación"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <li>
                  1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                </li>
                <li>
                  2. Desplázate y elige <strong>Agregar a inicio</strong> para usar UNT SafeZone como
                  app independiente.
                </li>
              </ol>
            ) : (
              <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="font-semibold text-[#0F172A] dark:text-white">
                    Opción 1 · Instalación directa en Android (Chrome / Edge)
                  </div>
                  <p className="mt-1">
                    Abre el menú del navegador (<strong>⋮</strong>) y pulsa{' '}
                    <strong>Instalar aplicación</strong> o <strong>Agregar a la pantalla principal</strong>.
                    Funciona en modo pantalla completa y conserva caché offline de rutas.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="font-semibold text-[#0F172A] dark:text-white">
                    Opción 2 · Archivo .apk instalable (Capacitor)
                  </div>
                  <p className="mt-1">
                    El repositorio ya incluye configuración Capacitor y flujo automático en GitHub
                    Actions (<strong>Build Android APK</strong>) para descargar{' '}
                    <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[11px] dark:bg-slate-800">
                      app-debug.apk
                    </code>{' '}
                    tras cada push.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-4 w-full rounded-lg bg-[#0F2942] py-2.5 text-xs font-semibold text-white hover:bg-[#1E3A5F] dark:bg-sky-600 dark:hover:bg-sky-500"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
