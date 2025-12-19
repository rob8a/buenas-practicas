-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroTrabajador` VARCHAR(20) NULL,
    `usuario` VARCHAR(50) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `nombre` VARCHAR(80) NOT NULL,
    `apellidoPaterno` VARCHAR(80) NOT NULL,
    `apellidoMaterno` VARCHAR(80) NULL,
    `passwordHash` VARCHAR(255) NULL,
    `usaAuthInstitucional` BOOLEAN NOT NULL DEFAULT false,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_numeroTrabajador_key`(`numeroTrabajador`),
    UNIQUE INDEX `user_usuario_key`(`usuario`),
    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rol` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clave` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `rol_clave_key`(`clave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_rol` (
    `userId` INTEGER NOT NULL,
    `rolId` INTEGER NOT NULL,

    PRIMARY KEY (`userId`, `rolId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delegacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `delegacion_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plantel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `delegacionId` INTEGER NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `plantel_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dependencia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `idInstitucional` VARCHAR(10) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `padreId` INTEGER NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `dependencia_idInstitucional_key`(`idInstitucional`),
    INDEX `dependencia_padreId_idx`(`padreId`),
    UNIQUE INDEX `dependencia_padreId_nombre_key`(`padreId`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eje_institucional` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `eje_institucional_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `criterio_orientador` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `criterio_orientador_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `criterio_autoevaluacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(255) NOT NULL,
    `orden` INTEGER NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `criterio_autoevaluacion_nombre_key`(`nombre`),
    UNIQUE INDEX `criterio_autoevaluacion_orden_key`(`orden`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `criterio_par` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `criterio_par_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `buena_practica` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(200) NOT NULL,
    `plantelId` INTEGER NULL,
    `dependenciaId` INTEGER NULL,
    `estadoFlujo` VARCHAR(30) NOT NULL DEFAULT 'documentacion',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `buena_practica_plantelId_idx`(`plantelId`),
    INDEX `buena_practica_dependenciaId_idx`(`dependenciaId`),
    INDEX `buena_practica_estadoFlujo_idx`(`estadoFlujo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `buena_practica_eje` (
    `buenaPracticaId` INTEGER NOT NULL,
    `ejeId` INTEGER NOT NULL,

    INDEX `buena_practica_eje_ejeId_idx`(`ejeId`),
    PRIMARY KEY (`buenaPracticaId`, `ejeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `buena_practica_criterio_orientador` (
    `buenaPracticaId` INTEGER NOT NULL,
    `criterioId` INTEGER NOT NULL,

    INDEX `buena_practica_criterio_orientador_criterioId_idx`(`criterioId`),
    PRIMARY KEY (`buenaPracticaId`, `criterioId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_rol` ADD CONSTRAINT `user_rol_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_rol` ADD CONSTRAINT `user_rol_rolId_fkey` FOREIGN KEY (`rolId`) REFERENCES `rol`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plantel` ADD CONSTRAINT `plantel_delegacionId_fkey` FOREIGN KEY (`delegacionId`) REFERENCES `delegacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dependencia` ADD CONSTRAINT `dependencia_padreId_fkey` FOREIGN KEY (`padreId`) REFERENCES `dependencia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buena_practica` ADD CONSTRAINT `buena_practica_plantelId_fkey` FOREIGN KEY (`plantelId`) REFERENCES `plantel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buena_practica` ADD CONSTRAINT `buena_practica_dependenciaId_fkey` FOREIGN KEY (`dependenciaId`) REFERENCES `dependencia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buena_practica_eje` ADD CONSTRAINT `buena_practica_eje_buenaPracticaId_fkey` FOREIGN KEY (`buenaPracticaId`) REFERENCES `buena_practica`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buena_practica_eje` ADD CONSTRAINT `buena_practica_eje_ejeId_fkey` FOREIGN KEY (`ejeId`) REFERENCES `eje_institucional`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buena_practica_criterio_orientador` ADD CONSTRAINT `buena_practica_criterio_orientador_buenaPracticaId_fkey` FOREIGN KEY (`buenaPracticaId`) REFERENCES `buena_practica`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buena_practica_criterio_orientador` ADD CONSTRAINT `buena_practica_criterio_orientador_criterioId_fkey` FOREIGN KEY (`criterioId`) REFERENCES `criterio_orientador`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
