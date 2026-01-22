import { useEffect, useState } from "react";
import {
  useCategoryStore,
  CATEGORY_COLORS,
  Category,
} from "../../store/categoryStore";
import { useTasksStore } from "../../store/tasksStore";

export const CategoryModal = () => {
  const {
    categories,
    isModalOpen,
    isLoading,
    closeModal,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryStore();

  // Get the fetchCategories from tasks store to sync
  const { fetchCategories: syncTasksCategories } = useTasksStore();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch categories when modal opens
  useEffect(() => {
    if (isModalOpen) {
      fetchCategories();
    }
  }, [isModalOpen, fetchCategories]);

  // Reset form when switching modes
  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setSelectedColor(editingCategory.color);
      setIsCreating(false);
    } else if (isCreating) {
      setName("");
      setSelectedColor(CATEGORY_COLORS[0].value);
    }
  }, [editingCategory, isCreating]);

  const handleClose = () => {
    setEditingCategory(null);
    setIsCreating(false);
    setName("");
    setSelectedColor(CATEGORY_COLORS[0].value);
    setDeleteConfirmId(null);
    closeModal();
  };

  const handleStartCreate = () => {
    setEditingCategory(null);
    setIsCreating(true);
    setName("");
    setSelectedColor(CATEGORY_COLORS[0].value);
  };

  const handleStartEdit = (category: Category) => {
    setIsCreating(false);
    setEditingCategory(category);
    setName(category.name);
    setSelectedColor(category.color);
  };

  const handleCancelForm = () => {
    setEditingCategory(null);
    setIsCreating(false);
    setName("");
    setSelectedColor(CATEGORY_COLORS[0].value);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          color: selectedColor,
        });
        setEditingCategory(null);
      } else if (isCreating) {
        await addCategory(name.trim(), selectedColor);
        setIsCreating(false);
      }
      setName("");
      setSelectedColor(CATEGORY_COLORS[0].value);
      // Sync with tasks store
      await syncTasksCategories();
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteCategory(id);
      setDeleteConfirmId(null);
      if (editingCategory?.id === id) {
        setEditingCategory(null);
      }
      // Sync with tasks store
      await syncTasksCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isModalOpen) return null;

  const isFormActive = isCreating || editingCategory !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1D1829] rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-[#2E2640] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2640] shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-[#8B5CF6]">
              category
            </span>
            <h2 className="text-lg font-semibold text-white">
              Administrar Categorías
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-[#2E2640] text-gray-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Add Button */}
          {!isFormActive && (
            <div className="px-6 py-4 border-b border-[#2E2640]">
              <button
                onClick={handleStartCreate}
                className="flex items-center gap-2 w-full px-4 py-3 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-xl text-[#8B5CF6] hover:bg-[#8B5CF6]/20 transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[20px]">
                  add
                </span>
                Nueva Categoría
              </button>
            </div>
          )}

          {/* Create/Edit Form */}
          {isFormActive && (
            <div className="px-6 py-4 border-b border-[#2E2640] bg-[#15101F]/50">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[20px] text-[#8B5CF6]">
                    {editingCategory ? "edit" : "add_circle"}
                  </span>
                  <h3 className="text-sm font-medium text-white">
                    {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                  </h3>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Trabajo, Personal, Estudio..."
                    className="w-full px-4 py-3 bg-[#15101F] border border-[#2E2640] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent transition-all"
                    autoFocus
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setSelectedColor(color.value)}
                        className={`w-full aspect-square rounded-lg transition-all flex items-center justify-center ${
                          selectedColor === color.value
                            ? "ring-2 ring-white ring-offset-2 ring-offset-[#1D1829] scale-110"
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {selectedColor === color.value && (
                          <span className="material-symbols-outlined text-white text-[16px] drop-shadow-lg">
                            check
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-3 p-3 bg-[#15101F] rounded-xl border border-[#2E2640]">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="text-white text-sm">
                    {name.trim() || "Vista previa"}
                  </span>
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCancelForm}
                    className="flex-1 px-4 py-2.5 bg-[#2E2640] text-gray-300 rounded-xl hover:bg-[#3E3650] transition-colors font-medium"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!name.trim() || isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-[#8B5CF6] text-white rounded-xl hover:bg-[#7C4FE0] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span className="material-symbols-outlined text-[18px] animate-spin">
                        progress_activity
                      </span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">
                          {editingCategory ? "save" : "add"}
                        </span>
                        {editingCategory ? "Guardar" : "Crear"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="px-6 py-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                list
              </span>
              Tus Categorías ({categories.length})
            </h3>

            {isLoading && categories.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <span className="material-symbols-outlined text-3xl text-[#8B5CF6] animate-spin">
                  progress_activity
                </span>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-gray-600 mb-2">
                  folder_off
                </span>
                <p className="text-gray-500 text-sm">
                  No tienes categorías aún.
                  <br />
                  Crea tu primera categoría arriba.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`group flex items-center gap-3 p-3 rounded-xl transition-all border ${
                      editingCategory?.id === category.id
                        ? "bg-[#8B5CF6]/10 border-[#8B5CF6]/30"
                        : "bg-[#15101F] border-[#2E2640] hover:border-[#3E3650]"
                    }`}
                  >
                    {/* Color indicator */}
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: category.color }}
                    />

                    {/* Name */}
                    <span className="flex-1 text-white text-sm truncate">
                      {category.name}
                    </span>

                    {/* Actions */}
                    {deleteConfirmId === category.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-400 mr-2">
                          ¿Eliminar?
                        </span>
                        <button
                          onClick={() => handleDelete(category.id)}
                          disabled={isSubmitting}
                          className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          title="Confirmar"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            check
                          </span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-1.5 rounded-lg bg-[#2E2640] text-gray-400 hover:text-white transition-colors"
                          title="Cancelar"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            close
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(category)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#2E2640] transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(category.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2E2640] bg-[#1D1829] shrink-0">
          <p className="text-xs text-gray-500 text-center">
            Las categorías se usan en el calendario y en las tareas
          </p>
        </div>
      </div>
    </div>
  );
};
