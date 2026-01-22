import { useEffect, useState } from "react";
import { useFocusTimer } from "../hooks/useFocusTimer";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useFloatingTimerStore } from "../store/floatingTimerStore";

// Format seconds to MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Duration options
const DURATION_OPTIONS = [15, 25, 30, 45, 60, 90, 120, 180];

export const Enfoque = () => {
  const {
    focusType,
    durationMinutes,
    status,
    timeRemaining,
    timeElapsed,
    distractionsCount,
    weeklyStats,
    currentWeekOffset,
    isLoading,
    isSaving,
    setFocusType,
    setDuration,
    start,
    pause,
    resume,
    stop,
    reset,
    registerDistraction,
    goToPrevMonth,
    goToNextMonth,
    fetchWeeklyStats,
  } = useFocusTimer();

  const { minimize, isMinimized, restore, source } = useFloatingTimerStore();

  // Animation state for distraction button
  const [distractionAnimation, setDistractionAnimation] = useState(false);

  // Auto-restore check (similar to Pomodoro)
  useEffect(() => {
    if (isMinimized && source === "focus") {
      // Don't auto-restore, show message instead
    }
  }, [isMinimized, source]);

  // El timer interval es manejado globalmente por GlobalTimerProvider
  // No necesitamos interval local

  // Fetch weekly stats on mount
  useEffect(() => {
    fetchWeeklyStats();
  }, [fetchWeeklyStats]);

  // Handle distraction click with animation
  const handleDistraction = () => {
    registerDistraction();
    setDistractionAnimation(true);
    setTimeout(() => setDistractionAnimation(false), 300);
  };

  // Calculate progress percentage
  const totalSeconds = durationMinutes * 60;
  const progress = ((totalSeconds - timeRemaining) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 45; // Circle radius is 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Get month name for stats navigation
  const getMonthLabel = () => {
    const baseDate = new Date();
    const targetDate = new Date(baseDate);
    targetDate.setMonth(targetDate.getMonth() + currentWeekOffset);
    return format(targetDate, "MMMM", { locale: es });
  };

  // Calculate max distraction rate for chart scaling
  const maxDistractionRate = Math.max(
    4,
    ...weeklyStats.map((s) => s.distractionsPerHour),
  );

  // Handle minimize
  const handleMinimize = () => {
    minimize("focus");
  };

  // If minimized, show placeholder
  if (isMinimized && source === "focus") {
    return (
      <main className="flex-1 flex flex-col bg-cal-bg items-center justify-center p-6">
        <div className="text-center max-w-md">
          <span className="material-symbols-outlined text-6xl text-[#8B5CF6] mb-4 inline-block">
            picture_in_picture_alt
          </span>
          <h2 className="text-2xl font-bold text-white mb-2">
            Temporizador Minimizado
          </h2>
          <p className="text-gray-400 mb-6">
            El temporizador de enfoque está funcionando en modo minimizado.
            Puedes navegar por otras secciones mientras continúa corriendo.
          </p>
          <button
            onClick={restore}
            className="px-6 py-3 bg-[#8B5CF6] text-white rounded-xl hover:bg-[#7C4FE0] transition-colors font-medium"
          >
            Restaurar Temporizador
          </button>
        </div>
      </main>
    );
  }

  // Theme colors based on focus type
  const isDeepWork = focusType === "deep";
  const themeColors = isDeepWork
    ? {
        primary: "#7f13ec",
        primaryLight: "rgba(127, 19, 236, 0.2)",
        primaryBorder: "rgba(127, 19, 236, 0.3)",
        bg: "bg-[#191022]",
        bgSecondary: "bg-[#251b2e]",
        bgActive: "bg-[#3a2a47]",
        gradient: "from-[#7f13ec]/10",
        text: "text-[#ab9db9]",
        accent: "text-[#7f13ec]",
      }
    : {
        primary: "#13ec13",
        primaryLight: "rgba(19, 236, 19, 0.2)",
        primaryBorder: "rgba(19, 236, 19, 0.3)",
        bg: "bg-[#102210]",
        bgSecondary: "bg-[#1a321a]",
        bgActive: "bg-[#2a472a]",
        gradient: "from-[#13ec13]/10",
        text: "text-[#9db9ab]",
        accent: "text-[#13ec13]",
      };

  return (
    <div
      className={`min-h-full transition-colors duration-500 ${themeColors.bg}`}
    >
      {/* Gradient overlay */}
      <div
        className={`absolute top-0 left-0 w-full h-64 bg-gradient-to-b ${themeColors.gradient} to-transparent pointer-events-none`}
      />

      <div className="relative max-w-5xl mx-auto w-full p-6 md:p-12 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-3xl"
                style={{ color: themeColors.primary }}
              >
                bolt
              </span>
              <h1 className="text-white text-3xl md:text-4xl font-black tracking-tight">
                Sesión de Enfoque
              </h1>
            </div>
            <p className={`${themeColors.text} text-base font-normal`}>
              {isDeepWork
                ? "Entra en estado de flujo y mide tu concentración."
                : "Mantenlo fluido y sin presiones."}
            </p>
          </div>

          {status !== "idle" && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: isDeepWork
                  ? "rgba(34, 197, 94, 0.1)"
                  : "rgba(19, 236, 19, 0.1)",
                borderColor: isDeepWork
                  ? "rgba(34, 197, 94, 0.2)"
                  : "rgba(19, 236, 19, 0.2)",
                borderWidth: 1,
              }}
            >
              <div
                className={`w-2 h-2 rounded-full ${status === "running" ? "animate-pulse" : ""}`}
                style={{
                  backgroundColor: isDeepWork ? "#22c55e" : "#13ec13",
                }}
              />
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: isDeepWork ? "#22c55e" : "#13ec13" }}
              >
                {status === "running"
                  ? "Sesión Activa"
                  : status === "paused"
                    ? "En Pausa"
                    : "Sesión Finalizada"}
              </span>
            </div>
          )}
        </div>

        {/* Mode selector */}
        <div className="flex flex-col items-center gap-10 py-4">
          <div
            className={`${themeColors.bgSecondary} p-1.5 rounded-2xl inline-flex shadow-lg shadow-black/20 border border-white/5`}
          >
            <label className="cursor-pointer relative">
              <input
                type="radio"
                name="mode"
                value="deep"
                checked={focusType === "deep"}
                onChange={() => setFocusType("deep")}
                disabled={status !== "idle"}
                className="peer sr-only"
              />
              <div
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 
                  ${focusType === "deep" ? "bg-[#7f13ec] text-white shadow-lg" : `${themeColors.text} hover:text-white`}
                  ${status !== "idle" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  psychology
                </span>
                <span className="text-sm font-semibold">Trabajo Profundo</span>
              </div>
            </label>
            <label className="cursor-pointer relative">
              <input
                type="radio"
                name="mode"
                value="shallow"
                checked={focusType === "shallow"}
                onChange={() => setFocusType("shallow")}
                disabled={status !== "idle"}
                className="peer sr-only"
              />
              <div
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300
                  ${focusType === "shallow" ? "bg-[#13ec13] text-[#102210] shadow-lg" : `${themeColors.text} hover:text-white`}
                  ${status !== "idle" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  check_circle
                </span>
                <span className="text-sm font-semibold">Trabajo Ligero</span>
              </div>
            </label>
          </div>

          {/* Duration selector (only visible when idle) */}
          {status === "idle" && (
            <div className="flex flex-wrap justify-center gap-2">
              {DURATION_OPTIONS.map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDuration(mins)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      durationMinutes === mins
                        ? "text-white shadow-lg"
                        : `${themeColors.bgSecondary} ${themeColors.text} hover:bg-white/10`
                    }`}
                  style={
                    durationMinutes === mins
                      ? { backgroundColor: themeColors.primary }
                      : {}
                  }
                >
                  {mins} min
                </button>
              ))}
            </div>
          )}

          {/* Timer Circle */}
          <div className="relative group my-4">
            <div
              className="absolute inset-0 blur-[60px] rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-700"
              style={{ backgroundColor: themeColors.primaryLight }}
            />
            <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center">
              <svg
                className="w-full h-full -rotate-90 transform"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={themeColors.bgSecondary.replace("bg-", "")}
                  strokeWidth="3"
                  className={themeColors.bgActive}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={themeColors.primary}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-7xl md:text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
                  {formatTime(timeRemaining)}
                </div>
                <div className={`${themeColors.text} text-sm font-medium mt-2`}>
                  {status === "idle"
                    ? "Listo para empezar"
                    : status === "running"
                      ? "Mantén el enfoque"
                      : status === "paused"
                        ? "En pausa"
                        : "¡Sesión completada!"}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            {/* Distraction button (only for deep work and when running) */}
            {isDeepWork && status === "running" && (
              <button
                onClick={handleDistraction}
                className={`w-full group relative flex items-center justify-center gap-3 h-16 rounded-2xl 
                  border transition-all duration-300 active:scale-[0.98] shadow-lg shadow-black/40 overflow-hidden
                  ${distractionAnimation ? "scale-95" : ""}`}
                style={{
                  backgroundColor: themeColors.bgActive.replace("bg-", ""),
                  borderColor: themeColors.primaryBorder,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="material-symbols-outlined text-white text-2xl group-hover:animate-bounce">
                  ads_click
                </span>
                <span className="text-white text-lg font-bold tracking-wide">
                  Registrar Distracción
                </span>
                <span className="bg-black/30 text-white text-xs font-bold px-2 py-1 rounded-md border border-white/10 ml-2">
                  {distractionsCount}
                </span>
              </button>
            )}

            {/* Action buttons */}
            <div className="flex gap-4">
              {/* Minimize button - visible during any active session */}
              {status !== "idle" && status !== "finished" && (
                <button
                  onClick={handleMinimize}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 transition-colors"
                  title="Minimizar temporizador"
                >
                  <span className="material-symbols-outlined text-xl">
                    picture_in_picture_alt
                  </span>
                  <span className="text-sm font-medium">Minimizar</span>
                </button>
              )}

              {status === "idle" && (
                <button
                  onClick={start}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold hover:opacity-90 transition-all shadow-lg"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  <span className="material-symbols-outlined text-xl">
                    play_arrow
                  </span>
                  <span className="text-sm font-medium">Comenzar</span>
                </button>
              )}

              {status === "running" && (
                <button
                  onClick={pause}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl ${themeColors.bgSecondary} border border-white/5 text-white hover:bg-white/10 transition-colors`}
                  title="Pausar sesión"
                >
                  <span className="material-symbols-outlined text-xl">
                    pause
                  </span>
                  <span className="text-sm font-medium">Pausar</span>
                </button>
              )}

              {status === "paused" && (
                <>
                  <button
                    onClick={resume}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold hover:opacity-90 transition-all"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    <span className="material-symbols-outlined text-xl">
                      play_arrow
                    </span>
                    <span className="text-sm font-medium">Continuar</span>
                  </button>
                  <button
                    onClick={stop}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-xl">
                      save
                    </span>
                    <span className="text-sm font-medium">
                      {isSaving ? "Guardando..." : "Guardar"}
                    </span>
                  </button>
                </>
              )}

              {(status === "running" || status === "paused") && (
                <button
                  onClick={stop}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  title="Finalizar sesión"
                >
                  <span className="material-symbols-outlined text-xl">
                    stop
                  </span>
                  <span className="text-sm font-medium">Finalizar</span>
                </button>
              )}

              {status === "finished" && (
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold hover:opacity-90 transition-all"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  <span className="material-symbols-outlined text-xl">
                    replay
                  </span>
                  <span className="text-sm font-medium">Nueva Sesión</span>
                </button>
              )}
            </div>

            {/* Session stats when finished */}
            {status === "finished" && (
              <div
                className={`${themeColors.bgSecondary} rounded-xl p-4 border border-white/5 text-center`}
              >
                <p className={`${themeColors.text} text-sm`}>
                  Tiempo trabajado:{" "}
                  <span className="text-white font-bold">
                    {Math.round(timeElapsed / 60)} minutos
                  </span>
                </p>
                {isDeepWork && (
                  <p className={`${themeColors.text} text-sm mt-1`}>
                    Distracciones:{" "}
                    <span className="text-white font-bold">
                      {distractionsCount}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Weekly comparison chart (only for deep work) */}
        {isDeepWork && (
          <div
            className={`w-full ${themeColors.bgSecondary} border border-white/5 rounded-2xl p-6 md:p-8`}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-white font-bold text-lg">
                  Comparación entre Semanas
                </h3>
                <p className={`${themeColors.text} text-sm`}>
                  Tasa de distracción promedio
                </p>
              </div>
              <div
                className={`flex items-center ${themeColors.bg} rounded-lg p-1 border border-white/5`}
              >
                <button
                  onClick={goToPrevMonth}
                  className={`p-1 hover:bg-white/10 rounded ${themeColors.text} hover:text-white transition-colors`}
                >
                  <span className="material-symbols-outlined text-lg">
                    chevron_left
                  </span>
                </button>
                <span
                  className={`px-3 text-xs font-medium ${themeColors.text} capitalize min-w-[80px] text-center`}
                >
                  {getMonthLabel()}
                </span>
                <button
                  onClick={goToNextMonth}
                  disabled={currentWeekOffset >= 0}
                  className={`p-1 hover:bg-white/10 rounded ${themeColors.text} hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <span className="material-symbols-outlined text-lg">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: themeColors.primary }}
                />
              </div>
            ) : (
              <div className="flex gap-4 h-48 w-full">
                {/* Y-axis labels */}
                <div
                  className={`flex flex-col justify-between h-40 text-xs ${themeColors.text} font-medium text-right pr-2 py-2 w-8 shrink-0 border-r border-white/5`}
                >
                  <span>{Math.round(maxDistractionRate)}</span>
                  <span>{Math.round((maxDistractionRate * 3) / 4)}</span>
                  <span>{Math.round(maxDistractionRate / 2)}</span>
                  <span>{Math.round(maxDistractionRate / 4)}</span>
                  <span>0</span>
                </div>

                {/* Bars */}
                <div className="flex-1 flex items-end justify-between gap-2 md:gap-6 px-2">
                  {weeklyStats.map((week, index) => {
                    const barHeight =
                      maxDistractionRate > 0
                        ? (week.distractionsPerHour / maxDistractionRate) * 100
                        : 0;
                    const isCurrentWeek =
                      index === weeklyStats.length - 1 &&
                      currentWeekOffset === 0;

                    return (
                      <div
                        key={week.weekStart}
                        className="flex flex-col items-center gap-2 w-full group cursor-pointer"
                      >
                        <div
                          className={`relative w-full ${themeColors.bgActive} rounded-t-lg flex items-end h-40 overflow-hidden hover:opacity-80 transition-colors`}
                        >
                          <div
                            className="w-full rounded-t-lg transition-all duration-500"
                            style={{
                              height: `${barHeight}%`,
                              backgroundColor: themeColors.primary,
                            }}
                          >
                            <div className="absolute inset-x-0 top-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {week.distractionsPerHour.toFixed(2)}/hr
                              </span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`text-xs font-medium ${isCurrentWeek ? "text-white font-bold" : themeColors.text}`}
                        >
                          {isCurrentWeek
                            ? "Esta Semana"
                            : `Semana ${index + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats cards (only for deep work) */}
        {isDeepWork && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-8">
            {/* Weekly distraction rate */}
            <div
              className={`${themeColors.bgSecondary} p-5 rounded-2xl border border-white/5 flex flex-col gap-1 relative overflow-hidden group`}
            >
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-white">
                  ssid_chart
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="p-1.5 rounded-lg"
                  style={{ backgroundColor: themeColors.primaryLight }}
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: themeColors.primary }}
                  >
                    timeline
                  </span>
                </div>
                <p className={`${themeColors.text} text-sm font-medium`}>
                  Tasa de Distracción Semanal
                </p>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-white">
                  {weeklyStats.length > 0
                    ? weeklyStats[
                        weeklyStats.length - 1
                      ].distractionsPerHour.toFixed(2)
                    : "0.00"}
                  <span
                    className={`text-sm ${themeColors.text} font-normal ml-1`}
                  >
                    /hr
                  </span>
                </span>
                {weeklyStats.length >= 2 && (
                  <div
                    className={`flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                      weeklyStats[weeklyStats.length - 1].distractionsPerHour <
                      weeklyStats[weeklyStats.length - 2].distractionsPerHour
                        ? "text-green-400 bg-green-500/10"
                        : "text-red-400 bg-red-500/10"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm mr-0.5">
                      {weeklyStats[weeklyStats.length - 1].distractionsPerHour <
                      weeklyStats[weeklyStats.length - 2].distractionsPerHour
                        ? "trending_down"
                        : "trending_up"}
                    </span>
                    {Math.abs(
                      ((weeklyStats[weeklyStats.length - 1]
                        .distractionsPerHour -
                        weeklyStats[weeklyStats.length - 2]
                          .distractionsPerHour) /
                        (weeklyStats[weeklyStats.length - 2]
                          .distractionsPerHour || 1)) *
                        100,
                    ).toFixed(0)}
                    %
                  </div>
                )}
              </div>
              {weeklyStats.length >= 2 && (
                <p className={`text-xs ${themeColors.text} opacity-60 mt-1`}>
                  vs.{" "}
                  {weeklyStats[
                    weeklyStats.length - 2
                  ].distractionsPerHour.toFixed(2)}
                  /hr la semana pasada
                </p>
              )}
            </div>

            {/* Deep work hours */}
            <div
              className={`${themeColors.bgSecondary} p-5 rounded-2xl border border-white/5 flex flex-col gap-1`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20">
                  <span className="material-symbols-outlined text-lg text-blue-400">
                    bolt
                  </span>
                </div>
                <p className={`${themeColors.text} text-sm font-medium`}>
                  Horas de Trabajo Profundo
                </p>
              </div>
              <span className="text-2xl font-bold text-white">
                {weeklyStats.length > 0
                  ? (
                      weeklyStats[weeklyStats.length - 1].totalDeepWorkMinutes /
                      60
                    ).toFixed(1)
                  : "0.0"}
                <span
                  className={`text-sm ${themeColors.text} font-normal ml-1`}
                >
                  hrs
                </span>
              </span>
              <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      weeklyStats.length > 0
                        ? (weeklyStats[weeklyStats.length - 1]
                            .totalDeepWorkMinutes /
                            (20 * 60)) *
                            100
                        : 0,
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Total distractions */}
            <div
              className={`${themeColors.bgSecondary} p-5 rounded-2xl border border-white/5 flex flex-col gap-1`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-orange-500/20">
                  <span className="material-symbols-outlined text-lg text-orange-400">
                    notifications_active
                  </span>
                </div>
                <p className={`${themeColors.text} text-sm font-medium`}>
                  Total Distracciones (Semana)
                </p>
              </div>
              <span className="text-2xl font-bold text-white">
                {weeklyStats.length > 0
                  ? weeklyStats[weeklyStats.length - 1].totalDistractions
                  : 0}
              </span>
              <p className={`text-xs ${themeColors.text} opacity-60 mt-1`}>
                Esta semana
              </p>
            </div>
          </div>
        )}

        {/* Shallow work simple stats */}
        {!isDeepWork && status === "idle" && (
          <div className="text-center py-8">
            <p className={`${themeColors.text} text-lg`}>
              El modo de trabajo ligero no rastrea distracciones.
            </p>
            <p className={`${themeColors.text} text-sm mt-2 opacity-60`}>
              Ideal para tareas que no requieren concentración profunda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
