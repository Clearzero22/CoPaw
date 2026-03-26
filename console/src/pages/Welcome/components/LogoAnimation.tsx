import { motion } from "framer-motion";
import { useTheme } from "../../../contexts/ThemeContext";
import styles from "../index.module.less";

export default function LogoAnimation() {
  const { isDark } = useTheme();

  return (
    <motion.div
      className={styles.logoAnimation}
      animate={{
        rotate: [0, 5, -5, 0],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        ease: "easeInOut",
        times: [0, 0.5, 0.75, 1],
        repeat: Infinity,
        repeatDelay: 1,
      }}
    >
      <motion.img
        src={isDark ? "/copaw-dark.png" : "/copaw-symbol.svg"}
        alt="CoPaw Logo"
        className={styles.logoImage}
        style={{
          filter: isDark
            ? "drop-shadow(0 0 20px rgba(139, 135, 240, 0.6))"
            : "drop-shadow(0 0 20px rgba(97, 92, 237, 0.4))",
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 1.5,
          ease: "easeOut",
        }}
      />
    </motion.div>
  );
}
