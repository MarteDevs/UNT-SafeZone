import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type {
  CampusBuilding,
  CampusSectorFeature,
  EvacuationRouteFeature,
  LayerFilter,
  RainScenario,
  SafeZoneFeature,
} from '../types/gis';

// Module-scope scratch math helpers (Zero GC inside render loop)
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _colorTarget = new THREE.Color();
const _dummy = new THREE.Object3D();

export type CameraPresetKey = 'general' | 'sur' | 'seguras' | 'aerea';

export interface Campus3DConfig {
  buildings: CampusBuilding[];
  sectors: CampusSectorFeature[];
  safeZones: SafeZoneFeature[];
  routes: EvacuationRouteFeature[];
  onSelectSector: (sectorId: string) => void;
  onSelectSafeZone: (zoneId: string) => void;
  onHoverLabel: (label: string | null) => void;
}

export interface Campus3DHandle {
  updateState: (params: {
    rainScenario: RainScenario;
    activeFilter: LayerFilter;
    selectedId: string | null;
  }) => void;
  setCameraPreset: (preset: CameraPresetKey) => void;
  focusPoint: (x: number, z: number) => void;
  dispose: () => void;
}

const CAMERA_PRESETS: Record<
  CameraPresetKey,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  general: { pos: [-78, 68, 92], target: [4, 2, 4] },
  sur: { pos: [-38, 34, 96], target: [6, 1, 36] },
  seguras: { pos: [-68, 44, -22], target: [-12, 2, -6] },
  aerea: { pos: [0, 145, 22], target: [0, 0, 0] },
};

const RISK_HEX: Record<string, number> = {
  muy_alto: 0xdc2626,
  alto: 0xea580c,
  medio: 0xca8a04,
  bajo: 0x16a34a,
};

/**
 * Converts campus lat/lng into local 3D scene meters centered on Ciudad Universitaria UNT.
 */
export function latLngToLocal3D(lat: number, lng: number): [number, number] {
  const centerLat = -8.114656;
  const centerLng = -79.038595;
  const metersPerLat = 110600;
  const metersPerLng = 111320 * Math.cos((centerLat * Math.PI) / 180);
  const x = (lng - centerLng) * metersPerLng * 0.25;
  const z = -(lat - centerLat) * metersPerLat * 0.25;
  return [x, z];
}

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createCampusGroundTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base urban campus lawn and paved courtyard canvas
  ctx.fillStyle = '#dde5dc';
  ctx.fillRect(0, 0, size, size);

  // Subtle topographic grid lines
  ctx.strokeStyle = 'rgba(15, 41, 66, 0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Green campus quadrants
  const greens = [
    [220, 170, 560, 620],
    [260, 220, 220, 180],
    [540, 210, 220, 190],
    [270, 440, 210, 170],
    [540, 440, 230, 170],
  ];
  ctx.fillStyle = '#c8dcc6';
  for (const [x, y, w, h] of greens) {
    ctx.fillRect(x, y, w, h);
  }

  // Internal paved campus walkways & Central Plaza
  ctx.fillStyle = '#e8ecf1';
  ctx.fillRect(210, 395, 600, 34); // Horizontal central walkway
  ctx.fillRect(492, 165, 36, 610); // North-South spine
  ctx.fillRect(310, 200, 24, 520); // West walkway
  ctx.fillRect(675, 210, 24, 480); // East walkway

  // Central Plazuela circle
  ctx.beginPath();
  ctx.arc(510, 412, 46, 0, Math.PI * 2);
  ctx.fillStyle = '#f1f5f9';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  // Perimeter avenues (Av. Juan Pablo II, Av. Jesús de Nazareth, Av. América Sur)
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 30;
  ctx.beginPath();
  ctx.moveTo(155, 860);
  ctx.lineTo(175, 145); // Av. Juan Pablo II (West)
  ctx.lineTo(845, 130); // Av. Jesús de Nazareth (North-East)
  ctx.lineTo(875, 840);
  ctx.lineTo(155, 860); // Av. América Sur (South)
  ctx.stroke();

  // Avenue lane dashes
  ctx.setLineDash([14, 14]);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);

  // Subtle contour curves on low-lying southern drainage zone
  ctx.strokeStyle = 'rgba(37, 99, 235, 0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(540, 725, 175, 70, 0.05, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createPitchTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#3f8f4e' : '#4a9e59';
    ctx.fillRect(i * (512 / 10), 0, 512 / 10, 256);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 18, 472, 220);
  ctx.beginPath();
  ctx.moveTo(256, 18);
  ctx.lineTo(256, 238);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 128, 34, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Composite 6-part Academic Building Group (plinth, main block, upper wing,
 * contrasting glass ribbon, entrance portico with columns, rooftop unit)
 */
