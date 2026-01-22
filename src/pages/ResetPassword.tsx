import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Error al enviar el correo de recuperación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-row overflow-hidden dark">
      {/* Left Panel - Quote Section */}
      <div
        className="relative hidden lg:flex w-1/2 flex-col justify-end p-10 xl:p-16 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, rgba(25, 16, 34, 0.2) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuD_0wQ5DLFzd2a2bner45IuSdn0uDEZqifd5JhAGL6x8YW_clLTWw422AtbIVWBVFNEhC1oGyk3Y7RiEajRkGPGcNF3QabIn0M44Loekz1gXGyLwfoeZtTHbQb4IohvvT-Yz_LAJYWobfon_C2oTWTRApF_cXsLVrc4XxhSBN12HVwtjSnmrlZpd4UeXIIItJIhesjx46X-shYz4A4OSieVJSz04gESfa3AJwlrVmQJ2M93dVHoQZzluR6w55Tx6mrripvbW3SbmNP7")`,
        }}
      >
        <div className="relative z-10 max-w-lg">
          <div className="mb-6 h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center backdrop-blur-md border border-primary/30">
            <span className="material-symbols-outlined text-primary text-2xl">
              hourglass_top
            </span>
          </div>
          <blockquote className="mb-4">
            <p className="text-3xl font-bold leading-tight tracking-tight text-white lg:text-4xl">
              "El trabajo profundo es la capacidad de concentrarse sin
              distracciones en una tarea cognitivamente exigente."
            </p>
          </blockquote>
          <p className="text-lg font-medium text-slate-300">- Cal Newport</p>
        </div>
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay pointer-events-none"></div>
      </div>

      {/* Right Panel - Reset Password Form */}
      <div className="flex w-full flex-col justify-center items-center bg-background-dark lg:w-1/2 p-6 sm:p-12">
        <div className="w-full max-w-[440px] flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
                <span className="material-symbols-outlined text-xl">bolt</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Deep Work
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Recuperar contraseña
            </h1>
            <p className="text-slate-400 text-sm font-normal">
              Ingresa tu correo electrónico y te enviaremos un enlace para
              restablecer tu contraseña.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-sm">
              ¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu
              contraseña.
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <label className="flex flex-col gap-2">
                <span className="text-white text-sm font-medium">
                  Correo electrónico
                </span>
                <input
                  className="w-full rounded-lg border border-[#473b54] bg-[#211c27] px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="nombre@ejemplo.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>

              <button
                className="mt-2 flex w-full items-center justify-center rounded-lg bg-primary py-3.5 text-base font-semibold text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>
            </form>
          )}

          {/* Back to Login Link */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <span className="material-symbols-outlined text-base">
                arrow_back
              </span>
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
