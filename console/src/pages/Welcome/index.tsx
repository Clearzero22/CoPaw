import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import UniverseBackground from "./components/UniverseBackground";
import HeroContent from "./components/HeroContent";
import GameTelemetry from "./components/GameTelemetry";
import styles from "./index.module.less";

interface WelcomePageProps {
  onComplete?: () => void;
}

export default function WelcomePage({ onComplete }: WelcomePageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // const [blackSwanActive, setBlackSwanActive] = useState(false);

  // Debug log to verify component is rendering
  // console.log('[WelcomePage] Component rendering, blackSwanActive:', blackSwanActive);

  const handleGetStarted = useCallback(() => {
    onComplete?.();
    if (window.location.pathname !== "/welcome") {
      navigate("/chat");
    }
  }, [navigate, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete?.();
    if (window.location.pathname !== "/welcome") {
      navigate("/chat");
    }
  }, [navigate, onComplete]);

  // Black Swan event - DISABLED
  // const handleBlackSwanTriggered = useCallback(() => {
  //   setBlackSwanActive(true);
  //   setTimeout(() => setBlackSwanActive(false), 2500);
  // }, []);

  // Handle Escape key to skip

  // Handle Escape key to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSkip]);

  // Handle global click for black swan event (exclude buttons) - DISABLED
  // useEffect(() => {
  //   const handleGlobalClick = (e: MouseEvent) => {
  //     const target = e.target as HTMLElement;
  //     if (target.closest('button') || target.closest('a') || target.closest('.no-black-swan')) {
  //       return;
  //     }
  //     handleBlackSwanTriggered();
  //   };

  //   window.addEventListener("click", handleGlobalClick);
  //   return () => window.removeEventListener("click", handleGlobalClick);
  // }, [handleBlackSwanTriggered]);

  // Debug log to verify rendering
  useEffect(() => {
    console.log('[Welcome] Welcome screen mounted');
  }, []);

  return (
    <div className={styles.welcomeContainer}>
      <UniverseBackground />

      <div className={styles.content}>
        <motion.div
          className={styles.heroSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <HeroContent
            // onBlackSwanTriggered={handleBlackSwanTriggered}
            // scrambleTrigger={blackSwanActive}
          />
        </motion.div>

        <motion.div
          className={styles.buttonsSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2.5 }}
        >
          <motion.button
            className={styles.primaryButton}
            onClick={handleGetStarted}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t("welcome.getStarted")}
          </motion.button>

          <motion.button
            className={styles.secondaryButton}
            onClick={handleSkip}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t("welcome.skip")}
          </motion.button>
        </motion.div>
      </div>

      {/* Game Telemetry Panel */}
      <GameTelemetry />

      {/* Black Swan Event Overlay - DISABLED */}
      {/* <AnimatePresence>
        {blackSwanActive && (
          <motion.div
            className={styles.blackSwanOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className={styles.blackSwanText}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              BLACK SWAN EVENT
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence> */}
    </div>
  );
}