function buildAcademicGroup(
  building: CampusBuilding,
  materials: {
    plinth: THREE.Material;
    wall: THREE.Material;
    roof: THREE.Material;
    glass: THREE.Material;
    metalTrim: THREE.Material;
  },
): THREE.Group {
  const { width, depth, height } = building.local3D;
  const group = new THREE.Group();

  // 1. Grounded stepped concrete plinth (flush at y = 0)
  const plinthGeo = new THREE.BoxGeometry(width + 1.4, 0.5, depth + 1.4);
  const plinth = new THREE.Mesh(plinthGeo, materials.plinth);
  plinth.position.y = 0.25;
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  group.add(plinth);

  // 2. Main extruded beveled building body
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hd = depth / 2;
  shape.moveTo(-hw, -hd);
  shape.lineTo(hw, -hd);
  shape.lineTo(hw, hd);
  shape.lineTo(-hw, hd);
  shape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: height - 1.2,
    bevelEnabled: true,
    bevelThickness: 0.22,
    bevelSize: 0.22,
    bevelSegments: 2,
  });
  bodyGeo.rotateX(-Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, materials.wall);
  body.position.y = 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // 3. Contrasting recessed glass window ribbon (smooth reflective surface)
  const glassGeo = new THREE.BoxGeometry(width + 0.16, height * 0.42, depth - 1.4);
  const glass = new THREE.Mesh(glassGeo, materials.glass);
  glass.position.y = 0.5 + height * 0.52;
  group.add(glass);

  // 4. Roof cornice & parapet slab
  const roofGeo = new THREE.BoxGeometry(width + 0.8, 0.55, depth + 0.8);
  const roof = new THREE.Mesh(roofGeo, materials.roof);
  roof.position.y = height - 0.15;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  // 5. Entrance canopy + twin support columns
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.34, 0.35, 2.2),
    materials.metalTrim,
  );
  canopy.position.set(0, 2.8, hd + 1.1);
  canopy.castShadow = true;
  group.add(canopy);

  const colGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.5, 10);
  const colL = new THREE.Mesh(colGeo, materials.metalTrim);
  colL.position.set(-width * 0.12, 1.5, hd + 1.8);
  colL.castShadow = true;
  const colR = new THREE.Mesh(colGeo, materials.metalTrim);
  colR.position.set(width * 0.12, 1.5, hd + 1.8);
  colR.castShadow = true;
  group.add(colL, colR);

  // 6. Rooftop HVAC / skylight penthouse detail
  const hvac = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.26, 1.1, depth * 0.32),
    materials.metalTrim,
  );
  hvac.position.set(width * 0.16, height + 0.65, -depth * 0.1);
  hvac.castShadow = true;
  group.add(hvac);

  return group;
}

/**
 * Composite Library Group with octagonal drum & glass lantern roof
 */
function buildLibraryGroup(
  building: CampusBuilding,
  materials: {
    plinth: THREE.Material;
    wall: THREE.Material;
    roof: THREE.Material;
    glass: THREE.Material;
    metalTrim: THREE.Material;
  },
): THREE.Group {
  const { width, depth, height } = building.local3D;
  const group = new THREE.Group();

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.62, width * 0.66, 0.7, 8),
    materials.plinth,
  );
  plinth.position.y = 0.35;
  plinth.receiveShadow = true;
  group.add(plinth);

  const lower = new THREE.Mesh(
    new THREE.BoxGeometry(width, height * 0.62, depth),
    materials.wall,
  );
  lower.position.y = 0.7 + height * 0.31;
  lower.castShadow = true;
  lower.receiveShadow = true;
  group.add(lower);

  const upperDrum = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.42, width * 0.45, height * 0.36, 8),
    materials.glass,
  );
  upperDrum.position.y = 0.7 + height * 0.78;
  upperDrum.castShadow = true;
  group.add(upperDrum);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.32, width * 0.47, 1.1, 8),
    materials.roof,
  );
  cap.position.y = height + 0.6;
  cap.castShadow = true;
  group.add(cap);

  const spire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.25, 2.2, 8),
    materials.metalTrim,
  );
  spire.position.y = height + 2.0;
  group.add(spire);

  return group;
}

