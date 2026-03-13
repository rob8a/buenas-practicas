import { Router } from "express";
import {
  createBuenaPractica,
  getBuenaPracticaById,
  updateDatosGenerales,
  updateContextoProposito,
  updateFundamentacion,
  updateMetodologia,
  updateFoda,
} from "./buenas-practicas.controller.js";

const router = Router();

router.post("/", createBuenaPractica);
router.get("/:id", getBuenaPracticaById);
router.patch("/:id/datos-generales", updateDatosGenerales);
router.patch("/:id/contexto-proposito", updateContextoProposito);
router.patch("/:id/fundamentacion", updateFundamentacion);
router.patch("/:id/metodologia", updateMetodologia);
router.patch("/:id/foda", updateFoda);

export default router;