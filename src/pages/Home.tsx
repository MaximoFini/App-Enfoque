import { Link } from "react-router-dom";
import { CheckCircle2, Calendar, Target } from "lucide-react";

export const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <nav className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary-900">Enfoque</h1>
          <Link
            to="/login"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Organiza tu vida con{" "}
            <span className="text-primary-600">Enfoque</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            La aplicación de productividad que te ayuda a mantener el foco en lo
            que realmente importa
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <CheckCircle2 className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Gestión de Tareas</h3>
            <p className="text-gray-600">
              Crea, organiza y completa tus tareas de manera eficiente
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <Calendar className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Planificación</h3>
            <p className="text-gray-600">
              Planifica tu día y mantén el control de tus plazos
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <Target className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Objetivos</h3>
            <p className="text-gray-600">
              Define y alcanza tus metas con seguimiento continuo
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
