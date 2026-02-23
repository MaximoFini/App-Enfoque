import { useState } from "react";
import { Task, useTasksStore } from "../../store/tasksStore";

interface TaskItemProps {
  task: Task;
  level?: number;
}

export const TaskItem = ({ task, level = 0 }: TaskItemProps) => {
  const {
    toggleComplete,
    openEditModal,
    openCreateModal,
    getSubtasks,
  } = useTasksStore();

  const subtasks = getSubtasks(task.id);
  const hasSubtasks = subtasks.length > 0;
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleComplete(task.id);
  };

  const handleClick = () => {
    if (!task.completed) {
      openEditModal(task);
    }
  };

  const handleAddSubtask = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCreateModal(task.category_id, task.id);
  };


  if (task.completed) {
    return (
      <div className="flex items-center gap-3 py-1.5 opacity-60">
        <span
          className="material-symbols-outlined text-gray-400 text-[20px]"
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          check
        </span>
        <span className="text-sm line-through text-gray-400">{task.title}</span>
      </div>
    );
  }

  return (
    <div style={{ paddingLeft: level > 0 ? `${level * 24}px` : 0 }}>
      <div
        className="group flex items-start gap-3 py-2 px-2 hover:bg-[#2E2640] rounded-md cursor-pointer transition-colors"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Indent spacer for alignment */}
        <div className="w-4" />

        {/* Checkbox */}
        <button onClick={handleToggle} className="mt-0.5 shrink-0">
          <span
            className={`material-symbols-outlined text-[20px] cursor-pointer hover:text-white transition-colors ${level > 0 ? "text-[16px]" : "text-[20px]"
              } text-gray-400`}
          >
            radio_button_unchecked
          </span>
        </button>

        {/* Title and metadata */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200 leading-snug">{task.title}</p>
          {task.due_date && (
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(task.due_date).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}
            </p>
          )}
        </div>

        {/* Priority indicator */}
        {task.priority === "high" && (
          <span
            className="material-symbols-outlined text-[#8ab4f8] text-[20px]"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            star
          </span>
        )}

        {/* Add subtask button (visible on hover) */}
        {isHovered && !task.completed && (
          <button
            onClick={handleAddSubtask}
            className="text-gray-500 hover:text-white transition-colors"
            title="Agregar subtarea"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        )}
      </div>

      {/* Render subtasks recursively — always visible */}
      {hasSubtasks && (
        <div className="ml-2">
          {subtasks.map((subtask) => (
            <TaskItem key={subtask.id} task={subtask} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
