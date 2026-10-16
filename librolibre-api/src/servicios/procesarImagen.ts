
import sharp from "sharp";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const RESOLUCION_MAXIMA = 1600;
const CALIDAD_JPEG = 85;
const MAXIMO_BYTES = 5 * 1024 * 1024;
const MAXIMO_PIXELES = 40_000_000;
const TIEMPO_MAXIMO = 30_000;

type FormatoImagen = "jpeg" | "png" | "webp" | "heic";

function detectarFormato(imagen: Buffer): FormatoImagen {
  if (
    imagen.length >= 3 &&
    imagen[0] === 0xff &&
    imagen[1] === 0xd8 &&
    imagen[2] === 0xff
  ) {
    return "jpeg";
  }

  if (
    imagen.length >= 8 &&
    imagen.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    )
  ) {
    return "png";
  }

  if (
    imagen.length >= 12 &&
    imagen.toString("ascii", 0, 4) === "RIFF" &&
    imagen.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  if (
    imagen.length >= 16 &&
    imagen.toString("ascii", 4, 8) === "ftyp"
  ) {
    const marcas = new Set([
      "heic",
      "heix",
      "hevc",
      "hevx",
      "heim",
      "heis",
      "hevm",
      "hevs",
      "mif1",
      "msf1",
    ]);

    const longitudCaja = imagen.readUInt32BE(0);

    if (
      longitudCaja >= 16 &&
      longitudCaja <= imagen.length &&
      longitudCaja <= 4096
    ) {
      const marcaPrincipal = imagen.toString("ascii", 8, 12);

      if (marcas.has(marcaPrincipal)) {
        return "heic";
      }

      for (let posicion = 16; posicion + 4 <= longitudCaja; posicion += 4) {
        if (marcas.has(imagen.toString("ascii", posicion, posicion + 4))) {
          return "heic";
        }
      }
    }
  }

  throw new Error(
    "El archivo no es una fotografía JPG, PNG, WebP, HEIC o HEIF válida.",
  );
}

function ejecutarImageMagick(
  entrada: string,
  salida: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let terminado = false;
    let errores = "";

    const proceso = spawn(
      process.env.IMAGEMAGICK_PATH || "convert",
      [
        "-limit", "memory", "256MiB",
        "-limit", "map", "512MiB",
        "-limit", "disk", "512MiB",
        "-limit", "time", "30",
        `${entrada}[0]`,
        "-auto-orient",
        "-resize", "1600x1600>",
        "-strip",
        "-quality", "85",
        salida,
      ],
      {
        windowsHide: true,
        stdio: ["ignore", "ignore", "pipe"],
      },
    );

    const temporizador = setTimeout(() => {
      proceso.kill("SIGKILL");
      finalizar(
        new Error("La fotografía tardó demasiado en procesarse."),
      );
    }, TIEMPO_MAXIMO);

    function finalizar(error?: Error) {
      if (terminado) return;

      terminado = true;
      clearTimeout(temporizador);

      if (error) reject(error);
      else resolve();
    }

    proceso.stderr.on("data", (datos: Buffer) => {
      errores = (errores + datos.toString()).slice(-3000);
    });

    proceso.on("error", (error) => {
      finalizar(error);
    });

    proceso.on("close", (codigo) => {
      if (codigo === 0) {
        finalizar();
      } else {
        finalizar(
          new Error(
            `No se pudo convertir la fotografía HEIC/HEIF: ${errores}`,
          ),
        );
      }
    });
  });
}

async function convertirHeic(imagen: Buffer): Promise<Buffer> {
  const carpeta = await mkdtemp(
    path.join(tmpdir(), "librolibre-imagen-"),
  );

  const entrada = path.join(carpeta, "entrada.heic");
  const salida = path.join(carpeta, "salida.jpg");

  try {
    await writeFile(entrada, imagen);
    await ejecutarImageMagick(entrada, salida);

    return await readFile(salida);
  } finally {
    await rm(carpeta, {
      recursive: true,
      force: true,
    });
  }
}

export async function optimizarImagen(
  imagen: Buffer,
  _tipoMime = "",
  _nombreArchivo = "",
): Promise<Buffer> {
  if (imagen.length === 0 || imagen.length > MAXIMO_BYTES) {
    throw new Error(
      "La fotografía está vacía o supera los 5 MB permitidos.",
    );
  }

  const formato = detectarFormato(imagen);

  const imagenProcesable =
    formato === "heic"
      ? await convertirHeic(imagen)
      : imagen;

  const procesador = sharp(imagenProcesable, {
    limitInputPixels: MAXIMO_PIXELES,
    failOn: "error",
  });

  const informacion = await procesador.metadata();

  if (
    !informacion.width ||
    !informacion.height ||
    informacion.width * informacion.height > MAXIMO_PIXELES
  ) {
    throw new Error(
      "La fotografía supera la resolución máxima permitida.",
    );
  }

  return procesador
    .rotate()
    .resize({
      width: RESOLUCION_MAXIMA,
      height: RESOLUCION_MAXIMA,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: CALIDAD_JPEG,
      mozjpeg: true,
    })
    .toBuffer();
}
