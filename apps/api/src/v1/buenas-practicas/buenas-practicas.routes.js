import { Router } from "express";
import {
  createBuenaPractica,
  getBuenaPracticaById,
} from "./buenas-practicas.controller.js";

const router = Router();

router.post("/", createBuenaPractica);
router.get("/:id", getBuenaPracticaById);

export default router;