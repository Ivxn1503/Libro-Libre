-- CreateEnum
CREATE TYPE "ModalidadLibro" AS ENUM ('REGALO', 'INTERCAMBIO');

-- CreateEnum
CREATE TYPE "EstadoLibro" AS ENUM ('DISPONIBLE', 'RESERVADO', 'ENTREGADO', 'OCULTO', 'ELIMINADO');

-- CreateEnum
CREATE TYPE "CondicionLibro" AS ENUM ('COMO_NUEVO', 'MUY_BUEN_ESTADO', 'BUEN_ESTADO', 'USO_CONSIDERABLE', 'DANADO');

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "icono" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "libros" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "editorial" TEXT,
    "isbn" TEXT,
    "anoPublicacion" INTEGER,
    "condicion" "CondicionLibro" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "modalidad" "ModalidadLibro" NOT NULL,
    "descripcionIntercambio" TEXT,
    "ciudad" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "colonia" TEXT,
    "estatus" "EstadoLibro" NOT NULL DEFAULT 'DISPONIBLE',
    "usuarioId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "libros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagenes_libros" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "esPortada" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "libroId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imagenes_libros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE INDEX "libros_usuarioId_idx" ON "libros"("usuarioId");

-- CreateIndex
CREATE INDEX "libros_categoriaId_idx" ON "libros"("categoriaId");

-- CreateIndex
CREATE INDEX "libros_estatus_idx" ON "libros"("estatus");

-- CreateIndex
CREATE INDEX "libros_ciudad_estado_idx" ON "libros"("ciudad", "estado");

-- CreateIndex
CREATE INDEX "imagenes_libros_libroId_idx" ON "imagenes_libros"("libroId");

-- AddForeignKey
ALTER TABLE "libros" ADD CONSTRAINT "libros_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "libros" ADD CONSTRAINT "libros_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagenes_libros" ADD CONSTRAINT "imagenes_libros_libroId_fkey" FOREIGN KEY ("libroId") REFERENCES "libros"("id") ON DELETE CASCADE ON UPDATE CASCADE;
