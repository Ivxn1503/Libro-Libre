-- CreateEnum
CREATE TYPE "EstadoSolicitudRevision" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "solicitudes_revision" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" "EstadoSolicitudRevision" NOT NULL DEFAULT 'PENDIENTE',
    "respuestaAdmin" TEXT,
    "revisadaPorId" INTEGER,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,
    "revisadaEn" TIMESTAMP(3),
    "tokenVerificacionHash" TEXT,
    "tokenVerificacionExpiraEn" TIMESTAMP(3),
    "correoVerificadoEn" TIMESTAMP(3),

    CONSTRAINT "solicitudes_revision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_revision_tokenVerificacionHash_key" ON "solicitudes_revision"("tokenVerificacionHash");

-- CreateIndex
CREATE INDEX "solicitudes_revision_usuarioId_idx" ON "solicitudes_revision"("usuarioId");

-- CreateIndex
CREATE INDEX "solicitudes_revision_estado_idx" ON "solicitudes_revision"("estado");

-- AddForeignKey
ALTER TABLE "solicitudes_revision" ADD CONSTRAINT "solicitudes_revision_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
