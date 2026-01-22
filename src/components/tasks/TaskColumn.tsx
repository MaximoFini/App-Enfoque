import { useState } from "react";
import { Category, useTasksStore } from "../../store/tasksStore";
import { TaskItem } from "./TaskItem";

interface TaskColumnProps {
  category: Category;
}

export const TaskColumn = ({ category }: TaskColumnProps) => {
  const { getTasksByCategory, openCreateModal } = useTasksStore();
  const { pending, completed } = getTasksByCategory(category.id);
  const [showCompleted, setShowCompleted] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#1D1829] rounded-2xl shadow-sm border dark:border-none min-w-[280px] max-w-[400px]">
      {/* Column Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <h3 className="font-medium text-base text-gray-900 dark:text-[#e8eaed]">
            {category.name}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({pending.length})
          </span>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-[#2E2640]">
          <span className="material-symbols-outlined text-[18px]">
            more_vert
          </span>
        </button>
      </div>

      {/* Add Task Button */}
      <div className="px-2 pb-2">
        <button
          onClick={() => openCreateModal(category.id)}
          className="flex items-center gap-3 w-full px-2 py-2 text-gray-400 hover:text-white transition-colors group text-left"
        >
          <span className="material-symbols-outlined text-[20px] text-[#aecbfa]">
            add_task
          </span>
          <span className="text-sm font-medium text-[#aecbfa]">
            Agregar una tarea
          </span>
        </button>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar">
        {pending.length === 0 && completed.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
              task_alt
            </span>
            <p className="text-sm">No hay tareas</p>
          </div>
        )}

        {/* Pending Tasks */}
        {pending.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}

        {/* Completed Tasks Section */}
        {completed.length > 0 && (
          <div className="mt-4 pt-2 border-t border-[#2E2640]">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-4 px-2 py-2 cursor-pointer select-none text-gray-400 hover:bg-[#2E2640] rounded-md transition-colors w-full"
            >
              <span
                className={`material-symbols-outlined text-[20px] transition-transform ${
                  showCompleted ? "rotate-90" : ""
                }`}
              >
                arrow_right
              </span>
              <span className="text-sm font-medium">
                Completadas ({completed.length})
              </span>
            </button>

            {showCompleted && (
              <div className="px-2 pt-1 pb-4 space-y-1">
                {completed.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
