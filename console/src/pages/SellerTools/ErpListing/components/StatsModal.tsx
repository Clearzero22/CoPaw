import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
} from "chart.js";
import { useTheme } from "../../../../contexts/ThemeContext";
import styles from "../index.module.less";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip);
ChartJS.defaults.font.family = "system-ui, -apple-system, sans-serif";

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
}

function generateData(base: number, variance: number, count: number): number[] {
  const data: number[] = [];
  for (let i = 0; i < count; i++) {
    let val = base + Math.random() * variance - variance / 2;
    if (i > count - 10) val += 100;
    if (i > count - 5) val -= 50;
    data.push(Math.max(0, val));
  }
  return data;
}

export default function StatsModal({ open, onClose }: StatsModalProps) {
  const { isDark } = useTheme();

  const dataRef = useRef<{
    labels: string[];
    orders: number[];
    sales: number[];
  } | null>(null);

  if (!dataRef.current) {
    const labels = Array.from({ length: 40 }, (_, i) =>
      `2021-11-${String(i + 1).padStart(2, "0")}`
    );
    const orders = generateData(50, 40, 40);
    const sales = orders.map((v) => v * 0.9 + Math.random() * 10);
    dataRef.current = { labels, orders, sales };
  }

  // Adapt Chart.js defaults for dark mode
  useEffect(() => {
    ChartJS.defaults.color = isDark ? "#9ca3af" : "#6b7280";
    ChartJS.defaults.borderColor = isDark ? "#374151" : "#e5e7eb";
  }, [isDark]);

  if (!open) return null;

  const { labels, orders, sales } = dataRef.current;

  const chartData = {
    labels,
    datasets: [
      {
        label: "订单量",
        data: orders,
        borderColor: "#00e5ff",
        backgroundColor: "rgba(0, 229, 255, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
      {
        label: "销量",
        data: sales,
        borderColor: "#00bfa5",
        backgroundColor: "rgba(0, 191, 165, 0.1)",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };

  return (
    <div
      className={styles.statsOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.statsModal}>
        {/* Header */}
        <div className={styles.statsHeader}>
          <h3 className={styles.statsTitle}>统计</h3>
          <button className={styles.statsCloseBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.statsBody}>
          {/* Product info summary */}
          <div className={styles.statsProductInfo}>
            <div className={styles.statsProductImage}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ width: 32, height: 32 }}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div className={styles.statsProductName}>站式亚马逊店铺管理系统（组合版1）</div>
              <div className={styles.statsProductMsku}>MSKU: M-6Qifu2L-U</div>
            </div>
          </div>

          {/* Legend */}
          <div className={styles.statsLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendLine} style={{ background: "#00e5ff" }} />
              订单量
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendLine} style={{ background: "#00bfa5" }} />
              销量
            </div>
          </div>

          {/* Chart */}
          <div className={styles.chartContainer}>
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    titleColor: "#333",
                    bodyColor: "#666",
                    borderColor: "#e5e7eb",
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    boxPadding: 4,
                    usePointStyle: true,
                  },
                },
                scales: {
                  y: { beginAtZero: true, grid: { borderDash: [5, 5] } as never },
                  x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
