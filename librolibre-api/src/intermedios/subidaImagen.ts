import multer from "multer";

const almacenamiento = multer.memoryStorage();

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