import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useUIStore } from "../../store/uiStore";
import { FloatingTimer } from "../timer/FloatingTimer";
import { useFocusCompletionStore } from "../../store/focusCompletionStore";
import { BlockModal } from "../calendar/BlockModal";

export const MainLayout = () => {
  const { sidebarCollapsed } = useUIStore();
  const { pendingBlock, clearCompletion } = useFocusCompletionStore();

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-cal-bg group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow">
        <Sidebar />
        {/* Spacer to compensate for fixed sidebar */}
        <div
          className={`hidden lg:block shrink-0 transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-64"
            }`}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Floating Timer Widget */}
      <FloatingTimer />

      {/* Modal automático al terminar sesión de enfoque */}
      <BlockModal
        isOpen={!!pendingBlock}
        onClose={clearCompletion}
        prefillDate={pendingBlock?.date}
        prefillStartTime={pendingBlock?.startTime}
        prefillEndTime={pendingBlock?.endTime}
        prefillType={pendingBlock?.type}
        fromSession={true}
      />
    </div>
  );
};
