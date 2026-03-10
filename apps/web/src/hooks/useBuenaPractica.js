import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export function useBuenaPractica(id) {
  const [buenaPractica, setBuenaPractica] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBuenaPractica = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(`/api/v1/buenas-practicas/${id}`);
      setBuenaPractica(response.data || null);
    } catch (err) {
      setError(err.message || "No se pudo cargar la buena práctica.");
      setBuenaPractica(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBuenaPractica();
  }, [loadBuenaPractica]);

  return {
    buenaPractica,
    loading,
    error,
    reload: loadBuenaPractica,
  };
}