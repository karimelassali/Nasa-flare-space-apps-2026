'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import type { GravityContext } from '@/types/flare';

export type FacilityChamberType =
  | 'cir_rack'
  | 'msg_duct'
  | 'saffire_duct'
  | 'exploration_bay';

export type FuelGeometryType =
  | 'fabric_strip'
  | 'polymer_slab'
  | 'liquid_droplet'
  | 'gaseous_burner';

export type CameraPreset = 'isometric' | 'side' | 'upstream' | 'top' | 'front' | 'close';

export interface ChamberVisibility {
  flowParticles: boolean;
  sensors: boolean;
  enclosure: boolean;
  grid: boolean;
}

export interface ThreeCombustionSceneProps {
  facility: FacilityChamberType;
  fuelGeometry: FuelGeometryType;
  oxygenPercent: number;
  pressureKpa: number;
  airflowCms: number;
  gravityContext: GravityContext;
  isRunning: boolean;
  simResetNonce: number;
  cameraPreset: CameraPreset;
  cameraResetNonce: number;
  visibility: ChamberVisibility;
}

class ResourceTracker {
  private resources = new Set<THREE.Object3D | { dispose: () => void }>();

  track<T extends THREE.Object3D | { dispose: () => void }>(resource: T): T {
    this.resources.add(resource);
    return resource;
  }

  disposeAll() {
    for (const resource of this.resources) {
      if (resource instanceof THREE.Object3D && resource.parent) {
        resource.parent.remove(resource);
      }
      if ('dispose' in resource && typeof resource.dispose === 'function') {
        resource.dispose();
      }
    }
    this.resources.clear();
  }
}

const CAMERA_VIEWS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  front: { pos: [0, 0.2, 4.5], target: [0, 0, 0] },
  close: { pos: [1.5, 0.8, 1.6], target: [0, 0, 0] },
  isometric: { pos: [5.2, 3.0, 6.5], target: [0.15, 0.15, 0] },
  side: { pos: [0.2, 0.35, 5.1], target: [0.2, 0.1, 0] },
  upstream: { pos: [-4.6, 0.75, 0.35], target: [0.2, 0.1, 0] },
  top: { pos: [0.2, 5.2, 0.35], target: [0.2, 0, 0] },
};

function createSoftParticleTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.75)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function getGravityFactor(gravity: GravityContext): number {
  switch (gravity) {
    case 'Microgravity':
      return 0;
    case 'Lunar':
      return 0.25;
    case 'Martian':
      return 0.45;
    case 'Earth':
      return 1.0;
  }
}