/**
 * Composite Stadium Group (oval seating bowl, running track, striped pitch, 4 light towers)
 */
function buildStadiumGroup(
  building: CampusBuilding,
  pitchTex: THREE.CanvasTexture,
  materials: {
    plinth: THREE.Material;
    wall: THREE.Material;
    metalTrim: THREE.Material;
    emissiveLamp: THREE.Material;
  },
): THREE.Group {
  const { width, depth } = building.local3D;
  const group = new THREE.Group();

  // Outer bowl via ExtrudeGeometry with inner pitch cutout
  const outer = new THREE.Shape();
  outer.absellipse(0, 0, width * 0.52, depth * 0.54, 0, Math.PI * 2, false, 0);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, width * 0.37, depth * 0.36, 0, Math.PI * 2, true, 0);
  outer.holes.push(hole);

  const bowlGeo = new THREE.ExtrudeGeometry(outer, {
    depth: 3.4,
    bevelEnabled: true,
    bevelThickness: 0.4,
    bevelSize: 0.4,
    bevelSegments: 2,
  });
  bowlGeo.rotateX(-Math.PI / 2);
  const bowl = new THREE.Mesh(bowlGeo, materials.wall);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  group.add(bowl);

  // Running track ring
  const trackMat = new THREE.MeshStandardMaterial({
    color: 0xb95343,
    roughness: 0.85,
    metalness: 0.05,
  });
  const track = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.36, width * 0.36, 0.14, 28),
    trackMat,
  );
  track.scale.set(1, 1, depth / width);
  track.position.y = 0.07;
  track.receiveShadow = true;
  group.add(track);

  // Pitch with procedural striped CanvasTexture
  const pitchMat = new THREE.MeshStandardMaterial({
    map: pitchTex,
    roughness: 0.88,
    metalness: 0.0,
  });
  const pitch = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.56, depth * 0.48),
    pitchMat,
  );
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.y = 0.16;
  pitch.receiveShadow = true;
  group.add(pitch);

  // 4 Floodlight towers (mast + crossbar + lamp housing)
  const mastGeo = new THREE.CylinderGeometry(0.18, 0.28, 12, 8);
  const headGeo = new THREE.BoxGeometry(2.2, 0.9, 0.5);
  const corners: [number, number][] = [
    [-width * 0.44, -depth * 0.44],
    [width * 0.44, -depth * 0.44],
    [-width * 0.44, depth * 0.44],
    [width * 0.44, depth * 0.44],
  ];
  for (const [cx, cz] of corners) {
    const mast = new THREE.Mesh(mastGeo, materials.metalTrim);
    mast.position.set(cx, 6, cz);
    mast.castShadow = true;
    const head = new THREE.Mesh(headGeo, materials.emissiveLamp);
    head.position.set(cx, 12.2, cz);
    head.lookAt(0, 0, 0);
    group.add(mast, head);
  }

  return group;
}

/**
 * Composite Campus Gate Group (piers, canopy arch, guard booth)
 */
