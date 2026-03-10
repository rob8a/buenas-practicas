import { Router } from "express";
import {
  createBuenaPractica,
  getBuenaPracticaById,
  updateDatosGenerales,
} from "./buenas-practicas.controller.js";

const router = Router();

router.post("/", createBuenaPractica);
router.get("/:id", getBuenaPracticaById);
router.patch("/:id/datos-generales", updateDatosGenerales);

export default router;