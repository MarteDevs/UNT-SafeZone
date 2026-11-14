import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  onJumpToMap: () => void;
}

const NAV_LINKS = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#mapa', label: 'Mapa de riesgos' },
  { href: '#zonas-seguras', label: 'Zonas seguras' },
  { href: '#alertas', label: 'Alertas' },
  { href: '#recomendaciones', label: 'Recomendaciones' },
];

export function Header({ onJumpToMap }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-4 py-3 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#inicio"
          className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap text-lg font-bold tracking-tight text-[#0F2942]"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="28" height="28" rx="7" fill="#0F2942" />
            <path
              d="M14 5.5L21 8.5V14.2C21 18.6 18 21.8 14 23C10 21.8 7 18.6 7 14.2V8.5L14 5.5Z"
              stroke="#FFFFFF"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
            <circle cx="14" cy="14" r="2.75" fill="#22C55E" />
          </svg>
          <span>UNT SafeZone</span>
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="shrink-0 whitespace-nowrap py-1 transition-colors hover:text-[#0F2942] hover:underline hover:underline-offset-4"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Drawer Toggle */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onJumpToMap}
            className="hidden min-h-[40px] shrink-0 whitespace-nowrap rounded-lg bg-[#0F2942] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1E3A5F] sm:inline-flex sm:items-center"
          >
            Ver mapa de riesgos
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Responsive mobile drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0F2942]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
