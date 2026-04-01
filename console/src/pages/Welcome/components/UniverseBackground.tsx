import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "../../../contexts/ThemeContext";

const PARTICLES_COUNT = 2000;
const SEASON_DURATION = 20;

const SEASONS = [
  { name: '🌸 SPRING', colorClass: 'text-green-500', darkBg: [5, 20, 15], lightBg: [240, 255, 245], speedMult: 1.0, friction: 0.92 },
  { name: '☀️ SUMMER', colorClass: 'text-red-500', darkBg: [25, 5, 5], lightBg: [255, 240, 240], speedMult: 1.8, friction: 0.96 },
  { name: '🍁 AUTUMN', colorClass: 'text-yellow-500', darkBg: [20, 15, 0], lightBg: [255, 250, 235], speedMult: 0.7, friction: 0.90 },
  { name: '❄️ WINTER', colorClass: 'text-blue-300', darkBg: [5, 10, 30], lightBg: [235, 245, 255], speedMult: 0.3, friction: 0.82 }
];

interface UniverseBackgroundProps {
  onSeasonChange?: (season: string) => void;
  onTeamStatusChange?: (teamA: { attacking: boolean }, teamB: { attacking: boolean }) => void;
}

export default function UniverseBackground({
  onSeasonChange,
  onTeamStatusChange
}: UniverseBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isDark } = useTheme();
  const animationRef = useRef<number>();

  // Refs to store Three.js objects for color updates
  const particlesMeshRef = useRef<THREE.Points | null>(null);
  const factionsArrayRef = useRef<Uint8Array | null>(null);

  // Shockwave system
  const shockwaveRef = useRef({ x: 0, y: 0, intensity: 0 });
  const mouseRef = useRef({ x: 0, y: 0, worldX: 0, worldY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[UniverseBackground] Canvas ref is null!');
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 30;

    // Particle system
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(PARTICLES_COUNT * 3);
    const colorArray = new Float32Array(PARTICLES_COUNT * 3);
    const factionsArray = new Uint8Array(PARTICLES_COUNT);
    const velocitiesArray = new Float32Array(PARTICLES_COUNT * 3);

    for (let i = 0; i < PARTICLES_COUNT; i++) {
      const i3 = i * 3;
      factionsArray[i] = i % 2; // Team A or Team B

      // Spherical distribution
      const radius = 10 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      posArray[i3] = radius * Math.sin(phi) * Math.cos(theta);
      posArray[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      posArray[i3 + 2] = radius * Math.cos(phi);

      velocitiesArray[i3] = velocitiesArray[i3 + 1] = velocitiesArray[i3 + 2] = 0;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Store refs for color updates
    particlesMeshRef.current = particlesMesh;
    factionsArrayRef.current = factionsArray;

    // Initial colors
    updateParticleColors(particlesGeometry, factionsArray, isDark);

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX - window.innerWidth / 2) * 0.001;
      mouseRef.current.y = (e.clientY - window.innerHeight / 2) * 0.001;
      mouseRef.current.worldX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.worldY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    // Black swan event trigger
    const handleMouseDown = (_e: MouseEvent) => {
      shockwaveRef.current.x = mouseRef.current.worldX * 30;
      shockwaveRef.current.y = mouseRef.current.worldY * 30;
      shockwaveRef.current.intensity = 12.0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    let lastSeasonName = "";
    let lastAttackingState: boolean | null = null;

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      if (!renderer || !scene || !camera) {
        console.error('[UniverseBackground] Missing renderer, scene, or camera!');
        return;
      }

      const time = Date.now() * 0.001;
      const positions = particlesGeometry.attributes.position.array;

      // Season system
      const seasonTime = time % SEASON_DURATION;
      const seasonProgress = seasonTime / SEASON_DURATION;
      const seasonIndex = Math.floor(seasonProgress * 4);
      const nextSeasonIndex = (seasonIndex + 1) % 4;
      const localT = (seasonProgress * 4) - seasonIndex;

      const curSeason = SEASONS[seasonIndex];
      const nextSeason = SEASONS[nextSeasonIndex];

      const currentSpeedMult = curSeason.speedMult + (nextSeason.speedMult - curSeason.speedMult) * localT;
      const currentFriction = curSeason.friction + (nextSeason.friction - curSeason.friction) * localT;

      // Update background color
      const c1 = isDark ? curSeason.darkBg : curSeason.lightBg;
      const c2 = isDark ? nextSeason.darkBg : nextSeason.lightBg;
      const bgColor = lerpColor(c1, c2, localT);

      if (canvas.parentElement) {
        canvas.parentElement.style.background = `rgb(${bgColor[0]}, ${bgColor[1]}, ${bgColor[2]})`;
      }

      // Notify season change
      if (lastSeasonName !== curSeason.name && onSeasonChange) {
        onSeasonChange(curSeason.name);
        lastSeasonName = curSeason.name;
      }

      // Calculate team centers
      let cAx = 0, cAy = 0, cAz = 0, countA = 0;
      let cBx = 0, cBy = 0, cBz = 0, countB = 0;

      for (let i = 0; i < PARTICLES_COUNT; i++) {
        const i3 = i * 3;
        if (factionsArray[i] === 0) {
          cAx += positions[i3]; cAy += positions[i3 + 1]; cAz += positions[i3 + 2]; countA++;
        } else {
          cBx += positions[i3]; cBy += positions[i3 + 1]; cBz += positions[i3 + 2]; countB++;
        }
      }

      if (countA > 0) { cAx /= countA; cAy /= countA; cAz /= countA; }
      if (countB > 0) { cBx /= countB; cBy /= countB; cBz /= countB; }

      const aIsAttacking = Math.sin(time * 0.5) > 0;

      // Notify team status change
      if (lastAttackingState !== aIsAttacking && onTeamStatusChange) {
        onTeamStatusChange(
          { attacking: aIsAttacking },
          { attacking: !aIsAttacking }
        );
        lastAttackingState = aIsAttacking;
      }

      // Update particles
      for (let i = 0; i < PARTICLES_COUNT; i++) {
        const i3 = i * 3;
        let px = positions[i3], py = positions[i3 + 1], pz = positions[i3 + 2];
        let vx = velocitiesArray[i3], vy = velocitiesArray[i3 + 1], vz = velocitiesArray[i3 + 2];

        const isA = factionsArray[i] === 0;
        const isAttacker = (isA && aIsAttacking) || (!isA && !aIsAttacking);

        const targetX = isA ? cBx : cAx;
        const targetY = isA ? cBy : cAy;
        const targetZ = isA ? cBz : cAz;

        let dx = targetX - px;
        let dy = targetY - py;
        let dz = targetZ - pz;
        const distToTarget = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;

        dx /= distToTarget; dy /= distToTarget; dz /= distToTarget;

        const force = (isAttacker ? 0.08 : -0.06) * currentSpeedMult;
        vx += dx * force;
        vy += dy * force;
        vz += dz * force;

        // Swirl effect
        const swirlDir = isA ? 1 : -1;
        vx += dz * 0.03 * swirlDir * currentSpeedMult;
        vz -= dx * 0.03 * swirlDir * currentSpeedMult;

        // Gravity
        const distToOrigin = Math.sqrt(px * px + py * py + pz * pz) + 0.01;
        const gravity = distToOrigin > 20 ? 0.05 : 0.01;
        vx -= (px / distToOrigin) * gravity;
        vy -= (py / distToOrigin) * gravity;
        vz -= (pz / distToOrigin) * gravity;

        // Mouse repulsion
        const mx = mouseRef.current.worldX * 30 - px;
        const my = mouseRef.current.worldY * 30 - py;
        const mDist = Math.sqrt(mx * mx + my * my + pz * pz) + 0.01;
        if (mDist < 15) {
          vx -= (mx / mDist) * 0.2;
          vy -= (my / mDist) * 0.2;
        }

        // Black swan shockwave
        if (shockwaveRef.current.intensity > 0.01) {
          let sx = px - shockwaveRef.current.x;
          let sy = py - shockwaveRef.current.y;
          let sz = pz;
          const sDist = Math.sqrt(sx * sx + sy * sy + sz * sz) + 0.1;

          const shockForce = (15.0 / (sDist + 2.0)) * shockwaveRef.current.intensity;

          vx += (sx / sDist) * shockForce;
          vy += (sy / sDist) * shockForce;
          vz += (sz / sDist) * shockForce;
        }

        // Apply friction
        vx *= currentFriction;
        vy *= currentFriction;
        vz *= currentFriction;

        velocitiesArray[i3] = vx;
        velocitiesArray[i3 + 1] = vy;
        velocitiesArray[i3 + 2] = vz;

        positions[i3] += vx;
        positions[i3 + 1] += vy;
        positions[i3 + 2] += vz;
      }

      particlesGeometry.attributes.position.needsUpdate = true;

      // Decay shockwave
      if (shockwaveRef.current.intensity > 0) {
        shockwaveRef.current.intensity *= 0.90;
        if (shockwaveRef.current.intensity < 0.01) shockwaveRef.current.intensity = 0;
      }

      // Rotation
      particlesMesh.rotation.y += 0.05 * (mouseRef.current.x - particlesMesh.rotation.y);
      particlesMesh.rotation.x += 0.05 * (mouseRef.current.y - particlesMesh.rotation.x);
      particlesMesh.material.size = 0.3 + Math.sin(time * 2) * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      renderer.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();

      // Clear refs
      particlesMeshRef.current = null;
      factionsArrayRef.current = null;
    };
  }, [onSeasonChange, onTeamStatusChange]); // Remove isDark from dependencies

  // Separate effect for color updates only (no scene rebuild)
  useEffect(() => {
    const particlesMesh = particlesMeshRef.current;
    const factionsArray = factionsArrayRef.current;

    if (particlesMesh && factionsArray) {
      const geometry = particlesMesh.geometry;
      updateParticleColors(geometry, factionsArray, isDark);
    }
  }, [isDark]); // Only depends on isDark

  return (
    <canvas
      ref={canvasRef}
      className="universe-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        transition: 'opacity 0.5s ease',
        background: 'transparent'
      }}
    />
  );
}

function updateParticleColors(
  geometry: THREE.BufferGeometry,
  factionsArray: Uint8Array,
  isDark: boolean
) {
  const colorArray = geometry.attributes.color.array;

  for (let i = 0; i < factionsArray.length; i++) {
    const isTeamA = factionsArray[i] === 0;
    let r, g, b;

    // Use much brighter colors for testing
    if (isDark) {
      // Team A: Bright blue, Team B: Bright red
      r = isTeamA ? 0.3 : 1.0;
      g = isTeamA ? 0.7 : 0.3;
      b = isTeamA ? 1.0 : 0.3;
    } else {
      // Team A: Medium blue, Team B: Medium red
      r = isTeamA ? 0.2 : 0.9;
      g = isTeamA ? 0.4 : 0.2;
      b = isTeamA ? 0.9 : 0.2;
    }

    colorArray[i * 3] = r;
    colorArray[i * 3 + 1] = g;
    colorArray[i * 3 + 2] = b;
  }

  geometry.attributes.color.needsUpdate = true;
}

function lerpColor(c1: number[], c2: number[], t: number): number[] {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t)
  ];
}
