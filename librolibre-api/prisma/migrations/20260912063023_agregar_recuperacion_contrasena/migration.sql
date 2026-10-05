/*
  Warnings:

  - A unique constraint covering the columns `[telefono]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "tokenRecuperacionExpiraEn" TIMESTAMP(3),
ADD COLUMN     "tokenRecuperacionHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_telefono_key" ON "usuarios"("telefono");
