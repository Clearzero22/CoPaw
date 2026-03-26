import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import styles from "../index.module.less";

interface CTAButtonsProps {
  onGetStarted: () => void;
  onSkip: () => void;
}

export default function CTAButtons({
  onGetStarted,
  onSkip,
}: CTAButtonsProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.buttonsContainer}>
      <motion.button
        className={styles.primaryButton}
        onClick={onGetStarted}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {t("welcome.getStarted")}
      </motion.button>

      <motion.button
        className={styles.secondaryButton}
        onClick={onSkip}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {t("welcome.skip")}
      </motion.button>
    </div>
  );
}
