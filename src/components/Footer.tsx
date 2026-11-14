export function Footer() {
  return (
    <footer className="no-print bg-[#0F2942] pb-20 text-slate-200 md:pb-10 dark:border-t dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 border-b border-white/15 pb-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="text-lg font-bold tracking-tight text-white">UNT SafeZone</div>
            <p className="mt-1 text-xs font-medium text-sky-200">
              Universidad Nacional de Trujillo · Ciudad Universitaria
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              Plataforma interactiva de prevención de riesgos y orientación ante lluvias intensas e
              inundaciones para estudiantes, docentes y personal administrativo.
            </p>
          </div>

          <div className="md:col-span-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-200">
              Fuentes e interoperabilidad
            </h3>
            <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-300">
              <li>Cartografía base: OpenStreetMap (OSM) / Imágenes satelitales referenciales</li>
              <li>Arquitectura preparada para capas GeoJSON de CENEPRED e INDECI</li>
              <li>Módulo climático preparado para integración futura con servicios SENAMHI</li>
              <li>Capas de riesgo y rutas actuales: Datos demostrativos de prototipo</li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-200">
              Contacto institucional
            </h3>
            <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-300">
              <li>Av. Juan Pablo II s/n, Trujillo, Perú</li>
              <li>Oficina de Gestión del Riesgo y Seguridad Universitaria (Referencial)</li>
              <li>Correo de proyecto: safezone@unitru.edu.pe (Referencial)</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-3 text-xs leading-relaxed text-slate-300 md:flex-row md:items-center">
          <p className="max-w-3xl">
            <strong className="font-semibold text-white">Aviso importante de validación:</strong>{' '}
            Toda la información geográfica de susceptibilidad, peligro, puntos seguros y rutas de
            evacuación mostrada en este prototipo tiene carácter demostrativo y debe ser validada
            formalmente por las autoridades competentes de la Universidad Nacional de Trujillo y
            Defensa Civil antes de su uso operativo oficial.
          </p>
          <span className="shrink-0 font-mono text-slate-400">UNT SafeZone · 2026</span>
        </div>
      </div>
    </footer>
  );
}
