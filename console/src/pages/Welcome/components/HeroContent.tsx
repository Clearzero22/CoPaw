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
        Dynamic Game Analysis Engine v0.1 动态博弈分析引擎
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
          <span className={styles.subtitle}>Welcome to Xing Chenxin AI</span>
        </h1>
      </div>

      <p className={styles.description}>
        从量子波动到银河文明，每一次互动都是一场博弈。
        实时分析所有尺度和时间线上的无限动态。
      </p>

      <p className={styles.blackSwanHint}>
        [ 点击任意位置触发黑天鹅事件 ]
      </p>
    </div>
  );
}
