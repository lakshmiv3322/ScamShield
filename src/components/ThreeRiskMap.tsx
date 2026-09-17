import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MapRiskPin } from '../types';
import { RotateCcw, MapPin, ShieldAlert } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

interface ThreeRiskMapProps {
  pins: MapRiskPin[];
  onPinSelect?: (pin: MapRiskPin) => void;
  selectedPinId?: string | null;
}

const ThreeRiskMapCanvas: React.FC<ThreeRiskMapProps> = ({
  pins,
  onPinSelect,
  selectedPinId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number>(0);
  const [activeTooltipPin, setActiveTooltipPin] = useState<MapRiskPin | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Convert lat/lng to 3D Sphere coordinates
  const latLngToVector3 = (lat: number, lng: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 5.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const blueLight = new THREE.PointLight(0x5b8fff, 4, 20);
    blueLight.position.set(5, 5, 5);
    scene.add(blueLight);

    const redLight = new THREE.PointLight(0xef4444, 2.5, 15);
    redLight.position.set(-5, -3, 3);
    scene.add(redLight);

    // Globe Group
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // 1. Inner dark sphere
    const globeRadius = 1.9;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 48, 48);
    const globeMat = new THREE.MeshStandardMaterial({
      color: 0x0c131d,
      roughness: 0.7,
      metalness: 0.3,
      wireframe: false,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // 2. Cyber wireframe grid aura
    const wireGeo = new THREE.SphereGeometry(globeRadius * 1.015, 36, 18);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x5b8fff,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireMesh);

    // 3. Glowing equator / latitude rings
    const ringGeo = new THREE.RingGeometry(globeRadius * 1.08, globeRadius * 1.1, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x5b8fff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const equatorRing = new THREE.Mesh(ringGeo, ringMat);
    equatorRing.rotation.x = Math.PI / 2;
    globeGroup.add(equatorRing);

    // 4. Pins group
    const pinsGroup = new THREE.Group();
    pinsGroupRef.current = pinsGroup;
    globeGroup.add(pinsGroup);

    // Add pins for each city
    const pinMeshes: { mesh: THREE.Group; pinData: MapRiskPin }[] = [];

    pins.forEach((pin) => {
      const pinSubGroup = new THREE.Group();
      const pos = latLngToVector3(pin.lat, pin.lng, globeRadius);
      pinSubGroup.position.copy(pos);

      // Orient pin outward along sphere normal
      const normal = pos.clone().normalize();
      pinSubGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      const pinColor =
        pin.riskLevel === 'scam' ? 0xef4444 : pin.riskLevel === 'caution' ? 0xf59e0b : 0x22c55e;

      // Pin base cylinder (spike)
      const cylinderGeo = new THREE.CylinderGeometry(0.015, 0.04, 0.3, 12);
      const cylinderMat = new THREE.MeshBasicMaterial({ color: pinColor, transparent: true, opacity: 0.9 });
      const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
      cylinder.position.y = 0.15;
      pinSubGroup.add(cylinder);

      // Pin head sphere
      const headGeo = new THREE.SphereGeometry(0.075, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: pinColor,
        emissive: pinColor,
        emissiveIntensity: 0.9,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.32;
      pinSubGroup.add(head);

      // Pulsing wave beacon ring
      const waveGeo = new THREE.RingGeometry(0.04, 0.16, 24);
      const waveMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const wave = new THREE.Mesh(waveGeo, waveMat);
      wave.rotation.x = Math.PI / 2;
      wave.position.y = 0.02;
      pinSubGroup.add(wave);

      pinsGroup.add(pinSubGroup);
      pinMeshes.push({ mesh: pinSubGroup, pinData: pin });
    });

    // Connecting cyber arcs between cities (representing cross-family scam waves)
    if (pins.length >= 2) {
      const arcMat = new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.45 });
      const p1 = latLngToVector3(pins[0].lat, pins[0].lng, globeRadius);
      const p2 = latLngToVector3(pins[1].lat, pins[1].lng, globeRadius);
      const mid = p1.clone().lerp(p2, 0.5).normalize().multiplyScalar(globeRadius * 1.35);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(32);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcLine = new THREE.Line(arcGeo, arcMat);
      globeGroup.add(arcLine);
    }

    // Default orientation facing India / Asia coords
    globeGroup.rotation.y = -Math.PI * 0.45;
    globeGroup.rotation.x = 0.25;

    // Interaction Handlers (Rotate via drag)
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (isDraggingRef.current && globeGroupRef.current) {
        const deltaX = e.clientX - previousMousePositionRef.current.x;
        const deltaY = e.clientY - previousMousePositionRef.current.y;
        globeGroupRef.current.rotation.y += deltaX * 0.007;
        globeGroupRef.current.rotation.x += deltaY * 0.007;
        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // Raycast to check hover on pin heads
      if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        setActiveTooltipPin(null);
        setTooltipPos(null);
        return;
      }

      const raycaster = new THREE.Raycaster();
      const ndcX = (mouseX / width) * 2 - 1;
      const ndcY = -(mouseY / height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      let hoveredPin: MapRiskPin | null = null;
      for (const item of pinMeshes) {
        const intersects = raycaster.intersectObjects(item.mesh.children, true);
        if (intersects.length > 0) {
          hoveredPin = item.pinData;
          break;
        }
      }

      if (hoveredPin) {
        setActiveTooltipPin(hoveredPin);
        setTooltipPos({ x: mouseX, y: mouseY });
      } else {
        setActiveTooltipPin(null);
        setTooltipPos(null);
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onMouseLeave = () => {
      isDraggingRef.current = false;
      setActiveTooltipPin(null);
      setTooltipPos(null);
    };

    const onClick = (e: MouseEvent) => {
      if (!onPinSelect) return;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const raycaster = new THREE.Raycaster();
      const ndcX = (mouseX / width) * 2 - 1;
      const ndcY = -(mouseY / height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      for (const item of pinMeshes) {
        const intersects = raycaster.intersectObjects(item.mesh.children, true);
        if (intersects.length > 0) {
          onPinSelect(item.pinData);
          break;
        }
      }
    };

    // Touch handlers for mobile devices
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && globeGroupRef.current && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
        const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;
        globeGroupRef.current.rotation.y += deltaX * 0.007;
        globeGroupRef.current.rotation.x += deltaY * 0.007;
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('click', onClick);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Gentle auto-rotation when idle
      if (!isDraggingRef.current && globeGroupRef.current) {
        globeGroupRef.current.rotation.y += 0.003;
      }

      // Animate pin pulsing rings
      pinMeshes.forEach(({ mesh }, index) => {
        const wave = mesh.children[2] as THREE.Mesh;
        if (wave) {
          const scale = 1 + Math.sin(elapsed * 4 + index) * 0.45;
          wave.scale.set(scale, scale, 1);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          width = w;
          height = h;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mouseleave', onMouseLeave);
      container.removeEventListener('click', onClick);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      globeGeo.dispose();
      globeMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, [pins]);

  return (
    <div className="relative w-full h-[400px] sm:h-[460px] rounded-2xl overflow-hidden glass-panel border border-white/10 flex flex-col">
      {/* Header Info Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-[#0B0F14]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-ping" />
          <span className="text-xs font-semibold text-white tracking-wide">Family Threat Radar</span>
          <span className="text-[10px] text-gray-400 font-mono">LIVE 3D</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              if (globeGroupRef.current) {
                globeGroupRef.current.rotation.y = -Math.PI * 0.45;
                globeGroupRef.current.rotation.x = 0.25;
              }
            }}
            title="Reset Angle"
            className="p-1.5 rounded-lg bg-[#121821]/80 hover:bg-[#1f2937] text-gray-300 border border-white/10 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Canvas Mount */}
      <div
        ref={containerRef}
        className="w-full h-full flex-1 cursor-grab active:cursor-grabbing select-none"
      />

      {/* Interactive Tooltip Overlay */}
      {activeTooltipPin && tooltipPos && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(tooltipPos.x + 12, 340),
            top: Math.max(tooltipPos.y - 120, 20),
            pointerEvents: 'none',
          }}
          className="z-30 w-72 p-3.5 rounded-xl bg-[#121821]/95 border border-white/15 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#5B8FFF]" />
              <span className="text-xs font-bold text-white">{activeTooltipPin.cityName}</span>
            </div>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                activeTooltipPin.riskLevel === 'scam'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : activeTooltipPin.riskLevel === 'caution'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {activeTooltipPin.riskLevel}
            </span>
          </div>

          <p className="text-xs text-gray-200 line-clamp-2 leading-relaxed mb-2">
            "{activeTooltipPin.scamSnippet}"
          </p>

          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/10">
            <span>Target: <strong className="text-white">{activeTooltipPin.memberAffected}</strong></span>
            <span>{activeTooltipPin.timestamp}</span>
          </div>
        </div>
      )}

      {/* Legend Footer */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between text-[11px] text-gray-400 bg-[#0B0F14]/70 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 pointer-events-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
            <span>High Risk ({pins.filter((p) => p.riskLevel === 'scam').length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span>Caution ({pins.filter((p) => p.riskLevel === 'caution').length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span>Safe ({pins.filter((p) => p.riskLevel === 'safe').length})</span>
          </div>
        </div>
        <div className="text-[10px] text-gray-500 hidden sm:block">
          Drag to rotate globe • Hover pin for incident
        </div>
      </div>
    </div>
  );
};

export const ThreeRiskMap: React.FC<ThreeRiskMapProps> = (props) => {
  const fallback = (
    <div className="relative w-full h-[420px] rounded-2xl bg-[#0B0F14] border border-white/10 p-6 flex flex-col justify-between overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white">2D Threat Radar Summary</h3>
        </div>
        <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-1 rounded">2D Fallback</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 my-auto">
        {props.pins.slice(0, 6).map((pin) => (
          <div
            key={pin.id}
            onClick={() => props.onPinSelect && props.onPinSelect(pin)}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#5B8FFF] cursor-pointer transition"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
              <span>{pin.cityName}</span>
              <span
                className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                  pin.riskLevel === 'scam' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {pin.riskLevel}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 line-clamp-1">"{pin.scamSnippet}"</p>
          </div>
        ))}
      </div>

      <div className="text-[11px] text-gray-500 text-center">
        WebGL 3D rendering was suspended. Live family threats remain monitored in 2D mode.
      </div>
    </div>
  );

  return (
    <ErrorBoundary name="3D Threat Radar" fallback={fallback}>
      <ThreeRiskMapCanvas {...props} />
    </ErrorBoundary>
  );
};

