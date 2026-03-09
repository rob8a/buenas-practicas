import { Router } from "express";
import { createBuenaPractica } from "./buenas-practicas.controller.js";

const router = Router();

router.post("/", createBuenaPractica);

export default router;