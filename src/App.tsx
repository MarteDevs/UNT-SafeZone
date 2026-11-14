import { useCallback, useState } from 'react';
import {
  CAMPUS_BUILDINGS,
  DEMO_RISK_SECTORS,
  EVACUATION_ROUTES,
  PREVENTIVE_ALERTS,
  SAFE_ZONES,
  WEATHER_BY_SCENARIO,
} from './data/untCampusData';
import { evaluateUserExposure } from './services/gisAdapters';
import type {
  BaseMapStyle,
  ExposureAnalysisResult,
  LatLngTuple,
  LayerFilter,
  MapViewMode,
  RainScenario,
  SafeZoneFeature,
} from './types/gis';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { MapWorkspace } from './components/MapWorkspace';
import { SafeZoneFinder } from './components/SafeZoneFinder';
import { AlertsSection } from './components/AlertsSection';
import { WeatherSection } from './components/WeatherSection';
import { PreventionGuide } from './components/PreventionGuide';
import { Footer } from './components/Footer';
import { MobileBottomBar } from './components/MobileBottomBar';
import { EmergencyQuickModal } from './components/EmergencyQuickModal';

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function App() {
  const [viewMode, setViewMode] = useState<MapViewMode>('2d');
  const [baseStyle, setBaseStyle] = useState<BaseMapStyle>('carto');
  const [rainScenario, setRainScenario] = useState<RainScenario>('normal');
  const [activeFilter, setActiveFilter] = useState<LayerFilter>('todos');

  const [selectedSectorId, setSelectedSectorId] = useState<string | null>('sec-sur-america');
  const [selectedSafeZoneId, setSelectedSafeZoneId] = useState<string | null>(null);
  const [highlightedRouteId, setHighlightedRouteId] = useState<string | null>(null);
  const [focusTargetCoords, setFocusTargetCoords] = useState<LatLngTuple | null>(null);

  const [userLocation, setUserLocation] = useState<{
    coords: LatLngTuple;
    accuracyMeters?: number;
  } | null>(null);
  const [exposureResult, setExposureResult] = useState<ExposureAnalysisResult | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  const handleSelectSector = useCallback((sectorId: string) => {
    setSelectedSafeZoneId(null);
    setSelectedSectorId(sectorId);
    const found = DEMO_RISK_SECTORS.find((s) => s.id === sectorId);
    if (found) setFocusTargetCoords({ ...found.center });
  }, []);

  const handleSelectSafeZone = useCallback((zoneId: string) => {
    setSelectedSectorId(null);
    setSelectedSafeZoneId(zoneId);
    const found = SAFE_ZONES.find((z) => z.id === zoneId);
    if (found) setFocusTargetCoords({ ...found.coords });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedSectorId(null);
    setSelectedSafeZoneId(null);
  }, []);

  const handleFocusSearchTarget = useCallback((coords: LatLngTuple, sectorId?: string) => {
    setFocusTargetCoords({ ...coords });
    if (sectorId) {
      setSelectedSafeZoneId(null);
      setSelectedSectorId(sectorId);
    }
  }, []);

  const handleRequestGeolocation = useCallback(() => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError(
        'Tu navegador no soporta geolocalización. Puedes usar el botón de simulación dentro del campus.',
      );
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: LatLngTuple = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const accuracyMeters = position.coords.accuracy;
        setUserLocation({ coords, accuracyMeters });
        setFocusTargetCoords(coords);
        const analysis = evaluateUserExposure(
          coords,
          DEMO_RISK_SECTORS,
          SAFE_ZONES,
          rainScenario,
          accuracyMeters,
          false,
        );
        setExposureResult(analysis);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        const reason =
          err.code === err.PERMISSION_DENIED
            ? 'Permiso de ubicación denegado. Activa el permiso en tu navegador o prueba con una ubicación simulada en el campus.'
            : 'No se pudo obtener tu ubicación actual. Puedes probar el análisis simulando estar en el campus.';
        setGeoError(reason);
        setExposureResult({
          status: 'outside_coverage',
          coords: { lat: -8.114656, lng: -79.038595 },
          message: reason,
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 },
    );
  }, [rainScenario]);

  const handleSimulateCampusLocation = useCallback(() => {
    // Places demo user marker near Pabellón 400 / Sector Sur
    const demoCoords: LatLngTuple = { lat: -8.11575, lng: -79.03795 };
    setGeoError(null);
    setUserLocation({ coords: demoCoords, accuracyMeters: 18 });
    setFocusTargetCoords({ ...demoCoords });
    const analysis = evaluateUserExposure(
      demoCoords,
      DEMO_RISK_SECTORS,
      SAFE_ZONES,
      rainScenario,
      18,
      true,
    );
    setExposureResult(analysis);
    if (analysis.matchedSector) {
      setSelectedSafeZoneId(null);
      setSelectedSectorId(analysis.matchedSector.id);
    }
  }, [rainScenario]);

  const handleLocateSafeZoneOnMap = useCallback((zone: SafeZoneFeature, routeId?: string) => {
    setSelectedSectorId(null);
    setSelectedSafeZoneId(zone.id);
    setFocusTargetCoords({ ...zone.coords });
    if (routeId) {
      setHighlightedRouteId(routeId);
      setActiveFilter('rutas_evacuacion');
    } else {
      setHighlightedRouteId(null);
      setActiveFilter('todos');
    }
    scrollToSection('mapa');
  }, []);

  const currentWeather = WEATHER_BY_SCENARIO[rainScenario];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Header onJumpToMap={() => scrollToSection('mapa')} />

      <main>
        <HeroSection
          onExploreMap={() => scrollToSection('mapa')}
          onJumpToRecommendations={() => scrollToSection('recomendaciones')}
          onQuickSelectSector={(id) => {
            handleSelectSector(id);
            scrollToSection('mapa');
          }}
        />

        <MapWorkspace
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          baseStyle={baseStyle}
          onChangeBaseStyle={setBaseStyle}
          rainScenario={rainScenario}
          onChangeRainScenario={setRainScenario}
          activeFilter={activeFilter}
          onChangeFilter={setActiveFilter}
          buildings={CAMPUS_BUILDINGS}
          sectors={DEMO_RISK_SECTORS}
          safeZones={SAFE_ZONES}
          routes={EVACUATION_ROUTES}
          selectedSectorId={selectedSectorId}
          selectedSafeZoneId={selectedSafeZoneId}
          highlightedRouteId={highlightedRouteId}
          focusTargetCoords={focusTargetCoords}
          userLocation={userLocation}
          exposureResult={exposureResult}
          geoError={geoError}
          geoLoading={geoLoading}
          onSelectSector={handleSelectSector}
          onSelectSafeZone={handleSelectSafeZone}
          onClearSelection={handleClearSelection}
          onHighlightRoute={(routeId) => {
            setHighlightedRouteId(routeId);
            setActiveFilter('rutas_evacuacion');
          }}
          onFocusSearchTarget={handleFocusSearchTarget}
          onRequestGeolocation={handleRequestGeolocation}
          onSimulateCampusLocation={handleSimulateCampusLocation}
          onOpenSafeZoneFinder={() => scrollToSection('zonas-seguras')}
        />

        <SafeZoneFinder
          safeZones={SAFE_ZONES}
          routes={EVACUATION_ROUTES}
          userCoords={userLocation?.coords ?? null}
          selectedZoneId={selectedSafeZoneId}
          onLocateSafeZoneOnMap={handleLocateSafeZoneOnMap}
        />

        <AlertsSection alerts={PREVENTIVE_ALERTS} rainScenario={rainScenario} />

        <WeatherSection weather={currentWeather} />

        <PreventionGuide />
      </main>

      <Footer />

      <MobileBottomBar
        onGoToMap={() => scrollToSection('mapa')}
        onGoToSafeZones={() => scrollToSection('zonas-seguras')}
        onGoToAlerts={() => scrollToSection('alertas')}
        onOpenEmergency={() => setEmergencyModalOpen(true)}
      />

      <EmergencyQuickModal
        open={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        onLocateMe={() => {
          scrollToSection('mapa');
          handleRequestGeolocation();
        }}
        onFindSafeZone={() => scrollToSection('zonas-seguras')}
      />
    </div>
  );
}
