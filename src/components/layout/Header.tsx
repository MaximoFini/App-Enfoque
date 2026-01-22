import { useAuthStore } from "../../store/authStore";

export const Header = () => {
  const { user } = useAuthStore();

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-cal-border bg-cal-sidebar px-6 py-3 shrink-0 z-20">
      <div className="flex items-center gap-4 text-white">
        <div className="size-8 flex items-center justify-center text-cal-primary">
          <span className="material-symbols-outlined text-3xl">
            calendar_month
          </span>
        </div>
        <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
          Bombini
        </h2>
      </div>

      <div className="flex flex-1 justify-end gap-6">
        {/* Search - Hidden on mobile */}
        <label className="flex-col min-w-40 !h-10 max-w-64 hidden md:flex">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full group focus-within:ring-2 ring-cal-primary/50">
            <div className="text-[#9da6b9] flex border-none bg-cal-border items-center justify-center pl-4 rounded-l-lg border-r-0">
              <span className="material-symbols-outlined text-[20px]">
                search
              </span>
            </div>
            <input
              className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-cal-border focus:border-none h-full placeholder:text-[#9da6b9] px-4 rounded-l-none border-l-0 pl-2 text-sm font-normal leading-normal"
              placeholder="Buscar eventos"
            />
          </div>
        </label>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-cal-border text-white hover:bg-[#323945] transition-colors">
            <span className="material-symbols-outlined text-[20px]">
              settings
            </span>
          </button>
          <button className="flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-cal-border text-white hover:bg-[#323945] transition-colors relative">
            <span className="material-symbols-outlined text-[20px]">
              notifications
            </span>
          </button>
        </div>

        {/* User avatar */}
        <div className="bg-cal-primary rounded-full size-10 border border-cal-border flex items-center justify-center text-white font-semibold">
          {user?.email?.charAt(0).toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
};
