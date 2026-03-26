import { useEffect } from "react";
import styles from "../index.module.less";

export default function CSSBackground() {
  useEffect(() => {
    console.log('[CSSBackground] Component mounted, rendering', 20, 'particles');
    console.log('[CSSBackground] Styles:', {
      gradientBackground: styles.gradientBackground,
      particlesContainer: styles.particlesContainer,
      particle: styles.particle
    });
  }, []);

  return (
    <>
      {/* Animated gradient background */}
      <div
        className={styles.gradientBackground}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          zIndex: -1
        }}
      />

      {/* Floating particles (CSS-based) */}
      <div
        className={styles.particlesContainer}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          pointerEvents: 'none'
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={styles.particle}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
              boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)'
            }}
          />
        ))}
      </div>
    </>
  );
}
