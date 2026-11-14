import type {
  AlertItem,
  CampusBuilding,
  CampusSectorFeature,
  EmergencyContact,
  EvacuationRouteFeature,
  LatLngTuple,
  RainScenario,
  SafeZoneFeature,
  WeatherSnapshot,
} from '../types/gis';

/**
 * Coordenadas reales de referencia de la Ciudad Universitaria
 * de la Universidad Nacional de Trujillo (Av. Juan Pablo II s/n).
 */
export const UNT_CAMPUS_CENTER: LatLngTuple = {
  lat: -8.114656,
  lng: -79.038595,
};

export const UNT_CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [-8.1185, -79.0432],
  [-8.1106, -79.0342],
];

export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  {
    id: 'bld-puerta-principal',
    name: 'Puerta Principal — Av. Juan Pablo II',
    shortName: 'Puerta Principal',
    facultyOrUse: 'Acceso vehicular y peatonal principal',
    coords: { lat: -8.11352, lng: -79.04072 },
    local3D: { x: -72, z: -28, width: 12, depth: 6, height: 6, rotationY: 0.45, kind: 'gate' },
    linkedSectorId: 'sec-acceso-juan-pablo',
  },
  {
    id: 'bld-agropecuarias',
    name: 'Pabellón 100 — Facultad de Ciencias Agropecuarias',
    shortName: 'Cs. Agropecuarias',
    facultyOrUse: 'Aulas, laboratorios y áreas experimentales',
    coords: { lat: -8.11282, lng: -79.03945 },
    local3D: { x: -34, z: -48, width: 22, depth: 11, height: 9, rotationY: 0.1, kind: 'academic' },
    linkedSectorId: 'sec-norte-drenaje',
  },
  {
    id: 'bld-derecho',
    name: 'Pabellón 200 — Facultad de Derecho y Ciencias Políticas',
    shortName: 'Derecho (Pab. 200)',
    facultyOrUse: 'Aulas y auditorio jurídico',
    coords: { lat: -8.11378, lng: -79.03892 },
    local3D: { x: -18, z: -22, width: 24, depth: 11, height: 11, rotationY: 0.08, kind: 'academic' },
    linkedSectorId: 'sec-eje-central',
  },
  {
    id: 'bld-economicas',
    name: 'Pabellón 300 — Facultad de Ciencias Económicas',
    shortName: 'Cs. Económicas (Pab. 300)',
    facultyOrUse: 'Pool de aulas y escuelas profesionales',
    coords: { lat: -8.11442, lng: -79.03835 },
    local3D: { x: 4, z: -4, width: 25, depth: 12, height: 12, rotationY: 0.08, kind: 'academic' },
    linkedSectorId: 'sec-eje-central',
  },
  {
    id: 'bld-educacion',
    name: 'Pabellón 400 — Facultad de Educación y Cs. de la Comunicación',
    shortName: 'Educación (Pab. 400)',
    facultyOrUse: 'Aulas y Auditorio Alberto Moya Obeso',
    coords: { lat: -8.11505, lng: -79.03762 },
    local3D: { x: 26, z: 16, width: 26, depth: 12, height: 11, rotationY: 0.08, kind: 'academic' },
    linkedSectorId: 'sec-sur-america',
  },
  {
    id: 'bld-biblioteca',
    name: 'Biblioteca Central UNT',
    shortName: 'Biblioteca Central',
    facultyOrUse: 'Centro de documentación y salas de lectura',
    coords: { lat: -8.11428, lng: -79.03945 },
    local3D: { x: -32, z: -2, width: 18, depth: 16, height: 13, rotationY: 0.05, kind: 'library' },
  },
  {
    id: 'bld-ingenieria',
    name: 'Complejo de Ingeniería e Ingeniería Química',
    shortName: 'Ingeniería y Química',
    facultyOrUse: 'Laboratorios de ingeniería y talleres',
    coords: { lat: -8.11548, lng: -79.03932 },
    local3D: { x: -24, z: 34, width: 28, depth: 14, height: 10, rotationY: -0.05, kind: 'academic' },
    linkedSectorId: 'sec-sur-talleres',
  },
  {
    id: 'bld-farmacia',
    name: 'Facultades de Farmacia, Bioquímica y Cs. Biológicas',
    shortName: 'Farmacia y Biológicas',
    facultyOrUse: 'Pabellones de ciencias de la vida',
    coords: { lat: -8.11358, lng: -79.03725 },
    local3D: { x: 38, z: -28, width: 22, depth: 12, height: 10, rotationY: 0.12, kind: 'academic' },
    linkedSectorId: 'sec-este-nazareth',
  },
  {
    id: 'bld-fisica-mate',
    name: 'Facultad de Ciencias Físicas y Matemáticas',
    shortName: 'Cs. Físicas y Matemáticas',
    facultyOrUse: 'Aulas y centros de cómputo',
    coords: { lat: -8.11486, lng: -79.03655 },
    local3D: { x: 56, z: 8, width: 20, depth: 11, height: 10, rotationY: 0.1, kind: 'academic' },
    linkedSectorId: 'sec-este-nazareth',
  },
  {
    id: 'bld-estadio',
    name: 'Estadio Universitario UNT',
    shortName: 'Estadio Universitario',
    facultyOrUse: 'Campo deportivo y explanada abierta',
    coords: { lat: -8.11625, lng: -79.03815 },
    local3D: { x: 14, z: 54, width: 42, depth: 28, height: 7, rotationY: 0.06, kind: 'stadium' },
    linkedSectorId: 'sec-sur-america',
  },
  {
    id: 'bld-puerta-nazareth',
    name: 'Acceso Av. Jesús de Nazareth',
    shortName: 'Puerta J. de Nazareth',
    facultyOrUse: 'Ingreso peatonal y salida sector noreste',
    coords: { lat: -8.11245, lng: -79.03735 },
    local3D: { x: 34, z: -62, width: 11, depth: 5, height: 5.5, rotationY: -0.2, kind: 'gate' },
  },
];

