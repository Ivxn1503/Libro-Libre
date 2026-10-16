
import multer from "multer";

const almacenamiento = multer.memoryStorage();

const tiposPermitidos = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const extensionesPermitidas =
  /\.(jpe?g|png|webp|heic|heif)$/i;

const MAXIMO_TAMANO = 5 * 1024 * 1024;
const MAXIMO_ARCHIVOS = 6;

const filtroImagen: multer.Options["fileFilter"] = (
  _peticion,
  archivo,
  callback,
) => {
  const tipo = archivo.mimetype.toLowerCase();

  const tipoValido = tiposPermitidos.has(tipo);

  const extensionValida = extensionesPermitidas.test(
    archivo.originalname,
  );

  const tipoGenerico =
    tipo === "application/octet-stream" ||
    tipo === "";

  if (
    !tipoValido &&
    !(tipoGenerico && extensionValida)
  ) {
    callback(
      new Error(
        "Solo se permiten fotografías JPG, PNG, WebP, HEIC o HEIF.",
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
    fileSize: MAXIMO_TAMANO,
    files: MAXIMO_ARCHIVOS,
    fields: 30,
    fieldSize: 1024 * 1024,
  },
});

export default subirImagen;
