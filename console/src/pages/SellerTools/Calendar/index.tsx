import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowLeftRight,
  Search,
} from "lucide-react";
import styles from "./index.module.less";

/* ─── Types & Data ─── */

interface AllDayEvent {
  text: string;
  color: "blue" | "orange" | "green";
  bold?: boolean;
}

interface TimeEvent {
  text: string;
  time: string;
  color: "blue" | "orange" | "yellow" | "green";
  top: number;
  height?: number;
  left?: string;
  right?: string;
  pill?: string;
  pillColor?: "blue" | "green";
  isLine?: boolean;
  isCheckpoint?: boolean;
  zIndex?: number;
  truncate?: boolean;
}

interface DayColumn {
  dayName: string;
  date: number;
  isPast: boolean;
  isToday: boolean;
  allDayEvents: AllDayEvent[];
  timeEvents: TimeEvent[];
}

const SNAP = 15;

const allDayDefault: AllDayEvent[] = [
  { text: "Learning new things", color: "blue" },
  {
    text: "iCloud data is synchronized across mul...",
    color: "orange",
  },
  {
    text: "Record what you do every 30 minutes ...",
    color: "blue",
  },
  {
    text: "New ideas every day, using Mao zedo...",
    color: "blue",
    bold: true,
  },
  { text: "\u6BCF\u65E5\u82F1\u8BED\u5B66\u4E60", color: "blue", bold: true },
];

const baseTimeEvents: TimeEvent[] = [
  {
    text: "\u7761\u89C9\u65F6\u95F4",
    time: "12:45\u20147 AM",
    color: "orange",
    top: 45,
    height: 375,
    pill: "Slow down to do s",
    pillColor: "blue",
  },
  {
    text: "Plan your daily tasks, including studying,",
    time: "",
    color: "orange",
    top: 425,
    height: 15,
    truncate: true,
  },
  {
    text: "Make breakfast",
    time: "7:30 AM",
    color: "blue",
    top: 450,
    height: 30,
    truncate: true,
  },
  {
    text: "Learning programming\ntechniques",
    time: "8:30\u201410 AM",
    color: "blue",
    top: 510,
    height: 90,
    pill: "\u6211\u7684\u601D\u7EF4\u68C0\u67E5\u70B9 9",
    pillColor: "green",
  },
  {
    text: "Learning, Working Time",
    time: "10 AM\u201412:30 PM",
    color: "yellow",
    top: 600,
    height: 150,
  },
  {
    text: "Making lunch",
    time: "11:30 AM\u201412:30 PM",
    color: "orange",
    top: 690,
    height: 60,
    left: "10px",
  },
  {
    text: "My thinking checkpoints 1:45 PM",
    time: "",
    color: "green",
    top: 825,
    isCheckpoint: true,
  },
  {
    text: "Learning Flutter\nand Swift",
    time: "2\u20143:45 PM",
    color: "blue",
    top: 840,
    height: 105,
    left: "40px",
  },
];

