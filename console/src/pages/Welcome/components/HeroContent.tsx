import { useState, useEffect } from "react";
import ScrambleText from "./ScrambleText";
import styles from "../index.module.less";

interface HeroContentProps {
  onBlackSwanTriggered?: () => void;
  scrambleTrigger?: boolean;
}

export default function HeroContent({ onBlackSwanTriggered, scrambleTrigger = false }: HeroContentProps) {
  const [keyword, setKeyword] = useState("兴宸鑫 AI");

  useEffect(() => {
    if (scrambleTrigger) {
      setKeyword("BLACK SWAN EVENT");
      const timeout = setTimeout(() => {
        setKeyword("兴宸鑫 AI");
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [scrambleTrigger]);

  return (
    <div className={styles.heroContent}>
      <div className={styles.statusBadge}>
        <span className={styles.statusDot} />
        AI Personal Assistant v0.2 智能个人助理系统
      </div>

      <div className={styles.titleContainer}>
        <h1 className={styles.mainTitle}>
          欢迎使用<br />
          <span
            className={`${styles.keyword} ${scrambleTrigger ? styles.blackSwan : ""}`}
          >
            <ScrambleText text={keyword} trigger={scrambleTrigger} />
          </span>
          <br />
          <span className={styles.subtitle}>懂你所需，伴你左右</span>
        </h1>
      </div>

      <p className={styles.description}>
        从社交媒体到生产力工具，一个 CoPaw 连接所有频道。
        支持钉钉、飞书、QQ、Discord 等多平台智能助手。
      </p>

      <p className={styles.blackSwanHint}>
        [ 点击任意位置触发粒子特效 ]
      </p>
    </div>
  );
}
