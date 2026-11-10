import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GALLERY_ROOMS } from '../data/caseData';
import { GalleryRoom, RoomLocationId } from '../types/game';
import { sound } from '../utils/audio';
import {
  Layers,
  Compass,
  RotateCcw,
  Sparkles,
  Maximize2,
  Video,
  Eye,
  Camera,
} from 'lucide-react';

interface ThreeGalleryProps {
  selectedLocationId?: RoomLocationId;
  onSelectLocation: (locationId: RoomLocationId) => void;
  inspectedLocations: RoomLocationId[];
  isInvestigationPhase?: boolean;
}

type CameraPreset = 'iso' | 'focus' | 'top' | 'orbit';

// Reusable scratch vectors and colors to ensure zero GC during tick
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _colorScratch = new THREE.Color();
const _warmSpotColor = new THREE.Color(0xffe2bf); // Cozy warm amber/tungsten gallery spotlight (2800K)
const _coolSpotColor = new THREE.Color(0xd2e9ff); // Crisp cool museum daylight spotlight (5500K)
const _warmKeyColor = new THREE.Color(0xfff7ea);
const _coolKeyColor = new THREE.Color(0xe0f2fe);

export const ThreeGallery: React.FC<ThreeGalleryProps> = ({
  selectedLocationId,
  onSelectLocation,
  inspectedLocations,
  isInvestigationPhase = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [hoveredRoom, setHoveredRoom] = useState<GalleryRoom | null>(null);

  const onSelectRef = useRef(onSelectLocation);
  onSelectRef.current = onSelectLocation;

  const selectedLocRef = useRef(selectedLocationId);
  selectedLocRef.current = selectedLocationId;

  const cameraPresetRef = useRef(cameraPreset);
  cameraPresetRef.current = cameraPreset;

  useEffect(() => {
    if (viewMode !== '3d' || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    const bgColor = new THREE.Color(0xf6f7f9);
    scene.background = bgColor;
    scene.fog = new THREE.FogExp2(0xf6f7f9, 0.022);

    // Master diorama group for the floating papercraft dollhouse
    const galleryRoot = new THREE.Group();
    scene.add(galleryRoot);

    // 2. Camera Setup (Perspective with smooth damping)
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.5, 100);
    camera.position.set(22, 22, 22);
    const cameraTarget = new THREE.Vector3(0, 0.5, 0);
    camera.lookAt(cameraTarget);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Studio Environment Reflection
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {}

    // 5. Procedural Textures (Zero 404s)
    // Hazard crime tape texture
    const tapeCanvas = document.createElement('canvas');
    tapeCanvas.width = 128;
    tapeCanvas.height = 32;
    const tapeCtx = tapeCanvas.getContext('2d');
    if (tapeCtx) {
      tapeCtx.fillStyle = '#fb7185';
      tapeCtx.fillRect(0, 0, 128, 32);
      tapeCtx.fillStyle = '#1e293b';
      for (let i = -32; i < 160; i += 32) {
        tapeCtx.beginPath();
        tapeCtx.moveTo(i, 0);
        tapeCtx.lineTo(i + 16, 32);
        tapeCtx.lineTo(i + 32, 32);
        tapeCtx.lineTo(i + 16, 0);
        tapeCtx.fill();
      }
    }
    const tapeTexture = new THREE.CanvasTexture(tapeCanvas);
    tapeTexture.wrapS = THREE.RepeatWrapping;
    tapeTexture.repeat.set(4, 1);

    // Floor parquet subtle wood grain
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 256;
    floorCanvas.height = 256;
    const fCtx = floorCanvas.getContext('2d');
    if (fCtx) {
      fCtx.fillStyle = '#f8f7f4';
      fCtx.fillRect(0, 0, 256, 256);
      fCtx.strokeStyle = '#e5e3dc';
      fCtx.lineWidth = 2;
      for (let x = 0; x < 256; x += 32) {
        fCtx.strokeRect(x, 0, 32, 256);
      }
    }
    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(6, 6);

    // Soft Contact Drop Shadow below floating toyhouse
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 12, 64, 64, 64);
      grad.addColorStop(0, 'rgba(30, 41, 59, 0.42)');
      grad.addColorStop(0.45, 'rgba(51, 65, 85, 0.22)');
      grad.addColorStop(0.8, 'rgba(148, 163, 184, 0.06)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(24, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = -0.82;
    scene.add(contactShadow);

    // 6. Dynamic Lighting Rig with Ceiling Spotlight Projection
    const hemiLight = new THREE.HemisphereLight(0xfffaed, 0xe0e7ff, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.3);
    keyLight.position.set(18, 28, 14);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0004;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdbeafe, 0.55);
    rimLight.position.set(-18, 16, -14);
    scene.add(rimLight);

    // Primary Ceiling Track Spotlight: casts dynamic moving shadow across the halls
    // and shifts between warm incandescent (2800K) and cool gallery daylight (5500K)
    const ceilingSpotLight = new THREE.SpotLight(0xfff5ea, 2.5, 45, Math.PI / 4.2, 0.55, 1.2);
    ceilingSpotLight.position.set(0, 16, 0);
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(0, 0.2, 0);
    scene.add(spotTarget);
    ceilingSpotLight.target = spotTarget;
    if (!isSoftwareGl) {
      ceilingSpotLight.castShadow = true;
      ceilingSpotLight.shadow.mapSize.width = 1024;
      ceilingSpotLight.shadow.mapSize.height = 1024;
      ceilingSpotLight.shadow.camera.near = 4;
      ceilingSpotLight.shadow.camera.far = 30;
      ceilingSpotLight.shadow.bias = -0.0003;
    }
    scene.add(ceilingSpotLight);

    // Overhead papercraft ceiling spotlight track ring
    const ceilingTrackRing = new THREE.Mesh(
      new THREE.RingGeometry(2.0, 2.2, 32),
      new THREE.MeshBasicMaterial({ color: 0xcbd5e1, side: THREE.DoubleSide, transparent: true, opacity: 0.4 })
    );
    ceilingTrackRing.rotation.x = Math.PI / 2;
    ceilingTrackRing.position.set(0, 15.2, 0);
    scene.add(ceilingTrackRing);

    // 7. Atmospheric Floating Dust Particles (Cinematic Air)
    const particleCount = isSoftwareGl ? 30 : 90;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 20;
      particlePos[i + 1] = Math.random() * 4 + 0.2;
      particlePos[i + 2] = (Math.random() - 0.5) * 20;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.12,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const dustParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(dustParticles);

    // 8. Base Gallery Pavilion Ground (Stepped Papercraft Dollhouse Plinth)
    const baseGroup = new THREE.Group();

    // Bottom foundation plinth (warm craftboard bevel)
    const plinthGeo = new THREE.BoxGeometry(22.8, 0.35, 22.8);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0xdcd8ce,
      roughness: 0.92,
      metalness: 0.02,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.y = -0.42;
    plinthMesh.receiveShadow = !isSoftwareGl;
    baseGroup.add(plinthMesh);

    // Main papercraft base platform
    const baseGeo = new THREE.BoxGeometry(22, 0.45, 22);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xf2efe7,
      roughness: 0.85,
      metalness: 0.04,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.15;
    baseMesh.receiveShadow = !isSoftwareGl;
    baseMesh.castShadow = !isSoftwareGl;
    baseGroup.add(baseMesh);

    // Architectural papercraft grid lines
    const grid = new THREE.GridHelper(20, 20, 0xd0cec4, 0xe4e2d8);
    grid.position.y = 0.08;
    baseGroup.add(grid);

    galleryRoot.add(baseGroup);

    // 9. Procedural Composite Rooms (3-12 parts per room)
    const roomMeshes = new Map<string, THREE.Group>();

    GALLERY_ROOMS.forEach((room) => {
      const roomGroup = new THREE.Group();
      roomGroup.position.set(...room.position);
      (roomGroup as any).userData = { roomId: room.id, roomData: room };

      const [rw, rh, rd] = room.size;

      // Part 1: Floor with parquet texture
      const fGeo = new THREE.BoxGeometry(rw - 0.15, 0.12, rd - 0.15);
      const fMat = new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.6,
        metalness: 0.1,
      });
      const fMesh = new THREE.Mesh(fGeo, fMat);
      fMesh.position.y = 0.06;
      fMesh.receiveShadow = !isSoftwareGl;
      roomGroup.add(fMesh);

      // Part 2: Walls (Isometric cutaway, back and left)
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
      });
      const bWallGeo = new THREE.BoxGeometry(rw, rh, 0.25);
      const bWall = new THREE.Mesh(bWallGeo, wallMat);
      bWall.position.set(0, rh / 2, -rd / 2);
      bWall.castShadow = !isSoftwareGl;
      bWall.receiveShadow = !isSoftwareGl;
      roomGroup.add(bWall);

      const lWallGeo = new THREE.BoxGeometry(0.25, rh, rd);
      const lWall = new THREE.Mesh(lWallGeo, wallMat);
      lWall.position.set(-rw / 2, rh / 2, 0);
      lWall.castShadow = !isSoftwareGl;
      lWall.receiveShadow = !isSoftwareGl;
      roomGroup.add(lWall);

      // Part 3: Base trim molding
      const trimGeo = new THREE.BoxGeometry(rw, 0.15, 0.28);
      const trimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
      const trim = new THREE.Mesh(trimGeo, trimMat);
      trim.position.set(0, 0.08, -rd / 2 + 0.02);
      trim.receiveShadow = !isSoftwareGl;
      roomGroup.add(trim);

      // Part 4: Interactive Holographic Beacon Ring & Light Beam
      const beaconGroup = new THREE.Group();
      const ringGeo = new THREE.RingGeometry(0.5, 0.7, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(room.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.14;
      (ring as any).name = 'beaconRing';
      beaconGroup.add(ring);

      // Subtle vertical light beam
      const beamGeo = new THREE.CylinderGeometry(0.3, 0.5, 2.5, 16, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(room.color),
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 1.35;
      (beam as any).name = 'lightBeam';
      beaconGroup.add(beam);
      roomGroup.add(beaconGroup);

      // Room Specific Multi-part Props
      if (room.id === 'main_hall') {
        // Multi-tier Marble Pedestal + Gold Modern Sculpture
        const pedBase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.7, 0.15, 24),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 })
        );
        pedBase.position.y = 0.15;
        pedBase.castShadow = !isSoftwareGl;
        pedBase.receiveShadow = !isSoftwareGl;
        roomGroup.add(pedBase);

        const pedColumn = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4, 0.45, 0.7, 24),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
        );
        pedColumn.position.y = 0.55;
        pedColumn.castShadow = !isSoftwareGl;
        pedColumn.receiveShadow = !isSoftwareGl;
        roomGroup.add(pedColumn);

        // Abstract Möbius Ring
        const torusMesh = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.35, 0.08, 64, 16),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.18 })
        );
        torusMesh.position.y = 1.25;
        torusMesh.castShadow = !isSoftwareGl;
        (torusMesh as any).name = 'torusSculpture';
        roomGroup.add(torusMesh);

        // Framed Modern Artworks on wall
        const artFrame = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 1.2, 0.06),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
        );
        artFrame.position.set(0, 1.45, -rd / 2 + 0.15);
        artFrame.castShadow = !isSoftwareGl;
        roomGroup.add(artFrame);

        // Canvas inside frame
        const artCanvas = new THREE.Mesh(
          new THREE.PlaneGeometry(1.6, 1.0),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.7 })
        );
        artCanvas.position.set(0, 1.45, -rd / 2 + 0.19);
        roomGroup.add(artCanvas);
      } else if (room.id === 'restoration_room') {
        // Crime Scene Table + Overturned Easel + Hazard Tape
        const table = new THREE.Mesh(
          new THREE.BoxGeometry(2.0, 0.65, 1.1),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 })
        );
        table.position.set(0, 0.38, 0);
        table.castShadow = !isSoftwareGl;
        table.receiveShadow = !isSoftwareGl;
        roomGroup.add(table);

        // Scattered Glass Shards
        const shardGeo = new THREE.TetrahedronGeometry(0.12);
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.8,
          transmission: 0.9,
          roughness: 0.1,
        });
        [-0.4, 0.2, 0.5].forEach((sx, idx) => {
          const shard = new THREE.Mesh(shardGeo, glassMat);
          shard.position.set(sx, 0.75, idx * 0.2 - 0.2);
          shard.castShadow = !isSoftwareGl;
          roomGroup.add(shard);
        });

        // Police Caution Tape Ribbon
        const tapeMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(2.4, 0.15),
          new THREE.MeshBasicMaterial({ map: tapeTexture, side: THREE.DoubleSide })
        );
        tapeMesh.position.set(0, 0.85, 0.9);
        roomGroup.add(tapeMesh);

        // High Ventilation Window + Nylon Thread
        const ventBox = new THREE.Mesh(
          new THREE.BoxGeometry(1.0, 0.55, 0.2),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
        );
        ventBox.position.set(0.9, 1.85, -rd / 2 + 0.1);
        ventBox.castShadow = !isSoftwareGl;
        roomGroup.add(ventBox);

        // Nylon thread hanging from latch
        const thread = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 })
        );
        thread.position.set(0.9, 1.4, -rd / 2 + 0.15);
        roomGroup.add(thread);
      } else if (room.id === 'curator_office') {
        // Executive Desk + Mahogany Bookshelf + Swivel Chair
        const desk = new THREE.Mesh(
          new THREE.BoxGeometry(1.7, 0.6, 0.85),
          new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.4, metalness: 0.1 })
        );
        desk.position.set(0.2, 0.35, 0.1);
        desk.castShadow = !isSoftwareGl;
        desk.receiveShadow = !isSoftwareGl;
        roomGroup.add(desk);

        const shelf = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 1.8, 1.6),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 })
        );
        shelf.position.set(-rw / 2 + 0.2, 0.95, 0.2);
        shelf.castShadow = !isSoftwareGl;
        shelf.receiveShadow = !isSoftwareGl;
        roomGroup.add(shelf);

        // Brass Desk Lamp (lathe geometry)
        const lamp = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.12, 0.35, 12),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
        );
        lamp.position.set(0.7, 0.8, 0.1);
        lamp.castShadow = !isSoftwareGl;
        roomGroup.add(lamp);
      } else if (room.id === 'security_room') {
        // Curved Console Desk + Triple CCTV Monitors + Server Rack
        const desk = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.6, 0.75),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
        );
        desk.position.set(0, 0.35, -0.4);
        desk.castShadow = !isSoftwareGl;
        desk.receiveShadow = !isSoftwareGl;
        roomGroup.add(desk);

        // 3 Glowing Screen Panels
        [-0.5, 0, 0.5].forEach((sx, idx) => {
          const scr = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 0.28, 0.04),
            new THREE.MeshBasicMaterial({ color: 0x34d399 })
          );
          scr.position.set(sx, 0.82, -0.4);
          scr.rotation.y = (idx - 1) * 0.15;
          roomGroup.add(scr);
        });

        // Server rack with blinking LEDs
        const rack = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 1.7, 0.5),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
        );
        rack.position.set(-rw / 2 + 0.4, 0.9, 0.4);
        rack.castShadow = !isSoftwareGl;
        rack.receiveShadow = !isSoftwareGl;
        roomGroup.add(rack);
      }

      galleryRoot.add(roomGroup);
      roomMeshes.set(room.id, roomGroup);
    });

    // 10. Pointer Raycasting & Mouse Motion Tracking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const targetMouseNDC = new THREE.Vector2(0, 0);
    const smoothedMouseNDC = new THREE.Vector2(0, 0);

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      targetMouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetMouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      mouse.copy(targetMouseNDC);

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      let foundRoomId: string | null = null;
      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== scene) {
          if ((cur as any).userData?.roomId) {
            foundRoomId = (cur as any).userData.roomId;
            break;
          }
          cur = cur.parent;
        }
        if (foundRoomId) break;
      }

      if (foundRoomId) {
        const rData = GALLERY_ROOMS.find((r) => r.id === foundRoomId) || null;
        setHoveredRoom(rData);
        container.style.cursor = 'pointer';
      } else {
        setHoveredRoom(null);
        container.style.cursor = 'default';
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== scene) {
          if ((cur as any).userData?.roomId) {
            const locId = (cur as any).userData.roomId as RoomLocationId;
            sound.playCameraGlide();
            onSelectRef.current(locId);
            return;
          }
          cur = cur.parent;
        }
      }
    };

    const handlePointerLeave = () => {
      targetMouseNDC.set(0, 0);
      setHoveredRoom(null);
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('click', handlePointerDown);
    container.addEventListener('mouseleave', handlePointerLeave);

    // 11. Damped Camera Motion & Continuous Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();

    function renderLoop() {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // 11a. Smooth mouse damping for dynamic ceiling projector light
      smoothedMouseNDC.x = THREE.MathUtils.damp(smoothedMouseNDC.x, targetMouseNDC.x, 3.5, delta);
      smoothedMouseNDC.y = THREE.MathUtils.damp(smoothedMouseNDC.y, targetMouseNDC.y, 3.5, delta);

      // 11b. Dynamic Cold/Warm Color Shift of the Ceiling Spotlight
      // Left (-1) shifts to warm amber tungsten (2800K), right (+1) shifts to cool daylight LED (5500K)
      const coldWarmFactor = THREE.MathUtils.clamp(
        (smoothedMouseNDC.x * 0.7 - smoothedMouseNDC.y * 0.3 + 1) * 0.5,
        0,
        1
      );
      _colorScratch.copy(_warmSpotColor).lerp(_coolSpotColor, coldWarmFactor);
      ceilingSpotLight.color.copy(_colorScratch);

      // Subtle track shift of ceiling spotlight with mouse position (casting dynamic moving shadows)
      const targetSpotX = smoothedMouseNDC.x * 4.2;
      const targetSpotZ = -smoothedMouseNDC.y * 4.2;
      ceilingSpotLight.position.x = THREE.MathUtils.damp(ceilingSpotLight.position.x, targetSpotX, 3.0, delta);
      ceilingSpotLight.position.z = THREE.MathUtils.damp(ceilingSpotLight.position.z, targetSpotZ, 3.0, delta);
      ceilingSpotLight.intensity = 2.5 + Math.sin(time * 2.2) * 0.12;

      // Subtle key directional light temperature shift for scene-wide harmony
      keyLight.color.lerpColors(_warmKeyColor, _coolKeyColor, coldWarmFactor * 0.45 + 0.25);

      // 11c. Gentle Floating Animation for the Gallery Model (Papercraft Toyhouse Aesthetic)
      const floatY = Math.sin(time * 1.5) * 0.16; // Gentle vertical bobbing
      const tiltX = Math.cos(time * 1.1) * 0.010;  // Subtle pitch
      const tiltZ = Math.sin(time * 0.9) * 0.012;  // Subtle roll
      galleryRoot.position.y = floatY;
      galleryRoot.rotation.x = tiltX;
      galleryRoot.rotation.z = tiltZ;

      // Contact drop shadow reacts dynamically to floating height
      const shadowScale = 1.0 - floatY * 0.35;
      contactShadow.scale.set(shadowScale, shadowScale, shadowScale);
      (contactShadow.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.clamp(
        0.52 - floatY * 0.35,
        0.2,
        0.65
      );

      // Rotate dust particles
      dustParticles.rotation.y = time * 0.05;

      // Rotate torus modern sculpture in central hall
      const centralHall = roomMeshes.get('main_hall');
      if (centralHall) {
        const sculp = centralHall.getObjectByName('torusSculpture');
        if (sculp) {
          sculp.rotation.y += delta * 0.8;
          sculp.rotation.x += delta * 0.4;
        }
      }

      // Calculate desired camera position & target based on cameraPreset
      const selectedId = selectedLocRef.current || 'main_hall';
      const curRoom = GALLERY_ROOMS.find((r) => r.id === selectedId) || GALLERY_ROOMS[0];

      let targetCamPos = _vec3A.set(20, 20, 20);
      let targetLookAt = _vec3B.set(0, 0.5, 0);

      switch (cameraPresetRef.current) {
        case 'focus': {
          // Dramatic detective low-angle swoop into selected room
          targetCamPos.set(curRoom.position[0] + 7, curRoom.position[1] + 5, curRoom.position[2] + 7);
          targetLookAt.set(curRoom.position[0], curRoom.position[1] + 0.8, curRoom.position[2]);
          break;
        }
        case 'top': {
          // Top-down tactical layout
          targetCamPos.set(curRoom.position[0] * 0.3, 24, curRoom.position[2] * 0.3 + 0.1);
          targetLookAt.set(0, 0, 0);
          break;
        }
        case 'orbit': {
          // Slow cinematic orbit
          const r = 22;
          targetCamPos.set(Math.cos(time * 0.25) * r, 18 + Math.sin(time * 0.3) * 2, Math.sin(time * 0.25) * r);
          targetLookAt.set(0, 0.5, 0);
          break;
        }
        case 'iso':
        default: {
          targetCamPos.set(18, 18, 18);
          targetLookAt.set(0, 0.5, 0);
          break;
        }
      }

      // Smooth exponential damping on camera position and look target
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamPos.x, 5, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamPos.y, 5, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamPos.z, 5, delta);

      cameraTarget.x = THREE.MathUtils.damp(cameraTarget.x, targetLookAt.x, 5, delta);
      cameraTarget.y = THREE.MathUtils.damp(cameraTarget.y, targetLookAt.y, 5, delta);
      cameraTarget.z = THREE.MathUtils.damp(cameraTarget.z, targetLookAt.z, 5, delta);
      camera.lookAt(cameraTarget);

      // Pulse beacon rings & elevate selected room
      roomMeshes.forEach((group, roomId) => {
        const isSelected = selectedLocRef.current === roomId;
        const ring = group.getObjectByName('beaconRing') as THREE.Mesh;
        const beam = group.getObjectByName('lightBeam') as THREE.Mesh;

        if (isSelected) {
          group.position.y = THREE.MathUtils.damp(group.position.y, 0.35, 7, delta);
          if (ring) {
            (ring.material as THREE.MeshBasicMaterial).opacity = 0.95;
            ring.rotation.z += delta * 1.8;
          }
          if (beam) {
            (beam.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(time * 3) * 0.1;
          }
        } else {
          group.position.y = THREE.MathUtils.damp(group.position.y, 0, 7, delta);
          if (ring) {
            (ring.material as THREE.MeshBasicMaterial).opacity = 0.3;
          }
          if (beam) {
            (beam.material as THREE.MeshBasicMaterial).opacity = 0.05;
          }
        }
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    }

    animId = requestAnimationFrame(renderLoop);

    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('click', handlePointerDown);
      container.removeEventListener('mouseleave', handlePointerLeave);
      if (renderer.domElement.parentElement) {
        container.removeChild(renderer.domElement);
      }
      shadowTexture.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      tapeTexture.dispose();
      floorTexture.dispose();
      renderer.dispose();
    };
  }, [viewMode]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-white/80 rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col group">
      {/* Top Header bar with Cinematic Viewport Controls */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-white/95 z-10 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-coral-500 animate-none"></div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-800">
            画廊空间架构巡视
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200/70 flex items-center space-x-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            <span>纸雕微缩玩具屋 · 动态冷暖光影</span>
          </span>
        </div>

        {/* Camera Preset Pills & 2D/3D Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl text-xs">
          <button
            onClick={() => {
              setCameraPreset('iso');
              sound.playCameraGlide();
            }}
            className={`px-2.5 py-1 rounded-lg transition font-bold flex items-center space-x-1 ${
              cameraPreset === 'iso' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>等距俯瞰</span>
          </button>

          <button
            onClick={() => {
              setCameraPreset('focus');
              sound.playCameraGlide();
            }}
            className={`px-2.5 py-1 rounded-lg transition font-bold flex items-center space-x-1 ${
              cameraPreset === 'focus' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-coral-500" />
            <span>特写聚焦</span>
          </button>

          <button
            onClick={() => {
              setCameraPreset('orbit');
              sound.playCameraGlide();
            }}
            className={`px-2.5 py-1 rounded-lg transition font-bold flex items-center space-x-1 ${
              cameraPreset === 'orbit' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-purple-500" />
            <span>巡游电影</span>
          </button>

          <div className="w-px h-3.5 bg-slate-200 mx-1"></div>

          <button
            onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
            className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 font-bold flex items-center space-x-1"
          >
            {viewMode === '3d' ? (
              <>
                <Compass className="w-3.5 h-3.5 text-sky-500" />
                <span>2D蓝图</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5 text-coral-500" />
                <span>3D画廊</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3D Canvas Mount Point */}
      {viewMode === '3d' ? (
        <div className="relative flex-1 w-full min-h-[300px]" ref={mountRef}>
          {/* Hovered room tooltip */}
          {hoveredRoom && (
            <div className="absolute top-3 left-3 bg-white/95 border border-slate-200 rounded-2xl px-3.5 py-2 shadow-lg pointer-events-none transition-all z-20">
              <div className="flex items-center space-x-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: hoveredRoom.color }}
                />
                <span className="text-xs font-bold text-slate-800">{hoveredRoom.name}</span>
                {hoveredRoom.isCrimeScene && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.2 rounded font-bold">
                    案发现场
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-[220px] line-clamp-1">
                {hoveredRoom.desc}
              </p>
            </div>
          )}

          {/* Interactive Floating Hint */}
          <div className="absolute bottom-3 left-3 text-[11px] text-slate-500 bg-white/90 px-3 py-1 rounded-full border border-slate-200 shadow-2xs pointer-events-none flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>光标引导天花板冷暖聚光灯 · 悬浮纸雕展厅点击勘验搜查</span>
          </div>
        </div>
      ) : (
        /* 2D Blueprint Fallback View */
        <div className="flex-1 p-4 grid grid-cols-2 gap-3 bg-slate-50/70 overflow-auto">
          {GALLERY_ROOMS.map((room) => {
            const isSelected = selectedLocationId === room.id;
            const isInspected = inspectedLocations.includes(room.id);
            return (
              <button
                key={room.id}
                onClick={() => {
                  sound.playCameraGlide();
                  onSelectLocation(room.id);
                }}
                className={`text-left p-3.5 rounded-2xl border transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-coral-500 ring-2 ring-coral-100 shadow-sm'
                    : 'bg-white/90 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold flex items-center space-x-1.5"
                      style={{ color: room.color }}
                    >
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: room.color }}
                      />
                      <span>{room.name}</span>
                    </span>
                    {room.isCrimeScene && (
                      <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-200">
                        死者现场
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{room.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    可搜查物证: {room.availableClues.length} 件
                  </span>
                  {isInspected ? (
                    <span className="text-emerald-600 font-bold">已勘验完成</span>
                  ) : (
                    <span className="text-amber-600 font-bold">待搜查</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Sleek Bottom Room Swapper Dock */}
      <div className="px-4 py-2.5 bg-slate-50/95 border-t border-slate-100 flex items-center justify-between gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-slate-400 shrink-0">快捷切房：</span>
        <div className="flex items-center space-x-2">
          {GALLERY_ROOMS.map((room) => {
            const isSelected = selectedLocationId === room.id;
            return (
              <button
                key={room.id}
                onClick={() => {
                  sound.playCameraGlide();
                  onSelectLocation(room.id);
                }}
                className={`text-xs px-3 py-1.5 rounded-xl transition font-bold shrink-0 flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: room.color }}
                />
                <span>{room.name.split('（')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
