import { HttpError } from "../utils/httpError.js";

export function errorHandler(err, _req, res, _next) {
  let status = 500;
  let message = "Internal Server Error";
  let details = null;

  if (err instanceof HttpError) {
    status = err.status;
    message = err.message || message;
    details = err.details || null;
  } else {
    const rawMessage = String(err?.message || "");
    const causeMessage = String(err?.cause?.message || "");

    const isDatabaseConnectionError =
      rawMessage.includes("pool timeout") ||
      rawMessage.includes("ECONNREFUSED") ||
      causeMessage.includes("ECONNREFUSED") ||
      causeMessage.includes("pool timeout");

    if (isDatabaseConnectionError) {
      status = 503;
      message = "No fue posible conectarse a la base de datos.";
      details =
        process.env.NODE_ENV !== "production"
          ? {
              originalMessage: rawMessage,
              cause: causeMessage || null,
            }
          : null;
    } else {
      message = err.message || message;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  const payload = {
    ok: false,
    message,
  };

  if (details) {
    payload.details = details;
  }

  res.status(status).json(payload);
}