import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MessageSquare, Cpu, Sparkles } from "lucide-react";
import styles from "../index.module.less";

interface FeatureCard {
  key: string;
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
}

const features: FeatureCard[] = [
  { key: "chat", icon: MessageSquare },
  { key: "multimodal", icon: Cpu },
  { key: "skills", icon: Sparkles },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function FeatureCards() {
  const { t } = useTranslation();

  return (
    <motion.div
      className={styles.cardsContainer}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <motion.div
            key={feature.key}
            className={styles.card}
            variants={itemVariants}
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.2 },
            }}
          >
            <div className={styles.cardIcon}>
              <Icon size={32} />
            </div>
            <h3 className={styles.cardTitle}>
              {t(`welcome.features.${feature.key}.title`)}
            </h3>
            <p className={styles.cardDescription}>
              {t(`welcome.features.${feature.key}.description`)}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
