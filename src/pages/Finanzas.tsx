export const Finanzas = () => {
  return (
    <main className="flex-1 flex flex-col bg-cal-bg items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-emerald-400">
            account_balance_wallet
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Finanzas</h1>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <span className="material-symbols-outlined text-emerald-400 text-lg">
            construction
          </span>
          <span className="text-emerald-400 font-medium">Próximamente</span>
        </div>
        <p className="text-[#9da6b9] text-lg leading-relaxed">
          Gestiona tus finanzas personales, rastrea gastos e ingresos, y
          visualiza tu progreso financiero.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-cal-sidebar border border-cal-border text-[#9da6b9] text-sm">
            📊 Seguimiento de gastos
          </div>
          <div className="px-4 py-2 rounded-lg bg-cal-sidebar border border-cal-border text-[#9da6b9] text-sm">
            💰 Presupuestos
          </div>
          <div className="px-4 py-2 rounded-lg bg-cal-sidebar border border-cal-border text-[#9da6b9] text-sm">
            📈 Reportes mensuales
          </div>
        </div>
      </div>
    </main>
  );
};
