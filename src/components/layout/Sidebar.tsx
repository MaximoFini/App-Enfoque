import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { useCategoryStore } from "../../store/categoryStore";
import { CategoryModal } from "../categories/CategoryModal";

const navItems = [
  { path: "/calendario", icon: "calendar_today", label: "Calendario" },
  { path: "/pomodoro", icon: "timer", label: "Pomodoro" },
  { path: "/enfoque", icon: "center_focus_strong", label: "Enfoque" },
  { path: "/tareas", icon: "task_alt", label: "Tareas" },
  { path: "/finanzas", icon: "account_balance_wallet", label: "Finanzas" },
  { path: "/analiticas", icon: "analytics", label: "Analíticas" },
];

export const Sidebar = () => {
  const { user, signOut } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { openModal: openCategoryModal } = useCategoryStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside
      className={`fixed left-0 top-0 bg-cal-sidebar border-r border-cal-border flex flex-col hidden lg:flex shrink-0 h-screen transition-all duration-300 z-40 ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Collapse Toggle Button */}
      <div className="p-4 border-b border-cal-border bg-cal-sidebar flex justify-end shrink-0">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-[#9da6b9] hover:text-white hover:bg-cal-hover transition-colors"
          title={sidebarCollapsed ? "Expandir" : "Colapsar"}
        >
          <span className="material-symbols-outlined text-[20px]">
            {sidebarCollapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto bg-cal-sidebar min-h-0">
        {/* User Profile */}
        {!sidebarCollapsed && (
          <div className="flex gap-3 mb-6 items-center px-2">
            <div className="w-12 h-12 rounded-full bg-cal-primary flex items-center justify-center text-white font-bold text-lg">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col">
              <h1 className="text-white text-base font-medium leading-normal truncate max-w-[140px]">
                {user?.email?.split("@")[0] || "Usuario"}
              </h1>
              <p className="text-[#9da6b9] text-xs font-normal leading-normal">
                Plan Gratuito
              </p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="flex justify-center mb-6">
            <div className="w-10 h-10 rounded-full bg-cal-primary flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? "bg-cal-border text-white"
                    : "text-[#9da6b9] hover:bg-cal-hover hover:text-white"
                }`
              }
              title={sidebarCollapsed ? item.label : ""}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              {!sidebarCollapsed && (
                <p className="text-sm font-medium leading-normal">
                  {item.label}
                </p>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Bottom Section - Fixed at bottom with same background */}
      <div className="p-4 border-t border-cal-border bg-cal-sidebar shrink-0">
        {/* Mini Calendar - Solo visible cuando está expandido */}
        {!sidebarCollapsed && <MiniCalendar />}

        {/* Category Management Button */}
        <button
          onClick={openCategoryModal}
          className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} px-3 py-2 text-[#9da6b9] hover:text-white hover:bg-cal-hover rounded-lg cursor-pointer w-full transition-colors mb-2`}
          title={sidebarCollapsed ? "Administrar Categorías" : ""}
        >
          <span className="material-symbols-outlined text-[20px]">
            category
          </span>
          {!sidebarCollapsed && (
            <p className="text-sm font-medium leading-normal">Categorías</p>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"} px-3 py-2 text-[#9da6b9] hover:text-white hover:bg-cal-hover rounded-lg cursor-pointer w-full transition-colors`}
          title={sidebarCollapsed ? "Cerrar sesión" : ""}
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          {!sidebarCollapsed && (
            <p className="text-sm font-medium leading-normal">Cerrar sesión</p>
          )}
        </button>
      </div>

      {/* Category Modal */}
      <CategoryModal />
    </aside>
  );
};

const MiniCalendar = () => {
  const today = new Date();
  const currentDay = today.getDate();

  // Get first day of month and total days
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
  const totalDays = lastDay.getDate();

  // Generate calendar days
  const days: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  return (
    <div className="px-2 py-4 mb-4 border-b border-cal-border">
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#9da6b9] mb-2">
        <span>D</span>
        <span>L</span>
        <span>M</span>
        <span>M</span>
        <span>J</span>
        <span>V</span>
        <span>S</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm text-white">
        {days.map((day, index) => (
          <span
            key={index}
            className={`${
              day === null
                ? "opacity-30"
                : day === currentDay
                  ? "bg-cal-primary rounded-full w-6 h-6 flex items-center justify-center mx-auto"
                  : ""
            }`}
          >
            {day || ""}
          </span>
        ))}
      </div>
    </div>
  );
};