/**
 * POLÍGONOS DEMOSTRATIVOS
 * No representan un estudio hidrológico oficial; permiten visualizar el funcionamiento
 * de las capas GIS, niveles de riesgo y el simulador de lluvias en el prototipo.
 */
export const DEMO_RISK_SECTORS: CampusSectorFeature[] = [
  {
    id: 'sec-sur-america',
    name: 'Sector Sur — Depresión Colindante a Av. América Sur',
    sectorCode: 'DEMO-S01',
    hazardType: 'inundacion',
    technicalCategory: 'riesgo',
    riskLevel: 'muy_alto',
    validationStatus: 'demostrativo',
    isDemoData: true,
    description:
      'Polígono demostrativo en zona baja del cuadrante sur del campus. Simula comportamiento de escorrentía superficial ante lluvias extraordinarias asociadas a eventos El Niño.',
    possibleConsequences: [
      'Anegamiento progresivo en accesos peatonales de planta baja.',
      'Dificultad para el tránsito vehicular hacia Av. América Sur.',
      'Posible afectación temporal a instalaciones eléctricas ubicadas a nivel de piso.',
    ],
    recommendations: [
      'Evitar transitar por zonas con lámina de agua mayor a 15 cm.',
      'Desplazarse hacia el Punto de Encuentro Explanada Biblioteca o Zona Norte elevada.',
      'No manipular tableros eléctricos húmedos y reportar incidencias a Seguridad UNT.',
    ],
    source: 'Datos demostrativos UNT SafeZone (pendiente estudio oficial CENEPRED/UNT)',
    updatedAt: '2026-11-13 18:30 PET',
    polygon: [
      [-8.1154, -79.03895],
      [-8.11525, -79.03715],
      [-8.11675, -79.03725],
      [-8.11685, -79.03915],
    ],
    center: { lat: -8.11605, lng: -79.03812 },
    baseWaterDepthM: 0.55,
    intensityMultiplier: { normal: 0.15, intensa: 0.72, elnino: 1.25 },
    nearbyBuildings: ['Pabellón 400 — Educación', 'Estadio Universitario UNT'],
  },
  {
    id: 'sec-sur-talleres',
    name: 'Sector Suroeste — Zona de Talleres y Laboratorios',
    sectorCode: 'DEMO-S02',
    hazardType: 'acumulacion',
    technicalCategory: 'peligro',
    riskLevel: 'alto',
    validationStatus: 'demostrativo',
    isDemoData: true,
    description:
      'Área demostrativa de susceptibilidad a acumulación pluvial por baja pendiente y escorrentía proveniente de vías perimetrales.',
    possibleConsequences: [
      'Formación de charcos profundos en patios de maniobra y senderos.',
      'Riesgo de resbalones en rampas y escalinatas descubiertas.',
      'Aislamiento temporal de salidas secundarias hacia el lado oeste.',
    ],
    recommendations: [
      'Utilizar pasarelas elevadas o aceras principales para salir hacia el eje central.',
      'Resguardar equipos de laboratorio en mesas altas ante pronóstico de lluvia fuerte.',
      'Seguir señalización preventiva instalada por brigadistas de facultad.',
    ],
    source: 'Datos demostrativos UNT SafeZone (referencia topográfica base)',
    updatedAt: '2026-11-13 18:30 PET',
    polygon: [
      [-8.11505, -79.04025],
      [-8.1150, -79.03898],
      [-8.11635, -79.03918],
      [-8.11625, -79.04038],
    ],
    center: { lat: -8.11566, lng: -79.03969 },
    baseWaterDepthM: 0.36,
    intensityMultiplier: { normal: 0.1, intensa: 0.55, elnino: 0.95 },
    nearbyBuildings: ['Complejo de Ingeniería e Ingeniería Química'],
  },
  {
    id: 'sec-acceso-juan-pablo',
    name: 'Borde Oeste — Acceso Av. Juan Pablo II',
    sectorCode: 'DEMO-O01',
    hazardType: 'acumulacion',
    technicalCategory: 'susceptibilidad',
    riskLevel: 'alto',
    validationStatus: 'demostrativo',
    isDemoData: true,
    description:
      'Sector demostrativo que representa la vulnerabilidad de ingreso de escorrentía urbana desde la Av. Juan Pablo II durante precipitaciones sostenidas.',
    possibleConsequences: [
      'Congestión peatonal en la puerta principal por formación de espejos de agua.',
      'Salpicaduras y reducción de visibilidad en cruces vehiculares externos.',
    ],
    recommendations: [
      'Ingresar y salir utilizando los senderos peatonales elevados.',
      'Esperar la disminución de la lluvia en zonas cubiertas antes de cruzar la avenida.',
    ],
    source: 'Datos demostrativos UNT SafeZone (referencia vial OSM)',
    updatedAt: '2026-11-13 18:30 PET',
    polygon: [
      [-8.11315, -79.04125],
      [-8.1132, -79.04015],
      [-8.11445, -79.04018],
      [-8.1144, -79.04128],
    ],
    center: { lat: -8.1138, lng: -79.04071 },
    baseWaterDepthM: 0.32,
    intensityMultiplier: { normal: 0.08, intensa: 0.48, elnino: 0.85 },
    nearbyBuildings: ['Puerta Principal — Av. Juan Pablo II'],
  },
  {
    id: 'sec-eje-central',
    name: 'Corredor Académico Central — Pabellones 200 y 300',
    sectorCode: 'DEMO-C01',
    hazardType: 'lluvia_intensa',
    technicalCategory: 'susceptibilidad',
    riskLevel: 'medio',
    validationStatus: 'demostrativo',
    isDemoData: true,
    description:
      'Zona demostrativa de tránsito intensivo entre pabellones centrales. Presenta riesgo medio por drenaje puntual de techos y patios internos durante lluvias intensas.',
    possibleConsequences: [
      'Saturación momentánea de canaletas y bajantes pluviales.',
      'Pisos resbaladizos en pasadizos exteriores semiabiertos.',
    ],
    recommendations: [
      'Desplazarse con calzado antideslizante y evitar correr bajo lluvia fuerte.',
      'Mantener despejados los sumideros y rejillas de patios centrales.',
    ],
    source: 'Datos demostrativos UNT SafeZone',
    updatedAt: '2026-11-13 18:30 PET',
    polygon: [
      [-8.11352, -79.03922],
      [-8.11358, -79.03795],
      [-8.11472, -79.03802],
      [-8.11468, -79.03925],
    ],
    center: { lat: -8.11412, lng: -79.03861 },
    baseWaterDepthM: 0.18,
    intensityMultiplier: { normal: 0.04, intensa: 0.3, elnino: 0.58 },
    nearbyBuildings: ['Derecho (Pab. 200)', 'Cs. Económicas (Pab. 300)'],
  },
  {
    id: 'sec-este-nazareth',
    name: 'Sector Este — Colindante a Av. Jesús de Nazareth',
    sectorCode: 'DEMO-E01',
    hazardType: 'lluvia_intensa',
    technicalCategory: 'peligro',
    riskLevel: 'medio',
    validationStatus: 'demostrativo',
    isDemoData: true,
    description:
      'Polígono demostrativo en el flanco este del campus. Modela escorrentía moderada y posibles filtraciones en coberturas ligeras ante precipitaciones intensas.',
    possibleConsequences: [
      'Goteras o filtraciones en techos livianos o pasillos antiguos.',
      'Acumulación menor en estacionamientos cercanos a la vía perimetral.',
    ],
    recommendations: [
      'Ubicar material académico lejos de ventanas sin sellado hermético.',
      'Usar las rutas internas pavimentadas hacia la Plazuela Central.',
    ],
    source: 'Datos demostrativos UNT SafeZone',
    updatedAt: '2026-11-13 18:30 PET',
    polygon: [
      [-8.11312, -79.03762],
      [-8.11315, -79.03612],
      [-8.11508, -79.03618],
      [-8.11504, -79.03768],
    ],
    center: { lat: -8.1141, lng: -79.0369 },
    baseWaterDepthM: 0.2,
    intensityMultiplier: { normal: 0.05, intensa: 0.34, elnino: 0.62 },
    nearbyBuildings: ['Farmacia y Biológicas', 'Cs. Físicas y Matemáticas'],
  },
  {
    id: 'sec-norte-drenaje',
    name: 'Sector Norte — Jardines y Pabellón 100',
    sectorCode: 'DEMO-N01',
    hazardType: 'inundacion',
    technicalCategory: 'susceptibilidad',
    riskLevel: 'medio',
    validationStatus: 'demostrativo',
    isDemoData: true,
    description:
      'Área demostrativa con presencia de suelos permeables y jardines que amortiguan parte de la lluvia, aunque puede saturarse tras lluvias continuas.',
    possibleConsequences: [
      'Encharcamiento en senderos de tierra o césped saturado.',
      'Pérdida de tracción en caminos no pavimentados.',
    ],
    recommendations: [
      'Transitar únicamente por veredas afirmadas de concreto.',
      'Evitar permanecer bajo árboles añosos durante vientos fuertes.',
    ],
    source: 'Datos demostrativos UNT SafeZone',
    updatedAt: '2026-11-13 18:30 PET',
    polygon: [
      [-8.11215, -79.03995],
      [-8.11218, -79.03835],
      [-8.11328, -79.03842],
      [-8.11325, -79.04002],
    ],
    center: { lat: -8.11271, lng: -79.03918 },
    baseWaterDepthM: 0.16,
    intensityMultiplier: { normal: 0.04, intensa: 0.28, elnino: 0.52 },
    nearbyBuildings: ['Pabellón 100 — Cs. Agropecuarias'],
  },
];

