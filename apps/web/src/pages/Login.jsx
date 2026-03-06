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
    <div className="login-page">
      <div className="login-card">
        <h1 className="text-2xl font-bold text-slate-900">Sistema de Buenas Prácticas</h1>
        <h1>Sistema de Buenas Prácticas</h1>
        <p>Inicia sesión para continuar</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <label htmlFor="usuario">Usuario</label>
            <input
              id="usuario"
              name="usuario"
              type="text"
              value={form.usuario}
              onChange={handleChange}
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          {error ? <div className="login-error">{error}</div> : null}

          <button type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}