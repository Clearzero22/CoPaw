import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function SimpleThreeTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.log('[SimpleThreeTest] Component mounted');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[SimpleThreeTest] Canvas ref is null!');
      return;
    }

    console.log('[SimpleThreeTest] Creating simple scene...');

    // 创建最简单的场景
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 5;

    console.log('[SimpleThreeTest] Renderer created');

    // 创建几个大粒子来测试
    const geometry = new THREE.BufferGeometry();
    const count = 10;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xff0000, // 红色，非常明显
      size: 0.5, // 大尺寸
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    console.log('[SimpleThreeTest] Points added to scene');

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      points.rotation.x += 0.01;
      points.rotation.y += 0.01;
      renderer.render(scene, camera);
    };

    animate();

    console.log('[SimpleThreeTest] Animation started');

    return () => {
      console.log('[SimpleThreeTest] Cleanup');
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        background: 'black' // 黑色背景让红色粒子更明显
      }}
    />
  );
}