/**
 * ZONAS SEGURAS Y PUNTOS DE ENCUENTRO (REFERENCIALES / DEMOSTRATIVOS)
 * Capacidad y validación institucional declaradas con transparencia.
 */
export const SAFE_ZONES: SafeZoneFeature[] = [
  {
    id: 'sz-explanada-biblioteca',
    name: 'Explanada Alta — Biblioteca Central',
    type: 'zona_segura',
    coords: { lat: -8.11428, lng: -79.03968 },
    local3D: { x: -40, z: -2 },
    validationStatus: 'referencial',
    isDemoData: true,
    capacityLabel: 'Pendiente de validación técnica (Ref. ~450 personas)',
    accessibility: 'Rampas peatonales y acceso directo desde vía principal',
    isEnabled: true,
    elevationNote: 'Plataforma elevada +0.85 m respecto a vías bajas del sector sur',
    description:
      'Espacio amplio y sobreelevado frente a la Biblioteca Central, propuesto como zona de resguardo referencial en el prototipo.',
    recommendations: [
      'Mantener libres las rampas de acceso para personas con movilidad reducida.',
      'Permanecer alejado de fachadas con ventanales ante sismos o ráfagas.',
    ],
    source: 'Propuesta referencial UNT SafeZone (requiere acta de Defensa Civil UNT)',
    updatedAt: '2026-11-13 18:30 PET',
    validatedRouteId: 'route-sur-biblioteca',
  },
  {
    id: 'sz-plazuela-central',
    name: 'Plazuela Cívica Central',
    type: 'zona_segura',
    coords: { lat: -8.11392, lng: -79.03805 },
    local3D: { x: 14, z: -16 },
    validationStatus: 'referencial',
    isDemoData: true,
    capacityLabel: 'Pendiente de validación técnica (Ref. ~600 personas)',
    accessibility: 'Superficie plana pavimentada con 4 accesos despejados',
    isEnabled: true,
    elevationNote: 'Nivel intermedio con pendiente de drenaje hacia canaleta perimetral',
    description:
      'Área cívica abierta equidistante a Derecho, Económicas y Farmacia. Marcada como referencia segura para concentración ordenada.',
    recommendations: [
      'Organizarse por facultad o escuela siguiendo indicaciones de brigadistas.',
      'Mantener despejado el corredor vehicular central para unidades de emergencia.',
    ],
    source: 'Propuesta referencial UNT SafeZone (requiere validación oficial)',
    updatedAt: '2026-11-13 18:30 PET',
    validatedRouteId: 'route-este-plazuela',
  },
  {
    id: 'pe-puerta-nazareth',
    name: 'Punto de Encuentro — Acceso Jesús de Nazareth',
    type: 'punto_encuentro',
    coords: { lat: -8.11258, lng: -79.03745 },
    local3D: { x: 30, z: -56 },
    validationStatus: 'referencial',
    isDemoData: true,
    capacityLabel: 'Pendiente de validación técnica (Ref. ~250 personas)',
    accessibility: 'Acceso directo a nivel de vereda exterior',
    isEnabled: true,
    elevationNote: 'Cota media-alta en el cuadrante noreste',
    description:
      'Punto de encuentro referencial para evacuación ordenada hacia la Av. Jesús de Nazareth cuando el cuadrante sur presenta aniegos.',
    recommendations: [
      'Verificar condiciones del tránsito vehicular externo antes de salir del campus.',
      'Reportar asistencia al responsable de aula o brigada.',
    ],
    source: 'Datos demostrativos UNT SafeZone',
    updatedAt: '2026-11-13 18:30 PET',
  },
  {
    id: 'pe-patio-norte',
    name: 'Punto de Encuentro — Patio Norte Agropecuarias',
    type: 'punto_encuentro',
    coords: { lat: -8.11292, lng: -79.03982 },
    local3D: { x: -46, z: -44 },
    validationStatus: 'pendiente_validacion',
    isDemoData: true,
    capacityLabel: 'Sin aforo validado — Inspección técnica pendiente',
    accessibility: 'Vereda parcial; requiere verificación de rampa',
    isEnabled: false,
    elevationNote: 'Sujeto a inspección de drenaje tras lluvias continuas',
    description:
      'Espacio preliminar en evaluación. Se muestra como inhabilitado temporalmente para reflejar el control estricto de validación antes de habilitar zonas.',
    recommendations: [
      'No dirigir evacuaciones masivas hacia este punto hasta contar con validación oficial.',
      'Utilizar preferentemente la Explanada Alta — Biblioteca Central.',
    ],
    source: 'Registro preliminar UNT SafeZone (pendiente de validación)',
    updatedAt: '2026-11-13 18:30 PET',
  },
];

