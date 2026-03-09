import { Router } from "express";
import metaRoutes from "./meta.routes.js";
import buenasPracticasRoutes from "../buenas-practicas/buenas-practicas.routes.js";

const router = Router();

router.use("/", metaRoutes);
router.use("/buenas-practicas", buenasPracticasRoutes);

export default router;