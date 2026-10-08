import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import crypto from "node:crypto";
import {
  enviarAvisoContrasenaCambiada,
  enviarEnlaceRecuperacion,
} from "../servicios/correo.js";
import prisma from "../prisma.js";
import supabase from "../supabase.js";
const router = Router();
const jwtSecreto = process.env.JWT_SECRETO;
if (!jwtSecreto) {
  throw new Error(
    "La variable JWT_SECRETO no está definida. Revisa el archivo .env.",
  );
}
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
router.post(
  "/registro",
  subirFoto.single("foto"),
  async (peticion, respuesta) => {
    try {
      const {
        nombre,
        correo,
        telefono,
        ciudad,
        estado,
        descripcion,
        contrasena,
      } = peticion.body;
      if (
        !nombre?.trim() ||
        !correo?.trim() ||
        !telefono?.trim() ||
        !ciudad?.trim() ||
        !estado?.trim() ||
        !contrasena
      ) {
        return respuesta.status(400).json({
          mensaje: "Completa todos los campos obligatorios.",
        });
      }
      const telefonoLimpio = telefono.replace(/\D/g, "");
      if (telefonoLimpio.length !== 10) {
        return respuesta.status(400).json({
          mensaje: "El teléfono debe tener 10 dígitos.",
        });
      }
      if (contrasena.length < 6) {
        return respuesta.status(400).json({
          mensaje: "La contraseña debe tener al menos 6 caracteres.",
        });
      }
      const correoNormalizado = correo.trim().toLowerCase();
      const usuarioExistente = await prisma.usuario.findFirst({
        where: {
          OR: [
            { correo: correoNormalizado },
            { telefono: telefonoLimpio },
          ],
        },
        select: {
          correo: true,
          telefono: true,
        },
      });
      if (usuarioExistente) {
        if (usuarioExistente.correo === correoNormalizado) {
          return respuesta.status(409).json({
            mensaje: "Ya existe una cuenta registrada con este correo.",
          });
        }
        return respuesta.status(409).json({
          mensaje: "Ya existe una cuenta registrada con este teléfono.",
        });
      }
      const contrasenaHash = await bcrypt.hash(contrasena, 10);
      const fotoUrl = peticion.file
  ? await subirFotoPerfil(peticion.file)
  : null;
      const usuarioNuevo = await prisma.usuario.create({
        data: {
          nombre: nombre.trim(),
          correo: correoNormalizado,
          telefono: telefonoLimpio,
          ciudad: ciudad.trim(),
          estado: estado.trim(),
          descripcion: descripcion?.trim() || null,
          foto: fotoUrl,
          contrasenaHash,
        },
        select: seleccionarUsuario,
      });
      return respuesta.status(201).json({
        mensaje: "Usuario registrado correctamente.",
        usuario: usuarioNuevo,
      });
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      return responderError(error, respuesta);
    }
  },
);
router.post("/login", async (peticion, respuesta) => {
  try {
    const { correo, contrasena } = peticion.body;
    if (!correo?.trim() || !contrasena) {
      return respuesta.status(400).json({
        mensaje: "El correo y la contraseña son obligatorios.",
      });
    }
    const correoNormalizado = correo.trim().toLowerCase();
    const usuario = await prisma.usuario.findUnique({
      where: {
        correo: correoNormalizado,
      },
    });
    const credencialesInvalidas = {
      mensaje: "Correo o contraseña incorrectos.",
    };
    if (!usuario) {
      return respuesta.status(401).json(credencialesInvalidas);
    }
    const contrasenaCorrecta = await bcrypt.compare(
      contrasena,
      usuario.contrasenaHash,
    );
    if (!contrasenaCorrecta) {
      return respuesta.status(401).json(credencialesInvalidas);
    }
    if (usuario.estatus === "BLOQUEADO") {
      return respuesta.status(403).json({
        mensaje: "Tu cuenta ha sido bloqueada. Puedes solicitar una revisión.",
        codigo: "CUENTA_BLOQUEADA",
        puedeSolicitarRevision: true,
      });
    }
    if (usuario.estatus !== "ACTIVO") {
      return respuesta.status(403).json({
        mensaje: "Esta cuenta no está activa.",
        codigo: "CUENTA_INACTIVA",
      });
    }
    const token = jwt.sign(
      {
        id: usuario.id,
        correo: usuario.correo,
        rol: usuario.rol,
      },
      jwtSecreto,
      {
        expiresIn: "7d",
      },
    );
    return respuesta.status(200).json({
      mensaje: "Inicio de sesión correcto.",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        telefono: usuario.telefono,
        foto: usuario.foto,
        ciudad: usuario.ciudad,
        estado: usuario.estado,
        descripcion: usuario.descripcion,
        rol: usuario.rol,
        estatus: usuario.estatus,
      },
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return respuesta.status(500).json({
      mensaje: "Ocurrió un error interno al iniciar sesión.",
    });
  }
});
router.post(
  "/solicitar-recuperacion",
  async (peticion, respuesta) => {
    try {
      const correo = peticion.body.correo
        ?.trim()
        .toLowerCase();
      const mensajeGenerico =
        "Si existe una cuenta con ese correo, recibirás instrucciones para recuperar tu contraseña.";
      if (!correo) {
        return respuesta.status(400).json({
          mensaje: "El correo es obligatorio.",
        });
      }
      const usuario = await prisma.usuario.findUnique({
        where: {
          correo,
        },
      });
      if (!usuario) {
        return respuesta.status(200).json({
          mensaje: mensajeGenerico,
        });
      }
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const expiraEn = new Date(
        Date.now() + 15 * 60 * 1000,
      );
      await prisma.usuario.update({
        where: {
          id: usuario.id,
        },
        data: {
          tokenRecuperacionHash: tokenHash,
          tokenRecuperacionExpiraEn: expiraEn,
        },
      });
      await enviarEnlaceRecuperacion({
        correo: usuario.correo,
        nombre: usuario.nombre,
        token,
      });
      return respuesta.status(200).json({
        mensaje: mensajeGenerico,
      });
    } catch (error) {
      console.error(
        "Error al solicitar recuperación:",
        error,
      );
      return respuesta.status(500).json({
        mensaje: "No fue posible procesar la solicitud.",
      });
    }
  },
);
router.post(
  "/restablecer-contrasena",
  async (peticion, respuesta) => {
    try {
      const {
        token,
        contrasena,
        confirmarContrasena,
      } = peticion.body;
      if (
        !token ||
        !contrasena ||
        !confirmarContrasena
      ) {
        return respuesta.status(400).json({
          mensaje: "Completa todos los campos.",
        });
      }
      if (contrasena.length < 6) {
        return respuesta.status(400).json({
          mensaje:
            "La contraseña debe tener al menos 6 caracteres.",
        });
      }
      if (contrasena !== confirmarContrasena) {
        return respuesta.status(400).json({
          mensaje: "Las contraseñas no coinciden.",
        });
      }
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const usuario = await prisma.usuario.findFirst({
        where: {
          tokenRecuperacionHash: tokenHash,
          tokenRecuperacionExpiraEn: {
            gt: new Date(),
          },
        },
      });
      if (!usuario) {
        return respuesta.status(400).json({
          mensaje: "El enlace no es válido o ya expiró.",
        });
      }
      const contrasenaHash = await bcrypt.hash(
        contrasena,
        10,
      );
      await prisma.usuario.update({
        where: {
          id: usuario.id,
        },
        data: {
          contrasenaHash,
          tokenRecuperacionHash: null,
          tokenRecuperacionExpiraEn: null,
        },
      });
      try {
        await enviarAvisoContrasenaCambiada({
          correo: usuario.correo,
          nombre: usuario.nombre,
        });
      } catch (error) {
        console.error(
          "La contraseña cambió, pero no se pudo enviar el correo de aviso:",
          error,
        );
      }
      return respuesta.status(200).json({
        mensaje:
          "Contraseña actualizada correctamente. Inicia sesión nuevamente.",
      });
    } catch (error) {
      console.error(
        "Error al restablecer contraseña:",
        error,
      );
      return respuesta.status(500).json({
        mensaje: "No fue posible restablecer la contraseña.",
      });
    }
  },
);
function responderError(error: unknown, respuesta: any) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return respuesta.status(400).json({
        mensaje: "La foto no puede superar los 5 MB.",
      });
    }
    return respuesta.status(400).json({
      mensaje: "No fue posible procesar la foto.",
    });
  }
  if (error instanceof Error && error.message.includes("La foto")) {
    return respuesta.status(400).json({
      mensaje: error.message,
    });
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return respuesta.status(409).json({
      mensaje: "El correo o teléfono ya está registrado.",
    });
  }
  return respuesta.status(500).json({
    mensaje: "Ocurrió un error interno al procesar la solicitud.",
  });
}
export default router;
