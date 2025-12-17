# Buenas Prácticas – Gestión Institucional

Sistema institucional para la **gestión, seguimiento y evaluación** de buenas prácticas.

Este proyecto busca apoyar procesos organizacionales mediante un flujo estructurado de **captura, revisión y validación** de buenas prácticas, promoviendo la **mejora continua** y la **trazabilidad** de la información.

> Basado en: *“Guía para la Identificación, Documentación y Evaluación de Buenas Prácticas Institucionales – Universidad de Colima”*.

---

## 🎯 Objetivo

Proporcionar una plataforma web que permita:

- Registrar buenas prácticas de manera estandarizada
- Gestionar su revisión y validación por distintos actores
- Dar seguimiento a su estado dentro de un flujo institucional
- Facilitar la consulta y análisis de prácticas implementadas

---

## 🧩 Alcance funcional (planeado)

- Registro y edición de buenas prácticas (wizard por secciones)
- Flujo institucional: Documentación → Autoevaluación → Evaluación externa → Validación institucional
- Observaciones obligatorias cuando una práctica es devuelta
- Historial y trazabilidad de cambios de estado
- Banco de prácticas consolidadas (consulta)
- Gestión de catálogos institucionales (ejes, criterios, unidades)
- Autenticación y roles (JWT) *(planeado)*

---

## 🛠 Arquitectura y tecnologías (objetivo del proyecto)

**Frontend**
- React (Vite)
- React Router
- Validación de formularios

**Backend**
- Node.js
- Express
- API REST
- Autenticación con JWT *(planeado)*

**Base de datos**
- MySQL

**Infraestructura**
- Git + GitHub
- Docker *(planeado para etapa final)*

---

## 🧱 Estructura del proyecto (monorepo)

buenas-practicas/
apps/
web/ # Frontend (React)
api/ # Backend (Express)
packages/
shared/ # Código compartido (tipos/utilidades)

---

## 🚀 Cómo ejecutar (próximamente)

Este repositorio está en construcción. Se agregarán instrucciones de instalación y ejecución conforme se habiliten los módulos.

---

## 📌 Roadmap (alto nivel)

- [ ] Base del monorepo (web + api)
- [ ] Catálogos (CRUD)
- [ ] Prácticas (CRUD + estados)
- [ ] Wizard de ficha (2.1–2.9)
- [ ] Autoevaluación (3.1)
- [ ] Evaluación externa (4.1–4.2)
- [ ] Validación institucional + devoluciones
- [ ] Banco público (6.1–6.2)
- [ ] JWT + roles
- [ ] Docker para deploy
