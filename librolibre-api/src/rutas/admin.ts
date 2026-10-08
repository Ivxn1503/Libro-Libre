
import { Router } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma.js";

import {
  requiereAutenticacion,
  type PeticionAutenticada,
} from "../intermedios/autenticacion.js";

import { requiereAdministrador } from "../intermedios/requiereadministrador.js";

const router = Router();

router.use(requiereAutenticacion);
router.use(requiereAdministrador);

// Obtener usuarios
router.get("/usuarios", async (_peticion, respuesta) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        estatus: true,
        creadoEn: true,
        _count: {
          select: { libros: true },
        },
      },
      orderBy: { creadoEn: "desc" },
    });

    return respuesta.json({ usuarios });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return respuesta.status(500).json({
      mensaje: "No se pudieron obtener los usuarios.",
    });
  }
});

// Crear usuario
router.post("/usuarios", async (peticion, respuesta) => {
  try {
    const { nombre, correo, password, rol } = peticion.body;

    if (
      typeof nombre !== "string" ||
      typeof correo !== "string" ||
      typeof password !== "string" ||
      !nombre.trim() ||
      !correo.trim() ||
      password.length < 8
    ) {
      return respuesta.status(400).json({
        mensaje: "Proporciona nombre, correo y contraseña de al menos 8 caracteres.",
      });
    }

    if (rol !== undefined && rol !== "USUARIO" && rol !== "ADMINISTRADOR") {
      return respuesta.status(400).json({
        mensaje: "El rol seleccionado no es válido.",
      });
    }

    const correoNormalizado = correo.trim().toLowerCase();

    const existente = await prisma.usuario.findUnique({
      where: { correo: correoNormalizado },
    });

    if (existente) {
      return respuesta.status(409).json({
        mensaje: "El correo ya está registrado.",
      });
    }

    const contrasenaHash = await bcrypt.hash(password, 12);

    const usuario = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        correo: correoNormalizado,
        contrasenaHash,
        rol: rol ?? "USUARIO",
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        estatus: true,
      },
    });

    return respuesta.status(201).json({
      mensaje: "Usuario creado correctamente.",
      usuario,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return respuesta.status(500).json({
      mensaje: "No se pudo crear el usuario.",
    });
  }
});

// Cambiar estado de usuario
router.patch("/usuarios/:id/estatus", async (peticion, respuesta) => {
  try {
    const id = Number(peticion.params.id);
    const { estatus } = peticion.body;

    if (!Number.isSafeInteger(id) || id <= 0) {
      return respuesta.status(400).json({
        mensaje: "ID de usuario inválido.",
      });
    }

    if (!["ACTIVO", "INACTIVO", "BLOQUEADO"].includes(estatus)) {
      return respuesta.status(400).json({
        mensaje: "Estado de usuario inválido.",
      });
    }

    const administrador = (peticion as PeticionAutenticada).usuario;

    if (administrador?.id === id) {
      return respuesta.status(403).json({
        mensaje: "No puedes cambiar el estado de tu propia cuenta.",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { rol: true },
    });

    if (!usuario) {
      return respuesta.status(404).json({
        mensaje: "Usuario no encontrado.",
      });
    }

    if (usuario.rol === "ADMINISTRADOR") {
      return respuesta.status(403).json({
        mensaje: "No puedes cambiar el estado de otro administrador.",
      });
    }

    const actualizado = await prisma.usuario.update({
      where: { id },
      data: { estatus },
      select: {
        id: true,
        nombre: true,
        estatus: true,
      },
    });

    return respuesta.json({
      mensaje: "Estado actualizado correctamente.",
      usuario: actualizado,
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    return respuesta.status(500).json({
      mensaje: "No se pudo actualizar el usuario.",
    });
  }
});

// Eliminar usuario
router.delete("/usuarios/:id", async (peticion: PeticionAutenticada, respuesta) => {
  try {
    const id = Number(peticion.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return respuesta.status(400).json({
        mensaje: "ID de usuario inválido.",
      });
    }

    if (peticion.usuario?.id === id) {
      return respuesta.status(403).json({
        mensaje: "No puedes eliminar tu propia cuenta.",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { rol: true },
    });

    if (!usuario) {
      return respuesta.status(404).json({
        mensaje: "Usuario no encontrado.",
      });
    }

    if (usuario.rol === "ADMINISTRADOR") {
      return respuesta.status(403).json({
        mensaje: "No puedes eliminar otro administrador.",
      });
    }

    await prisma.usuario.delete({
      where: { id },
    });

    return respuesta.json({
      mensaje: "Usuario eliminado correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return respuesta.status(500).json({
      mensaje: "No se pudo eliminar el usuario.",
    });
  }
});

// Obtener libros
router.get("/libros", async (_peticion, respuesta) => {
  try {
    const libros = await prisma.libro.findMany({
      select: {
        id: true,
        titulo: true,
        autor: true,
        modalidad: true,
        estatus: true,
        creadoEn: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            correo: true,
          },
        },
      },
      orderBy: { creadoEn: "desc" },
    });

    return respuesta.json({ libros });
  } catch (error) {
    console.error("Error al obtener libros:", error);
    return respuesta.status(500).json({
      mensaje: "No se pudieron obtener los libros.",
    });
  }
});

// Ocultar o restaurar libro
router.patch("/libros/:id/estatus", async (peticion, respuesta) => {
  try {
    const id = Number(peticion.params.id);
    const { estatus } = peticion.body;

    if (!Number.isSafeInteger(id) || id <= 0) {
      return respuesta.status(400).json({
        mensaje: "ID de libro inválido.",
      });
    }

    if (!["DISPONIBLE", "OCULTO"].includes(estatus)) {
      return respuesta.status(400).json({
        mensaje: "Estado de libro inválido.",
      });
    }

    const libro = await prisma.libro.findUnique({
      where: { id },
    });

    if (!libro) {
      return respuesta.status(404).json({
        mensaje: "Libro no encontrado.",
      });
    }

    const actualizado = await prisma.libro.update({
      where: { id },
      data: { estatus },
    });

    return respuesta.json({
      mensaje: "Estado del libro actualizado.",
      libro: actualizado,
    });
  } catch (error) {
    console.error("Error al actualizar libro:", error);
    return respuesta.status(500).json({
      mensaje: "No se pudo actualizar el libro.",
    });
  }
});

// Eliminar libro
router.delete("/libros/:id", async (peticion, respuesta) => {
  try {
    const id = Number(peticion.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return respuesta.status(400).json({
        mensaje: "ID de libro inválido.",
      });
    }

    const libro = await prisma.libro.findUnique({
      where: { id },
    });

    if (!libro) {
      return respuesta.status(404).json({
        mensaje: "Libro no encontrado.",
      });
    }

    await prisma.libro.update({
      where: { id },
      data: { estatus: "ELIMINADO" },
    });

    return respuesta.json({
      mensaje: "Libro marcado como eliminado.",
    });
  } catch (error) {
    console.error("Error al eliminar libro:", error);
    return respuesta.status(500).json({
      mensaje: "No se pudo eliminar el libro.",
    });
  }
});

export default router;
