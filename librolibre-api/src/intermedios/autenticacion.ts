
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

const jwtSecretoConfiguracion = process.env.JWT_SECRETO;

if (!jwtSecretoConfiguracion) {
  throw new Error(
    "La variable JWT_SECRETO no está definida. Revisa el archivo .env.",
  );
}

const jwtSecreto: string = jwtSecretoConfiguracion;

export interface DatosToken {
  id: number;
  correo: string;
  rol: string;
  iat?: number;
  exp?: number;
}

export interface PeticionAutenticada extends Request {
  usuario?: DatosToken;
}

function esDatosToken(valor: unknown): valor is DatosToken {
  if (!valor || typeof valor !== "object") {
    return false;
  }

  const datos = valor as Record<string, unknown>;

  return (
    Number.isSafeInteger(datos.id) &&
    (datos.id as number) > 0 &&
    typeof datos.correo === "string" &&
    typeof datos.rol === "string"
  );
}

export async function requiereAutenticacion(
  peticion: PeticionAutenticada,
  respuesta: Response,
  siguiente: NextFunction,
) {
  const encabezadoAutorizacion = peticion.headers.authorization;

  if (!encabezadoAutorizacion?.startsWith("Bearer ")) {
    return respuesta.status(401).json({
      mensaje: "Acceso no autorizado. Envía un token Bearer válido.",
    });
  }

  const token = encabezadoAutorizacion.substring("Bearer ".length);

  let datosToken: DatosToken;

  try {
    const resultado = jwt.verify(token, jwtSecreto);

    if (!esDatosToken(resultado)) {
      return respuesta.status(401).json({
        mensaje: "El token no contiene datos válidos.",
      });
    }

    datosToken = resultado;
  } catch {
    return respuesta.status(401).json({
      mensaje: "Token inválido o expirado.",
    });
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: datosToken.id },
      select: {
        id: true,
        correo: true,
        rol: true,
        estatus: true,
      },
    });

    if (!usuario) {
      return respuesta.status(401).json({
        mensaje: "La cuenta ya no existe.",
      });
    }

    if (usuario.estatus !== "ACTIVO") {
      return respuesta.status(403).json({
        mensaje: "Tu cuenta está bloqueada o inactiva.",
        codigo: "CUENTA_NO_ACTIVA",
      });
    }

    peticion.usuario = {
      ...datosToken,
      correo: usuario.correo,
      rol: usuario.rol,
    };

    return siguiente();
  } catch (error) {
    console.error("Error al verificar el estado del usuario:", error);

    return respuesta.status(500).json({
      mensaje: "No fue posible verificar la cuenta.",
    });
  }
}
