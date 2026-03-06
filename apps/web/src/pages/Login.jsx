import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { setSession } from "../lib/auth";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    usuario: "admin",
    password: "Admin123!",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setSession({
        token: data.token,
        user: data.user,
      });

      navigate("/app", { replace: true });
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Lado izquierdo */}
        <div className="hidden lg:flex flex-col justify-between bg-slate-900 px-12 py-10 text-white">
          <div>
            <div className="text-sm font-medium tracking-wide text-slate-300">
              Universidad de Colima
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight">
              Sistema de Buenas
              <br />
              Prácticas Institucionales
            </h1>
            <p className="mt-6 max-w-md text-sm leading-6 text-slate-300">
              Plataforma institucional para la gestión, documentación,
              autoevaluación y evaluación de buenas prácticas.
            </p>
          </div>

          <div className="text-sm text-slate-400">
            Acceso institucional seguro
          </div>
        </div>

        {/* Lado derecho */}
        <div className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8">
              <div className="text-sm font-medium text-slate-500">
                Bienvenido
              </div>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Iniciar sesión
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Ingresa con tus credenciales para continuar.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="usuario"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Usuario
                </label>
                <input
                  id="usuario"
                  name="usuario"
                  type="text"
                  value={form.usuario}
                  onChange={handleChange}
                  autoComplete="username"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Ingresando..." : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}