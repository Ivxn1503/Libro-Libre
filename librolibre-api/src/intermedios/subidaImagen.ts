import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const carpetaImagenes = path.resolve(
  process.cwd(),
  "uploads",
  "libros",
);

fs.mkdirSync(carpetaImagenes, {
  recursive: true,
});

const almacenamiento = multer.diskStorage({
  destination: (_peticion, _archivo, callback) => {
    callback(null, carpetaImagenes);
  },

  filename: (_peticion, archivo, callback) => {
    const extension = path.extname(
      archivo.originalname,
    );

    const nombre = `${Date.now()}-${Math.round(
      Math.random() * 1_000_000_000,
    )}${extension}`;

    callback(null, nombre);
  },
});

const filtroImagen: multer.Options["fileFilter"] = (
  _peticion,
  archivo,
  callback,
) => {
  const tiposPermitidos = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!tiposPermitidos.includes(archivo.mimetype)) {
    callback(
      new Error(
        "Solo se permiten imágenes JPG, PNG o WebP.",
      ),
    );
    return;
  }

  callback(null, true);
};

const subirImagen = multer({
  storage: almacenamiento,
  fileFilter: filtroImagen,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default subirImagen;