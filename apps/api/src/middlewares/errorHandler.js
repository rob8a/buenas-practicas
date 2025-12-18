import { HttpError } from "../utils/httpError.js";

export function errorHandler(err, _req, res, _next) {
  const status = err instanceof HttpError ? err.status : 500;

  const payload = {
    ok: false,
    message: err.message || "Internal Server Error",
  };

  if (err instanceof HttpError && err.details) payload.details = err.details;

  // En desarrollo puedes imprimir el error completo
  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(status).json(payload);
}