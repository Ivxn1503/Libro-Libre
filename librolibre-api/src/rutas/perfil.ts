import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";

import {
  type PeticionAutenticada,
  requiereAutenticacion,
} from "../intermedios/autenticacion.js";
import prisma from "../prisma.js";
import supabase from "../supabase.js";

const router = Router();

const almacenamientoFoto = multer.memoryStorage();

const subirFoto = multer({
  storage: almacenamientoFoto,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_peticion, archivo, callback) => {
    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (tiposPermitidos.includes(archivo.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new Error("La foto debe ser JPG, PNG o WebP."));
  },
});

async function subirFotoPerfil(
  archivo: Express.Multer.File,
) {
  const extension =
    archivo.originalname.split(".").pop()?.toLowerCase() || "jpg";

  const nombreArchivo =
    `perfil-${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const ruta = `perfiles/${nombreArchivo}`;

  const { error } = await supabase.storage
    .from("librolibre-imagenes")
    .upload(ruta, archivo.buffer, {
      contentType: archivo.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Error al subir la foto de perfil: ${error.message}`,
    );
  }

  const { data } = supabase.storage
    .from("librolibre-imagenes")
    .getPublicUrl(ruta);

  return data.publicUrl;
}

const seleccionarUsuario = {
  id: true,
  nombre: true,
  correo: true,
  telefono: true,
  foto: true,
  ciudad: true,
  estado: true,
  descripcion: true,
  rol: true,
  estatus: true,
  creadoEn: true,
};

const incluirImagenesLibro = {
  orderBy: {
    orden: "asc" as const,
  },
  select: {
    id: true,
    url: true,
    esPortada: true,
    orden: true,
  },
};

router.get(
  "/",
  requiereAutenticacion,
  async (
    peticion: PeticionAutenticada,
    respuesta,
  ) => {
    try {
      if (!peticion.usuario) {
        return respuesta.status(401).json({
          mensaje: "No hay una sesión válida.",
        });
      }

      const usuario = await prisma.usuario.findUnique({
        where: {
          id: peticion.usuario.id,
        },
        select: seleccionarUsuario,
      });

      if (!usuario) {
        return respuesta.status(404).json({
          mensaje: "No se encontró el usuario.",
        });
      }

      const libros = await prisma.libro.findMany({
        where: {
          usuarioId: usuario.id,
          estatus: {
            not: "ELIMINADO",
          },
        },
        orderBy: {
          creadoEn: "desc",
        },
        select: {
          id: true,
          titulo: true,
          autor: true,
          modalidad: true,
          estatus: true,
          ciudad: true,
          estado: true,
          imagenes: incluirImagenesLibro,
        },
      });

      const estadisticas = {
        publicados: libros.length,
        disponibles: libros.filter(
          (libro) => libro.estatus === "DISPONIBLE",
        ).length,
        reservados: libros.filter(
          (libro) => libro.estatus === "RESERVADO",
        ).length,
        entregados: libros.filter(
          (libro) => libro.estatus === "ENTREGADO",
        ).length,
      };

      return respuesta.json({
        usuario,
        libros,
        estadisticas,
      });
    } catch (error) {
      console.error("Error al cargar el perfil:", error);

      return respuesta.status(500).json({
        mensaje: "Ocurrió un error al cargar el perfil.",
      });
    }
  },
);

router.put(
  "/",
  requiereAutenticacion,
  subirFoto.single("foto"),
  async (
    peticion: PeticionAutenticada,
    respuesta,
  ) => {
    try {
      if (!peticion.usuario) {
        return respuesta.status(401).json({
          mensaje: "No hay una sesión válida.",
        });
      }

      const {
        nombre,
        telefono,
        ciudad,
        estado,
        descripcion,
      } = peticion.body;

      if (
        !nombre?.trim() ||
        !ciudad?.trim() ||
        !estado?.trim()
      ) {
        return respuesta.status(400).json({
          mensaje:
            "Nombre, ciudad y estado son obligatorios.",
        });
      }

      const telefonoLimpio = telefono
        ? telefono.replace(/\D/g, "")
        : null;

      if (
        telefonoLimpio &&
        telefonoLimpio.length !== 10
      ) {
        return respuesta.status(400).json({
          mensaje: "El teléfono debe tener 10 dígitos.",
        });
      }

      const usuarioActual = await prisma.usuario.findUnique({
        where: {
          id: peticion.usuario.id,
        },
        select: {
          foto: true,
        },
      });

      const fotoUrl = peticion.file
        ? await subirFotoPerfil(peticion.file)
        : usuarioActual?.foto ?? null;

      const usuarioActualizado = await prisma.usuario.update({
        where: {
          id: peticion.usuario.id,
        },
        data: {
          nombre: nombre.trim(),
          telefono: telefonoLimpio,
          ciudad: ciudad.trim(),
          estado: estado.trim(),
          descripcion: descripcion?.trim() || null,
          foto: fotoUrl,
        },
        select: seleccionarUsuario,
      });

      return respuesta.json({
        mensaje: "Perfil actualizado correctamente.",
        usuario: usuarioActualizado,
      });
    } catch (error) {
      console.error(
        "Error al actualizar el perfil:",
        error,
      );

      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return respuesta.status(400).json({
            mensaje:
              "La foto no puede superar los 5 MB.",
          });
        }

        return respuesta.status(400).json({
          mensaje: "No fue posible procesar la foto.",
        });
      }

      if (
        error instanceof Error &&
        error.message.includes("La foto")
      ) {
        return respuesta.status(400).json({
          mensaje: error.message,
        });
      }

      return respuesta.status(500).json({
        mensaje:
          "Ocurrió un error al actualizar el perfil.",
      });
    }
  },
);

export default router;