/**
 * RUTAS DE EVACUACIÓN
 * Solo las rutas con validatedByAuthority === true se trazan en el mapa como
 * rutas de evacuación habilitadas en el prototipo.
 */
export const EVACUATION_ROUTES: EvacuationRouteFeature[] = [
  {
    id: 'route-sur-biblioteca',
    name: 'Ruta Demostrativa 1: Sector Sur → Explanada Biblioteca Central',
    originSectorName: 'Pabellón 400 / Ingeniería',
    targetSafeZoneId: 'sz-explanada-biblioteca',
    targetSafeZoneName: 'Explanada Alta — Biblioteca Central',
    validatedByAuthority: true,
    validationNote:
      'Ruta de ejemplo habilitada en prototipo sobre sendero peatonal elevado (sujeta a ratificación oficial de Seguridad UNT).',
    estimatedMinutes: 4,
    distanceMeters: 280,
    coordinates: [
      [-8.11548, -79.03892],
      [-8.11495, -79.03922],
      [-8.11455, -79.03952],
      [-8.11428, -79.03968],
    ],
    source: 'Trazado demostrativo UNT SafeZone',
    updatedAt: '2026-11-13 18:30 PET',
  },
  {
    id: 'route-este-plazuela',
    name: 'Ruta Demostrativa 2: Sector Este → Plazuela Cívica Central',
    originSectorName: 'Farmacia / Cs. Físicas y Matemáticas',
    targetSafeZoneId: 'sz-plazuela-central',
    targetSafeZoneName: 'Plazuela Cívica Central',
    validatedByAuthority: true,
    validationNote:
      'Ruta de ejemplo habilitada en prototipo por corredor pavimentado central (sujeta a ratificación oficial).',
    estimatedMinutes: 3,
    distanceMeters: 210,
    coordinates: [
      [-8.11472, -79.03678],
      [-8.11428, -79.03735],
      [-8.11398, -79.03782],
      [-8.11392, -79.03805],
    ],
    source: 'Trazado demostrativo UNT SafeZone',
    updatedAt: '2026-11-13 18:30 PET',
  },
  {
    id: 'route-norte-pendiente',
    name: 'Corredor Preliminar Norte (No validado)',
    originSectorName: 'Pabellón 100 — Cs. Agropecuarias',
    targetSafeZoneId: 'pe-patio-norte',
    targetSafeZoneName: 'Punto de Encuentro — Patio Norte Agropecuarias',
    validatedByAuthority: false,
    validationNote:
      'No se traza como ruta de evacuación activa porque aún no cuenta con validación técnica de las autoridades responsables.',
    estimatedMinutes: 3,
    distanceMeters: 165,
    coordinates: [
      [-8.11282, -79.03945],
      [-8.11292, -79.03982],
    ],
    source: 'Borrador interno pendiente de inspección',
    updatedAt: '2026-11-13 18:30 PET',
  },
];

