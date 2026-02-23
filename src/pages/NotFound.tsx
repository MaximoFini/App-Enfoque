import { useNavigate } from "react-router-dom";

export const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-cal-bg text-white px-4">
            <div className="flex flex-col items-center gap-6 max-w-md text-center">
                {/* Icon */}
                <div className="flex items-center justify-center w-24 h-24 rounded-full bg-[#2E2640] border border-[#8B5CF6]/30">
                    <span className="material-symbols-outlined text-5xl text-[#8B5CF6]">
                        search_off
                    </span>
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h1 className="text-6xl font-bold text-[#8B5CF6]">404</h1>
                    <h2 className="text-xl font-semibold text-white">
                        Página no encontrada
                    </h2>
                    <p className="text-gray-400 text-sm">
                        La ruta que buscás no existe o fue movida. Volvé al calendario para
                        continuar.
                    </p>
                </div>

                {/* CTA */}
                <button
                    onClick={() => navigate("/calendario")}
                    className="flex items-center gap-2 px-6 py-3 bg-[#8B5CF6] hover:bg-[#7C4FE0] text-white font-medium rounded-xl transition-colors"
                >
                    <span className="material-symbols-outlined text-xl">
                        calendar_today
                    </span>
                    Ir al Calendario
                </button>
            </div>
        </div>
    );
};
