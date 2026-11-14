import { useState, type ChangeEvent } from 'react';
import { Eye, EyeOff, FileJson, Trash2, Upload, X } from 'lucide-react';
import type { GeoJsonFeatureCollectionLike, ImportedGeoJsonLayer } from '../types/gis';

interface GeoJsonImporterModalProps {
  open: boolean;
  layers: ImportedGeoJsonLayer[];
  onClose: () => void;
  onAddLayer: (layer: ImportedGeoJsonLayer) => void;
  onToggleLayer: (id: string) => void;
  onRemoveLayer: (id: string) => void;
}

const SAMPLE_CENEPRED_TEMPLATE: GeoJsonFeatureCollectionLike = {
  type: 'FeatureCollection',
  name: 'Ejemplo_SIGRID_CENEPRED_Referencia',
  features: [
    {
      type: 'Feature',
      id: 'sample-cenepred-1',
      properties: {
        nombre: 'Microcuenca de drenaje pluvial — Muestra GeoJSON',
        nivel: 'alto',
        fuente: 'Plantilla de interoperabilidad QGIS / CENEPRED',
        nota: 'Polígono de prueba cargado mediante el importador GeoJSON',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-79.0402, -8.1144],
            [-79.0389, -8.1144],
            [-79.0389, -8.1153],
            [-79.0402, -8.1153],
            [-79.0402, -8.1144],
          ],
        ],
      },
    },
  ],
};

export function GeoJsonImporterModal({
  open,
  layers,
  onClose,
  onAddLayer,
  onToggleLayer,
  onRemoveLayer,
}: GeoJsonImporterModalProps) {
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const parseAndImport = (rawText: string, fileName: string) => {
    setError(null);
    try {
      const parsed = JSON.parse(rawText) as Partial<GeoJsonFeatureCollectionLike>;
      if (parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) {
        setError('El archivo debe ser un GeoJSON válido de tipo "FeatureCollection".');
        return;
      }
      if (parsed.features.length === 0) {
        setError('El archivo GeoJSON no contiene geometrías ("features").');
        return;
      }

      onAddLayer({
        id: `geojson-${Date.now()}`,
        fileName,
        loadedAt: new Date().toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        featureCount: parsed.features.length,
        visible: true,
        collection: parsed as GeoJsonFeatureCollectionLike,
      });
    } catch {
      setError('No se pudo leer el archivo JSON. Verifica la sintaxis del GeoJSON.');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        parseAndImport(reader.result, file.name);
      }
    };
    reader.onerror = () => setError('Error al leer el archivo local.');
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadSample = () => {
    parseAndImport(
      JSON.stringify(SAMPLE_CENEPRED_TEMPLATE),
      'plantilla-sigrid-cenepred-demo.geojson',
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="geojson-importer-title"
      className="no-print fixed inset-0 z-[700] flex items-center justify-center bg-slate-950/60 p-4"
    >
      <div className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Interoperabilidad GIS · QGIS / SIGRID CENEPRED / Defensa Civil
            </div>
            <h3
              id="geojson-importer-title"
              className="mt-0.5 text-lg font-bold text-[#0F172A] dark:text-white"
            >
              Importar capas GeoJSON externas
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar importador GeoJSON"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Carga archivos{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800 dark:text-slate-200">
              .geojson
            </code>{' '}
            o{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800 dark:text-slate-200">
              .json
            </code>{' '}
            en sistema WGS84 (EPSG:4326) para superponer polígonos oficiales, curvas o sectores
            técnicos directamente sobre el mapa del campus. Todo el procesamiento ocurre localmente en
            tu navegador.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E3A5F] dark:bg-sky-600 dark:hover:bg-sky-500">
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>Seleccionar archivo .geojson</span>
              <input
                type="file"
                accept=".geojson,.json,application/geo+json,application/json"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <FileJson className="h-4 w-4 text-[#0F2942] dark:text-sky-400" aria-hidden="true" />
              <span>Probar con plantilla de ejemplo</span>
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Capas externas cargadas ({layers.length})
            </h4>

            {layers.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed border-slate-200 bg-[#F8FAFC] p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                Aún no has cargado capas GeoJSON externas en esta sesión.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {layers.map((layer) => (
                  <li
                    key={layer.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-[#F8FAFC] px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">
                        {layer.fileName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {layer.featureCount} elementos · Cargado {layer.loadedAt}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleLayer(layer.id)}
                        aria-label={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {layer.visible ? (
                          <Eye className="h-4 w-4 text-[#0F2942] dark:text-sky-400" aria-hidden="true" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveLayer(layer.id)}
                        aria-label="Eliminar capa"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-red-600 hover:bg-red-50 dark:border-slate-700 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
