-- AlterTable
ALTER TABLE "libros" ADD COLUMN     "codigoPostal" TEXT,
ADD COLUMN     "municipio" TEXT;

-- CreateIndex
CREATE INDEX "libros_codigoPostal_idx" ON "libros"("codigoPostal");
