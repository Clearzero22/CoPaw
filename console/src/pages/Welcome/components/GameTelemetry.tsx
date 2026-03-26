import { useEffect, useRef, useState } from "react";
import styles from "../index.module.less";

interface TelemetryData {
  season: string;
  time: string;
  progress: number;
  teamA: { name: string; status: string; opacity: number };
  teamB: { name: string; status: string; opacity: number };
  history: number[];
}

export default function GameTelemetry() {
  const [data, setData] = useState<TelemetryData>({
    season: "🌸 SPRING",
    time: "T+0.00s",
    progress: 50,
    teamA: { name: "TEAM A (PREDATOR)", status: "ATTACK", opacity: 1 },
    teamB: { name: "TEAM B (PREY)", status: "DEFEND", opacity: 0.4 },
    history: new Array(30).fill(0.5)
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const updateTelemetry = () => {
      const now = Date.now() / 1000;

      // Update time every frame
      setData(prev => ({
        ...prev,
        time: `T+${now.toFixed(2)}s`,
        progress: ((Math.sin(now * 0.5) + 1) / 2) * 100
      }));

      // Update history graph every 0.2s
      if (now - lastUpdateRef.current > 0.2) {
        const newVal = (Math.sin(now * 0.5) + 1) / 2;
        setData(prev => ({
          ...prev,
          history: [...prev.history.slice(1), newVal]
        }));
        lastUpdateRef.current = now;
      }
    };

    const interval = setInterval(updateTelemetry, 100);
    return () => clearInterval(interval);
  }, []);

  // Draw history graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Clear
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    const barWidth = canvas.offsetWidth / data.history.length;

    data.history.forEach((val, idx) => {
      const heightPercent = 20 + Math.abs(val - 0.5) * 160;
      const x = idx * barWidth;
      const y = canvas.offsetHeight - (heightPercent / 100) * canvas.offsetHeight;
      const width = barWidth - 2;

      // Color based on value
      const isBlue = val > 0.5;
      ctx.fillStyle = isBlue ? "rgba(96, 165, 250, 0.8)" : "rgba(248, 113, 113, 0.8)";

      // Opacity based on position
      const opacity = (idx / data.history.length) * 0.8 + 0.2;
      ctx.globalAlpha = opacity;

      ctx.fillRect(x, y, width, (heightPercent / 100) * canvas.offsetHeight);
    });

    ctx.globalAlpha = 1;
  }, [data.history]);

  return (
    <div className={styles.telemetryPanel}>
      <div className={styles.telemetryHeader}>
        <span>EPOCH: <span className={styles.seasonIndicator}>{data.season}</span></span>
        <span>{data.time}</span>
      </div>

      <div className={styles.progressContainer}>
        <div
          className={styles.progressBar}
          style={{ width: `${data.progress}%` }}
        />
        <div className={styles.progressCenter} />
      </div>

      <div className={styles.teamStats}>
        <span
          className={styles.teamA}
          style={{ opacity: data.teamA.opacity }}
        >
          {data.teamA.name}
        </span>
        <span className={styles.vs}>VS</span>
        <span
          className={styles.teamB}
          style={{ opacity: data.teamB.opacity }}
        >
          {data.teamB.name}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        className={styles.historyGraph}
      />
    </div>
  );
}
