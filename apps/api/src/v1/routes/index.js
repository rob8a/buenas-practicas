import { Router } from "express";
import metaRoutes from "./meta.routes.js";
import buenasPracticasRoutes from "../buenas-practicas/buenas-practicas.routes.js";
import unidadesOrganizacionalesRoutes from "../unidades-organizacionales/unidades-organizacionales.routes.js";

const router = Router();

router.use("/", metaRoutes);
router.use("/buenas-practicas", buenasPracticasRoutes);
router.use("/unidades-organizacionales", unidadesOrganizacionalesRoutes);

export default router;