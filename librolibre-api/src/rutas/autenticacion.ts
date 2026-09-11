import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import prisma from "../prisma.js";

const router = Router();

const jwtSecreto = process.env.JWT_SECRETO;

if (!jwtSecreto) {
  throw new Error(
    "La variable JWT_SECRETO no está definida. Revisa el archivo .env.",
  );
}

router.post("/registro", async (peticion, respuesta) => {
  try {
    const {
      nombre,
      correo,
      ciudad,
      estado,
      contrasena,
    } = peticion.body;

    if (
      !nombre?.trim() ||
      !correo?.trim() ||
      !ciudad?.trim() ||
      !estado?.trim() ||
      !contrasena
    ) {
      return respuesta.status(400).json({
        mensaje: "Todos los campos son obligatorios.",
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

    const usuarioNuevo = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        correo: correoNormalizado,
        ciudad: ciudad.trim(),
        estado: estado.trim(),
        contrasenaHash,
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        ciudad: true,
        estado: true,
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

    return respuesta.status(500).json({
      mensaje: "Ocurrió un error interno al registrar el usuario.",
    });
  }
});

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
        ciudad: usuario.ciudad,
        estado: usuario.estado,
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