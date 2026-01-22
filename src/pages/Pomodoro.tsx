import { useEffect, useState } from "react";
import {
  usePomodoroTimer,
  formatTime,
  calculateProgress,
  type SavedSessionData,
} from "../hooks/usePomodoroTimer";
import { useCalendarStore } from "../store/calendarStoreNew";
import { categoriesService } from "../services/database";
import { SaveToCalendarModal } from "../components/pomodoro/SaveToCalendarModal";
import { useFloatingTimerStore } from "../store/floatingTimerStore";

export const Pomodoro = () => {
  const {
    pomodoroDuration,
    breakDuration,
    currentMode,
    timeRemaining,
    isRunning,
    totalWorkMinutes,
    autoPlay,
    setPomodoroDuration,
    setBreakDuration,
    setAutoPlay,
    start,
    pause,
    reset,
    switchMode,
    getSessionPreview,
    clearSession,
  } = usePomodoroTimer();

  const { addBlock } = useCalendarStore();
  const { minimize, isMinimized, restore, source } = useFloatingTimerStore();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sessionPreview, setSessionPreview] = useState<SavedSessionData | null>(
    null,
  );
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Auto-restore if user navigates back to pomodoro while it's minimized
  useEffect(() => {
    if (isMinimized && source === "pomodoro") {
      // Don't auto-restore, just show the message
      // User must click X on widget to restore
    }
  }, [isMinimized, source]);

  // El timer interval es manejado globalmente por GlobalTimerProvider
  // No necesitamos interval local

  // Calculate progress for circular bar
  const totalDuration =
    currentMode === "break" ? breakDuration * 60 : pomodoroDuration * 60;
  const progress = calculateProgress(timeRemaining, totalDuration);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Format total work time as hours and minutes
  const formatTotalTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m`;
  };

  // Open save modal with preview
  const handleOpenSaveModal = () => {
    if (totalWorkMinutes === 0) return;
    const preview = getSessionPreview();
    if (preview) {
      setSessionPreview(preview);
      setShowSaveModal(true);
    }
  };

  // Handle confirmed save to calendar
  const handleConfirmSave = async () => {
    if (!sessionPreview) return;

    try {
      // Get or create "Estudio" category with red color
      const category = await categoriesService.getOrCreate(
        "Estudio",
        "#EF4444",
      );

      // Create the block in calendar
      await addBlock({
        title: "Estudio",
        date: sessionPreview.date,
        startTime: sessionPreview.startTime,
        endTime: sessionPreview.endTime,
        type: "other",
        color: "red",
        categoryId: category.id,
        completed: false,
      });

      // Show success toast
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);

      // Clear the session
      clearSession();
    } catch (error) {
      console.error("Error saving to calendar:", error);
      throw error; // Re-throw to let the modal handle it
    }
  };

  // Toggle play/pause
  const handlePlayPause = () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  // Handle minimize
  const handleMinimize = () => {
    minimize("pomodoro");
  };

  // If minimized, don't render the full page
  if (isMinimized && source === "pomodoro") {
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
            El temporizador está funcionando en modo minimizado. Puedes navegar
            por otras secciones mientras continúa corriendo.
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

  return (
    <main className="flex-1 flex flex-col bg-cal-bg relative overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-6xl mx-auto">
        {/* Mode Toggle */}
        <div className="bg-[#1e293b] p-1.5 rounded-full flex items-center mb-10 shadow-lg border border-[#282e39]">
          <button
            onClick={() => !isRunning && switchMode("pomodoro")}
            className={`rounded-full px-8 py-2 text-sm font-semibold transition-all ${
              currentMode === "pomodoro" || currentMode === "paused"
                ? "bg-primary text-white shadow-lg shadow-blue-900/20"
                : "text-[#9da6b9] hover:text-white"
            }`}
            disabled={isRunning}
          >
            Enfoque
          </button>
          <button
            onClick={() => !isRunning && switchMode("break")}
            className={`rounded-full px-8 py-2 text-sm font-medium transition-all ${
              currentMode === "break"
                ? "bg-primary text-white shadow-lg shadow-blue-900/20"
                : "text-[#9da6b9] hover:text-white"
            }`}
            disabled={isRunning}
          >
            Descanso
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 w-full items-center justify-center">
          {/* Left Panel - Stats and Settings */}
          <div className="w-full lg:w-1/4 flex flex-col gap-6 order-2 lg:order-1">
            {/* Total Time Card */}
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-[#282e39] shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-[#9da6b9]">
                <span className="material-symbols-outlined text-[20px]">
                  history
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Tiempo Total
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {formatTotalTime(totalWorkMinutes)}
              </div>
              {totalWorkMinutes > 0 && (
                <div className="text-emerald-400 text-xs flex items-center gap-1 bg-emerald-400/10 self-start px-2 py-1 rounded w-fit">
                  <span className="material-symbols-outlined text-[14px]">
                    trending_up
                  </span>
                  <span>+{totalWorkMinutes}m esta sesión</span>
                </div>
              )}
            </div>

            {/* Configuration Card */}
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-[#282e39] shadow-sm relative group">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    tune
                  </span>
                  Configuración
                </h3>
              </div>

              {/* Pomodoro Duration Slider */}
              <div className="mb-6">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[#9da6b9]">Pomodoro</span>
                  <span className="text-white font-mono">
                    {pomodoroDuration} min
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="90"
                  value={pomodoroDuration}
                  onChange={(e) => setPomodoroDuration(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full h-1 bg-[#282e39] rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-[10px] text-[#556075] mt-1">
                  <span>15</span>
                  <span>90</span>
                </div>
              </div>

              {/* Break Duration Slider */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[#9da6b9]">Descanso</span>
                  <span className="text-white font-mono">
                    {breakDuration} min
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="20"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(Number(e.target.value))}
                  disabled={isRunning}
                  className="w-full h-1 bg-[#282e39] rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-[10px] text-[#556075] mt-1">
                  <span>5</span>
                  <span>20</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center - Timer */}
          <div className="w-full lg:w-2/3 flex flex-col items-center order-1 lg:order-2">
            {/* Circular Timer */}
            <div className="relative size-[380px] md:size-[440px] flex items-center justify-center mb-10">
              <svg
                className="absolute inset-0 size-full -rotate-90 transform"
                viewBox="0 0 100 100"
              >
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="3"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={currentMode === "break" ? "#10b981" : "#135bec"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-linear drop-shadow-2xl"
                  style={{
                    filter:
                      currentMode === "break"
                        ? "drop-shadow(0 0 15px rgba(16, 185, 129, 0.5))"
                        : "drop-shadow(0 0 15px rgba(19, 91, 236, 0.5))",
                  }}
                />
              </svg>

              <div className="flex flex-col items-center z-10">
                <span className="text-8xl md:text-9xl font-bold text-white tracking-tighter tabular-nums mb-2 drop-shadow-lg">
                  {formatTime(timeRemaining)}
                </span>
                <span className="text-[#9da6b9] text-xl font-medium tracking-wide">
                  {currentMode === "break"
                    ? "Tómate un descanso"
                    : "Mantén el enfoque"}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-8 w-full max-w-md">
              <div className="flex w-full gap-4">
                {/* Play/Pause Button */}
                <button
                  onClick={handlePlayPause}
                  className={`flex-1 h-16 text-white rounded-xl text-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 group active:scale-95 ${
                    currentMode === "break"
                      ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-900/30"
                      : "bg-primary hover:bg-blue-600 shadow-blue-900/30"
                  }`}
                >
                  <span className="material-symbols-outlined text-[32px] group-hover:scale-110 transition-transform">
                    {isRunning ? "pause" : "play_arrow"}
                  </span>
                  {isRunning ? "Pausar" : "Iniciar"}
                </button>

                {/* Minimize Button */}
                <button
                  onClick={handleMinimize}
                  className="h-16 px-4 flex items-center justify-center gap-2 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 hover:text-[#A78BFA] transition-all"
                  title="Minimizar temporizador"
                >
                  <span className="material-symbols-outlined text-[24px]">
                    picture_in_picture_alt
                  </span>
                  <span className="font-medium text-sm hidden sm:inline">
                    Minimizar
                  </span>
                </button>

                {/* Save Button - Only visible when paused and has accumulated time */}
                {!isRunning && totalWorkMinutes > 0 && (
                  <button
                    onClick={handleOpenSaveModal}
                    className="h-16 px-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all"
                    title="Guardar en Calendario"
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      calendar_add_on
                    </span>
                    <span className="font-medium text-sm hidden sm:inline">
                      Guardar
                    </span>
                  </button>
                )}

                {/* Reset Button - Only visible when paused */}
                {!isRunning && (
                  <button
                    onClick={reset}
                    className="h-16 aspect-square flex items-center justify-center rounded-xl bg-[#1e293b] border border-[#282e39] text-[#9da6b9] hover:text-white hover:border-white/20 transition-all"
                    title="Reiniciar"
                  >
                    <span className="material-symbols-outlined text-[28px]">
                      restart_alt
                    </span>
                  </button>
                )}
              </div>

              {/* Auto-play Toggle */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPlay}
                    onChange={(e) => setAutoPlay(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#1e293b] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-[#282e39]"></div>
                </div>
                <span className="text-sm font-medium text-[#9da6b9] group-hover:text-white transition-colors">
                  Auto-reproducir descansos
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {showSaveSuccess && (
          <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in z-50">
            <span className="material-symbols-outlined">check_circle</span>
            <span>Sesión guardada en el calendario</span>
          </div>
        )}
      </div>

      {/* Save to Calendar Modal */}
      <SaveToCalendarModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={handleConfirmSave}
        sessionData={sessionPreview}
      />
    </main>
  );
};
