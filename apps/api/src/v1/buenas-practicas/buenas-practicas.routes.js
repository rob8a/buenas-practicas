import { Router } from "express";
import {
  createBuenaPractica,
  getBuenaPracticaById,
  updateDatosGenerales,
  updateContextoProposito,
} from "./buenas-practicas.controller.js";

const router = Router();

router.post("/", createBuenaPractica);
router.get("/:id", getBuenaPracticaById);
router.patch("/:id/datos-generales", updateDatosGenerales);
router.patch("/:id/contexto-proposito", updateContextoProposito);

export default router;