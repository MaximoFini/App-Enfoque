import { useEffect, useState } from "react";
import { TaskPriority, useTasksStore } from "../../store/tasksStore";

export const TaskModal = () => {
  const {
    editingTask,
    createModalCategoryId,
    closeModal,
    addTask,
    updateTask,
    deleteTask,
    categories,
  } = useTasksStore();

  const isEditing = editingTask !== null;
  const isOpen = editingTask !== null || createModalCategoryId !== null;

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState<string>("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [subtasks, setSubtasks] = useState<
    { id?: string; title: string; completed: boolean }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when modal opens
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setCategoryId(editingTask.category_id || "");
      setPriority(editingTask.priority);
      setDueDate(
        editingTask.due_date ? editingTask.due_date.split("T")[0] : "",
      );
      // Subtasks would need to be fetched separately if editing
      setSubtasks([]);
    } else if (createModalCategoryId) {
      setTitle("");
      setCategoryId(createModalCategoryId);
      setPriority("medium");
      setDueDate("");
      setSubtasks([]);
    }
  }, [editingTask, createModalCategoryId]);

  const handleSave = async () => {
    if (!title.trim() || !categoryId) return;

    setIsSubmitting(true);
    try {
      if (isEditing && editingTask) {
        await updateTask(editingTask.id, {
          title: title.trim(),
          category_id: categoryId,
          priority,
          due_date: dueDate || null,
        });
      } else {
        const newTask = await addTask({
          title: title.trim(),
          category_id: categoryId,
          priority,
          due_date: dueDate || null,
          completed: false,
          parent_task_id: null,
        });

        // Add subtasks if any
        if (newTask && subtasks.length > 0) {
          for (const subtask of subtasks) {
            await addTask({
              title: subtask.title,
              category_id: categoryId,
              priority: "medium",
              completed: false,
              due_date: null,
              parent_task_id: newTask.id,
            });
          }
        }
      }
      closeModal();
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTask) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que quieres eliminar esta tarea?",
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await deleteTask(editingTask.id);
      closeModal();
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      { title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle("");
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const getPriorityButtonClass = (p: TaskPriority) => {
    const base =
      "flex-1 py-2 text-sm font-medium rounded-lg transition-all border-2";
    const isActive = priority === p;

    switch (p) {
      case "high":
        return `${base} ${
          isActive
            ? "border-red-500 bg-red-500/20 text-red-400"
            : "border-[#2E2640] text-gray-400 hover:border-red-500/50"
        }`;
      case "medium":
        return `${base} ${
          isActive
            ? "border-yellow-500 bg-yellow-500/20 text-yellow-400"
            : "border-[#2E2640] text-gray-400 hover:border-yellow-500/50"
        }`;
      case "low":
        return `${base} ${
          isActive
            ? "border-green-500 bg-green-500/20 text-green-400"
            : "border-[#2E2640] text-gray-400 hover:border-green-500/50"
        }`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="relative bg-[#1D1829] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-[#2E2640]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2640]">
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? "Editar Tarea" : "Nueva Tarea"}
          </h2>
          <button
            onClick={closeModal}
            className="p-1 rounded-full hover:bg-[#2E2640] text-gray-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-5">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué necesitas hacer?"
              className="w-full px-4 py-3 bg-[#15101F] border border-[#2E2640] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent transition-all"
              autoFocus
            />
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-[#15101F] border border-[#2E2640] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent transition-all appearance-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Prioridad
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPriority("high")}
                className={getPriorityButtonClass("high")}
              >
                <span className="flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    priority_high
                  </span>
                  Alta
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPriority("medium")}
                className={getPriorityButtonClass("medium")}
              >
                <span className="flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    remove
                  </span>
                  Media
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPriority("low")}
                className={getPriorityButtonClass("low")}
              >
                <span className="flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_downward
                  </span>
                  Baja
                </span>
              </button>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Fecha límite
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 bg-[#15101F] border border-[#2E2640] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent transition-all"
            />
          </div>

          {/* Subtasks (only for new tasks) */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Subtareas
              </label>
              <div className="space-y-2">
                {subtasks.map((subtask, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-[#15101F] rounded-lg"
                  >
                    <span className="material-symbols-outlined text-[18px] text-gray-500">
                      subdirectory_arrow_right
                    </span>
                    <span className="flex-1 text-sm text-gray-300">
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => handleRemoveSubtask(index)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        close
                      </span>
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                    placeholder="Agregar subtarea..."
                    className="flex-1 px-3 py-2 bg-[#15101F] border border-[#2E2640] rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]"
                  />
                  <button
                    onClick={handleAddSubtask}
                    className="px-3 py-2 bg-[#2E2640] hover:bg-[#3E3650] rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      add
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2E2640] bg-[#15101F]">
          {isEditing ? (
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                delete
              </span>
              Eliminar
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={closeModal}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2E2640] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting || !title.trim()}
              className="px-6 py-2 bg-[#8B5CF6] hover:bg-[#7C4FE0] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">
                  check
                </span>
              )}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