function buildGateGroup(
  building: CampusBuilding,
  materials: {
    plinth: THREE.Material;
    wall: THREE.Material;
    metalTrim: THREE.Material;
    roof: THREE.Material;
  },
): THREE.Group {
  const { width } = building.local3D;
  const group = new THREE.Group();

  const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.3, 4.5), materials.plinth);
  base.position.y = 0.15;
  group.add(base);

  const pierGeo = new THREE.BoxGeometry(1.4, 4.4, 1.4);
  const pLeft = new THREE.Mesh(pierGeo, materials.wall);
  pLeft.position.set(-width * 0.38, 2.35, 0);
  pLeft.castShadow = true;
  const pRight = new THREE.Mesh(pierGeo, materials.wall);
  pRight.position.set(width * 0.38, 2.35, 0);
  pRight.castShadow = true;
  group.add(pLeft, pRight);

  const arch = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.96, 0.9, 2.4),
    materials.roof,
  );
  arch.position.y = 4.9;
  arch.castShadow = true;
  group.add(arch);

  const booth = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 2.4, 2.2),
    materials.metalTrim,
  );
  booth.position.set(-width * 0.22, 1.35, 0.6);
  booth.castShadow = true;
  group.add(booth);

  return group;
}

/**
 * Composite 4-part Safe Zone / Meeting Point Beacon (grounded plinth, mast, collar, floating ring)
 */
function buildSafeMarkerGroup(zone: SafeZoneFeature): {
  group: THREE.Group;
  ring: THREE.Mesh;
} {
  const isSafe = zone.type === 'zona_segura';
  const colorHex = !zone.isEnabled ? 0x64748b : isSafe ? 0x16a34a : 0x2563eb;
  const group = new THREE.Group();
  const [lx, lz] = [zone.local3D.x, zone.local3D.z];
  group.position.set(lx, 0, lz);

  const padMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.7,
    metalness: 0.1,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.25,
    metalness: 0.85,
  });
  const beaconMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.55,
    roughness: 0.2,
    metalness: 0.4,
  });

  // 1. Grounded platform
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 0.32, 24), padMat);
  pad.position.y = 0.16;
  pad.receiveShadow = true;
  group.add(pad);

  // 2. Brushed collar base
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.95, 0.9, 12), metalMat);
  collar.position.y = 0.65;
  collar.castShadow = true;
  group.add(collar);

  // 3. Tapered vertical beacon mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.32, 6.2, 12), metalMat);
  mast.position.y = 3.8;
  mast.castShadow = true;
  group.add(mast);

  // 4. Floating emblem ring / octahedron top
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.2, 12, 28), beaconMat);
  ring.position.y = 7.8;
  group.add(ring);

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 0), beaconMat);
  core.position.y = 7.8;
  group.add(core);

  return { group, ring };
}

