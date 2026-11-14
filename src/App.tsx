import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  CAMPUS_BUILDINGS,
  DEMO_RISK_SECTORS,
  EVACUATION_ROUTES,
  PREVENTIVE_ALERTS,
  SAFE_ZONES,
  WEATHER_BY_SCENARIO,
} from './data/untCampusData';
import { auth, db, googleProvider } from './lib/firebase';
import {
  ALERT_PRESETS,
  appendIncidentLog,
  BOOTSTRAP_ADMIN_EMAIL,
  DEFAULT_CAMPUS_STATUS,
  DEFAULT_INCIDENT_LOGS,
  DEFAULT_ZONE_STATUSES,
  moderateFieldReportInCloud,
  publishCampusStatus,
  publishZoneStatus,
  seedOperationalCollections,
  submitFieldReportToCloud,
  subscribeCampusStatus,
  subscribeCloudFieldReports,
  subscribeIncidentLogs,
  subscribeZoneStatuses,
} from './services/emergencySyncService';
import { evaluateUserExposure } from './services/gisAdapters';
import { fetchUntOsmGeometry } from './services/osmOverpassService';
import { computeDynamicSafeRoute } from './services/routingEngine';
import { fetchLiveTrujilloWeather } from './services/weatherService';
import type {
  BaseMapStyle,
  DynamicRouteResult,
  ExposureAnalysisResult,
  FieldIncidentReport,
  ImportedGeoJsonLayer,
  LatLngTuple,
  LayerFilter,
  MapViewMode,
  OsmBuildingFootprint,
  OsmFootwayPath,
  RainScenario,
  SafeZoneFeature,
  WeatherSnapshot,
} from './types/gis';
import type {
  CampusStatusState,
  TacticalAlertLevel,
  TacticalLogEntry,
  ZoneOperationalItem,
  ZoneOperationalStatus,
} from './types/tactical';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { SituationalStrip } from './components/SituationalStrip';
import { TacticalEmergencySuite } from './components/TacticalEmergencySuite';
import { MapWorkspace } from './components/MapWorkspace';
import { SafeZoneFinder } from './components/SafeZoneFinder';
import { AlertsSection } from './components/AlertsSection';
import { WeatherSection } from './components/WeatherSection';
import { FieldReportPanel } from './components/FieldReportPanel';
import { PreventionGuide } from './components/PreventionGuide';
import { Footer } from './components/Footer';
import { MobileBottomBar } from './components/MobileBottomBar';
import { EmergencyQuickModal } from './components/EmergencyQuickModal';
import { GeoJsonImporterModal } from './components/GeoJsonImporterModal';
import { OfflineIndicator } from './components/OfflineIndicator';

const REPORTS_STORAGE_KEY = 'unt_safezone_field_reports_v1';

const INITIAL_DEMO_REPORTS: FieldIncidentReport[] = [
  {
    id: 'rep-init-verified',
    kind: 'sumidero_tapado',
    title: 'Sumidero o canaleta obstruida',
    description:
      'Ejemplo verificado: Rejilla pluvial con hojas acumuladas en el pasadizo lateral hacia Pabellón 400.',
    coords: { lat: -8.11515, lng: -79.03782 },
    sectorName: 'Educación (Pab. 400)',
    createdAt: '17:50',
    moderationStatus: 'verificado',
    reporterRole: 'Brigadista de facultad (Ejemplo)',
  },
  {
    id: 'rep-init-pending',
    kind: 'pasadizo_resbaladizo',
    title: 'Pasadizo o rampa resbaladiza',
    description:
      'Ejemplo en espera: Humedad persistente en rampa peatonal cercana al ingreso de Ingeniería.',
    coords: { lat: -8.11538, lng: -79.03915 },
    sectorName: 'Ingeniería y Química',
    createdAt: '18:10',
    moderationStatus: 'pendiente',
    reporterRole: 'Estudiante (Ejemplo pendiente)',
  },
];

