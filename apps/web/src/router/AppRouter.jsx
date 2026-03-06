import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import { isAuthenticated } from "../lib/auth";

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated() ? "/app" : "/login"}
            replace
          />
        }
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}