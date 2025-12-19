import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
//import { prisma } from "../../../lib/prisma.js";
import { prisma } from "../../lib/prisma.js";


const router = Router();

const loginSchema = z.object({
  usuario: z.string().min(1),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  try {
    const { usuario, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { usuario },
      include: { roles: { include: { rol: true } } }, // asumiendo relación user_rol -> rol
    });

    if (!user || !user.activo) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // si en el futuro usa auth institucional, aquí lo manejaremos
    if (user.usaAuthInstitucional) {
      return res.status(403).json({ message: "Usuario configurado para autenticación institucional" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash || "");
    if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

    const roleKeys = (user.roles || []).map((ur) => ur.rol.clave);

    const token = jwt.sign(
      { sub: user.id, usuario: user.usuario, roles: roleKeys },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        usuario: user.usuario,
        email: user.email,
        nombre: user.nombre,
        apellidoPaterno: user.apellidoPaterno,
        apellidoMaterno: user.apellidoMaterno,
        roles: roleKeys,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ message: "Datos inválidos", details: e.errors });
    }
    console.error(e);
    return res.status(500).json({ message: "Error interno" });
  }
});

export default router;
