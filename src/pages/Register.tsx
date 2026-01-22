import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  const { signUp } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      setEmailVerificationSent(true);
    } catch (err: any) {
      setError(err.message || "Error al crear la cuenta");
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

      {/* Right Panel - Register Form */}
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
              {emailVerificationSent
                ? "Verifica tu correo"
                : "Crear una cuenta"}
            </h1>
            <p className="text-slate-400 text-sm font-normal">
              {emailVerificationSent
                ? `Hemos enviado un enlace de verificación a ${email}. Por favor, verifica tu correo para activar tu cuenta.`
                : "Regístrate para comenzar tu viaje hacia la productividad profunda."}
            </p>
          </div>

          {/* Verification Sent Message */}
          {emailVerificationSent && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg flex items-start gap-3">
              <span className="material-symbols-outlined text-xl flex-shrink-0 mt-0.5">
                check_circle
              </span>
              <div className="text-sm">
                <p className="font-semibold mb-1">
                  ¡Cuenta creada exitosamente!
                </p>
                <p>
                  Revisa tu bandeja de entrada (y la carpeta de spam) para
                  confirmar tu correo electrónico. Una vez verificado, podrás
                  acceder a tu cuenta.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !emailVerificationSent && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Form - Only show if not verified */}
          {!emailVerificationSent && (
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

              <label className="flex flex-col gap-2">
                <span className="text-white text-sm font-medium">
                  Contraseña
                </span>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-[#473b54] bg-[#211c27] px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors pr-12"
                    placeholder="Mínimo 6 caracteres"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-white text-sm font-medium">
                  Confirmar contraseña
                </span>
                <input
                  className="w-full rounded-lg border border-[#473b54] bg-[#211c27] px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="Repite tu contraseña"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>

              <button
                className="mt-2 flex w-full items-center justify-center rounded-lg bg-primary py-3.5 text-base font-semibold text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? "Creando cuenta..." : "Registrarse"}
              </button>
            </form>
          )}

          {/* Login Link */}
          <div className="text-center">
            {emailVerificationSent ? (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <span className="material-symbols-outlined text-base">
                  arrow_back
                </span>
                Volver al inicio de sesión
              </Link>
            ) : (
              <p className="text-sm text-slate-400">
                ¿Ya tienes una cuenta?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Iniciar sesión
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
