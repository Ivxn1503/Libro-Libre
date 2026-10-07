import type {
  NextFunction,
  Request,
  Response,
} from "express";

import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

type UsuarioAutenticado = {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  estatus: string;
};

export type PeticionConUsuario = Request & {
  usuario?: UsuarioAutenticado;
};

const jwtSecreto = process.env.JWT_SECRETO;

export async function autenticacionOpcional(
  peticion: PeticionConUsuario,
  _respuesta: Response,
  siguiente: NextFunction,
) {
  try {
    const encabezado =
      peticion.headers.authorization;

    /*
     * Si el visitante no tiene token, continúa normalmente.
     * Podrá ver todos los libros públicos.
     */
    if (!encabezado) {
      return siguiente();
    }

    const [tipo, token] = encabezado.split(" ");

    if (tipo !== "Bearer" || !token) {
      return siguiente();
    }

    if (!jwtSecreto) {
      console.error(
        "JWT_SECRETO no está definido en el archivo .env.",
      );

      return siguiente();
    }

    const contenido = jwt.verify(
      token,
      jwtSecreto,
    ) as {
      id?: number;
    };

    if (!contenido.id) {
      return siguiente();
    }

    const usuario =
      await prisma.usuario.findUnique({
        where: {
          id: Number(contenido.id),
        },

        select: {
          id: true,
          nombre: true,
          correo: true,
          rol: true,
          estatus: true,
        },
      });

    if (usuario?.estatus === "ACTIVO") {
      peticion.usuario = usuario;
    }

    return siguiente();
  } catch (_error) {
    /*
     * Si el token expiró o es inválido, no bloqueamos
     * el catálogo público.
     */
    return siguiente();
  }
}