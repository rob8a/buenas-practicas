import { prisma } from "../src/lib/prisma.js";

async function main() {
  console.log("🌱 Iniciando seed completo...");

  // ===== 1) ROLES =====
  const roles = [
    { clave: "ADMIN", nombre: "Administrador" },
    { clave: "CAPTURISTA", nombre: "Capturista" },
    { clave: "EVALUADOR_PAR", nombre: "Evaluador par" },
    { clave: "VALIDADOR_INST", nombre: "Validador institucional" },
  ];

  for (const r of roles) {
    await prisma.rol.upsert({
      where: { clave: r.clave },
      update: { nombre: r.nombre, activo: true },
      create: { ...r, activo: true },
    });
  }

  // ===== 2) EJES INSTITUCIONALES =====
  const ejes = [
    "Educacion humanista y pertinente",
    "Investigacion para la formacion y el desarrollo",
    "Extension universitaria para el bienestar comun",
    "Gobernanza institucional",
    "Igualdad de genero",
    "Sostenibilidad y medio ambiente",
    "Universidad digital",
    "Internacionalizacion solidaria",
    "Cultura de paz",
  ];

  for (const nombre of ejes) {
    await prisma.eje_institucional.upsert({
      where: { nombre },
      update: { activo: true },
      create: { nombre, activo: true },
    });
  }

  // ===== 3) CRITERIOS ORIENTADORES (para filtro/listado) =====
  const criteriosOrientadores = [
    "Compromiso con la responsabilidad social",
    "Equidad social y de genero",
    "Inclusion",
    "Excelencia",
    "Vanguardia",
    "Innovacion social",
    "Interculturalidad",
  ];

  for (const nombre of criteriosOrientadores) {
    await prisma.criterio_orientador.upsert({
      where: { nombre },
      update: { activo: true },
      create: { nombre, activo: true },
    });
  }

  // ===== 4) CRITERIOS AUTOEVALUACION (9 con descripcion + orden) =====
  const criteriosAuto = [
    { orden: 1, nombre: "Pertinencia y relevancia", descripcion: "Responde a necesidades reales y esta alineada a la planeacion institucional" },
    { orden: 2, nombre: "Resultados verificables", descripcion: "Incluye indicadores claros y evidencias de logro" },
    { orden: 3, nombre: "Innovacion y mejora", descripcion: "Integra elementos novedosos o mejoras sustantivas a procesos existentes" },
    { orden: 4, nombre: "Sistematizacion", descripcion: "Esta documentada y organizada de manera estructurada" },
    { orden: 5, nombre: "Eficiencia y economia", descripcion: "Hace un uso optimo de recursos humanos, materiales y financieros" },
    { orden: 6, nombre: "Replicabilidad", descripcion: "Puede adoptarse o adaptarse en otros contextos de la institucion" },
    { orden: 7, nombre: "Participacion y colaboracion", descripcion: "Involucra actores clave internos y/o externos en su implementacion" },
    { orden: 8, nombre: "Evaluacion y mejora continua", descripcion: "Incluye mecanismos de seguimiento, evaluacion y retroalimentacion" },
    { orden: 9, nombre: "Contribucion al aprendizaje institucional", descripcion: "Aporta experiencias y aprendizajes transferibles a otras areas" },
  ];

  for (const c of criteriosAuto) {
    await prisma.criterio_autoevaluacion.upsert({
      where: { nombre: c.nombre },
      update: { descripcion: c.descripcion, orden: c.orden, activo: true },
      create: { nombre: c.nombre, descripcion: c.descripcion, orden: c.orden, activo: true },
    });
  }

  // ===== 5) CRITERIOS POR PARES (10) =====
  const criteriosPar = [
    "Responsabilidad social",
    "Equidad social y de genero",
    "Inclusion",
    "Excelencia",
    "Vanguardia",
    "Innovacion social",
    "Interculturalidad",
    "Cultura de paz",
    "Medio ambiente y sustentabilidad",
    "Internacionalizacion solidaria",
  ];

  for (const nombre of criteriosPar) {
    await prisma.criterio_par.upsert({
      where: { nombre },
      update: { activo: true },
      create: { nombre, activo: true },
    });
  }

  // ===== 6) DELEGACIONES =====
  const delegaciones = ["Delegacion Colima", "Delegacion Manzanillo"];
  const delegacionIdByNombre = new Map();

  for (const nombre of delegaciones) {
    const d = await prisma.delegacion.upsert({
      where: { nombre },
      update: { activo: true },
      create: { nombre, activo: true },
    });
    delegacionIdByNombre.set(nombre, d.id);
  }

  // ===== 7) PLANTELES (ejemplos) =====
  const planteles = [
    { nombre: "Facultad de Telematica", delegacionNombre: "Delegacion Colima" },
    { nombre: "Facultad de Medicina", delegacionNombre: "Delegacion Colima" },
    { nombre: "Facultad de Turismo", delegacionNombre: "Delegacion Manzanillo" },
  ];

  for (const p of planteles) {
    const delegacionId = delegacionIdByNombre.get(p.delegacionNombre);
    if (!delegacionId) throw new Error(`No existe delegacion: ${p.delegacionNombre}`);

    await prisma.plantel.upsert({
      where: { nombre: p.nombre },
      update: { delegacionId, activo: true },
      create: { nombre: p.nombre, delegacionId, activo: true },
    });
  }

  // ===== 8) DEPENDENCIAS (padres e hijos) =====
  // Nota: idInstitucional es VarChar(10). Por eso usamos claves de 10 caracteres.
  const dependenciasPadre = [
    { idInstitucional: "CGD0000001", nombre: "Coordinacion General de Docencia" },
    { idInstitucional: "DGE0000001", nombre: "Direccion General de Educacion Superior" }, // antes DGES...
  ];

  const depPadreIdByClave = new Map();

  for (const dep of dependenciasPadre) {
    const saved = await prisma.dependencia.upsert({
      where: { idInstitucional: dep.idInstitucional },
      update: { nombre: dep.nombre, padreId: null, activo: true },
      create: { idInstitucional: dep.idInstitucional, nombre: dep.nombre, padreId: null, activo: true },
    });
    depPadreIdByClave.set(dep.idInstitucional, saved.id);
  }

  const dependenciasHijo = [
    { idInstitucional: "CGD0000002", nombre: "Area de Sistemas", padreClave: "CGD0000001" },
    { idInstitucional: "CGD0000003", nombre: "Area Pedagogica", padreClave: "CGD0000001" },
    { idInstitucional: "DGE0000002", nombre: "Area de Planeacion", padreClave: "DGE0000001" }, // antes DGES...
  ];

  for (const dep of dependenciasHijo) {
    const padreId = depPadreIdByClave.get(dep.padreClave);
    if (!padreId) throw new Error(`No existe dependencia padre con clave: ${dep.padreClave}`);

    await prisma.dependencia.upsert({
      where: { idInstitucional: dep.idInstitucional },
      update: { nombre: dep.nombre, padreId, activo: true },
      create: { idInstitucional: dep.idInstitucional, nombre: dep.nombre, padreId, activo: true },
    });
  }

  // ===== 9) USUARIO ADMIN DEMO (sin bcrypt aun; lo haremos en JWT) =====
  const adminUser = await prisma.user.upsert({
    where: { usuario: "admin" },
    update: {
      email: "admin@localhost",
      nombre: "Admin",
      apellidoPaterno: "Sistema",
      apellidoMaterno: null,
      activo: true,
      usaAuthInstitucional: false,
      passwordHash: "CHANGE_ME",
    },
    create: {
      numeroTrabajador: null,
      usuario: "admin",
      email: "admin@localhost",
      nombre: "Admin",
      apellidoPaterno: "Sistema",
      apellidoMaterno: null,
      passwordHash: "CHANGE_ME",
      usaAuthInstitucional: false,
      activo: true,
    },
  });

  const adminRol = await prisma.rol.findUnique({ where: { clave: "ADMIN" } });
  if (!adminRol) throw new Error("No existe rol ADMIN");

  await prisma.user_rol.upsert({
    where: { userId_rolId: { userId: adminUser.id, rolId: adminRol.id } },
    update: {},
    create: { userId: adminUser.id, rolId: adminRol.id },
  });

  console.log("✅ Seed completo finalizado");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed completo:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
