
import { Router } from "express";
import crypto from "node:crypto";
import prisma from "../prisma.js";
import { enviarEnlaceRevisionCuenta } from "../servicios/correo.js";
import {
  requiereAutenticacion,
  type PeticionAutenticada,
} from "../intermedios/autenticacion.js";
import { requiereAdministrador } from "../intermedios/requiereadministrador.js";

const router = Router();

const MENSAJE_GENERICO =
  "Si existe una cuenta bloqueada con ese correo, recibirás instrucciones para continuar.";

const DURACION_TOKEN = 15 * 60 * 1000;
const ESPERA_REENVIO = 60 * 1000;

function crearToken() {
  const token = crypto.randomBytes(32).toString("hex");

  const hash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  return { token, hash };
}

function obtenerHash(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

// 1. SOLICITAR REVISIÓN DE CUENTA
router.post("/solicitar", async (peticion, respuesta) => {
  try {
    const { correo, motivo } = peticion.body ?? {};

    if (
      typeof correo !== "string" ||
      typeof motivo !== "string" ||
      !correo.trim() ||
      motivo.trim().length < 10 ||
      motivo.trim().length > 1000
    ) {
      return respuesta.status(400).json({
        mensaje:
          "Ingresa un correo válido y un motivo de entre 10 y 1000 caracteres.",
      });
    }

    const correoNormalizado = correo.trim().toLowerCase();

    const usuario = await prisma.usuario.findUnique({
      where: { correo: correoNormalizado },
    });

    if (!usuario || usuario.estatus !== "BLOQUEADO") {
      return respuesta.status(200).json({
        mensaje: MENSAJE_GENERICO,
      });
    }

    const solicitudPendiente =
      await prisma.solicitudRevision.findFirst({
        where: {
          usuarioId: usuario.id,
          estado: "PENDIENTE",
        },
        orderBy: {
          creadaEn: "desc",
        },
      });

    // Si ya existe una solicitud verificada,
    // no se crea otra.
    if (solicitudPendiente?.correoVerificadoEn) {
      return respuesta.status(200).json({
        mensaje: MENSAJE_GENERICO,
      });
    }

    // Evitar reenvíos demasiado frecuentes.
    if (
      solicitudPendiente &&
      solicitudPendiente.tokenVerificacionHash &&
      solicitudPendiente.actualizadaEn.getTime() >
        Date.now() - ESPERA_REENVIO
    ) {
      return respuesta.status(200).json({
        mensaje: MENSAJE_GENERICO,
      });
    }

    const { token, hash } = crearToken();

    const expiraEn = new Date(
      Date.now() + DURACION_TOKEN,
    );

    const solicitud = solicitudPendiente
      ? await prisma.solicitudRevision.update({
          where: {
            id: solicitudPendiente.id,
          },
          data: {
            motivo: motivo.trim(),
            tokenVerificacionHash: hash,
            tokenVerificacionExpiraEn: expiraEn,
          },
        })
      : await prisma.solicitudRevision.create({
          data: {
            usuarioId: usuario.id,
            motivo: motivo.trim(),
            tokenVerificacionHash: hash,
            tokenVerificacionExpiraEn: expiraEn,
          },
        });

    try {
      await enviarEnlaceRevisionCuenta({
        correo: usuario.correo,
        nombre: usuario.nombre,
        token,
      });
    } catch (error) {
      console.error(
        "Error al enviar correo de revisión:",
        error,
      );

      // Invalidar el enlace si el correo no pudo enviarse.
      await prisma.solicitudRevision.updateMany({
        where: {
          id: solicitud.id,
          tokenVerificacionHash: hash,
        },
        data: {
          tokenVerificacionHash: null,
          tokenVerificacionExpiraEn: null,
        },
      });
    }

    return respuesta.status(200).json({
      mensaje: MENSAJE_GENERICO,
    });
  } catch (error) {
    console.error(
      "Error al solicitar revisión:",
      error,
    );

    return respuesta.status(500).json({
      mensaje: "No fue posible procesar la solicitud.",
    });
  }
});

// 2. VERIFICAR EL CORREO
router.post("/verificar", async (peticion, respuesta) => {
  try {
    const { token } = peticion.body ?? {};

    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token)
    ) {
      return respuesta.status(400).json({
        mensaje: "El enlace de verificación no es válido.",
      });
    }

    const hash = obtenerHash(token);

    const solicitud =
      await prisma.solicitudRevision.findUnique({
        where: {
          tokenVerificacionHash: hash,
        },
        include: {
          usuario: true,
        },
      });

    if (
      !solicitud ||
      solicitud.estado !== "PENDIENTE" ||
      solicitud.correoVerificadoEn ||
      solicitud.usuario.estatus !== "BLOQUEADO" ||
      !solicitud.tokenVerificacionExpiraEn ||
      solicitud.tokenVerificacionExpiraEn <= new Date()
    ) {
      return respuesta.status(400).json({
        mensaje:
          "El enlace es inválido, ya fue utilizado o expiró.",
      });
    }

    const resultado =
      await prisma.solicitudRevision.updateMany({
        where: {
          id: solicitud.id,
          estado: "PENDIENTE",
          correoVerificadoEn: null,
          tokenVerificacionHash: hash,
          tokenVerificacionExpiraEn: {
            gt: new Date(),
          },
        },
        data: {
          correoVerificadoEn: new Date(),
          tokenVerificacionHash: null,
          tokenVerificacionExpiraEn: null,
        },
      });

    if (resultado.count !== 1) {
      return respuesta.status(400).json({
        mensaje:
          "El enlace ya fue utilizado o expiró.",
      });
    }

    return respuesta.status(200).json({
      mensaje:
        "Correo verificado correctamente. Tu solicitud fue enviada al administrador.",
    });
  } catch (error) {
    console.error(
      "Error al verificar solicitud:",
      error,
    );

    return respuesta.status(500).json({
      mensaje: "No fue posible verificar la solicitud.",
    });
  }
});