export const PREVENTIVE_ALERTS: AlertItem[] = [
  {
    id: 'alert-lluvias',
    title: 'Lluvias intensas — Mantente informado y evita acumulación de agua',
    alertType: 'Alerta hidrometeorológica demostrativa',
    severity: 'alta',
    affectedZone: 'Sector Sur (Av. América Sur) y Talleres de Ingeniería',
    timestamp: '13 nov 2026 · 18:15 PET',
    description:
      'Simulación de incremento de precipitaciones vespertinas sobre el área metropolitana de Trujillo con potencial formación de charcos en cotas bajas.',
    actionRecommendation:
      'Mantente informado por canales institucionales y evita transitar por sectores con acumulación de agua o drenaje lento.',
    isSimulatedPrototype: true,
    source: 'Ejemplo simulado del prototipo UNT SafeZone',
    activeScenarios: ['normal', 'intensa', 'elnino'],
  },
  {
    id: 'alert-inundacion',
    title: 'Riesgo de inundación — Evita transitar por zonas vulnerables',
    alertType: 'Alerta de escorrentía superficial',
    severity: 'critica',
    affectedZone: 'Cuadrante Sur · Estadio Universitario y Pabellón 400',
    timestamp: '13 nov 2026 · 18:25 PET',
    description:
      'Durante el escenario simulado de evento El Niño, la escorrentía puede superar la capacidad de evacuación pluvial en zonas bajas del campus.',
    actionRecommendation:
      'Evita transitar por zonas identificadas como vulnerables y prioriza el desplazamiento hacia la Explanada Alta de Biblioteca Central.',
    isSimulatedPrototype: true,
    source: 'Ejemplo simulado del prototipo UNT SafeZone',
    activeScenarios: ['intensa', 'elnino'],
  },
  {
    id: 'alert-preventiva',
    title: 'Alerta preventiva — Identifica puntos de encuentro y rutas',
    alertType: 'Orientación comunitaria preventiva',
    severity: 'preventiva',
    affectedZone: 'Toda la Ciudad Universitaria UNT',
    timestamp: '13 nov 2026 · 17:40 PET',
    description:
      'Recordatorio permanente para estudiantes, docentes y personal administrativo sobre el reconocimiento previo de rutas de evacuación y espacios seguros.',
    actionRecommendation:
      'Identifica los puntos de encuentro más cercanos a tu facultad antes de iniciar clases o actividades en laboratorio.',
    isSimulatedPrototype: false,
    source: 'Aviso preventivo institucional de referencia (UNT SafeZone)',
    activeScenarios: ['normal', 'intensa', 'elnino'],
  },
];

