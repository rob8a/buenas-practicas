import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export function useValidacionEnvio(id) {
  const [validacion, setValidacion] = useState(null);
  const [loadingValidacion, setLoadingValidacion] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState("");

  const loadValidacion = useCallback(async () => {
    if (!id) return null;

    try {
      setLoadingValidacion(true);
      setErrorValidacion("");

      const response = await apiFetch(
        `/api/v1/buenas-practicas/${id}/validacion-envio`
      );

      const data = response.data || null;
      setValidacion(data);
      return data;
    } catch (err) {
      setErrorValidacion(
        err.message || "No se pudo cargar la validación de la ficha."
      );
      setValidacion(null);
      return null;
    } finally {
      setLoadingValidacion(false);
    }
  }, [id]);

  useEffect(() => {
    loadValidacion();
  }, [loadValidacion]);

  return {
    validacion,
    loadingValidacion,
    errorValidacion,
    reloadValidacion: loadValidacion,
  };
}