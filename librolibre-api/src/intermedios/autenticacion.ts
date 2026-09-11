import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

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
    typeof datos.id === "number" &&
    typeof datos.correo === "string" &&
    typeof datos.rol === "string"
  );
}

export function requiereAutenticacion(
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

  try {
    const resultado = jwt.verify(token, jwtSecreto);

    if (!esDatosToken(resultado)) {
      return respuesta.status(401).json({
        mensaje: "El token no contiene datos válidos.",
      });
    }

    peticion.usuario = resultado;

    return siguiente();
  } catch {
    return respuesta.status(401).json({
      mensaje: "Token inválido o expirado.",
    });
  }
}