import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import styles from "../index.module.less";

export default function WelcomeText() {
  const { t } = useTranslation();

  // Split title into characters for animation
  const title = t("welcome.title");
  const titleChars = title.split("");

  return (
    <div className={styles.textContainer}>
      <motion.h1
        className={styles.title}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
        }}
      >
        {titleChars.map((char, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
              delay: index * 0.05,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.h1>

      <motion.p
        className={styles.subtitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 1,
          delay: 0.8,
          ease: "easeOut",
        }}
      >
        {t("welcome.subtitle")}
      </motion.p>
    </div>
  );
}