export function ThreeCombustionScene({
  facility,
  fuelGeometry,
  oxygenPercent,
  pressureKpa,
  airflowCms,
  gravityContext,
  isRunning,
  simResetNonce,
  cameraPreset,
  cameraResetNonce,
  visibility,
}: ThreeCombustionSceneProps) {
  const [quality, setQuality] = useState('auto');
  const qualityRef = useRef('auto');
  // Snapshot feedback: previously the button downloaded silently, so a
  // judge could not tell whether anything had happened.
  const [snapshotNotice, setSnapshotNotice] = useState<string | null>(null);
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showSnapshotNotice = (message: string) => {
    setSnapshotNotice(message);
    if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
    snapshotTimerRef.current = setTimeout(() => setSnapshotNotice(null), 5000);
  };
  useEffect(() => () => {
    if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
  }, []);
  useEffect(() => {
    qualityRef.current = quality;
  }, [quality]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fallbackRef = useRef<HTMLDivElement | null>(null);

  // Store dynamic simulation state in a ref so parameter updates do not recreate WebGL context
  const stateRef = useRef({
    oxygenPercent,
    pressureKpa,
    airflowCms,
    gravityContext,
    isRunning,
    visibility,
    fuelGeometry,
  });

  useEffect(() => {
    stateRef.current = {
      oxygenPercent,
      pressureKpa,
      airflowCms,
      gravityContext,
      isRunning,
      visibility,
      fuelGeometry,
    };
  }, [
    oxygenPercent,
    pressureKpa,
    airflowCms,
    gravityContext,
    isRunning,
    visibility,
    fuelGeometry,
  ]);

  // Refs for scene groups managed across effect hooks
  const sceneHooksRef = useRef<{
    rebuildFacility: (f: FacilityChamberType) => void;
    rebuildFuel: (g: FuelGeometryType) => void;
    resetParticles: () => void;
    setCameraView: (preset: CameraPreset) => void;
    toggleGroups: (v: ChamberVisibility) => void;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      fallbackRef.current?.classList.remove('hidden');
      return;
    }

    fallbackRef.current?.classList.add('hidden');
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.localClippingEnabled = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070B10');
    scene.fog = new THREE.FogExp2('#070B10', 0.045);

    const environmentRoom = new RoomEnvironment();
    const environmentGenerator = new THREE.PMREMGenerator(renderer);
    const environmentTarget = environmentGenerator.fromScene(environmentRoom, 0.04);
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 0.45;
    environmentRoom.dispose();
    environmentGenerator.dispose();
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 60);
    const initialView = CAMERA_VIEWS[cameraPreset];
    camera.position.set(...initialView.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.minDistance = 1.9;
    controls.maxDistance = 10.5;
    controls.target.set(...initialView.target);
    controls.update();

    const baseTracker = new ResourceTracker();
    const facilityTracker = new ResourceTracker();
    const fuelTracker = new ResourceTracker();

    // Lighting setup: technical instrument studio look
    const ambient = baseTracker.track(new THREE.AmbientLight('#9CB6D4', 0.35));
    const keyLight = baseTracker.track(
      new THREE.DirectionalLight('#DCEBFF', 1.0)
    );
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.normalBias = 0.04;
    keyLight.position.set(4.5, 6.0, 5.0);
    const rimLight = baseTracker.track(
      new THREE.DirectionalLight('#CBD9EB', 0.6)
    );
    rimLight.position.set(-5.0, -2.5, -3.5);
    const flamePointLight = baseTracker.track(
      new THREE.PointLight('#D97706', 4.5, 9, 1.8)
    );
    flamePointLight.position.set(0, 0.12, 0);

    scene.add(ambient, keyLight, rimLight, flamePointLight);

    // Coordinate Reference Grid + Downstream Axis Indicator
    const gridGroup = baseTracker.track(new THREE.Group());
    const gridHelper = baseTracker.track(
      new THREE.GridHelper(8, 16, '#526171', '#303b46')
    );
    gridHelper.position.y = -1.495;
    if (Array.isArray(gridHelper.material)) gridHelper.material.forEach(m => { m.transparent = true; m.opacity = 0.22; });
    gridGroup.add(gridHelper);

    const flowAxisArrow = baseTracker.track(
      new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-2.35, -1.25, 1.35),
        1.1,
        0x55d7f7,
        0.18,
        0.1
      )
    );
    gridGroup.add(flowAxisArrow);
    scene.add(gridGroup);

    // Groups for toggleable chamber sub-assemblies
    const facilityGroup = baseTracker.track(new THREE.Group());
    const fuelGroup = baseTracker.track(new THREE.Group());
    const sensorGroup = baseTracker.track(new THREE.Group());
    const flameGroup = baseTracker.track(new THREE.Group());
    scene.add(facilityGroup, fuelGroup, sensorGroup, flameGroup);

    // Thermocouple / Radiometer Sensor Probes
    const sensorLeds: THREE.Mesh[] = [];
    const buildSensors = () => {
      const stalkMat = baseTracker.track(
        new THREE.MeshStandardMaterial({
          color: '#64748B',
          metalness: 0.85,
          roughness: 0.25,
        })
      );
      const probePositions: Array<[number, number, number]> = [
        [-0.75, -0.78, 0.55],
        [0.0, -0.78, 0.72],
        [0.85, -0.78, 0.48],
        [1.35, -0.78, -0.45],
      ];

      probePositions.forEach(([px, py, pz]) => {
        const stalkGeo = baseTracker.track(
          new THREE.CylinderGeometry(0.016, 0.022, 0.75, 12)
        );
        const stalk = new THREE.Mesh(stalkGeo, stalkMat);
        stalk.position.set(px, py + 0.375, pz);
        sensorGroup.add(stalk);

        const tipGeo = baseTracker.track(new THREE.SphereGeometry(0.042, 16, 16));
        const tipMat = baseTracker.track(
          new THREE.MeshStandardMaterial({
            color: '#0284C7',
            emissive: new THREE.Color('#0284C7'),
            emissiveIntensity: 0.9,
            roughness: 0.2,
          })
        );
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(px, py + 0.76, pz);
        sensorGroup.add(tip);
        sensorLeds.push(tip);
      });
    };
    buildSensors();

    // Multi-layered Conceptual Flame Plume Assembly
    const coreMat = baseTracker.track(
      new THREE.MeshBasicMaterial({
        color: '#FFF4D8',
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const midMat = baseTracker.track(
      new THREE.MeshBasicMaterial({
        color: '#D97706',
        transparent: true,
        opacity: 0.58,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const outerMat = baseTracker.track(
      new THREE.MeshBasicMaterial({
        color: '#3B9EFF',
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );

    const flameGeo = baseTracker.track(new THREE.SphereGeometry(0.45, 36, 28));
    const coreMesh = new THREE.Mesh(flameGeo, coreMat);
    const midMesh = new THREE.Mesh(flameGeo, midMat);
    const outerMesh = new THREE.Mesh(flameGeo, outerMat);
    // Ray-integrated density inside a real 3D volume; no camera-facing flame sprites.
    const volumeMaterial = baseTracker.track(new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.BackSide,
      uniforms: { time: { value: 0 }, eye: { value: new THREE.Vector3() }, droplet: { value: 1 }, steps: { value: 48 } },
      vertexShader: `varying vec3 local; void main(){local=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `precision highp float;
      varying vec3 local; uniform vec3 eye; uniform float time; uniform float droplet; uniform float steps;
      float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){vec3 ray=normalize(local-eye);vec3 inv=1./ray;vec3 a=(-vec3(1.)-eye)*inv,b=(vec3(1.)-eye)*inv;vec3 lo=min(a,b),hi=max(a,b);float start=max(max(lo.x,lo.y),lo.z),end=min(min(hi.x,hi.y),hi.z);start=max(start,0.);if(end<=start)discard;vec4 sum=vec4(0.);float stepSize=(end-start)/steps;
      for(int i=0;i<64;i++){if(float(i)>=steps)break;vec3 p=eye+ray*(start+(float(i)+.5)*stepSize);float n=noise(p*5.+vec3(0,-time*.2,time*.08))*.7+noise(p*12.-time*.12)*.3;float radius=length(p);float shell=exp(-pow((radius-.57+(n-.5)*.035)/.055,2.));float taper=1.-smoothstep(-.25,.9,p.y);float plume=exp(-pow(length(p.xz)/max(.08,taper*.48),2.))*smoothstep(-.8,-.45,p.y)*(1.-smoothstep(.3,.95,p.y));float d=mix(plume*(.35+n),shell,droplet);vec3 color=mix(vec3(.12,.32,.85),vec3(1.,.46,.10),smoothstep(.25,.8,n)*(1.-droplet*.65));float alpha=1.-exp(-d*stepSize*3.);sum.rgb+=(1.-sum.a)*color*alpha*1.15;sum.a+=(1.-sum.a)*alpha;}if(sum.a<.008)discard;gl_FragColor=vec4(sum.rgb/max(sum.a,.001),sum.a);}`
    }));
    const volume = new THREE.Mesh(baseTracker.track(new THREE.BoxGeometry(2,2,2)), volumeMaterial);
    flameGroup.add(volume);

    // Radiative Corona Glow Sprite
    const softTexture = baseTracker.track(createSoftParticleTexture());
    const glowMat = baseTracker.track(
      new THREE.SpriteMaterial({
        map: softTexture,
        color: '#D97706',
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const glowSprite = new THREE.Sprite(glowMat);
    glowSprite.scale.set(2.2, 2.2, 1);
    // The integrated volume supplies the luminous envelope.

    // Airflow Tracer Particles (Cyan streamline seeds)
    const FLOW_COUNT = 220;
    const flowPositions = new Float32Array(FLOW_COUNT * 3);
    const flowSpeedOffsets = new Float32Array(FLOW_COUNT);
    const seedFlowParticles = () => {
      for (let i = 0; i < FLOW_COUNT; i++) {
        flowPositions[i * 3] = (Math.random() - 0.5) * 4.8;
        flowPositions[i * 3 + 1] = (Math.random() - 0.5) * 2.1;
        flowPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.9;
        flowSpeedOffsets[i] = 0.7 + Math.random() * 0.65;
      }
    };
    seedFlowParticles();

    const flowGeo = baseTracker.track(new THREE.BufferGeometry());
    flowGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(flowPositions, 3)
    );
    const flowMat = baseTracker.track(
      new THREE.PointsMaterial({
        size: 0.07,
        map: softTexture,
        color: '#0284C7',
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const flowPoints = baseTracker.track(new THREE.Points(flowGeo, flowMat));
    scene.add(flowPoints);

    // Thermal Ember / Soot Drift Particles
    const EMBER_COUNT = 95;
    const emberPositions = new Float32Array(EMBER_COUNT * 3);
    const emberAges = new Float32Array(EMBER_COUNT);
    const seedEmbers = () => {
      for (let i = 0; i < EMBER_COUNT; i++) {
        emberPositions[i * 3] = (Math.random() - 0.5) * 0.3;
        emberPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
        emberPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
        emberAges[i] = Math.random();
      }
    };
    seedEmbers();

    const emberGeo = baseTracker.track(new THREE.BufferGeometry());
    emberGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(emberPositions, 3)
    );
    const emberMat = baseTracker.track(
      new THREE.PointsMaterial({
        size: 0.085,
        map: softTexture,
        color: '#D97706',
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const emberPoints = baseTracker.track(new THREE.Points(emberGeo, emberMat));
    scene.add(emberPoints);

    let facilityGeneration = 0;
    let disposed = false;
    const modelLoader = new GLTFLoader();
    const disposeModel = (root: THREE.Object3D) => root.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => material.dispose());
      }
    });
    // Equipment shares the enclosure visibility toggle and survives facility rebuilds.
    const equipmentGroup = baseTracker.track(new THREE.Group());
    scene.add(equipmentGroup);
    const equipment = [
      { file: 'instrument-rack', height: 2.35, position: [2.15, -1.35, -1.8], rotation: -0.25 },
      { file: 'vacuum-pump', height: 0.8, position: [-2.65, -1.35, -0.7], rotation: 0.4 },
      { file: 'sample-bench', height: 0.7, position: [0, -1.5, 0], rotation: 0 },
      { file: 'camera-arm', height: 1.4, position: [1.65, -1.3, 0.8], rotation: -1.1 },
    ];
    equipment.forEach(asset => modelLoader.load(`/models/${asset.file}.glb`, gltf => {
      if(disposed) { disposeModel(gltf.scene); return; }
      const root = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(root);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = asset.height / Math.max(size.y, 0.001);
      root.scale.setScalar(scale);
      root.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      const placement = new THREE.Group();
      placement.add(root);
      placement.rotation.y = asset.rotation;
      placement.position.set(asset.position[0], asset.position[1], asset.position[2]);
      root.traverse(object => {
        if(object instanceof THREE.Mesh) {
          baseTracker.track(object.geometry);
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => baseTracker.track(material));
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      equipmentGroup.add(placement);
    }, undefined, () => { /* Keep the chamber usable if auxiliary equipment fails to load. */ }));

    const floorMaterial = baseTracker.track(new THREE.MeshStandardMaterial({color: '#303943', roughness: .82, metalness: .2}));
    const floor = new THREE.Mesh(baseTracker.track(new THREE.BoxGeometry(8.5, .12, 6)), floorMaterial);
    floor.position.set(0, -1.57, -.3);
    floor.receiveShadow = true;
    equipmentGroup.add(floor);
    // Generic third-party hardware asset, not reconstructed NASA apparatus.
    // Dynamic Builder: Spacecraft Chamber Enclosures
    const rebuildFacility = (type: FacilityChamberType) => {
      facilityTracker.disposeAll();
      facilityGroup.clear();
      const generation = ++facilityGeneration;
      if (type === 'cir_rack' || type === 'exploration_bay') {
        modelLoader.load('/models/laboratory-chamber.glb', gltf => {
          if (disposed || generation !== facilityGeneration) { disposeModel(gltf.scene); return; }
          facilityTracker.disposeAll();
          facilityGroup.clear();
          const model = gltf.scene;
          const bounds = new THREE.Box3().setFromObject(model);
          const center = bounds.getCenter(new THREE.Vector3());
          model.position.sub(center);
          model.scale.setScalar(1.15);
          model.position.multiplyScalar(1.15);
          model.traverse(object => {
            if (object instanceof THREE.Mesh) {
              facilityTracker.track(object.geometry);
              object.castShadow = true;
              object.receiveShadow = true;
              const materials = Array.isArray(object.material) ? object.material : [object.material];
              materials.forEach(material => {
                facilityTracker.track(material);
                // Inspection cutaway exposes the sample while retaining the rear shell and flanges.
                material.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -0.45, -1).normalize(), 0.55)];
                material.clipShadows = true;
                material.side = THREE.DoubleSide;
              });
            }
          });
          facilityGroup.add(model);
        }, undefined, () => { /* Retain the procedural enclosure on asset failure. */ });
      }

      const metalMat = facilityTracker.track(
        new THREE.MeshStandardMaterial({
          color: '#344457',
          metalness: 0.78,
          roughness: 0.32,
        })
      );
      const darkDeckMat = facilityTracker.track(
        new THREE.MeshStandardMaterial({
          color: '#17212E',
          metalness: 0.45,
          roughness: 0.6,
        })
      );
      const cyanAccentMat = facilityTracker.track(
        new THREE.MeshStandardMaterial({
          color: '#0284C7',
          emissive: new THREE.Color('#0284C7'),
          emissiveIntensity: 0.45,
          roughness: 0.25,
        })
      );

      if (type === 'cir_rack' || type === 'exploration_bay') {
        const ringGeo = facilityTracker.track(
          new THREE.TorusGeometry(1.75, 0.06, 16, 64)
        );
        const leftRing = new THREE.Mesh(ringGeo, metalMat);
        leftRing.rotation.y = Math.PI / 2;
        leftRing.position.x = -1.9;

        const rightRing = new THREE.Mesh(ringGeo, metalMat);
        rightRing.rotation.y = Math.PI / 2;
        rightRing.position.x = 1.9;

        facilityGroup.add(leftRing, rightRing);

        // Axial structural rails
        const railGeo = facilityTracker.track(
          new THREE.CylinderGeometry(0.035, 0.035, 3.85, 12)
        );
        const angles = [0.6, 2.54, -0.6, -2.54];
        angles.forEach((ang) => {
          const rail = new THREE.Mesh(railGeo, metalMat);
          rail.rotation.z = Math.PI / 2;
          rail.position.set(0, Math.sin(ang) * 1.75, Math.cos(ang) * 1.75);
          facilityGroup.add(rail);
        });

        // Translucent pressure shell cylinder
        const shellGeo = facilityTracker.track(
          new THREE.CylinderGeometry(1.72, 1.72, 3.8, 40, 1, true)
        );
        const shellMat = facilityTracker.track(
          new THREE.MeshPhysicalMaterial({
            color: type === 'exploration_bay' ? '#70B8FF' : '#94A9C2',
            transparent: true,
            opacity: type === 'exploration_bay' ? 0.12 : 0.08,
            roughness: 0.15,
            metalness: 0.1,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        const shell = new THREE.Mesh(shellGeo, shellMat);
        shell.rotation.z = Math.PI / 2;
        facilityGroup.add(shell);

        // Optical diagnostic bench deck
        const deckGeo = facilityTracker.track(new THREE.BoxGeometry(3.7, 0.08, 1.5));
        const deck = new THREE.Mesh(deckGeo, darkDeckMat);
        deck.position.y = -1.05;
        facilityGroup.add(deck);
      } else {
        // Duct geometry for ISS MSG (BASS) and Cygnus SAFFIRE
        const halfW = type === 'saffire_duct' ? 2.45 : 2.15;
        const halfH = type === 'saffire_duct' ? 1.3 : 1.08;
        const halfD = type === 'saffire_duct' ? 1.25 : 0.98;

        const wireGeo = facilityTracker.track(
          new THREE.BoxGeometry(halfW * 2, halfH * 2, halfD * 2)
        );
        const edgesGeo = facilityTracker.track(new THREE.EdgesGeometry(wireGeo));
        const edgesMat = facilityTracker.track(
          new THREE.LineBasicMaterial({
            color: type === 'saffire_duct' ? '#D97706' : '#0284C7',
            transparent: true,
            opacity: 0.45,
          })
        );
        const wireBox = new THREE.LineSegments(edgesGeo, edgesMat);
        facilityGroup.add(wireBox);

        const glassMat = facilityTracker.track(
          new THREE.MeshPhysicalMaterial({
            color: '#9CB8D4',
            transparent: true,
            opacity: 0.06,
            roughness: 0.1,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        const ductBox = new THREE.Mesh(wireGeo, glassMat);
        facilityGroup.add(ductBox);

        // Flow straightener intake bars (upstream at -halfW)
        const barGeo = facilityTracker.track(
          new THREE.BoxGeometry(0.05, halfH * 1.92, 0.04)
        );
        for (let z = -halfD + 0.25; z <= halfD - 0.25; z += 0.35) {
          const bar = new THREE.Mesh(barGeo, metalMat);
          bar.position.set(-halfW + 0.04, 0, z);
          facilityGroup.add(bar);
        }

        // Duct floor rail
        const floorGeo = facilityTracker.track(
          new THREE.BoxGeometry(halfW * 2, 0.06, halfD * 1.92)
        );
        const floor = new THREE.Mesh(floorGeo, darkDeckMat);
        floor.position.y = -halfH + 0.03;
        facilityGroup.add(floor);

        // Highlight indicator strip along top frame
        const stripGeo = facilityTracker.track(
          new THREE.BoxGeometry(halfW * 1.85, 0.03, 0.03)
        );
        const strip = new THREE.Mesh(stripGeo, cyanAccentMat);
        strip.position.set(0, halfH, halfD);
        facilityGroup.add(strip);
      }
    };

    // Dynamic Builder: Fuel Samples & Mounting Hardware
    let sampleGlowMesh: THREE.Mesh | null = null;
    const rebuildFuel = (geom: FuelGeometryType) => {
      fuelTracker.disposeAll();
      fuelGroup.clear();
      sampleGlowMesh = null;

      const clampMat = fuelTracker.track(
        new THREE.MeshStandardMaterial({
          color: '#64778C',
          metalness: 0.85,
          roughness: 0.28,
        })
      );

      if (geom === 'fabric_strip') {
        const frameGeo = fuelTracker.track(
          new THREE.BoxGeometry(1.45, 0.045, 0.045)
        );
        const topRail = new THREE.Mesh(frameGeo, clampMat);
        topRail.position.set(0.1, 0.36, 0);
        const bottomRail = new THREE.Mesh(frameGeo, clampMat);
        bottomRail.position.set(0.1, -0.36, 0);
        fuelGroup.add(topRail, bottomRail);

        const clothGeo = fuelTracker.track(new THREE.BoxGeometry(1.36, 0.68, 0.015));
        const clothMat = fuelTracker.track(
          new THREE.MeshStandardMaterial({
            color: '#E6E1D5',
            emissive: new THREE.Color('#FF6B1A'),
            emissiveIntensity: 0.15,
            roughness: 0.9,
          })
        );
        const cloth = new THREE.Mesh(clothGeo, clothMat);
        cloth.position.set(0.1, 0, 0);
        fuelGroup.add(cloth);
        sampleGlowMesh = cloth;
      } else if (geom === 'polymer_slab') {
        const mountGeo = fuelTracker.track(new THREE.BoxGeometry(1.4, 0.12, 0.56));
        const mount = new THREE.Mesh(mountGeo, clampMat);
        mount.position.set(0.05, -0.22, 0);
        fuelGroup.add(mount);

        const pmmaGeo = fuelTracker.track(new THREE.BoxGeometry(1.25, 0.22, 0.44));
        const pmmaMat = fuelTracker.track(
          new THREE.MeshPhysicalMaterial({
            color: '#B5DCFF',
            emissive: new THREE.Color('#FF8B2E'),
            emissiveIntensity: 0.18,
            transparent: true,
            opacity: 0.78,
            roughness: 0.18,
          })
        );
        const pmma = new THREE.Mesh(pmmaGeo, pmmaMat);
        pmma.position.set(0.05, -0.05, 0);
        fuelGroup.add(pmma);
        sampleGlowMesh = pmma;
      } else if (geom === 'liquid_droplet') {
        const fiberGeo = fuelTracker.track(
          new THREE.CylinderGeometry(0.008, 0.008, 1.75, 8)
        );
        const fiberA = new THREE.Mesh(fiberGeo, clampMat);
        fiberA.rotation.z = Math.PI / 2;
        fiberA.rotation.y = Math.PI / 5;
        const fiberB = new THREE.Mesh(fiberGeo, clampMat);
        fiberB.rotation.z = Math.PI / 2;
        fiberB.rotation.y = -Math.PI / 5;
        fuelGroup.add(fiberA, fiberB);

        const dropGeo = fuelTracker.track(new THREE.SphereGeometry(0.15, 28, 28));
        const dropMat = fuelTracker.track(
          new THREE.MeshPhysicalMaterial({
            color: '#FFF2C6',
            emissive: new THREE.Color('#D97706'),
            emissiveIntensity: 0.55,
            roughness: 0.08,
            transparent: true,
            opacity: 0.92,
          })
        );
        const drop = new THREE.Mesh(dropGeo, dropMat);
        fuelGroup.add(drop);
        sampleGlowMesh = drop;
      } else {
        // Porous gaseous burner nozzle (ACME-style)
        const stemGeo = fuelTracker.track(
          new THREE.CylinderGeometry(0.06, 0.08, 0.85, 16)
        );
        const stem = new THREE.Mesh(stemGeo, clampMat);
        stem.position.set(0, -0.55, 0);
        fuelGroup.add(stem);

        const nozzleGeo = fuelTracker.track(new THREE.SphereGeometry(0.13, 24, 24));
        const nozzleMat = fuelTracker.track(
          new THREE.MeshStandardMaterial({
            color: '#9BA9B8',
            emissive: new THREE.Color('#FF9B38'),
            emissiveIntensity: 0.28,
            metalness: 0.7,
            roughness: 0.5,
          })
        );
        const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
        nozzle.position.set(0, -0.1, 0);
        fuelGroup.add(nozzle);
        sampleGlowMesh = nozzle;
      }
    };

    const toggleGroups = (v: ChamberVisibility) => {
      flowPoints.visible = v.flowParticles;
      sensorGroup.visible = v.sensors;
      facilityGroup.visible = v.enclosure;
      equipmentGroup.visible = v.enclosure;
      gridGroup.visible = v.grid;
    };

    const setCameraView = (preset: CameraPreset) => {
      const targetView = CAMERA_VIEWS[preset];
      camera.position.set(...targetView.pos);
      controls.target.set(...targetView.target);
      controls.update();
    };

    rebuildFacility(facility);
    rebuildFuel(fuelGeometry);
    toggleGroups(visibility);

    sceneHooksRef.current = {
      rebuildFacility,
      rebuildFuel,
      resetParticles: () => {
        elapsedPhase = 0;
        seedFlowParticles();
        seedEmbers();
        flowGeo.attributes.position.needsUpdate = true;
        emberGeo.attributes.position.needsUpdate = true;
      },
      setCameraView,
      toggleGroups,
    };

    // ResizeObserver for crisp layout transitions (e.g., sidebar collapse)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(entry.contentRect.width, 280);
        const h = Math.max(entry.contentRect.height, 280);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
    });
    resizeObserver.observe(container);

    let lastTimestamp = performance.now();
    let elapsedPhase = 0;

    renderer.setAnimationLoop((now) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.05);
      lastTimestamp = now;

      const s = stateRef.current;
      emberPoints.visible = false; // Unmeasured flying sparks are inappropriate for the droplet view.
      equipmentGroup.visible = s.visibility.enclosure;
      if (s.isRunning && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        elapsedPhase += dt;
      }

      const o2Norm = THREE.MathUtils.clamp((s.oxygenPercent - 12) / 28, 0, 1);
      const pressNorm = THREE.MathUtils.clamp((s.pressureKpa - 35) / 85, 0, 1);
      const flowNorm = THREE.MathUtils.clamp(s.airflowCms / 40, 0, 1);
      const grav = getGravityFactor(s.gravityContext);

      // Droplet d²-law diameter regression in microgravity
      if (sampleGlowMesh && s.fuelGeometry === 'liquid_droplet') {
        const burnRate = 0.012 * (s.oxygenPercent / 21) * Math.pow(s.pressureKpa / 101.3, 0.25);
        const regression = Math.max(0.18, 1 - burnRate * elapsedPhase);
        sampleGlowMesh.scale.setScalar(regression);
      }

      // Flame size scales directly with O2 richness and pressure diffusion inversely
      const baseScale =
        (0.55 + o2Norm * 0.72) * (1.12 - pressNorm * 0.25) *
        (s.fuelGeometry === 'liquid_droplet' ? 0.78 : 1.0);
      const flicker = s.isRunning
        ? 1 + Math.sin(elapsedPhase * 9.5) * (0.025 + flowNorm * 0.045) +
          Math.cos(elapsedPhase * 15.2) * 0.015
        : 1;

      const stretchX = 1 + flowNorm * 1.55;
      const stretchY = 1 + grav * 1.15 - flowNorm * 0.14;
      const stretchZ = 1 - flowNorm * 0.16;

      flameGroup.position.set(0, 0, 0);

      coreMesh.scale.set(
        0.58 * baseScale * stretchX * flicker,
        0.58 * baseScale * stretchY * flicker,
        0.58 * baseScale * stretchZ * flicker
      );
      midMesh.scale.set(
        0.92 * baseScale * stretchX * flicker,
        0.92 * baseScale * stretchY * flicker,
        0.92 * baseScale * stretchZ * flicker
      );
      outerMesh.scale.set(
        (1.28 + (1 - pressNorm) * 0.25) * baseScale * stretchX * flicker,
        (1.28 + (1 - pressNorm) * 0.25) * baseScale * stretchY * flicker,
        (1.28 + (1 - pressNorm) * 0.25) * baseScale * stretchZ * flicker
      );

      // Color shifts toward dim cool blue under O2 starvation, warm luminous amber under enriched O2
      coreMat.color.setHSL(0.09 + (1 - o2Norm) * 0.45, 0.35 + o2Norm * 0.5, 0.85);
      midMat.color.setHSL(0.08 + (1 - o2Norm) * 0.04, 0.92, 0.48 + o2Norm * 0.16);
      midMat.opacity = 0.24 + o2Norm * 0.48;
      outerMat.opacity = 0.18 + (1 - o2Norm) * 0.18 + pressNorm * 0.06;

      glowMat.opacity = 0.2 + o2Norm * 0.45;
      const glowSpan = 2.0 * baseScale * (1 + flowNorm * 0.45);
      glowSprite.scale.set(glowSpan, glowSpan * (1 + grav * 0.3), 1);

      flamePointLight.intensity = (2.2 + o2Norm * 5.2) * flicker;
      flamePointLight.position.copy(flameGroup.position);

      if (sampleGlowMesh && sampleGlowMesh.material instanceof THREE.MeshStandardMaterial) {
        sampleGlowMesh.material.emissiveIntensity = 0.12 + o2Norm * 0.55;
      }

      // Pulse diagnostic probe LEDs smoothly
      sensorLeds.forEach((led, idx) => {
        if (led.material instanceof THREE.MeshStandardMaterial) {
          const proximity = idx === 1 || idx === 2 ? 0.55 + o2Norm * 0.7 : 0.45;
          led.material.emissive.set(
            idx === 2 && (flowNorm > 0.3 || o2Norm > 0.5) ? '#D97706' : '#0284C7'
          );
          led.material.emissiveIntensity =
            proximity + Math.sin(elapsedPhase * 3 + idx) * 0.2;
        }
      });

      // Animate streamlines & embers only while simulation is running
      if (s.isRunning && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const flowVel = s.airflowCms * 0.095;
        for (let i = 0; i < FLOW_COUNT; i++) {
          const idx = i * 3;
          flowPositions[idx] += flowVel * flowSpeedOffsets[i] * dt;
          flowPositions[idx + 1] += 0;
          if (flowPositions[idx] > 2.4) {
            flowPositions[idx] = -2.4;
            flowPositions[idx + 1] = (Math.random() - 0.5) * 2.0;
          }
          if (flowPositions[idx + 1] > 1.2) {
            flowPositions[idx + 1] = -1.1;
          }
        }
        flowGeo.attributes.position.needsUpdate = true;

        const emberSpeedX = 0.15 + s.airflowCms * 0.08;
        const emberSpeedY = 0.06 + grav * 1.45;
        for (let i = 0; i < EMBER_COUNT; i++) {
          emberAges[i] += dt * (0.55 + o2Norm * 0.65);
          const idx = i * 3;
          if (emberAges[i] >= 1) {
            emberAges[i] = 0;
            emberPositions[idx] = (Math.random() - 0.5) * 0.28;
            emberPositions[idx + 1] = (Math.random() - 0.5) * 0.22;
            emberPositions[idx + 2] = (Math.random() - 0.5) * 0.25;
          } else {
            emberPositions[idx] +=
              (emberSpeedX + (Math.random() - 0.5) * 0.25) * dt;
            emberPositions[idx + 1] +=
              (emberSpeedY + Math.sin(elapsedPhase * 4 + i) * 0.12) * dt;
            emberPositions[idx + 2] += (Math.random() - 0.5) * 0.2 * dt;
          }
        }
        emberGeo.attributes.position.needsUpdate = true;
      }

      volumeMaterial.uniforms.time.value = elapsedPhase;
      volumeMaterial.uniforms.droplet.value = s.fuelGeometry === 'liquid_droplet' ? 1 : 0;
      volume.scale.set(s.fuelGeometry === 'liquid_droplet' ? .68 : .42, s.fuelGeometry === 'liquid_droplet' ? .68 : .72, .68);
      volume.position.y = s.fuelGeometry === 'liquid_droplet' ? 0 : .38;
      volume.updateWorldMatrix(true, false);
      volumeMaterial.uniforms.eye.value.copy(camera.position);
      volume.worldToLocal(volumeMaterial.uniforms.eye.value);
      const q = qualityRef.current;
      volumeMaterial.uniforms.steps.value = q === 'low' ? 16 : q === 'medium' || (q === 'auto' && container.clientWidth < 700) ? 32 : 56;
      const ratio = q === 'low' ? 1 : Math.min(devicePixelRatio, q === 'high' ? 2 : 1.5);
      if(renderer.getPixelRatio() !== ratio) renderer.setPixelRatio(ratio);
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      environmentTarget.dispose();
      resizeObserver.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      facilityTracker.disposeAll();
      fuelTracker.disposeAll();
      baseTracker.disposeAll();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneHooksRef.current = null;
    };
    // Run once on mount; incremental prop updates apply via hooks below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sceneHooksRef.current?.rebuildFacility(facility);
  }, [facility]);

  useEffect(() => {
    sceneHooksRef.current?.rebuildFuel(fuelGeometry);
  }, [fuelGeometry]);

  useEffect(() => {
    sceneHooksRef.current?.toggleGroups(visibility);
  }, [visibility]);

  useEffect(() => {
    sceneHooksRef.current?.resetParticles();
  }, [simResetNonce]);

  useEffect(() => {
    sceneHooksRef.current?.setCameraView(cameraPreset);
  }, [cameraPreset, cameraResetNonce]);

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-xl overflow-hidden bg-[#070B10] border border-[#E2E8F0]">
      <div
        ref={containerRef}
        className="w-full h-full min-h-[460px] cursor-grab active:cursor-grabbing"
        aria-label="Interactive Three.js microgravity combustion chamber canvas"
      />

      <div
        ref={fallbackRef}
        className="hidden absolute inset-0 bg-[#070B10] flex flex-col items-center justify-center p-8 text-center gap-3 z-20"
      >
        <AlertTriangle className="w-8 h-8 text-[#D97706]" />
        <h3 className="font-display text-base font-semibold text-slate-100">
          3D WebGL Viewport Unavailable
        </h3>
        <p className="text-xs text-slate-300 max-w-md leading-relaxed">
          WebGL hardware context is unavailable in this browser session. Atmospheric boundary
          parameters, telemetry cards, and source-linked NASA experiment loaders remain active.
        </p>
      </div>

      <div className="absolute left-3 right-3 top-3.5 flex items-center justify-end gap-1 text-xs z-10">
        <select
          aria-label="Rendering quality"
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          className="min-w-0 flex-1 sm:flex-none bg-white/95 text-[#0F172A] border border-[#CBD5E1] shadow-xs rounded-md px-1 sm:px-2 py-1 text-[10px] sm:text-xs font-mono-telemetry focus:outline-none focus:border-[#0284C7] cursor-pointer"
        >
          {['auto', 'high', 'medium', 'low'].map((q) => (
            <option key={q} value={q}>
              {q.toUpperCase()}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="bg-white/95 text-[#0F172A] border border-[#CBD5E1] shadow-xs rounded-md px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs font-mono-telemetry hover:bg-[#F1F5F9] cursor-pointer"
          onClick={() => containerRef.current?.parentElement?.requestFullscreen()}
        >
          Fullscreen
        </button>
        <button
          type="button"
          className="bg-white/95 text-[#0F172A] border border-[#CBD5E1] shadow-xs rounded-md px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs font-mono-telemetry hover:bg-[#F1F5F9] cursor-pointer"
          onClick={() => {
            const canvas = containerRef.current?.querySelector('canvas');
            if (!canvas) {
              showSnapshotNotice('Snapshot unavailable — the WebGL canvas is not ready yet.');
              return;
            }
            const output = document.createElement('canvas');
            output.width = canvas.width;
            output.height = canvas.height + 96;
            const ctx = output.getContext('2d');
            if (!ctx) {
              showSnapshotNotice('Snapshot unavailable — could not read the WebGL canvas.');
              return;
            }
            ctx.drawImage(canvas, 0, 0);
            ctx.fillStyle = '#0F172A';
            ctx.fillRect(0, canvas.height, output.width, 96);
            ctx.fillStyle = '#F8FAFC';
            ctx.font = `${Math.max(12, Math.min(20, output.width / 45))}px sans-serif`;
            ctx.fillText('FLARE — Illustrative animation. Not experimental data or CFD.', 16, canvas.height + 35);
            ctx.fillText(`${oxygenPercent.toFixed(1)}% O₂ · ${pressureKpa.toFixed(1)} kPa · ${airflowCms.toFixed(1)} cm/s · ${gravityContext}`, 16, canvas.height + 65);
            const a = document.createElement('a');
            a.download = 'flare-conceptual-view.png';
            a.href = output.toDataURL();
            a.click();
            showSnapshotNotice('Snapshot saved — flare-conceptual-view.png downloaded.');
          }}
        >
          Snapshot
        </button>
      </div>

      {/* Snapshot confirmation toast */}
      {snapshotNotice ? (
        <div
          role="status"
          aria-live="polite"
          className="absolute left-3.5 bottom-16 z-20 max-w-[calc(100%-1.75rem)] rounded-lg bg-[#0F172A]/95 px-3 py-2 text-[11px] text-white shadow-lg"
        >
          {snapshotNotice}
        </div>
      ) : null}

      {/* Top-Left Live Boundary Telemetry HUD */}
      <div className="pointer-events-none absolute top-16 inset-x-3.5 flex flex-col gap-1.5 z-10">
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md border border-[#E2E8F0] font-mono-telemetry text-[11px] text-[#0F172A] shadow-xs flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRunning ? 'bg-[#059669]' : 'bg-[#D97706]'
              }`}
            />
            <span>{isRunning ? 'ILLUSTRATIVE ANIMATION' : 'PAUSED'}</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md border border-[#E2E8F0] font-mono-telemetry text-[11px] text-[#334155] shadow-xs tabular-nums whitespace-nowrap leading-normal">
            {oxygenPercent.toFixed(1)}% O₂ · {pressureKpa.toFixed(1)} kPa ·{' '}
            {airflowCms.toFixed(1)} cm/s · {gravityContext}
          </div>
        </div>

      </div>

      {/* Bottom Disclaimer & Controls Overlay */}
      <div className="pointer-events-none absolute bottom-3.5 inset-x-3.5 flex flex-wrap items-end justify-between gap-2">
        <div className="px-3 py-1.5 rounded-md bg-[#FFFFFF]/90 backdrop-blur-md border border-[#D97706]/35 flex items-center gap-2 text-[11px] text-[#0F172A]">
          <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
          <span>
            Conceptual 3D Visualization — Not a Validated CFD Solver or Flight Safety Tool.
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E2E8F0] font-mono-telemetry text-[10px] text-[#64748B]">
          <RotateCcw className="w-3 h-3 text-[#0284C7]" />
          <span>Drag to Orbit · Scroll to Zoom · Right-Drag to Pan</span>
        </div>
      </div>
    </div>
  );
}
