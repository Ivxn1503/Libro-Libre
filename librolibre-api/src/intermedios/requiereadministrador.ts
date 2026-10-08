
import type { NextFunction, Response } from "express";
import prisma from "../prisma.js";
import type { PeticionAutenticada } from "./autenticacion.js";

export async function requiereAdministrador(
  peticion: PeticionAutenticada,
  respuesta: Response,
  siguiente: NextFunction,
) {
  try {
    const usuarioId = peticion.usuario?.id;

    if (!usuarioId) {
      return respuesta.status(401).json({
        mensaje: "Debes iniciar sesión.",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        rol: true,
        estatus: true,
      },
    });

    if (!usuario) {
      return respuesta.status(401).json({
        mensaje: "El usuario no existe.",
      });
    }

    if (usuario.estatus !== "ACTIVO") {
      return respuesta.status(403).json({
        mensaje: "Tu cuenta no está activa.",
      });
    }

    if (usuario.rol !== "ADMINISTRADOR") {
      return respuesta.status(403).json({
        mensaje: "No tienes permisos de administrador.",
      });
    }

    return siguiente();
  } catch (error) {
    console.error("Error al verificar administrador:", error);

    return respuesta.status(500).json({
      mensaje: "No se pudieron verificar los permisos.",
    });
  }
}