export const WEATHER_BY_SCENARIO: Record<RainScenario, WeatherSnapshot> = {
  normal: {
    locationName: 'Trujillo — Ciudad Universitaria UNT',
    updatedAt: '13 nov 2026 · 18:30 PET',
    sourceLabel: 'Datos referenciales de prototipo (sin conexión en vivo a SENAMHI)',
    isLiveApiConnected: false,
    currentTempC: 22.4,
    feelsLikeC: 23.0,
    precipProbabilityPct: 20,
    rainIntensityLabel: 'Llovizna ligera aislada',
    rainRateMmH: 0.4,
    humidityPct: 76,
    windKmh: 14,
    advisoryTitle: 'Vigilancia meteorológica preventiva activa',
    advisorySummary:
      'Condiciones estables con nubosidad costera. Se recomienda revisar canales de drenaje y ubicar las zonas seguras del campus como medida preventiva.',
    forecast: [
      { dayLabel: 'Hoy', dateLabel: '13 nov', condition: 'Nublado parcial', iconKind: 'cloud-sun', tempMaxC: 24, tempMinC: 17, precipProbPct: 20, rainMm: 0.4 },
      { dayLabel: 'Sáb', dateLabel: '14 nov', condition: 'Llovizna aislada', iconKind: 'cloud-rain', tempMaxC: 23, tempMinC: 17, precipProbPct: 45, rainMm: 2.1 },
      { dayLabel: 'Dom', dateLabel: '15 nov', condition: 'Cielo cubierto', iconKind: 'cloud-sun', tempMaxC: 23, tempMinC: 16, precipProbPct: 30, rainMm: 0.8 },
      { dayLabel: 'Lun', dateLabel: '16 nov', condition: 'Parcial soleado', iconKind: 'sun', tempMaxC: 25, tempMinC: 17, precipProbPct: 15, rainMm: 0.0 },
    ],
  },
  intensa: {
    locationName: 'Trujillo — Ciudad Universitaria UNT (Simulación)',
    updatedAt: '13 nov 2026 · 18:30 PET (Escenario simulado)',
    sourceLabel: 'Escenario demostrativo de lluvia intensa (no conectado a SENAMHI)',
    isLiveApiConnected: false,
    currentTempC: 24.8,
    feelsLikeC: 26.2,
    precipProbabilityPct: 80,
    rainIntensityLabel: 'Lluvia moderada a fuerte',
    rainRateMmH: 14.5,
    humidityPct: 89,
    windKmh: 22,
    advisoryTitle: 'Advertencia demostrativa: Lluvias intensas en curso',
    advisorySummary:
      'Escenario de prueba con acumulación rápida en pavimentos de baja pendiente. Evita el cuadrante sur y usa senderos elevados.',
    forecast: [
      { dayLabel: 'Hoy', dateLabel: '13 nov', condition: 'Lluvia fuerte', iconKind: 'cloud-rain', tempMaxC: 25, tempMinC: 19, precipProbPct: 85, rainMm: 18.5 },
      { dayLabel: 'Sáb', dateLabel: '14 nov', condition: 'Chubascos', iconKind: 'cloud-rain', tempMaxC: 24, tempMinC: 19, precipProbPct: 75, rainMm: 12.0 },
      { dayLabel: 'Dom', dateLabel: '15 nov', condition: 'Nublado húmedo', iconKind: 'cloud-sun', tempMaxC: 24, tempMinC: 18, precipProbPct: 40, rainMm: 3.2 },
      { dayLabel: 'Lun', dateLabel: '16 nov', condition: 'Mejora gradual', iconKind: 'cloud-sun', tempMaxC: 25, tempMinC: 18, precipProbPct: 25, rainMm: 0.5 },
    ],
  },
  elnino: {
    locationName: 'Trujillo — Ciudad Universitaria UNT (Simulación El Niño)',
    updatedAt: '13 nov 2026 · 18:30 PET (Escenario simulado)',
    sourceLabel: 'Escenario demostrativo Fenómeno El Niño (no conectado a SENAMHI)',
    isLiveApiConnected: false,
    currentTempC: 27.6,
    feelsLikeC: 30.1,
    precipProbabilityPct: 95,
    rainIntensityLabel: 'Precipitación torrencial simulada',
    rainRateMmH: 36.0,
    humidityPct: 94,
    windKmh: 31,
    advisoryTitle: 'Advertencia demostrativa: Evento extremo de lluvias tipo El Niño',
    advisorySummary:
      'Simulación de estrés hídrico para evaluar respuesta universitaria: aniegos severos en sectores sur/suroeste y activación prioritaria de Explanada Biblioteca.',
    forecast: [
      { dayLabel: 'Hoy', dateLabel: '13 nov', condition: 'Tormenta pluvial', iconKind: 'storm', tempMaxC: 28, tempMinC: 22, precipProbPct: 95, rainMm: 42.0 },
      { dayLabel: 'Sáb', dateLabel: '14 nov', condition: 'Lluvia muy fuerte', iconKind: 'storm', tempMaxC: 27, tempMinC: 21, precipProbPct: 90, rainMm: 31.5 },
      { dayLabel: 'Dom', dateLabel: '15 nov', condition: 'Lluvias persistentes', iconKind: 'cloud-rain', tempMaxC: 26, tempMinC: 21, precipProbPct: 80, rainMm: 19.0 },
      { dayLabel: 'Lun', dateLabel: '16 nov', condition: 'Chubascos dispersos', iconKind: 'cloud-rain', tempMaxC: 26, tempMinC: 20, precipProbPct: 60, rainMm: 7.4 },
    ],
  },
};

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'ec-seguridad-unt',
    name: 'Central de Seguridad y Vigilancia UNT',
    role: 'Atención interna en Ciudad Universitaria',
    phone: 'Anexo interno UNT (Referencial)',
    note: 'Acudir al módulo de Puerta Principal Av. Juan Pablo II o contactar al brigadista de tu facultad.',
  },
  {
    id: 'ec-bomberos',
    name: 'Cuerpo General de Bomberos Voluntarios',
    role: 'Emergencias, rescates e inundaciones',
    phone: '116',
    note: 'Línea gratuita nacional de emergencias.',
  },
  {
    id: 'ec-pnp',
    name: 'Policía Nacional del Perú — Emergencias',
    role: 'Apoyo en seguridad y control perimetral',
    phone: '105',
    note: 'Línea gratuita nacional.',
  },
  {
    id: 'ec-samu',
    name: 'SAMU — Atención Médica Móvil de Urgencia',
    role: 'Emergencias médicas y traslados',
    phone: '106',
    note: 'Atención prehospitalaria gratuita.',
  },
];