export function createCampus3DScene(
  container: HTMLElement,
  config: Campus3DConfig,
): Campus3DHandle {
  const isSoftwareGl = detectSoftwareWebGL();
  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 320);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const skyColor = new THREE.Color(0xdce8f2);
  scene.background = skyColor;
  scene.fog = new THREE.FogExp2(0xdce8f2, 0.0038);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 650);
  camera.position.set(...CAMERA_PRESETS.general.pos);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...CAMERA_PRESETS.general.target);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI / 2 - 0.06;
  controls.minPolarAngle = 0.18;
  controls.minDistance = 28;
  controls.maxDistance = 210;
  controls.update();

  // Lighting rig: Warm directional sun + cool Hemisphere fill + subtle rim
  const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x94a3b8, 0.72);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff3e0, 1.85);
  sunLight.position.set(78, 110, 64);
  sunLight.castShadow = !isSoftwareGl;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 280;
  const d = 105;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight);

  const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.45);
  rimLight.position.set(-70, 42, -80);
  scene.add(rimLight);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  // Extended urban perimeter ground (no floating void edges)
  const outerGround = new THREE.Mesh(
    new THREE.PlaneGeometry(540, 540),
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.95, metalness: 0.0 }),
  );
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.05;
  outerGround.receiveShadow = true;
  scene.add(outerGround);

  // Main Ciudad Universitaria textured plane
  const campusGroundTex = createCampusGroundTexture(maxAniso);
  const campusGround = new THREE.Mesh(
    new THREE.PlaneGeometry(215, 215),
    new THREE.MeshStandardMaterial({
      map: campusGroundTex,
      roughness: 0.88,
      metalness: 0.02,
    }),
  );
  campusGround.rotation.x = -Math.PI / 2;
  campusGround.position.y = 0;
  campusGround.receiveShadow = true;
  scene.add(campusGround);

  // Shared PBR material library (varied roughness/metalness across adjacent parts)
  const materials = {
    plinth: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.82, metalness: 0.08 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.72, metalness: 0.05 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.48, metalness: 0.35 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      roughness: 0.12,
      metalness: 0.25,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    }),
    metalTrim: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.28, metalness: 0.78 }),
    emissiveLamp: new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      emissive: 0xfef08a,
      emissiveIntensity: 0.8,
      roughness: 0.25,
      metalness: 0.4,
    }),
  };

  const pitchTex = createPitchTexture(maxAniso);
  const clickableProxies: THREE.Mesh[] = [];

  // Build composite Campus Buildings
  const buildingGroups = new Map<string, THREE.Group>();
  for (const bld of config.buildings) {
    let grp: THREE.Group;
    if (bld.local3D.kind === 'library') {
      grp = buildLibraryGroup(bld, materials);
    } else if (bld.local3D.kind === 'stadium') {
      grp = buildStadiumGroup(bld, pitchTex, materials);
    } else if (bld.local3D.kind === 'gate') {
      grp = buildGateGroup(bld, materials);
    } else {
      grp = buildAcademicGroup(bld, materials);
    }
    grp.position.set(bld.local3D.x, 0, bld.local3D.z);
    grp.rotation.y = bld.local3D.rotationY ?? 0;
    scene.add(grp);
    buildingGroups.set(bld.id, grp);

    if (bld.linkedSectorId) {
      const proxy = new THREE.Mesh(
        new THREE.BoxGeometry(bld.local3D.width + 2, bld.local3D.height + 2, bld.local3D.depth + 2),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      proxy.position.set(bld.local3D.x, (bld.local3D.height + 2) / 2, bld.local3D.z);
      proxy.rotation.y = bld.local3D.rotationY ?? 0;
      proxy.layers.set(1);
      proxy.userData = {
        kind: 'sector',
        id: bld.linkedSectorId,
        label: bld.name,
      };
      scene.add(proxy);
      clickableProxies.push(proxy);
    }
  }

  // Instanced campus trees (>45 trees with ±15% scale variation & color tinting)
  const treePositions: [number, number][] = [];
  for (let i = -80; i <= 80; i += 14) {
    if (Math.abs(i) > 12) {
      treePositions.push([-84, i], [84, i], [i, -78], [i * 0.85, 82]);
    }
  }
  treePositions.push(
    [-55, -18], [-55, 16], [-10, -45], [16, -40], [45, -10], [45, 22], [-44, 22], [6, 26],
  );
  const treeCount = treePositions.length;
  const trunkInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.24, 0.36, 2.4, 7),
    new THREE.MeshStandardMaterial({ color: 0x6b4f3a, roughness: 0.9, metalness: 0.0 }),
    treeCount,
  );
  const crownInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1.9, 1),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0.0 }),
    treeCount,
  );
  trunkInst.castShadow = !isSoftwareGl;
  crownInst.castShadow = !isSoftwareGl;
  crownInst.receiveShadow = true;

  treePositions.forEach(([tx, tz], idx) => {
    const scaleJitter = 0.85 + ((idx * 17) % 30) / 100;
    _dummy.position.set(tx, 1.2 * scaleJitter, tz);
    _dummy.scale.set(scaleJitter, scaleJitter, scaleJitter);
    _dummy.rotation.set(0, idx * 0.7, 0);
    _dummy.updateMatrix();
    trunkInst.setMatrixAt(idx, _dummy.matrix);

    _dummy.position.set(tx, 3.4 * scaleJitter, tz);
    _dummy.scale.set(scaleJitter, scaleJitter * 1.1, scaleJitter);
    _dummy.updateMatrix();
    crownInst.setMatrixAt(idx, _dummy.matrix);

    const tint = new THREE.Color().setHSL(0.32 + (idx % 5) * 0.015, 0.42, 0.36 + (idx % 3) * 0.04);
    crownInst.setColorAt(idx, tint);
  });
  trunkInst.instanceMatrix.needsUpdate = true;
  crownInst.instanceMatrix.needsUpdate = true;
  if (crownInst.instanceColor) crownInst.instanceColor.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  crownInst.computeBoundingSphere();
  scene.add(trunkInst, crownInst);

  // Risk Sector Polygons + Dynamic Flood Water Surfaces (onBeforeCompile wave shader)
  const waterUniforms = {
    uTime: { value: 0 },
    uWaveAmp: { value: 0.04 },
  };
  const sectorOverlays = new Map<
    string,
    {
      pad: THREE.Mesh;
      waterMesh: THREE.Mesh;
      sector: CampusSectorFeature;
      currentWaterY: number;
      targetWaterY: number;
      basePadOpacity: number;
    }
  >();

  for (const sector of config.sectors) {
    const pts = sector.polygon.map(([lat, lng]) => latLngToLocal3D(lat, lng));
    const shape = new THREE.Shape();
    pts.forEach(([x, z], idx) => {
      if (idx === 0) shape.moveTo(x, -z);
      else shape.lineTo(x, -z);
    });
    shape.closePath();

    const padGeo = new THREE.ShapeGeometry(shape);
    padGeo.rotateX(-Math.PI / 2);

    const riskHex = RISK_HEX[sector.riskLevel] ?? 0xca8a04;
    const padMat = new THREE.MeshStandardMaterial({
      color: riskHex,
      transparent: true,
      opacity: 0.34,
      roughness: 0.7,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      depthWrite: false,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.06;
    pad.renderOrder = 2;
    scene.add(pad);

    // Dynamic animated flood sheet inside the sector polygon
    const waterGeo = new THREE.ShapeGeometry(shape, 12);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      roughness: 0.08,
      metalness: 0.12,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    });
    waterMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = waterUniforms.uTime;
      shader.uniforms.uWaveAmp = waterUniforms.uWaveAmp;
      shader.vertexShader =
        `uniform float uTime;\nuniform float uWaveAmp;\n` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float wave = sin(position.x * 0.45 + uTime * 2.2) * cos(position.z * 0.45 + uTime * 1.8);
         transformed.y += wave * uWaveAmp;`,
      );
    };

    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = -0.25;
    waterMesh.renderOrder = 4;
    scene.add(waterMesh);

    // Layer 1 clickable proxy over sector ground footprint
    const [cx, cz] = latLngToLocal3D(sector.center.lat, sector.center.lng);
    const proxy = new THREE.Mesh(
      new THREE.CylinderGeometry(16, 16, 2.2, 12),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    proxy.position.set(cx, 1.1, cz);
    proxy.layers.set(1);
    proxy.userData = { kind: 'sector', id: sector.id, label: sector.name };
    scene.add(proxy);
    clickableProxies.push(proxy);

    sectorOverlays.set(sector.id, {
      pad,
      waterMesh,
      sector,
      currentWaterY: -0.25,
      targetWaterY: -0.25,
      basePadOpacity: 0.34,
    });
  }

  // Safe Zones & Meeting Points Beacons
  const safeBeacons: {
    zone: SafeZoneFeature;
    group: THREE.Group;
    ring: THREE.Mesh;
  }[] = [];

  for (const zone of config.safeZones) {
    const built = buildSafeMarkerGroup(zone);
    scene.add(built.group);
    safeBeacons.push({ zone, ...built });

    const proxy = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 4.5, 9, 10),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    proxy.position.set(zone.local3D.x, 4.5, zone.local3D.z);
    proxy.layers.set(1);
    proxy.userData = { kind: 'safeZone', id: zone.id, label: zone.name };
    scene.add(proxy);
    clickableProxies.push(proxy);
  }

  // Validated Evacuation Routes (3D TubeGeometry ribbons)
  const routeMeshes: THREE.Mesh[] = [];
  for (const route of config.routes) {
    if (!route.validatedByAuthority) continue;
    const curvePts = route.coordinates.map(([lat, lng]) => {
      const [rx, rz] = latLngToLocal3D(lat, lng);
      return new THREE.Vector3(rx, 0.35, rz);
    });
    const curve = new THREE.CatmullRomCurve3(curvePts);
    const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.55, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.25,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.renderOrder = 3;
    scene.add(tube);
    routeMeshes.push(tube);
  }

  // Procedural Rain Particles (THREE.Points, pre-allocated Float32Array)
  const rainCount = 1200;
  const rainPositions = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 210;
    rainPositions[i * 3 + 1] = Math.random() * 65;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 210;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.PointsMaterial({
    color: 0xbae6fd,
    size: 0.55,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const rainPoints = new THREE.Points(rainGeo, rainMat);
  rainPoints.frustumCulled = false;
  scene.add(rainPoints);

  // Raycaster on layer 1 proxies
  const raycaster = new THREE.Raycaster();
  raycaster.layers.set(1);
  const pointerNdc = new THREE.Vector2();
  let lastHoverCheck = 0;
  let pointerDownPos = { x: 0, y: 0 };

  const onPointerDown = (e: PointerEvent) => {
    pointerDownPos = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: PointerEvent) => {
    const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    if (moveDist > 6) return; // Ignore orbit drags
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(clickableProxies, false);
    if (hits.length > 0) {
      const data = hits[0].object.userData;
      if (data.kind === 'sector') config.onSelectSector(data.id);
      else if (data.kind === 'safeZone') config.onSelectSafeZone(data.id);
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    const now = performance.now();
    if (now - lastHoverCheck < 55) return;
    lastHoverCheck = now;
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(clickableProxies, false);
    if (hits.length > 0) {
      renderer.domElement.style.cursor = 'pointer';
      config.onHoverLabel(hits[0].object.userData.label ?? null);
    } else {
      renderer.domElement.style.cursor = 'grab';
      config.onHoverLabel(null);
    }
  };

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointermove', onPointerMove);

  // Smooth camera transition state (canceled on user OrbitControls 'start')
  let activeCamAnim: {
    pos: THREE.Vector3;
    target: THREE.Vector3;
  } | null = null;

  const cancelCamAnim = () => {
    activeCamAnim = null;
  };
  controls.addEventListener('start', cancelCamAnim);

  // Simulation & Atmosphere state
  let currentScenario: RainScenario = 'normal';
  let currentFilter: LayerFilter = 'todos';
  let selectedFeatureId: string | null = null;
  let targetSkyHex = 0xdce8f2;
  let targetRainOpacity = 0.0;
  let rainFallSpeed = 28;

  const applyFilterAndScenario = () => {
    const scenarioCfg: Record<
      RainScenario,
      { sky: number; rainOpacity: number; speed: number; wave: number; sunIntensity: number }
    > = {
      normal: { sky: 0xdce8f2, rainOpacity: 0.0, speed: 26, wave: 0.02, sunIntensity: 1.85 },
      intensa: { sky: 0xb6c7d6, rainOpacity: 0.55, speed: 48, wave: 0.06, sunIntensity: 1.25 },
      elnino: { sky: 0x8ea3b8, rainOpacity: 0.88, speed: 70, wave: 0.11, sunIntensity: 0.95 },
    };

    const cfg = scenarioCfg[currentScenario];
    targetSkyHex = cfg.sky;
    targetRainOpacity = cfg.rainOpacity;
    rainFallSpeed = cfg.speed;
    waterUniforms.uWaveAmp.value = cfg.wave;
    sunLight.intensity = cfg.sunIntensity;

    const showRiskPolygons =
      currentFilter === 'todos' ||
      currentFilter === 'inundacion' ||
      currentFilter === 'acumulacion' ||
      currentFilter === 'lluvia_intensa';

    for (const [id, item] of sectorOverlays.entries()) {
      const matchesFilter =
        currentFilter === 'todos' || item.sector.hazardType === currentFilter;
      const visible = showRiskPolygons && matchesFilter;
      item.pad.visible = visible;

      const mult = item.sector.intensityMultiplier[currentScenario];
      const depth = item.sector.baseWaterDepthM * mult;
      // Convert water depth (meters) to subtle 3D scene scale height
      item.targetWaterY = visible && depth > 0.08 ? Math.min(1.65, depth * 1.15) : -0.35;

      const padMat = item.pad.material as THREE.MeshStandardMaterial;
      padMat.opacity = selectedFeatureId === id ? 0.62 : 0.34;
    }

    for (const beacon of safeBeacons) {
      const matchesSafe =
        currentFilter === 'todos' ||
        (currentFilter === 'zonas_seguras' && beacon.zone.type === 'zona_segura') ||
        (currentFilter === 'puntos_encuentro' && beacon.zone.type === 'punto_encuentro') ||
        currentFilter === 'rutas_evacuacion';
      beacon.group.visible = matchesSafe;
    }

    const showRoutes = currentFilter === 'todos' || currentFilter === 'rutas_evacuacion';
    for (const mesh of routeMeshes) {
      mesh.visible = showRoutes;
    }
  };

  applyFilterAndScenario();

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  // Resize observer
  const handleResize = () => {
    const w = Math.max(container.clientWidth, 320);
    const h = Math.max(container.clientHeight, 320);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(container);

  // Paced 60fps loop + Software WebGL afterDraw fenceSync
  let frameId = 0;
  let disposed = false;
  const clock = new THREE.Clock();

  function afterDraw(cb: () => void) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  function tick() {
    if (disposed) return;
    const delta = Math.min(clock.getDelta(), 0.1);
    const elapsed = clock.getElapsedTime();

    waterUniforms.uTime.value = elapsed;

    // Smooth sky & fog atmospheric transition
    _colorTarget.setHex(targetSkyHex);
    skyColor.lerp(_colorTarget, 1 - Math.exp(-3.5 * delta));
    (scene.fog as THREE.FogExp2).color.copy(skyColor);

    // Smooth damped floodwater elevation per sector
    for (const item of sectorOverlays.values()) {
      item.currentWaterY = THREE.MathUtils.damp(
        item.currentWaterY,
        item.targetWaterY,
        4.2,
        delta,
      );
      item.waterMesh.position.y = item.currentWaterY;
      item.waterMesh.visible = item.currentWaterY > -0.15;
    }

    // Rotate beacon rings gently
    for (const beacon of safeBeacons) {
      if (beacon.group.visible) {
        beacon.ring.rotation.y += delta * 1.1;
      }
    }

    // Rain particle fall
    rainMat.opacity = THREE.MathUtils.damp(rainMat.opacity, targetRainOpacity, 5.0, delta);
    rainPoints.visible = rainMat.opacity > 0.02;
    if (rainPoints.visible) {
      const posAttr = rainGeo.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < rainCount; i++) {
        arr[i * 3 + 1] -= rainFallSpeed * delta;
        arr[i * 3] -= 4.5 * delta;
        if (arr[i * 3 + 1] < 0) {
          arr[i * 3 + 1] = 62;
          arr[i * 3] = ((i * 37) % 200) - 100;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Damped camera preset transitions
    if (activeCamAnim) {
      const k = 1 - Math.exp(-5.0 * delta);
      camera.position.lerp(activeCamAnim.pos, k);
      controls.target.lerp(activeCamAnim.target, k);
      if (
        camera.position.distanceTo(activeCamAnim.pos) < 0.35 &&
        controls.target.distanceTo(activeCamAnim.target) < 0.35
      ) {
        activeCamAnim = null;
      }
    }

    controls.update();
    renderer.render(scene, camera);

    if (isSoftwareGl) afterDraw(tick);
    else frameId = requestAnimationFrame(tick);
  }

  tick();

  return {
    updateState({ rainScenario, activeFilter, selectedId }) {
      currentScenario = rainScenario;
      currentFilter = activeFilter;
      selectedFeatureId = selectedId;
      applyFilterAndScenario();
    },
    setCameraPreset(preset) {
      const target = CAMERA_PRESETS[preset];
      _vec3A.set(...target.pos);
      _vec3B.set(...target.target);
      activeCamAnim = { pos: _vec3A.clone(), target: _vec3B.clone() };
    },
    focusPoint(x: number, z: number) {
      activeCamAnim = {
        pos: new THREE.Vector3(x - 36, 36, z + 42),
        target: new THREE.Vector3(x, 2, z),
      };
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      controls.removeEventListener('start', cancelCamAnim);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
          else m.material?.dispose();
        }
      });
      campusGroundTex.dispose();
      pitchTex.dispose();
      rainGeo.dispose();
      rainMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