// Las rutas siguientes requieren administrador.
router.use(requiereAutenticacion);
router.use(requiereAdministrador);

// 3. CONSULTAR SOLICITUDES VERIFICADAS
router.get("/", async (_peticion, respuesta) => {
  try {
    const solicitudes =
      await prisma.solicitudRevision.findMany({
        where: {
          correoVerificadoEn: {
            not: null,
          },
        },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              correo: true,
              estatus: true,
            },
          },
        },
        orderBy: {
          creadaEn: "desc",
        },
      });

    return respuesta.status(200).json({
      solicitudes,
    });
  } catch (error) {
    console.error(
      "Error al consultar solicitudes:",
      error,
    );

    return respuesta.status(500).json({
      mensaje: "No fue posible consultar las solicitudes.",
    });
  }
});

// 4. APROBAR O RECHAZAR SOLICITUD
router.patch(
  "/:id/resolver",
  async (peticion: PeticionAutenticada, respuesta) => {
    try {
      const id = Number(peticion.params.id);
      const { decision, respuestaAdmin } =
        peticion.body ?? {};

      if (!Number.isSafeInteger(id) || id <= 0) {
        return respuesta.status(400).json({
          mensaje: "Identificador inválido.",
        });
      }

      if (
        decision !== "APROBADA" &&
        decision !== "RECHAZADA"
      ) {
        return respuesta.status(400).json({
          mensaje:
            "La decisión debe ser APROBADA o RECHAZADA.",
        });
      }

      if (
        respuestaAdmin !== undefined &&
        (typeof respuestaAdmin !== "string" ||
          respuestaAdmin.length > 1000)
      ) {
        return respuesta.status(400).json({
          mensaje: "La respuesta administrativa no es válida.",
        });
      }

      const administradorId = peticion.usuario?.id;

      if (!administradorId) {
        return respuesta.status(401).json({
          mensaje: "Sesión no válida.",
        });
      }

      const resultado = await prisma.$transaction(
        async (tx) => {
          const solicitud =
            await tx.solicitudRevision.findUnique({
              where: { id },
              include: { usuario: true },
            });

          if (!solicitud) {
            return "NO_ENCONTRADA";
          }

          if (
            solicitud.estado !== "PENDIENTE" ||
            !solicitud.correoVerificadoEn
          ) {
            return "NO_DISPONIBLE";
          }

          if (
            solicitud.usuario.estatus !== "BLOQUEADO"
          ) {
            return "CUENTA_NO_BLOQUEADA";
          }

          const actualizacion =
            await tx.solicitudRevision.updateMany({
              where: {
                id,
                estado: "PENDIENTE",
                correoVerificadoEn: {
                  not: null,
                },
              },
              data: {
                estado: decision,
                respuestaAdmin:
                  respuestaAdmin?.trim() || null,
                revisadaPorId: administradorId,
                revisadaEn: new Date(),
              },
            });

          if (actualizacion.count !== 1) {
            return "NO_DISPONIBLE";
          }

          if (decision === "APROBADA") {
            const usuarioActualizado =
              await tx.usuario.updateMany({
                where: {
                  id: solicitud.usuarioId,
                  estatus: "BLOQUEADO",
                },
                data: {
                  estatus: "ACTIVO",
                },
              });

            if (usuarioActualizado.count !== 1) {
              throw new Error(
                "No se pudo reactivar la cuenta.",
              );
            }
          }

          return "OK";
        },
      );

      if (resultado === "NO_ENCONTRADA") {
        return respuesta.status(404).json({
          mensaje: "Solicitud no encontrada.",
        });
      }

      if (resultado === "NO_DISPONIBLE") {
        return respuesta.status(409).json({
          mensaje:
            "La solicitud ya fue resuelta o no está verificada.",
        });
      }

      if (resultado === "CUENTA_NO_BLOQUEADA") {
        return respuesta.status(409).json({
          mensaje: "La cuenta ya no está bloqueada.",
        });
      }

      return respuesta.status(200).json({
        mensaje:
          decision === "APROBADA"
            ? "Solicitud aprobada. La cuenta fue reactivada."
            : "Solicitud rechazada correctamente.",
      });
    } catch (error) {
      console.error(
        "Error al resolver solicitud:",
        error,
      );

      return respuesta.status(500).json({
        mensaje: "No fue posible resolver la solicitud.",
      });
    }
  },
);

export default router;
