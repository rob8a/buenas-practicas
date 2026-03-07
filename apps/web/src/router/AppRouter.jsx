import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import PlaceholderPage from "../pages/PlaceholderPage";
import ProtectedRoute from "./ProtectedRoute";
import { isAuthenticated } from "../lib/auth";

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
        path="/app/ficha"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Ficha" />
          </ProtectedRoute>
        }
      />

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
            <PlaceholderPage title="Crear buena práctica" />
            </ProtectedRoute>
        }
    />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}