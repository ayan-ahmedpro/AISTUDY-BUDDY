import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeBackgroundProps {
  isDarkMode?: boolean;
  className?: string;
  interactive?: boolean;
}

export default function ThreeBackground({
  isDarkMode = true,
  className = '',
  interactive = true,
}: ThreeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let isDisposed = false;
    let cleanupFn: (() => void) | null = null;
    let initTimerId: number | null = null;

    // Defer initialization to idle time so FCP and LCP are instantaneous
    const startInit = () => {
      if (isDisposed || !container) return;

      const isMobile = window.innerWidth < 768;

      // Dimensions
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      // Scene, Camera, Renderer
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(
        isDarkMode ? 0x030712 : 0xfdfcfb,
        0.0018
      );

      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      camera.position.z = 80;

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.5));
      container.appendChild(renderer.domElement);

      // Color definitions based on dark / light mode
      const primaryColorHex = isDarkMode ? 0x3b82f6 : 0x2563eb;
      const secondaryColorHex = isDarkMode ? 0x8b5cf6 : 0x4f46e5;
      const cyanColorHex = isDarkMode ? 0x06b6d4 : 0x0d9488;
      const lineOpacity = isDarkMode ? 0.22 : 0.14;

      // 1. Interactive Particle Network (Neural Nodes) - 25 on mobile, 45 on desktop
      const particleCount = isMobile ? 25 : 45;
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const velocities: { x: number; y: number; z: number }[] = [];

      const bounds = { x: 120, y: 70, z: 80 };

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * bounds.x;
        positions[i * 3 + 1] = (Math.random() - 0.5) * bounds.y;
        positions[i * 3 + 2] = (Math.random() - 0.5) * bounds.z;

        velocities.push({
          x: (Math.random() - 0.5) * 0.05,
          y: (Math.random() - 0.5) * 0.05,
          z: (Math.random() - 0.5) * 0.05,
        });
      }

      particlesGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );

      // Particle sprite canvas texture
      const createParticleTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
          gradient.addColorStop(0.3, isDarkMode ? 'rgba(96, 165, 250, 0.8)' : 'rgba(37, 99, 235, 0.8)');
          gradient.addColorStop(0.7, isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(79, 70, 229, 0.3)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(16, 16, 16, 0, Math.PI * 2);
          ctx.fill();
        }
        return new THREE.CanvasTexture(canvas);
      };

      const pMaterial = new THREE.PointsMaterial({
        size: 3.5,
        map: createParticleTexture(),
        transparent: true,
        blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
        opacity: isDarkMode ? 0.9 : 0.75,
      });

      const particleSystem = new THREE.Points(particlesGeometry, pMaterial);
      scene.add(particleSystem);

      // Dynamic Connecting Lines Geometry
      const linesGeometry = new THREE.BufferGeometry();
      const linesMaterial = new THREE.LineBasicMaterial({
        color: primaryColorHex,
        transparent: true,
        opacity: lineOpacity,
        blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
      scene.add(linesMesh);

      // 2. Floating 3D Geometric Objects
      const createFloatingShape = (
        geo: THREE.BufferGeometry,
        color: number,
        x: number,
        y: number,
        z: number,
        scale: number
      ) => {
        const group = new THREE.Group();

        const meshMat = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: isDarkMode ? 0.12 : 0.06,
          wireframe: true,
        });
        const mesh = new THREE.Mesh(geo, meshMat);

        group.add(mesh);
        group.position.set(x, y, z);
        group.scale.setScalar(scale);

        scene.add(group);
        return group;
      };

      const shape1 = createFloatingShape(
        new THREE.IcosahedronGeometry(7, 1),
        primaryColorHex,
        -38,
        18,
        -10,
        1.1
      );

      const shape2 = createFloatingShape(
        new THREE.TorusKnotGeometry(5, 1.4, 40, 8),
        secondaryColorHex,
        42,
        -12,
        -15,
        1.2
      );

      const shape3 = createFloatingShape(
        new THREE.DodecahedronGeometry(6, 0),
        cyanColorHex,
        -28,
        -22,
        5,
        1.0
      );

      // Orbiting Ring around Shape 1
      const ringGeo = new THREE.TorusGeometry(12, 0.15, 8, 30);
      const ringMat = new THREE.MeshBasicMaterial({
        color: cyanColorHex,
        transparent: true,
        opacity: isDarkMode ? 0.4 : 0.25,
        wireframe: true,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      shape1.add(ringMesh);
      ringMesh.rotation.x = Math.PI / 3;

      // Mouse Interaction
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        if (!interactive) return;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        mouseX = (x / width - 0.5) * 2;
        mouseY = -(y / height - 0.5) * 2;
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });

      // Resize Handler
      const handleResize = () => {
        if (!container) return;
        const newWidth = container.clientWidth || window.innerWidth;
        const newHeight = container.clientHeight || window.innerHeight;

        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      // Pause when offscreen with IntersectionObserver
      let isVisible = true;
      const intersectionObserver = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting && !document.hidden;
      }, { threshold: 0.05 });
      intersectionObserver.observe(container);

      const handleVisibility = () => {
        isVisible = !document.hidden;
      };
      document.addEventListener('visibilitychange', handleVisibility, { passive: true });

      // Animation Loop
      let animationFrameId: number;
      let clock = new THREE.Clock();
      let frameCount = 0;

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        if (!isVisible) return; // Skip work when off-screen

        frameCount++;
        const elapsedTime = clock.getElapsedTime();

        // Smooth mouse lerp
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        camera.position.x = targetX * 10;
        camera.position.y = targetY * 10;
        camera.lookAt(0, 0, 0);

        // Rotate Floating Shapes
        if (shape1) {
          shape1.rotation.x = elapsedTime * 0.15;
          shape1.rotation.y = elapsedTime * 0.2;
        }
        if (shape2) {
          shape2.rotation.x = elapsedTime * -0.12;
          shape2.rotation.z = elapsedTime * 0.15;
        }
        if (shape3) {
          shape3.rotation.y = elapsedTime * 0.2;
        }

        // Update particle positions
        const posAttr = particlesGeometry.attributes.position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          posArray[i3] += velocities[i].x;
          posArray[i3 + 1] += velocities[i].y;
          posArray[i3 + 2] += velocities[i].z;

          if (Math.abs(posArray[i3]) > bounds.x / 2) velocities[i].x *= -1;
          if (Math.abs(posArray[i3 + 1]) > bounds.y / 2) velocities[i].y *= -1;
          if (Math.abs(posArray[i3 + 2]) > bounds.z / 2) velocities[i].z *= -1;
        }
        posAttr.needsUpdate = true;

        // Distance connections - compute every 2nd frame for 50% CPU reduction
        if (frameCount % 2 === 0) {
          const linePositions: number[] = [];
          const connectDistance = 24;

          for (let i = 0; i < particleCount; i++) {
            for (let j = i + 1; j < particleCount; j++) {
              const dx = posArray[i * 3] - posArray[j * 3];
              const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
              const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

              if (dist < connectDistance) {
                linePositions.push(
                  posArray[i * 3],
                  posArray[i * 3 + 1],
                  posArray[i * 3 + 2],
                  posArray[j * 3],
                  posArray[j * 3 + 1],
                  posArray[j * 3 + 2]
                );
              }
            }
          }

          linesGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(linePositions, 3)
          );
        }

        renderer.render(scene, camera);
      };

      animate();

      cleanupFn = () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('visibilitychange', handleVisibility);
        resizeObserver.disconnect();
        intersectionObserver.disconnect();

        if (container && renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }

        particlesGeometry.dispose();
        pMaterial.dispose();
        linesGeometry.dispose();
        linesMaterial.dispose();
        renderer.dispose();
      };
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      initTimerId = (window as any).requestIdleCallback(startInit, { timeout: 800 });
    } else {
      initTimerId = (setTimeout(startInit, 200) as unknown as number);
    }

    return () => {
      isDisposed = true;
      if (initTimerId !== null) {
        if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
          (window as any).cancelIdleCallback(initTimerId);
        } else {
          clearTimeout(initTimerId);
        }
      }
      if (cleanupFn) cleanupFn();
    };
  }, [isDarkMode, interactive]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
