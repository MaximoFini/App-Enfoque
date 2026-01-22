import { useEffect } from "react";
import { useTasksStore } from "../store/tasksStore";
import { TaskColumn } from "../components/tasks/TaskColumn";
import { TaskModal } from "../components/tasks/TaskModal";

export const Tareas = () => {
  const {
    categories,
    categoryVisibility,
    toggleCategoryVisibility,
    fetchCategories,
    fetchTasks,
    isLoading,
  } = useTasksStore();

  useEffect(() => {
    fetchCategories();
    fetchTasks();
  }, [fetchCategories, fetchTasks]);

  // Get visible categories
  const visibleCategories = categories.filter(
    (cat) => categoryVisibility[cat.id] !== false,
  );

  return (
    <div className="flex flex-col h-screen bg-[#0F0A15] overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#2E2640]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[28px] text-[#8B5CF6]">
            task_alt
          </span>
          <h1 className="text-xl font-semibold text-white">Tareas</h1>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 mr-2">Filtrar:</span>
          {categories.map((category) => {
            const isVisible = categoryVisibility[category.id] !== false;
            return (
              <button
                key={category.id}
                onClick={() => toggleCategoryVisibility(category.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isVisible
                    ? "bg-[#2E2640] text-white"
                    : "bg-transparent text-gray-500 border border-[#2E2640]"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full transition-opacity ${
                    isVisible ? "opacity-100" : "opacity-40"
                  }`}
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-4xl text-[#8B5CF6] animate-spin">
                progress_activity
              </span>
              <p className="text-gray-400">Cargando tareas...</p>
            </div>
          </div>
        ) : visibleCategories.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="material-symbols-outlined text-6xl text-gray-600">
                filter_list_off
              </span>
              <p className="text-gray-400">
                No hay categorías visibles.
                <br />
                Activa al menos una categoría en los filtros.
              </p>
            </div>
          </div>
        ) : (
          <div
            className={`flex gap-4 h-full ${
              visibleCategories.length > 3 ? "overflow-x-auto" : ""
            } pb-2 custom-scrollbar`}
          >
            {visibleCategories.map((category) => (
              <TaskColumn key={category.id} category={category} />
            ))}
          </div>
        )}
      </main>

      {/* Task Modal */}
      <TaskModal />
    </div>
  );
};