const dayColumns: DayColumn[] = [
  {
    dayName: "\u5468\u65E5",
    date: 15,
    isPast: true,
    isToday: false,
    allDayEvents: allDayDefault,
    timeEvents: baseTimeEvents,
  },
  {
    dayName: "\u5468\u4E00",
    date: 16,
    isPast: true,
    isToday: false,
    allDayEvents: allDayDefault,
    timeEvents: [
      ...baseTimeEvents,
      {
        text: "Sleeping",
        time: "3:15\u201410 AM",
        color: "blue" as const,
        top: 195,
        height: 405,
        left: "35%",
        right: "2px",
        zIndex: 5,
        pill: "\u6211\u7684\u601D\u7EF4\u68C0\u67E5\u70B9 9 AM",
        pillColor: "green",
      },
    ],
  },
  {
    dayName: "\u5468\u4E8C",
    date: 17,
    isPast: true,
    isToday: false,
    allDayEvents: allDayDefault,
    timeEvents: [
      ...baseTimeEvents.slice(0, 3),
      {
        text: "\u6536\u62FE\u5BB6\u91CC\u9762\u536B\u751F",
        time: "6:30\u20148:45 AM",
        color: "blue" as const,
        top: 390,
        height: 135,
        left: "45%",
        zIndex: 5,
      },
      {
        text: "Plan your daily tasks...",
        time: "",
        color: "orange" as const,
        top: 425,
        height: 15,
        right: "60%",
        truncate: true,
      },
      {
        text: "Make breakfast",
        time: "",
        color: "blue" as const,
        top: 450,
        height: 30,
        right: "60%",
        truncate: true,
      },
      {
        text: "Learning pro...",
        time: "8:30\u201410 AM",
        color: "blue" as const,
        top: 510,
        height: 90,
        right: "50%",
        pill: "\u6211\u7684\u601D\u7EF4\u68C0\u67E5\u70B9 9 AM",
        pillColor: "green",
      },
      {
        text: "\u7535\u5546\u516C\u53F8\u5185\u5BB9\u8C08\u5224\u535A\u5F08",
        time: "9:45\u201411:45 AM",
        color: "blue" as const,
        top: 585,
        height: 120,
        left: "35%",
        zIndex: 10,
      },
      {
        text: "Learning, Wor...",
        time: "10 AM\u201412:30 PM",
        color: "yellow" as const,
        top: 600,
        height: 150,
        right: "60%",
      },
      {
        text: "Making\nlunch",
        time: "11:30 AM\u2014...",
        color: "orange" as const,
        top: 690,
        height: 60,
        left: "60%",
      },
      {
        text: "My thinking check...",
        time: "",
        color: "green" as const,
        top: 825,
        isCheckpoint: true,
      },
      {
        text: "Learning Flutter and Swift",
        time: "2\u20143:45 PM",
        color: "blue" as const,
        top: 840,
        height: 105,
        left: "40px",
        right: "52%",
        zIndex: 5,
      },
      {
        text: "\u8C08-ai\u9879\u76EE\u5DE5\u4F5C\n\u4F5C\u5185\u5BB9\uFF0C\u5E76\u7B7E...",
        time: "2:45\u20146:30 PM",
        color: "blue" as const,
        top: 885,
        height: 135,
        left: "2px",
        zIndex: 10,
      },
      {
        text: "\u516C\u53F8\u7684\u9762\u8BD5\u65F6\u95F4\u5185\u5BB9",
        time: "2:45\u20144 PM",
        color: "yellow" as const,
        top: 885,
        height: 75,
        left: "48%",
        zIndex: 10,
      },
    ],
  },
  {
    dayName: "\u5468\u4E09",
    date: 18,
    isPast: false,
    isToday: true,
    allDayEvents: allDayDefault,
    timeEvents: [
      ...baseTimeEvents,
      {
        text: "\u68B3\u7406\u6574\u4E2A\u9879\u76EE\u5185\u5BB9\u7684\u5F00\u53D1\u6587\u6863\u5185\u5BB9",
        time: "8 AM",
        color: "blue" as const,
        top: 480,
        isLine: true,
      },
    ],
  },
  {
    dayName: "\u5468\u56DB",
    date: 19,
    isPast: false,
    isToday: false,
    allDayEvents: allDayDefault,
    timeEvents: baseTimeEvents,
  },
  {
    dayName: "\u5468\u4E94",
    date: 20,
    isPast: false,
    isToday: false,
    allDayEvents: [
      ...allDayDefault,
      { text: "\u4E2D\u548C\u8282", color: "green", bold: true },
    ],
    timeEvents: baseTimeEvents,
  },
  {
    dayName: "\u5468\u516D",
    date: 21,
    isPast: false,
    isToday: false,
    allDayEvents: allDayDefault,
    timeEvents: baseTimeEvents,
  },
];

const timeLabels = [
  "1AM",
  "2AM",
  "",
  "4AM",
  "5AM",
  "6AM",
  "7AM",
  "8AM",
  "9AM",
  "10AM",
  "11AM",
  "12PM",
  "1PM",
  "2PM",
  "3PM",
  "4PM",
  "",
];

/* ─── Sub-components ─── */

function Kbd({ children }: { children: string }) {
  return <kbd className={styles.kbd}>{children}</kbd>;
}

function AllDayEventChip({ text, color, bold }: AllDayEvent) {
  return (
    <div
      className={`${styles.allDayEvt} ${styles[`allDay${color.charAt(0).toUpperCase() + color.slice(1)}`]} ${bold ? styles.allDayBold : ""}`}
    >
      {text}
    </div>
  );
}

