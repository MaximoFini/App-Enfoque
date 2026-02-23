import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ResetPassword } from "./pages/ResetPassword";
import { Calendar } from "./pages/Calendar";
import { Pomodoro } from "./pages/Pomodoro";
import { Enfoque } from "./pages/Enfoque";
import { Tareas } from "./pages/Tareas";
import { Finanzas } from "./pages/Finanzas";
import { Analiticas } from "./pages/Analiticas";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import { NotFound } from "./pages/NotFound";

function App() {
  return (
    <div className="min-h-screen dark">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes with MainLayout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/calendario" replace />} />
          <Route path="/calendario" element={<Calendar />} />
          <Route path="/pomodoro" element={<Pomodoro />} />
          <Route path="/enfoque" element={<Enfoque />} />
          <Route path="/tareas" element={<Tareas />} />
          <Route path="/finanzas" element={<Finanzas />} />
          <Route path="/analiticas" element={<Analiticas />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
