import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import PlaceholderPage from "../pages/PlaceholderPage";
import ProtectedRoute from "./ProtectedRoute";
import { isAuthenticated } from "../lib/auth";
import CreateBuenaPractica from "../pages/CreateBuenaPractica";
import FichaPage from "../pages/FichaPage";
import FichaLayout from "../pages/ficha/FichaLayout";
import DatosGeneralesPage from "../pages/ficha/DatosGeneralesPage";
import ContextoPropositoPage from "../pages/ficha/ContextoPropositoPage";
import FundamentacionPage from "../pages/ficha/FundamentacionPage";
import MetodologiaPage from "../pages/ficha/MetodologiaPage";
import FodaPage from "../pages/ficha/FodaPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated() ? "/app" : "/login"} replace />}
      />

      <Route path="/login" element={<Login />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/listado"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Listado de Buenas Prácticas" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/ficha/:id"
        element={
          <ProtectedRoute>
            <FichaLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DatosGeneralesPage />} />

        <Route
          path="datos-generales"
          element={<DatosGeneralesPage />}
        />

        <Route
          path="contexto"
          element={<ContextoPropositoPage />}
        />

        <Route
          path="fundamentacion"
          element={<FundamentacionPage />}
        />

        <Route
          path="metodologia"
          element={<MetodologiaPage />}
        />

        <Route
          path="foda"
          element={<FodaPage />}
        />

      </Route>

      <Route
        path="/app/autoevaluacion"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Autoevaluación" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/evaluacion-pares"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Evaluación de pares" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app/crear"
        element={
          <ProtectedRoute>
            <CreateBuenaPractica />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}