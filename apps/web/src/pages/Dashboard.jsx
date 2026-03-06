import { useNavigate } from "react-router-dom";
import { clearSession, getUser } from "../lib/auth";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();

  function handleLogout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h1>Panel principal</h1>
        <p>Sesión iniciada correctamente.</p>

        <div className="dashboard-user">
          <strong>Usuario:</strong> {user?.usuario || "N/D"}
        </div>

        <div className="dashboard-user">
          <strong>Rol:</strong> {user?.roles?.join(", ") || "N/D"}
        </div>

        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </div>
  );
}