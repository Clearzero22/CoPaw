import { useState } from "react";
import { useTranslation } from "react-i18next";
import ScrambleText from "./ScrambleText";
import styles from "../index.module.less";

interface HeroContentProps {
  // onBlackSwanTriggered?: () => void;
  // scrambleTrigger?: boolean;
}

export default function HeroContent({ /* scrambleTrigger = false */ }: HeroContentProps) {
  const { t } = useTranslation();
  const [keyword] = useState(t("welcome.keyword"));

  // Black Swan effect - DISABLED
  // useEffect(() => {
  //   if (scrambleTrigger) {
  //     setKeyword(t("welcome.blackSwanEvent"));
  //     const timeout = setTimeout(() => {
  //       setKeyword(t("welcome.keyword"));
  //     }, 2500);
  //     return () => clearTimeout(timeout);
  //   }
  // }, [scrambleTrigger, t]);

  return (
    <div className={styles.heroContent}>
      <div className={styles.statusBadge}>
        <span className={styles.statusDot} />
        {t("welcome.statusBadge")}
      </div>

      <div className={styles.titleContainer}>
        <h1 className={styles.mainTitle}>
          {t("welcome.title")}<br />
          <span
            className={styles.keyword}
            // className={`${styles.keyword} ${scrambleTrigger ? styles.blackSwan : ""}`}
          >
            <ScrambleText text={keyword} trigger={false} />
          </span>
          <br />
          <span className={styles.subtitle}>{t("welcome.subtitle")}</span>
        </h1>
      </div>

      <p className={styles.description}>
        {t("welcome.description")}
      </p>

      <p className={styles.blackSwanHint}>
        [ {t("welcome.particleHint")} ]
      </p>
    </div>
  );
}