export interface PreventionTopic {
  id: string;
  title: string;
  subtitle: string;
  steps: string[];
  keyReminder: string;
}

export const PREVENTION_TOPICS: PreventionTopic[] = [
  {
    id: 'antes',
    title: '¿Qué hacer antes de una inundación?',
    subtitle: 'Preparación en facultades, aulas y laboratorios',
    steps: [
      'Identifica en el mapa de UNT SafeZone las zonas bajas cercanas a tu pabellón y el punto de encuentro más alto.',
      'Ubica documentos, equipos de cómputo e insumos de laboratorio por encima de los 50 cm del nivel del piso.',
      'Reporta rejillas, sumideros o canaletas obstruidas en patios internos ante la administración de tu facultad.',
      'Guarda en tu teléfono los números de emergencia (116, 105, 106) y mantén batería suficiente en días de alerta.',
    ],
    keyReminder: 'La prevención reduce el tiempo de reacción de minutos críticos a segundos.',
  },
  {
    id: 'durante',
    title: '¿Qué hacer durante lluvias intensas?',
    subtitle: 'Conducta segura mientras permaneces en el campus',
    steps: [
      'Permanece bajo techo en edificaciones de material noble con drenaje verificado si la lluvia es intensa.',
      'Evita guarecerte debajo de árboles altos, estructuras metálicas ligeras o postes de alumbrado.',
      'No cruces patios anegados ni corras sobre superficies mojadas o escaleras descubiertas.',
      'Consulta los avisos oficiales universitarios antes de iniciar desplazamientos hacia las puertas de salida.',
    ],
    keyReminder: 'Si no es urgente desplazarte, espera en un piso superior seguro hasta que baje la intensidad.',
  },
  {
    id: 'inundando',
    title: '¿Qué hacer si una zona comienza a inundarse?',
    subtitle: 'Acción inmediata ante ingreso de agua',
    steps: [
      'Aléjate de inmediato de tomacorrientes, extensiones en el suelo, tableros eléctricos y equipos conectados.',
      'Si estás en planta baja o sótano y el agua sube rápidamente, trasládate ordenadamente a pisos superiores o zonas altas.',
      'Nunca camines por corrientes de agua en movimiento; 15 cm de flujo rápido pueden hacer perder el equilibrio.',
      'Avisa a docentes, brigadistas y personal de seguridad sobre personas con movilidad reducida que requieran apoyo.',
    ],
    keyReminder: 'Prioriza siempre tu integridad física por encima de pertenencias materiales.',
  },
  {
    id: 'evacuar',
    title: '¿Cómo evacuar de manera segura?',
    subtitle: 'Desplazamiento hacia zonas seguras y puntos de encuentro',
    steps: [
      'Utiliza únicamente rutas de evacuación habilitadas y caminos pavimentados elevados visibles.',
      'Camina con paso firme en fila ordenada; evita empujar o bloquear rampas y puertas de acceso.',
      'Ayuda a compañeros que necesiten asistencia sin obstaculizar el flujo principal de salida.',
      'Al llegar al punto de encuentro, permanece en el área designada y confirma tu ubicación con el encargado de grupo.',
    ],
    keyReminder: 'Verifica en UNT SafeZone si la ruta cuenta con validación técnica antes de usar corredores secundarios.',
  },
];

export const EMERGENCY_BACKPACK_ITEMS = [
  { id: 'bp-water', label: 'Agua embotellada (mínimo 1 L por persona para uso inmediato)' },
  { id: 'bp-doc', label: 'DNI, carné universitario y copia digital protegida en bolsa hermética' },
  { id: 'bp-light', label: 'Linterna LED impermeable y pilas de repuesto' },
  { id: 'bp-power', label: 'Cargador portátil (power bank) cargado y cable USB' },
  { id: 'bp-firstaid', label: 'Botiquín básico: gasas, alcohol, curitas y medicación personal' },
  { id: 'bp-whistle', label: 'Silbato de emergencia para señalización sonora' },
  { id: 'bp-poncho', label: 'Poncho impermeable ligero y mascarilla de repuesto' },
  { id: 'bp-food', label: 'Barras energéticas o alimentos no perecibles sellados' },
];