const ZONE_CYCLE_ORDER: ZoneOperationalStatus[] = [
  'desalojado',
  'bloqueado',
  'en_vigilancia',
  'habilitado',
  'punto_encuentro',
];

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function App() {
  const [viewMode, setViewMode] = useState<MapViewMode>('2d');
  const [baseStyle, setBaseStyle] = useState<BaseMapStyle>('carto');
  const [rainScenario, setRainScenario] = useState<RainScenario>('normal');
  const [activeFilter, setActiveFilter] = useState<LayerFilter>('todos');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

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

  const [osmBuildings, setOsmBuildings] = useState<OsmBuildingFootprint[]>([]);
  const [osmFootways, setOsmFootways] = useState<OsmFootwayPath[]>([]);
  const [osmLoading, setOsmLoading] = useState(false);
  const [showOsmGeometry, setShowOsmGeometry] = useState(true);

  const [tacticalOriginId, setTacticalOriginId] = useState<string>(
    CAMPUS_BUILDINGS[3]?.id ?? CAMPUS_BUILDINGS[0].id,
  );
  const [dynamicRouteOrigin, setDynamicRouteOrigin] = useState<{
    coords: LatLngTuple;
    label: string;
  } | null>(() => {
    const bld = CAMPUS_BUILDINGS[3] ?? CAMPUS_BUILDINGS[0];
    return { coords: bld.coords, label: bld.shortName };
  });

  const [geoJsonModalOpen, setGeoJsonModalOpen] = useState(false);
  const [importedGeoJsonLayers, setImportedGeoJsonLayers] = useState<ImportedGeoJsonLayer[]>([]);

  // Firebase Auth & Real-Time Operational Sync State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  const [campusStatus, setCampusStatus] = useState<CampusStatusState>(DEFAULT_CAMPUS_STATUS);
  const [zoneStatuses, setZoneStatuses] = useState<ZoneOperationalItem[]>(DEFAULT_ZONE_STATUSES);
  const [incidentLogs, setIncidentLogs] = useState<TacticalLogEntry[]>(DEFAULT_INCIDENT_LOGS);
  const [cloudReports, setCloudReports] = useState<FieldIncidentReport[]>([]);

  const [fieldReports, setFieldReports] = useState<FieldIncidentReport[]>(() => {
    try {
      const saved = localStorage.getItem(REPORTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved) as FieldIncidentReport[];
    } catch {
      // Ignore storage errors
    }
    return INITIAL_DEMO_REPORTS;
  });

  const [liveWeather, setLiveWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  // Firebase Auth listener + admin verification
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user || !user.emailVerified) {
        setIsAuthorizedAdmin(false);
        return;
      }
      if (user.email === BOOTSTRAP_ADMIN_EMAIL) {
        setIsAuthorizedAdmin(true);
        return;
      }
      try {
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        setIsAuthorizedAdmin(adminSnap.exists());
      } catch {
        setIsAuthorizedAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  // Firestore real-time subscriptions for tactical screens
  useEffect(() => {
    const unsubStatus = subscribeCampusStatus(
      (nextStatus) => {
        setCampusStatus(nextStatus);
        if (nextStatus.isSyncedFromCloud) {
          setRainScenario(nextStatus.activeScenario);
        }
      },
      () => {
        // Keep graceful local state if offline or rules uninitialized
      },
    );

    const unsubZones = subscribeZoneStatuses(
      (zones) => setZoneStatuses(zones),
      () => {},
    );

    const unsubLogs = subscribeIncidentLogs(
      (logs) => setIncidentLogs(logs),
      () => {},
    );

    return () => {
      unsubStatus();
      unsubZones();
      unsubLogs();
    };
  }, []);

  useEffect(() => {
    const unsubReports = subscribeCloudFieldReports(
      isAuthorizedAdmin,
      firebaseUser?.uid ?? null,
      (items) => setCloudReports(items),
      () => {},
    );
    return () => unsubReports();
  }, [isAuthorizedAdmin, firebaseUser?.uid]);

  useEffect(() => {
    try {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(fieldReports));
    } catch {
      // Ignore quota errors
    }
  }, [fieldReports]);

  useEffect(() => {
    const controller = new AbortController();
    setOsmLoading(true);
    fetchUntOsmGeometry(controller.signal)
      .then((res) => {
        setOsmBuildings(res.buildings);
        setOsmFootways(res.footways);
      })
      .catch(() => {})
      .finally(() => {
        setOsmLoading(false);
      });
    return () => controller.abort();
  }, []);

  const refreshLiveWeather = useCallback(() => {
    setWeatherLoading(true);
    fetchLiveTrujilloWeather()
      .then((snapshot) => setLiveWeather(snapshot))
      .catch(() => {})
      .finally(() => setWeatherLoading(false));
  }, []);

  useEffect(() => {
    refreshLiveWeather();
  }, [refreshLiveWeather]);

  const dynamicRoute: DynamicRouteResult | null = useMemo(() => {
    if (!dynamicRouteOrigin) return null;
    return computeDynamicSafeRoute(
      dynamicRouteOrigin.coords,
      dynamicRouteOrigin.label,
      DEMO_RISK_SECTORS,
      SAFE_ZONES,
      rainScenario,
    );
  }, [dynamicRouteOrigin, rainScenario]);

  const handleComputeDynamicRoute = useCallback(
    (originId: string) => {
      setTacticalOriginId(originId);
      if (originId === 'user-gps' && userLocation) {
        setDynamicRouteOrigin({
          coords: userLocation.coords,
          label: 'Tu ubicación GPS',
        });
        setFocusTargetCoords(userLocation.coords);
        return;
      }
      const bld = CAMPUS_BUILDINGS.find((b) => b.id === originId) ?? CAMPUS_BUILDINGS[0];
      setDynamicRouteOrigin({
        coords: bld.coords,
        label: bld.shortName,
      });
      setFocusTargetCoords(bld.coords);
    },
    [userLocation],
  );

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
        setTacticalOriginId('user-gps');
        setDynamicRouteOrigin({ coords, label: 'Tu ubicación GPS' });
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

  // Tactical Operator Handlers (Firestore when authorized admin, instant local preview otherwise)
  const handleSignInGoogle = useCallback(async () => {
    setCloudError(null);
    setAuthBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setCloudError(
        err instanceof Error
          ? `No se pudo iniciar sesión: ${err.message}`
          : 'No se pudo completar el inicio de sesión con Google.',
      );
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const handleSignOutGoogle = useCallback(async () => {
    setCloudError(null);
    setAuthBusy(true);
    try {
      await signOut(auth);
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const handleChangeAlertLevel = useCallback(
    async (level: TacticalAlertLevel) => {
      setCloudError(null);
      const preset = ALERT_PRESETS[level];
      const nowTime = new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const nextStatus: CampusStatusState = {
        ...campusStatus,
        alertLevel: level,
        activeScenario: preset.scenario,
        advisoryTitle: preset.advisoryTitle,
        advisoryMessage: preset.advisoryMessage,
        updatedTimeLabel: nowTime,
        updatedByLabel: firebaseUser?.displayName || 'Operador UNT SafeZone',
      };

      setCampusStatus(nextStatus);
      setRainScenario(preset.scenario);

      if (isAuthorizedAdmin) {
        try {
          await publishCampusStatus(nextStatus, `Nivel ${preset.label} declarado`);
        } catch (err) {
          setCloudError(
            err instanceof Error ? err.message : 'Error al publicar el nivel de alerta.',
          );
        }
      } else {
        setIncidentLogs((prev) => [
          {
            logId: `local-${Date.now()}`,
            timeLabel: nowTime,
            message: `Nivel ${preset.label} declarado (Vista local)`,
            alertLevel: level,
          },
          ...prev,
        ]);
      }
    },
    [campusStatus, firebaseUser?.displayName, isAuthorizedAdmin],
  );

  const handleCycleZoneStatus = useCallback(
    async (zoneId: string) => {
      setCloudError(null);
      const current = zoneStatuses.find((z) => z.zoneId === zoneId);
      if (!current) return;
      const nextIdx = (ZONE_CYCLE_ORDER.indexOf(current.status) + 1) % ZONE_CYCLE_ORDER.length;
      const nextStatus = ZONE_CYCLE_ORDER[nextIdx];
      const nextSeverity: TacticalAlertLevel =
        nextStatus === 'bloqueado'
          ? 'rojo'
          : nextStatus === 'en_vigilancia'
            ? 'naranja'
            : nextStatus === 'desalojado'
              ? 'amarillo'
              : 'blanco';
      const updatedItem: ZoneOperationalItem = {
        ...current,
        status: nextStatus,
        severity: nextSeverity,
      };

      setZoneStatuses((prev) => prev.map((z) => (z.zoneId === zoneId ? updatedItem : z)));

      if (isAuthorizedAdmin) {
        try {
          await publishZoneStatus(updatedItem);
          await appendIncidentLog(
            `${updatedItem.name}: ${nextStatus.replace('_', ' ').toUpperCase()}`,
            nextSeverity,
          );
        } catch (err) {
          setCloudError(err instanceof Error ? err.message : 'Error al actualizar zona.');
        }
      } else {
        const nowTime = new Date().toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setIncidentLogs((prev) => [
          {
            logId: `local-${Date.now()}`,
            timeLabel: nowTime,
            message: `${updatedItem.name}: ${nextStatus.replace('_', ' ').toUpperCase()}`,
            alertLevel: nextSeverity,
          },
          ...prev,
        ]);
      }
    },
    [isAuthorizedAdmin, zoneStatuses],
  );

  const handleToggleRemoteClasses = useCallback(async () => {
    setCloudError(null);
    const nextRemote = !campusStatus.remoteClassesActive;
    const nowTime = new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const nextStatus: CampusStatusState = {
      ...campusStatus,
      remoteClassesActive: nextRemote,
      updatedTimeLabel: nowTime,
    };
    setCampusStatus(nextStatus);

    const logMsg = nextRemote ? 'Clases remotas activadas' : 'Clases presenciales reanudadas';
    if (isAuthorizedAdmin) {
      try {
        await publishCampusStatus(nextStatus, logMsg);
      } catch (err) {
        setCloudError(err instanceof Error ? err.message : 'Error al actualizar modalidad.');
      }
    } else {
      setIncidentLogs((prev) => [
        {
          logId: `local-${Date.now()}`,
          timeLabel: nowTime,
          message: `${logMsg} (Vista local)`,
          alertLevel: campusStatus.alertLevel,
        },
        ...prev,
      ]);
    }
  }, [campusStatus, isAuthorizedAdmin]);

  const handleAddCustomLog = useCallback(
    async (message: string) => {
      setCloudError(null);
      if (isAuthorizedAdmin) {
        try {
          await appendIncidentLog(message, campusStatus.alertLevel);
        } catch (err) {
          setCloudError(err instanceof Error ? err.message : 'Error al escribir bitácora.');
        }
      } else {
        const nowTime = new Date().toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setIncidentLogs((prev) => [
          {
            logId: `local-${Date.now()}`,
            timeLabel: nowTime,
            message,
            alertLevel: campusStatus.alertLevel,
          },
          ...prev,
        ]);
      }
    },
    [campusStatus.alertLevel, isAuthorizedAdmin],
  );

  const handleSeedCloud = useCallback(async () => {
    setCloudError(null);
    try {
      await seedOperationalCollections();
    } catch (err) {
      setCloudError(err instanceof Error ? err.message : 'Error al sincronizar Firestore.');
    }
  }, []);

  const currentWeather =
    rainScenario === 'normal' && liveWeather ? liveWeather : WEATHER_BY_SCENARIO[rainScenario];

  const mergedReports = useMemo(() => {
    const cloudIds = new Set(cloudReports.map((r) => r.id));
    return [...cloudReports, ...fieldReports.filter((r) => !cloudIds.has(r.id))];
  }, [cloudReports, fieldReports]);

  const verifiedReports = useMemo(
    () => mergedReports.filter((r) => r.moderationStatus === 'verificado'),
    [mergedReports],
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] dark:bg-slate-950 dark:text-slate-100">
      <Header onJumpToMap={() => scrollToSection('mapa')} />

      <main>
        <HeroSection
          onExploreMap={() => scrollToSection('mapa')}
          onJumpToRecommendations={() => scrollToSection('recomendaciones')}
          onOpenTacticalApp={() => scrollToSection('app-tactica')}
          onQuickSelectSector={(id) => {
            handleSelectSector(id);
            scrollToSection('mapa');
          }}
        />

        <SituationalStrip
          sectorCount={DEMO_RISK_SECTORS.length}
          safeZones={SAFE_ZONES}
          rainScenario={rainScenario}
          weather={currentWeather}
          onJumpToSection={scrollToSection}
        />

        <TacticalEmergencySuite
          campusStatus={campusStatus}
          zoneStatuses={zoneStatuses}
          incidentLogs={incidentLogs}
          buildings={CAMPUS_BUILDINGS}
          sectors={DEMO_RISK_SECTORS}
          safeZones={SAFE_ZONES}
          userLocation={userLocation}
          dynamicRoute={dynamicRoute}
          selectedOriginId={tacticalOriginId}
          onSelectOrigin={handleComputeDynamicRoute}
          onRequestGeolocation={handleRequestGeolocation}
          onChangeAlertLevel={(lvl) => {
            void handleChangeAlertLevel(lvl);
          }}
          onCycleZoneStatus={(zoneId) => {
            void handleCycleZoneStatus(zoneId);
          }}
          onToggleRemoteClasses={() => {
            void handleToggleRemoteClasses();
          }}
          onAddCustomLog={(msg) => {
            void handleAddCustomLog(msg);
          }}
          onOpenFullMap={() => scrollToSection('mapa')}
          firebaseUser={firebaseUser}
          isAuthorizedAdmin={isAuthorizedAdmin}
          authBusy={authBusy}
          cloudError={cloudError}
          onSignInGoogle={() => {
            void handleSignInGoogle();
          }}
          onSignOutGoogle={() => {
            void handleSignOutGoogle();
          }}
          onSeedCloud={() => {
            void handleSeedCloud();
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
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((v) => !v)}
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
          osmBuildings={osmBuildings}
          osmFootways={osmFootways}
          osmLoading={osmLoading}
          showOsmGeometry={showOsmGeometry}
          onToggleOsmGeometry={() => setShowOsmGeometry((v) => !v)}
          dynamicRoute={dynamicRoute}
          onComputeDynamicRoute={handleComputeDynamicRoute}
          onClearDynamicRoute={() => setDynamicRouteOrigin(null)}
          importedGeoJsonLayers={importedGeoJsonLayers}
          onOpenGeoJsonImporter={() => setGeoJsonModalOpen(true)}
          verifiedReports={verifiedReports}
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

        <WeatherSection
          weather={currentWeather}
          rainScenario={rainScenario}
          weatherLoading={weatherLoading}
          onRefreshLiveWeather={refreshLiveWeather}
          onResetToLiveScenario={() => setRainScenario('normal')}
        />

        <FieldReportPanel
          buildings={CAMPUS_BUILDINGS}
          reports={mergedReports}
          userCoords={userLocation?.coords ?? null}
          onAddReport={(rep) => {
            setFieldReports((prev) => [rep, ...prev]);
            if (firebaseUser?.emailVerified) {
              void submitFieldReportToCloud(rep).catch(() => {});
            }
          }}
          onModerateReport={(id, status) => {
            setFieldReports((prev) =>
              prev.map((r) => (r.id === id ? { ...r, moderationStatus: status } : r)),
            );
            if (isAuthorizedAdmin) {
              void moderateFieldReportInCloud(id, status).catch(() => {});
            }
          }}
          onFocusCoords={(coords) => {
            setFocusTargetCoords({ ...coords });
            scrollToSection('mapa');
          }}
        />

        <PreventionGuide />
      </main>

      <Footer />

      <MobileBottomBar
        onGoToMap={() => scrollToSection('mapa')}
        onGoToSafeZones={() => scrollToSection('zonas-seguras')}
        onGoToAlerts={() => scrollToSection('app-tactica')}
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

      <GeoJsonImporterModal
        open={geoJsonModalOpen}
        layers={importedGeoJsonLayers}
        onClose={() => setGeoJsonModalOpen(false)}
        onAddLayer={(layer) => setImportedGeoJsonLayers((prev) => [...prev, layer])}
        onToggleLayer={(id) =>
          setImportedGeoJsonLayers((prev) =>
            prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
          )
        }
        onRemoveLayer={(id) =>
          setImportedGeoJsonLayers((prev) => prev.filter((l) => l.id !== id))
        }
      />

      <OfflineIndicator />
    </div>
  );
}
