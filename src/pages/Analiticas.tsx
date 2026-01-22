export const Analiticas = () => {
  return (
    <main className="flex-1 flex flex-col bg-cal-bg items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-violet-400">
            analytics
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Analíticas</h1>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
          <span className="material-symbols-outlined text-violet-400 text-lg">
            construction
          </span>
          <span className="text-violet-400 font-medium">Próximamente</span>
        </div>
        <p className="text-[#9da6b9] text-lg leading-relaxed">
          Visualiza estadísticas detalladas de tu productividad, tiempo
          invertido y patrones de trabajo.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-cal-sidebar border border-cal-border text-[#9da6b9] text-sm">
            📊 Gráficos de productividad
          </div>
          <div className="px-4 py-2 rounded-lg bg-cal-sidebar border border-cal-border text-[#9da6b9] text-sm">
            ⏱️ Tiempo por categoría
          </div>
          <div className="px-4 py-2 rounded-lg bg-cal-sidebar border border-cal-border text-[#9da6b9] text-sm">
            🎯 Metas semanales
          </div>
        </div>
      </div>
    </main>
  );
};
