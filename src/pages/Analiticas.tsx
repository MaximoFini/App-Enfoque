import { useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useAnalyticsStore } from "../store/analyticsStore";

// ─── Color palette (static JS values — Recharts can't use CSS vars) ──────────
const DEEP_WORK_COLOR = "#8B5CF6";
const SHALLOW_WORK_COLOR = "#10B981";
const OTHER_COLOR = "#3B82F6";
const GRID_COLOR = "#1e2530";
const MUTED_TEXT = "#6b7280";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtHours = (h: number) => {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accentColor: string;
}
const StatCard = ({ icon, label, value, sub, accentColor }: StatCardProps) => (
  <div className="bg-cal-sidebar border border-cal-border rounded-xl p-5 flex flex-col gap-3">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}1a` }}>
        <span className="material-symbols-outlined text-[18px]" style={{ color: accentColor }}>{icon}</span>
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">{label}</span>
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-[#6b7280] mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-4">
    <h2 className="text-sm font-bold text-white uppercase tracking-widest">{title}</h2>
    {subtitle && <p className="text-xs text-[#6b7280] mt-0.5">{subtitle}</p>}
  </div>
);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1f2b] border border-[#2a3141] rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-[#9da6b9] mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-white">{fmtHours(p.value)}</span>
          <span className="text-[#6b7280] capitalize">{p.name}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-[#1e2530] rounded-lg ${className}`} />
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export const Analiticas = () => {
  const { currentMonth, stats, isLoading, fetchMonthData, goToPrevMonth, goToNextMonth } =
    useAnalyticsStore();

  useEffect(() => { fetchMonthData(currentMonth); }, []);

  const monthLabel = format(currentMonth, "MMMM yyyy", { locale: es });
  const isCurrentMonth = format(currentMonth, "yyyy-MM") === format(new Date(), "yyyy-MM");

  return (
    <main className="flex-1 overflow-y-auto bg-cal-bg">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Analíticas</h1>
            <p className="text-sm text-[#6b7280] mt-0.5">Resumen de productividad mensual</p>
          </div>
          {/* Month navigator */}
          <div className="flex items-center gap-1 bg-cal-sidebar border border-cal-border rounded-xl overflow-hidden">
            <button
              onClick={goToPrevMonth}
              className="p-2.5 text-[#9da6b9] hover:text-white hover:bg-[#2a3141] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="px-4 text-sm font-semibold text-white capitalize min-w-[140px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className="p-2.5 text-[#9da6b9] hover:text-white hover:bg-[#2a3141] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon="psychology"
              label="Deep Work"
              value={fmtHours(stats.deepWorkHours)}
              sub={`${stats.deepWorkDays} días activos`}
              accentColor={DEEP_WORK_COLOR}
            />
            <StatCard
              icon="speed"
              label="Shallow Work"
              value={fmtHours(stats.shallowWorkHours)}
              sub="Trabajo superficial"
              accentColor={SHALLOW_WORK_COLOR}
            />
            <StatCard
              icon="calendar_view_day"
              label="Total horas"
              value={fmtHours(stats.totalHours)}
              sub={`Prom. ${fmtHours(stats.avgDailyDeepWork)}/día deep`}
              accentColor={OTHER_COLOR}
            />
            <StatCard
              icon="category"
              label="Top categoría"
              value={stats.topCategory?.name ?? "—"}
              sub={stats.topCategory ? fmtHours(stats.topCategory.hours) : "Sin datos"}
              accentColor={stats.topCategory?.color ?? "#6b7280"}
            />
          </div>
        ) : (
          <div className="text-center py-12 text-[#6b7280]">
            <span className="material-symbols-outlined text-4xl mb-2 block">bar_chart</span>
            <p>No hay datos para este mes.</p>
          </div>
        )}

        {/* ── Area Chart — Actividad diaria ── */}
        <div className="bg-cal-sidebar border border-cal-border rounded-xl p-6">
          <SectionHeader title="Actividad diaria" subtitle="Horas por tipo de trabajo cada día" />
          {isLoading ? (
            <Skeleton className="h-52 w-full" />
          ) : stats && stats.dailyPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.dailyPoints} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDeep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={DEEP_WORK_COLOR} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={DEEP_WORK_COLOR} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradShallow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SHALLOW_WORK_COLOR} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={SHALLOW_WORK_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis dataKey="day" tick={{ fill: MUTED_TEXT, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: MUTED_TEXT, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: MUTED_TEXT }} />
                <Area type="monotone" dataKey="deepWork" name="Deep Work" stroke={DEEP_WORK_COLOR} strokeWidth={2} fill="url(#gradDeep)" />
                <Area type="monotone" dataKey="shallowWork" name="Shallow Work" stroke={SHALLOW_WORK_COLOR} strokeWidth={2} fill="url(#gradShallow)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-[#6b7280] text-sm">Sin actividad registrada</div>
          )}
        </div>

        {/* ── Row: Bar chart + Donut chart ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar chart — Deep Work semanal */}
          <div className="bg-cal-sidebar border border-cal-border rounded-xl p-6">
            <SectionHeader title="Deep Work semanal" subtitle="Horas de enfoque profundo por semana" />
            {isLoading ? (
              <Skeleton className="h-44 w-full" />
            ) : stats && stats.weeklyDeepWork.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.weeklyDeepWork} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: MUTED_TEXT, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: MUTED_TEXT, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" name="Deep Work" fill={DEEP_WORK_COLOR} radius={[4, 4, 0, 0]}>
                    {stats.weeklyDeepWork.map((_, i) => (
                      <Cell key={i} fill={DEEP_WORK_COLOR} fillOpacity={0.7 + i * 0.08} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-[#6b7280] text-sm">Sin datos</div>
            )}
          </div>

          {/* Donut chart — Categorías */}
          <div className="bg-cal-sidebar border border-cal-border rounded-xl p-6">
            <SectionHeader title="Categorías" subtitle="Distribución de horas por categoría" />
            {isLoading ? (
              <Skeleton className="h-44 w-full" />
            ) : stats && stats.categoryBreakdown.length > 0 ? (
              <div className="flex items-center gap-4 h-44">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryBreakdown}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={72}
                      paddingAngle={3}
                      dataKey="hours"
                    >
                      {stats.categoryBreakdown.map((cat, i) => (
                        <Cell key={i} fill={cat.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#1a1f2b] border border-[#2a3141] rounded-lg px-3 py-2 text-xs shadow-xl">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                              <span className="text-white font-medium">{d.name}</span>
                            </div>
                            <p className="text-[#9da6b9] mt-1">{fmtHours(d.hours)} · {d.percentage.toFixed(0)}%</p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-44">
                  {stats.categoryBreakdown.map((cat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs text-white truncate">{cat.name}</span>
                          <span className="text-xs text-[#6b7280] flex-shrink-0">{fmtHours(cat.hours)}</span>
                        </div>
                        <div className="mt-0.5 h-1 bg-[#1e2530] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-[#6b7280] text-sm">Sin categorías asignadas</div>
            )}
          </div>
        </div>

        {/* ── Weekly Summaries ── */}
        <div>
          <SectionHeader title="Resumen por semana" subtitle="Desglose semanal de productividad" />
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
            </div>
          ) : stats && stats.weekSummaries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.weekSummaries.map((week, i) => (
                <div key={i} className="bg-cal-sidebar border border-cal-border rounded-xl p-5 space-y-4">
                  {/* Week header */}
                  <div>
                    <p className="text-xs font-bold text-white">{week.label}</p>
                    <p className="text-[10px] text-[#6b7280] mt-0.5 capitalize">
                      {week.startDate} – {week.endDate}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: DEEP_WORK_COLOR }} />
                        <span className="text-[11px] text-[#9da6b9]">Deep Work</span>
                      </div>
                      <span className="text-xs font-semibold text-white">{fmtHours(week.deepWorkHours)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SHALLOW_WORK_COLOR }} />
                        <span className="text-[11px] text-[#9da6b9]">Shallow Work</span>
                      </div>
                      <span className="text-xs font-semibold text-white">{fmtHours(week.shallowWorkHours)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[12px] text-[#6b7280]">schedule</span>
                        <span className="text-[11px] text-[#9da6b9]">Total</span>
                      </div>
                      <span className="text-xs font-semibold text-white">{fmtHours(week.totalHours)}</span>
                    </div>
                  </div>

                  {/* Mini progress bar: deep work ratio */}
                  <div>
                    <div className="h-1.5 bg-[#1e2530] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: week.totalHours > 0 ? `${(week.deepWorkHours / week.totalHours) * 100}%` : "0%",
                          backgroundColor: DEEP_WORK_COLOR,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-[#6b7280] mt-1">
                      {week.totalHours > 0
                        ? `${Math.round((week.deepWorkHours / week.totalHours) * 100)}% deep work`
                        : "Sin actividad"}
                    </p>
                  </div>

                  {/* Top category badge */}
                  {week.topCategory && (
                    <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: `${week.topCategory.color}1a` }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: week.topCategory.color }} />
                      <span className="text-[11px] font-medium truncate" style={{ color: week.topCategory.color }}>
                        {week.topCategory.name}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#6b7280] bg-cal-sidebar border border-cal-border rounded-xl">
              <span className="material-symbols-outlined text-3xl mb-2 block">calendar_month</span>
              <p className="text-sm">No hay semanas con actividad registrada.</p>
            </div>
          )}
        </div>

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </main>
  );
};
