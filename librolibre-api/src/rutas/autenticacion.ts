import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";

import prisma from "../prisma.js";

const router = Router();

const jwtSecreto = process.env.JWT_SECRETO;

if (!jwtSecreto) {
  throw new Error(
    "La variable JWT_SECRETO no está definida. Revisa el archivo .env.",
  );
}

const carpetaPerfiles = path.resolve(
  process.cwd(),
  "uploads",
  "perfiles",
);

fs.mkdirSync(carpetaPerfiles, {
  recursive: true,
});

const almacenamientoFoto = multer.diskStorage({
  destination: (_peticion, _archivo, callback) => {
    callback(null, carpetaPerfiles);
  },
  filename: (_peticion, archivo, callback) => {
    const extension = path.extname(archivo.originalname).toLowerCase() || ".jpg";

    const nombreArchivo = `perfil-${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${extension}`;

    callback(null, nombreArchivo);
  },
});

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

      const usuarioExistente = await prisma.usuario.findUnique({
        where: {
          correo: correoNormalizado,
        },
      });

      if (usuarioExistente) {
        return respuesta.status(409).json({
          mensaje: "Ya existe una cuenta registrada con este correo.",
        });
      }

      const contrasenaHash = await bcrypt.hash(contrasena, 10);
      const fotoUrl = peticion.file
        ? `/uploads/perfiles/${peticion.file.filename}`
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
        select: {
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
        },
      });

      return respuesta.status(201).json({
        mensaje: "Usuario registrado correctamente.",
        usuario: usuarioNuevo,
      });
    } catch (error) {
      console.error("Error al registrar usuario:", error);

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

      return respuesta.status(500).json({
        mensaje: "Ocurrió un error interno al registrar el usuario.",
      });
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

    if (usuario.estatus !== "ACTIVO") {
      return respuesta.status(403).json({
        mensaje: "Esta cuenta no está activa.",
      });
    }

    const contrasenaCorrecta = await bcrypt.compare(
      contrasena,
      usuario.contrasenaHash,
    );

    if (!contrasenaCorrecta) {
      return respuesta.status(401).json(credencialesInvalidas);
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

export default router;
