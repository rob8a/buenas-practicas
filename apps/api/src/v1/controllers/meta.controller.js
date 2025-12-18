export function health(_req, res) {
  res.json({ ok: true });
}

export function version(_req, res) {
  res.json({
    ok: true,
    name: "buenas-practicas-api",
    version: "v1",
  });
}