function TimeEventCard({ evt, isPast, onMouseDown }: { evt: TimeEvent; isPast: boolean; onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void }) {
  if (evt.isLine) {
    return (
      <div
        className={styles.eventLine}
        style={{ top: evt.top }}
      >
        <span className={styles.eventLineText}>
          {evt.text}{" "}
          <span className={styles.eventLineTime}>{evt.time}</span>
        </span>
      </div>
    );
  }

  if (evt.isCheckpoint) {
    return (
      <div
        className={`${styles.eventCheckpoint} ${!isPast ? styles.eventCheckpointActive : ""}`}
        style={{ top: evt.top }}
      >
        {evt.text}
      </div>
    );
  }

  return (
    <div
      className={`${styles.eventCard} ${styles[`evt${evt.color.charAt(0).toUpperCase() + evt.color.slice(1)}`]} ${!isPast ? styles.eventCardFuture : ""} ${evt.truncate ? styles.eventCardTruncate : ""}`}
      style={{
        top: evt.top,
        height: evt.height,
        left: evt.left,
        right: evt.right,
        zIndex: evt.zIndex,
        padding: evt.truncate ? "1px 4px" : undefined,
        fontSize: evt.truncate ? "10px" : undefined,
      }}
      onMouseDown={onMouseDown}
    >
      <div className={evt.truncate ? "" : styles.eventCardTitle}>
        {evt.text}
      </div>
      {evt.time && <div className={styles.eventCardTime}>{evt.time}</div>}
      {evt.pill && (
        <div
          className={`${styles.innerPill} ${styles[`pill${evt.pillColor!.charAt(0).toUpperCase() + evt.pillColor!.slice(1)}`]} ${!isPast ? styles.innerPillShadow : ""}`}
        >
          {evt.pill}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

export default function CalendarPage() {
  const { t } = useTranslation();
  const [draggedCard, setDraggedCard] = useState<HTMLDivElement | null>(null);
  const dragStartY = useRef(0);
  const dragOffsetY = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = e.currentTarget;
      dragStartY.current = e.clientY;
      dragOffsetY.current = e.clientY - card.getBoundingClientRect().top;
      setDraggedCard(card);
      card.style.zIndex = "100";
      card.style.opacity = "0.9";
      card.style.boxShadow =
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
      document.body.style.userSelect = "none";
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedCard) return;
      const parentRect = draggedCard.parentElement?.getBoundingClientRect();
      if (!parentRect) return;
      let newTop = e.clientY - parentRect.top - dragOffsetY.current;
      if (newTop < 0) newTop = 0;
      newTop = Math.round(newTop / SNAP) * SNAP;
      draggedCard.style.top = newTop + "px";
    },
    [draggedCard],
  );

  const handleMouseUp = useCallback(() => {
    if (draggedCard) {
      draggedCard.style.zIndex = "";
      draggedCard.style.opacity = "";
      draggedCard.style.boxShadow = "";
      setDraggedCard(null);
      document.body.style.userSelect = "";
    }
  }, [draggedCard]);

  const shortcuts = [
    { label: t("sellerTools.calendar.shortcuts.cmdMenu"), keys: ["Ctrl", "K"] },
    { label: t("sellerTools.calendar.shortcuts.collapseSidebar"), keys: ["`"] },
    { label: t("sellerTools.calendar.shortcuts.jumpToDate"), keys: ["."] },
    {
      label: t("sellerTools.calendar.shortcuts.allShortcuts"),
      keys: ["?"],
    },
  ];

  return (
    <div
      className={styles.page}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className={styles.inner}>
        {/* Main calendar area */}
        <div className={styles.main}>
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <button className={styles.plusBtn}>
                <Plus className={styles.plusIcon} />
              </button>
              <h1 className={styles.headerTitle}>
                {t("sellerTools.calendar.title")}
              </h1>
              <span className={styles.headerTimezone}>GMT+8</span>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.headerControls}>
                <div className={styles.avatar}>
                  <User className={styles.avatarIcon} />
                </div>
                <div className={styles.viewSwitcher}>
                  <button className={styles.viewSwitcherBtn}>
                    {t("sellerTools.calendar.week")}{" "}
                    <ChevronDown className={styles.viewChevron} />
                  </button>
                  <button className={styles.viewSwitcherBtn}>
                    {t("sellerTools.calendar.today")}
                  </button>
                  <button className={styles.viewSwitcherBtn}>
                    <ChevronLeft className={styles.viewArrow} />
                  </button>
                  <button className={styles.viewSwitcherBtn}>
                    <ChevronRight className={styles.viewArrow} />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Calendar body */}
          <div className={styles.body}>
            {/* All-day header */}
            <div className={styles.allDayHeader}>
              {/* Time gutter placeholder */}
              <div className={styles.timeGutter}>
                <X className={styles.gutterClose} />
              </div>
              {/* 7 day columns */}
              <div className={styles.allDayGrid}>
                {dayColumns.map((col) => (
                  <div
                    key={col.dayName + col.date}
                    className={`${styles.allDayCol} ${col.isPast ? styles.colPast : ""}`}
                  >
                    <div
                      className={`${styles.dayLabel} ${col.isToday ? styles.dayLabelToday : styles.dayLabelDefault}`}
                    >
                      {col.dayName}{" "}
                      {col.isToday ? (
                        <span className={styles.todayBadge}>{col.date}</span>
                      ) : (
                        col.date
                      )}
                    </div>
                    <div className={styles.allDayEvents}>
                      {col.allDayEvents.map((evt, j) => (
                        <AllDayEventChip key={j} {...evt} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable time grid */}
            <div className={styles.timeGrid} ref={gridRef}>
              <div className={styles.timeGridInner}>
                {/* Time labels */}
                <div className={styles.timeLabels}>
                  {timeLabels.map((label, i) => (
                    <div key={i} className={styles.timeLabelCell}>
                      {label && (
                        <span className={styles.timeLabelText}>{label}</span>
                      )}
                    </div>
                  ))}
                  <div className={styles.timeLabelCell} />
                </div>

                {/* 7 day columns */}
                <div className={styles.dayColumnsGrid}>
                  {/* Grid lines */}
                  <div className={styles.gridLines}>
                    {[...Array(17)].map((_, i) => (
                      <div key={i} className={styles.gridLine} />
                    ))}
                  </div>

                  {/* Current time red line */}
                  <div className={styles.currentTimeLine} style={{ top: 192 }}>
                    <div className={styles.currentTimeBadge}>3:12AM</div>
                    <div className={styles.currentTimeDot} />
                  </div>

                  {/* Day content */}
                  {dayColumns.map((col) => (
                    <div
                      key={col.dayName + col.date}
                      className={`${styles.dayCol} ${col.isPast ? styles.colPast : ""} ${col.isToday ? styles.colToday : ""} ${col.dayName === "\u5468\u516D" ? styles.colLast : ""}`}
                    >
                      {/* Overnight reading indicator */}
                      <div
                        className={`${styles.readingIndicator} ${col.isPast ? styles.readingPast : styles.readingFuture}`}
                        style={{ top: 8 }}
                      >
                        <div
                          className={`${styles.readingDot} ${col.isPast ? styles.readingDotPast : styles.readingDotFuture}`}
                        />
                        Reading Books{" "}
                        <span
                          className={`${styles.readingTime} ${col.isPast ? styles.readingTimePast : ""}`}
                        >
                          11:45 PM
                        </span>
                      </div>

                      {/* Time events */}
                      {col.timeEvents.map((evt, j) => (
                        <TimeEventCard key={j} evt={evt} isPast={col.isPast} onMouseDown={handleMouseDown} />
                      ))}
                    </div>
                  ))}

                  {/* Bottom spacer */}
                  <div
                    className={styles.bottomSpacer}
                    style={{ marginTop: 1000 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSearch}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder={t("sellerTools.calendar.searchPlaceholder")}
                className={styles.searchInput}
              />
              <div className={styles.searchSlash}>/</div>
            </div>
          </div>

          <div className={styles.sidebarShortcuts}>
            <h2 className={styles.shortcutsTitle}>
              {t("sellerTools.calendar.shortcuts.title")}
            </h2>
            <ul className={styles.shortcutsList}>
              {shortcuts.map((s) => (
                <li key={s.label} className={styles.shortcutItem}>
                  <span className={styles.shortcutLabel}>{s.label}</span>
                  <div className={styles.shortcutKeys}>
                    {s.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Floating side buttons */}
          <div className={styles.floatingBtns}>
            <button className={styles.floatBtnPink}>
              <ArrowLeftRight className={styles.floatBtnIcon} />
            </button>
            <button className={styles.floatBtnGradient} />
          </div>
        </aside>
      </div>
    </div>
  );
}
