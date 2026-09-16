import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RiskLevel } from '../types';

interface ThreeShieldProps {
  riskLevel?: RiskLevel | 'default' | string;
  isHovered?: boolean;
  isPulsing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const ThreeShield: React.FC<ThreeShieldProps> = ({
  riskLevel = 'default',
  isHovered = false,
  isPulsing = false,
  size = 'lg',
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const shieldGroupRef = useRef<THREE.Group | null>(null);
  const pointLightRef = useRef<THREE.PointLight | null>(null);
  const innerMeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameIdRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  // Determine colors based on risk state
  const getColorHex = (level: string) => {
    switch (level) {
      case 'scam':
        return 0xef4444; // danger red
      case 'caution':
        return 0xf59e0b; // amber
      case 'safe':
        return 0x22c55e; // emerald
      case 'default':
      default:
        return 0x5b8fff; // electric blue
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Clean previous canvases
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 6, 4);
    scene.add(dirLight);

    const themeColor = getColorHex(riskLevel);
    const pointLight = new THREE.PointLight(themeColor, 3.5, 10);
    pointLight.position.set(0, 0, 2);
    scene.add(pointLight);
    pointLightRef.current = pointLight;

    // Shield group
    const shieldGroup = new THREE.Group();
    shieldGroupRef.current = shieldGroup;
    scene.add(shieldGroup);

    // Create 3D Shield Shape using ExtrudeGeometry
    const shape = new THREE.Shape();
    // Top center
    shape.moveTo(0, 1.25);
    // Top right curve
    shape.bezierCurveTo(0.6, 1.2, 1.1, 1.0, 1.1, 0.4);
    // Right flank tapering down to point
    shape.bezierCurveTo(1.1, -0.4, 0.7, -1.0, 0, -1.5);
    // Left flank tapering up
    shape.bezierCurveTo(-0.7, -1.0, -1.1, -0.4, -1.1, 0.4);
    // Top left curve back to center
    shape.bezierCurveTo(-1.1, 1.0, -0.6, 1.2, 0, 1.25);

    const extrudeSettings = {
      steps: 2,
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 5,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    // Outer shield material (metallic glass / brushed carbon)
    const material = new THREE.MeshStandardMaterial({
      color: 0x121821,
      roughness: 0.25,
      metalness: 0.85,
      emissive: themeColor,
      emissiveIntensity: 0.22,
    });

    const shieldMesh = new THREE.Mesh(geometry, material);
    shieldGroup.add(shieldMesh);

    // Inner glowing core emblem (padlock / crest)
    const innerShape = new THREE.Shape();
    innerShape.moveTo(0, 0.7);
    innerShape.bezierCurveTo(0.35, 0.65, 0.65, 0.5, 0.65, 0.2);
    innerShape.bezierCurveTo(0.65, -0.2, 0.4, -0.55, 0, -0.9);
    innerShape.bezierCurveTo(-0.4, -0.55, -0.65, -0.2, -0.65, 0.2);
    innerShape.bezierCurveTo(-0.65, 0.5, -0.35, 0.65, 0, 0.7);

    const innerGeometry = new THREE.ShapeGeometry(innerShape);
    innerGeometry.center();
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: themeColor,
      emissive: themeColor,
      emissiveIntensity: 0.75,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    innerMesh.position.z = 0.23;
    innerMesh.scale.set(0.72, 0.72, 1);
    shieldGroup.add(innerMesh);
    innerMeshRef.current = innerMesh;

    // Glowing orbital cyber ring around shield
    const ringGeo = new THREE.TorusGeometry(1.6, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: themeColor,
      transparent: true,
      opacity: 0.35,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.6;
    shieldGroup.add(ringMesh);

    // Floating particle field
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 3.5;
      positions[i + 1] = (Math.random() - 0.5) * 3.5;
      positions[i + 2] = (Math.random() - 0.5) * 2;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: themeColor,
      size: 0.035,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    shieldGroup.add(particles);

    // Mouse movement listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = nx * 0.45;
      mouseRef.current.targetY = ny * 0.35;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse tilt interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      if (shieldGroup) {
        // Base rotation + subtle bobbing
        const speedMultiplier = isHovered ? 2.2 : 1.0;
        shieldGroup.rotation.y = Math.sin(elapsedTime * 0.7 * speedMultiplier) * 0.35 + mouseRef.current.x;
        shieldGroup.rotation.x = Math.cos(elapsedTime * 0.5) * 0.08 - mouseRef.current.y;
        shieldGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.08;

        // Rotate cyber ring
        ringMesh.rotation.z += 0.008;
        particles.rotation.y = elapsedTime * 0.05;

        // Pulse intensity if scam detected or hovered
        if (pointLightRef.current) {
          const pulse = isPulsing ? Math.sin(elapsedTime * 8) * 2.0 + 3.5 : Math.sin(elapsedTime * 2) * 0.6 + 2.8;
          pointLightRef.current.intensity = pulse;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
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
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      geometry.dispose();
      material.dispose();
      innerGeometry.dispose();
      innerMaterial.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, [interactive]);

  // Update dynamic colors and intensities when riskLevel / hover / pulsing changes
  useEffect(() => {
    const col = getColorHex(riskLevel);
    if (pointLightRef.current) {
      pointLightRef.current.color.setHex(col);
    }
    if (innerMeshRef.current) {
      const mat = innerMeshRef.current.material as THREE.MeshStandardMaterial;
      mat.color.setHex(col);
      mat.emissive.setHex(col);
      mat.emissiveIntensity = isHovered || isPulsing ? 1.2 : 0.75;
    }
  }, [riskLevel, isHovered, isPulsing]);

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-48 h-48 sm:w-60 sm:h-60',
    lg: 'w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96',
  };

  return (
    <div
      ref={containerRef}
      className={`relative mx-auto flex items-center justify-center cursor-pointer select-none ${sizeClasses[size]}`}
      style={{ touchAction: 'none' }}
    />
  );
};
