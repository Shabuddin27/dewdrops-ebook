import { useState, useEffect, useRef } from "react";
import { Flame, BookOpen, Target, Calendar, TrendingUp, Minus, Plus, CheckCircle } from "lucide-react";
import { motion as framerMotion } from "framer-motion";

const MotionDiv = framerMotion.div;
const GOAL_KEY = "daily-reading-goal";
const LOG_KEY = "reading-log";

function getLog() {
  try {
    const raw = JSON.parse(localStorage.getItem(LOG_KEY));
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch { return {}; }
}

function getSavedGoal() {
  return Math.max(1, parseInt(localStorage.getItem(GOAL_KEY)) || 10);
}

function computeStreak(log) {
  const today = new Date();
  const todayKey = toDateKey(today);
  let streak = 0;
  // If today has no reading, start checking from yesterday
  let start = log[todayKey] ? 0 : 1;
  for (let i = start; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (log[toDateKey(d)]) streak++;
    else break;
  }
  return streak;
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function computeStats(log) {
  const totalPageTurns = Object.values(log).reduce((s, n) => s + n, 0);
  try {
    const progress = JSON.parse(localStorage.getItem("reading-progress")) || [];
    if (!Array.isArray(progress)) return { totalPageTurns, booksStarted: 0, chaptersRead: 0 };
    const booksStarted = new Set(progress.map(p => p.bookId)).size;
    const chaptersRead = progress.reduce((s, p) => {
      const pct = p.totalPages > 0 ? (p.pageIndex || 0) / p.totalPages : 0;
      return s + (pct >= 0.9 ? 1 : 0);
    }, 0);
    return { totalPageTurns, booksStarted, chaptersRead };
  } catch { return { totalPageTurns, booksStarted: 0, chaptersRead: 0 }; }
}

// Build a 15-week heatmap grid (Sun–Sat columns)
function buildHeatmap(log) {
  const today = new Date();
  const WEEKS = 15;
  const totalDays = WEEKS * 7;

  const days = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ date: toDateKey(d), count: log[toDateKey(d)] || 0, d });
  }

  // Pad front so first day lands on the right column
  const firstDow = days[0]?.d.getDay() ?? 0;
  const weeks = [];
  let week = Array(firstDow).fill(null);
  for (const day of days) {
    week.push(day);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function monthLabels(weeks) {
  let last = -1;
  return weeks.map(week => {
    const day = week.find(d => d !== null);
    if (!day) return "";
    const m = day.d.getMonth();
    if (m !== last) { last = m; return day.d.toLocaleString("en", { month: "short" }); }
    return "";
  });
}

function heatColor(count) {
  if (!count) return "bg-gray-200 dark:bg-gray-600";
  if (count < 5)  return "bg-amber-200 dark:bg-amber-800";
  if (count < 15) return "bg-amber-400 dark:bg-amber-600";
  if (count < 30) return "bg-amber-500 dark:bg-amber-500";
  return "bg-amber-600 dark:bg-amber-400";
}

function StatCard({ Icon, label, value, sub, colorClass }) {
  const Comp = Icon;

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 sm:p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm flex flex-col gap-1"
    >
        <div className={`inline-flex p-2 rounded-xl w-fit ${colorClass}`}>
          <Comp size={15} />
        </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</div>
      <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 dark:text-gray-500">{sub}</div>}
    </MotionDiv>
  );
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const LEGEND = [
  "bg-gray-200 dark:bg-gray-600",
  "bg-amber-200 dark:bg-amber-800",
  "bg-amber-400 dark:bg-amber-600",
  "bg-amber-500 dark:bg-amber-500",
  "bg-amber-600 dark:bg-amber-400",
];

export default function Stats() {
  const [log, setLog] = useState(getLog);
  const [goal, setGoal] = useState(getSavedGoal);
  const [editing, setEditing] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(getSavedGoal()));
  const goalInputRef = useRef(null);

  useEffect(() => {
    const refresh = () => { setLog(getLog()); setGoal(getSavedGoal()); };
    const onVisible = () => { if (!document.hidden) refresh(); };
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    if (editing) goalInputRef.current?.focus();
  }, [editing]);

  const saveGoal = () => {
    const n = parseInt(goalDraft);
    if (!isNaN(n) && n > 0) {
      localStorage.setItem(GOAL_KEY, String(n));
      setGoal(n);
    }
    setEditing(false);
  };

  const adjustGoalDraft = (delta) => {
    setGoalDraft(v => String(Math.max(1, (parseInt(v) || 1) + delta)));
  };

  const todayPages = log[toDateKey(new Date())] || 0;
  const goalPct = Math.min(100, (todayPages / goal) * 100);
  const streak = computeStreak(log);
  const stats = computeStats(log);
  const heatmap = buildHeatmap(log);
  const mLabels = monthLabels(heatmap);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 pt-3 pb-12 sm:px-6">

      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp size={18} className="text-amber-600 dark:text-amber-500" />
        <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:text-xl">
          Reading Stats
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2.5 mb-4 sm:grid-cols-4 sm:gap-3">
        <StatCard
          Icon={Flame}
          label="Day Streak"
          value={streak}
          sub={streak === 1 ? "day" : "days"}
          colorClass="text-orange-500 bg-orange-50 dark:bg-orange-900/20"
        />
        <StatCard
          Icon={BookOpen}
          label="Books Started"
          value={stats.booksStarted}
          colorClass="text-amber-600 bg-amber-50 dark:bg-amber-900/20"
        />
        <StatCard
          Icon={Target}
          label="Today"
          value={todayPages}
          sub={`goal: ${goal} pages`}
          colorClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
        />
        <StatCard
          Icon={TrendingUp}
          label="Total Page Turns"
          value={stats.totalPageTurns.toLocaleString()}
          colorClass="text-blue-500 bg-blue-50 dark:bg-blue-900/20"
        />
      </div>

      {/* Daily goal */}
      <div className="p-4 mb-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-amber-600 dark:text-amber-500" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Daily Goal</span>
          </div>
          {!editing ? (
            <button
              onClick={() => { setGoalDraft(String(goal)); setEditing(true); }}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
            >
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button onClick={() => adjustGoalDraft(-1)} className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white"><Minus size={10} /></button>
              <input
                ref={goalInputRef}
                value={goalDraft}
                onChange={e => setGoalDraft(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveGoal()}
                className="w-10 text-center text-xs border border-gray-200 dark:border-gray-600 rounded-lg py-0.5 bg-white dark:bg-gray-700 dark:text-white outline-none focus:border-amber-400"
              />
              <button onClick={() => adjustGoalDraft(1)} className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white"><Plus size={10} /></button>
              <button onClick={saveGoal} className="text-xs text-amber-600 dark:text-amber-400 font-semibold ml-0.5">Save</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-1.5">
          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <MotionDiv
              initial={{ width: 0 }}
              animate={{ width: `${goalPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums">
            {todayPages} / {goal}
          </span>
        </div>

        {todayPages >= goal && goal > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <CheckCircle size={13} className="text-emerald-500" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Daily goal reached!</span>
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={14} className="text-amber-600 dark:text-amber-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Reading Activity</span>
        </div>

        <div className="overflow-x-auto pb-1 whitespace-nowrap">
          <table style={{ borderCollapse: "separate", borderSpacing: "3px 3px", display: "inline-table" }}>
            {/* Month labels row */}
            <thead>
              <tr>
                <th style={{ width: "2rem" }} />
                {mLabels.map((l, i) => (
                  <th
                    key={i}
                    className="text-[8px] text-gray-400 dark:text-gray-500 font-normal text-left align-bottom whitespace-nowrap overflow-visible"
                    style={{ width: "13px", padding: 0, paddingBottom: "2px" }}
                  >
                    {l}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Day rows */}
            <tbody>
              {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                <tr key={dayIdx}>
                  {/* Day label */}
                  <td
                    className="text-right text-[8px] text-gray-400 dark:text-gray-500 whitespace-nowrap"
                    style={{ padding: 0, paddingRight: "4px", width: "2rem" }}
                  >
                    {DAY_LABELS[dayIdx]}
                  </td>

                  {/* One cell per week */}
                  {heatmap.map((week, wi) => {
                    const day = week[dayIdx];
                    return (
                      <td key={wi} style={{ width: "13px", height: "13px", padding: 0 }}>
                        {day ? (
                          <div
                            title={`${day.date}: ${day.count} page turn${day.count !== 1 ? "s" : ""}`}
                            className={`rounded-[2px] cursor-default ${heatColor(day.count)}`}
                            style={{ width: "13px", height: "13px" }}
                          />
                        ) : (
                          <div style={{ width: "13px", height: "13px" }} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 mt-3 justify-end">
          <span className="text-[9px] text-gray-400 mr-0.5">Less</span>
          {LEGEND.map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-[2px] ${c}`} />
          ))}
          <span className="text-[9px] text-gray-400 ml-0.5">More</span>
        </div>
      </div>

    </div>
  );
}
