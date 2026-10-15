
import { Router } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma.js";

import {
  requiereAutenticacion,
  type PeticionAutenticada,
} from "../intermedios/autenticacion.js";

import { requiereAdministrador } from "../intermedios/requiereadministrador.js";

const router = Router();

// Todas las rutas requieren una sesión activa
// y permisos de administrador.
router.use(requiereAutenticacion);
router.use(requiereAdministrador);

// Validar identificadores recibidos en la URL.
// Compatible con string | string[] de Express.
function idValido(valor: string | string[]): number | null {
  if (typeof valor !== "string" || !/^[1-9]\d*$/.test(valor)) {
    return null;
  }

  const id = Number(valor);

  return Number.isSafeInteger(id) ? id : null;
}

// Validar formato básico de correo electrónico.
function correoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

// ======================================================
// ADMINISTRACIÓN DE USUARIOS
// ======================================================

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
          select: {
            libros: true,
          },
        },
      },
      orderBy: {
        creadoEn: "desc",
      },
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
        mensaje:
          "Proporciona nombre, correo y contraseña de al menos 8 caracteres.",
      });
    }

    const nombreNormalizado = nombre.trim();
    const correoNormalizado = correo.trim().toLowerCase();

    if (nombreNormalizado.length > 100) {
      return respuesta.status(400).json({
        mensaje: "El nombre no puede superar los 100 caracteres.",
      });
    }

    if (
      correoNormalizado.length > 254 ||
      !correoValido(correoNormalizado)
    ) {
      return respuesta.status(400).json({
        mensaje: "Introduce un correo electrónico válido.",
      });
    }

    if (password.length > 128) {
      return respuesta.status(400).json({
        mensaje: "La contraseña no puede superar los 128 caracteres.",
      });
    }

    if (
      rol !== undefined &&
      rol !== "USUARIO" &&
      rol !== "ADMINISTRADOR"
    ) {
      return respuesta.status(400).json({
        mensaje: "El rol seleccionado no es válido.",
      });
    }

    const existente = await prisma.usuario.findUnique({
      where: {
        correo: correoNormalizado,
      },
    });

    if (existente) {
      return respuesta.status(409).json({
        mensaje: "El correo ya está registrado.",
      });
    }

    const contrasenaHash = await bcrypt.hash(password, 12);

    const usuario = await prisma.usuario.create({
      data: {
        nombre: nombreNormalizado,
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
  } catch (error: unknown) {
    console.error("Error al crear usuario:", error);

    // Correo duplicado detectado por Prisma.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return respuesta.status(409).json({
        mensaje: "El correo ya está registrado.",
      });
    }

    return respuesta.status(500).json({
      mensaje: "No se pudo crear el usuario.",
    });
  }
});

// Cambiar estado de usuario
router.patch(
  "/usuarios/:id/estatus",
  async (peticion: PeticionAutenticada, respuesta) => {
    try {
      const id = idValido(peticion.params.id);
      const { estatus } = peticion.body;

      if (id === null) {
        return respuesta.status(400).json({
          mensaje: "ID de usuario inválido.",
        });
      }

      if (
        estatus !== "ACTIVO" &&
        estatus !== "INACTIVO" &&
        estatus !== "BLOQUEADO"
      ) {
        return respuesta.status(400).json({
          mensaje: "Estado de usuario inválido.",
        });
      }

      if (peticion.usuario?.id === id) {
        return respuesta.status(403).json({
          mensaje: "No puedes cambiar el estado de tu propia cuenta.",
        });
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id },
        select: {
          id: true,
          rol: true,
          estatus: true,
        },
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
  },
);

// Dar de baja usuario sin eliminar sus datos.
router.delete(
  "/usuarios/:id",
  async (peticion: PeticionAutenticada, respuesta) => {
    try {
      const id = idValido(peticion.params.id);

      if (id === null) {
        return respuesta.status(400).json({
          mensaje: "ID de usuario inválido.",
        });
      }

      if (peticion.usuario?.id === id) {
        return respuesta.status(403).json({
          mensaje: "No puedes dar de baja tu propia cuenta.",
        });
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id },
        select: {
          id: true,
          rol: true,
          estatus: true,
        },
      });

      if (!usuario) {
        return respuesta.status(404).json({
          mensaje: "Usuario no encontrado.",
        });
      }

      if (usuario.rol === "ADMINISTRADOR") {
        return respuesta.status(403).json({
          mensaje: "No puedes dar de baja otro administrador.",
        });
      }

      if (usuario.estatus === "INACTIVO") {
        return respuesta.status(409).json({
          mensaje: "El usuario ya se encuentra inactivo.",
        });
      }

      const actualizado = await prisma.usuario.update({
        where: { id },
        data: {
          estatus: "INACTIVO",
        },
        select: {
          id: true,
          nombre: true,
          estatus: true,
        },
      });

      return respuesta.json({
        mensaje:
          "Usuario desactivado correctamente. Sus datos se conservaron.",
        usuario: actualizado,
      });
    } catch (error) {
      console.error("Error al desactivar usuario:", error);

      return respuesta.status(500).json({
        mensaje: "No se pudo desactivar el usuario.",
      });
    }
  },
);

// ======================================================
// ADMINISTRACIÓN DE LIBROS
// ======================================================

// Obtener todos los libros para administración.
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
      orderBy: {
        creadoEn: "desc",
      },
    });

    return respuesta.json({ libros });
  } catch (error) {
    console.error("Error al obtener libros:", error);

    return respuesta.status(500).json({
      mensaje: "No se pudieron obtener los libros.",
    });
  }
});

// Ocultar o restaurar libro.
router.patch("/libros/:id/estatus", async (peticion, respuesta) => {
  try {
    const id = idValido(peticion.params.id);
    const { estatus } = peticion.body;

    if (id === null) {
      return respuesta.status(400).json({
        mensaje: "ID de libro inválido.",
      });
    }

    if (estatus !== "DISPONIBLE" && estatus !== "OCULTO") {
      return respuesta.status(400).json({
        mensaje: "Estado de libro inválido.",
      });
    }

    const libro = await prisma.libro.findUnique({
      where: { id },
      select: {
        id: true,
        estatus: true,
      },
    });

    if (!libro) {
      return respuesta.status(404).json({
        mensaje: "Libro no encontrado.",
      });
    }

    // Evitar alterar libros reservados, entregados o eliminados.
    if (
      libro.estatus === "RESERVADO" ||
      libro.estatus === "ENTREGADO" ||
      libro.estatus === "ELIMINADO"
    ) {
      return respuesta.status(409).json({
        mensaje:
          "No puedes cambiar el estado de un libro reservado, entregado o eliminado.",
      });
    }

    if (libro.estatus === estatus) {
      return respuesta.json({
        mensaje: "El libro ya tiene el estado solicitado.",
        libro,
      });
    }

    const actualizado = await prisma.libro.update({
      where: {
        id,
        estatus: libro.estatus,
      },
      data: {
        estatus,
      },
    });

    return respuesta.json({
      mensaje: "Estado del libro actualizado correctamente.",
      libro: actualizado,
    });
  } catch (error) {
    console.error("Error al actualizar libro:", error);

    return respuesta.status(500).json({
      mensaje: "No se pudo actualizar el libro.",
    });
  }
});

// Eliminar libro mediante borrado lógico.
router.delete("/libros/:id", async (peticion, respuesta) => {
  try {
    const id = idValido(peticion.params.id);

    if (id === null) {
      return respuesta.status(400).json({
        mensaje: "ID de libro inválido.",
      });
    }

    const libro = await prisma.libro.findUnique({
      where: { id },
      select: {
        id: true,
        estatus: true,
      },
    });

    if (!libro) {
      return respuesta.status(404).json({
        mensaje: "Libro no encontrado.",
      });
    }

    if (libro.estatus === "ELIMINADO") {
      return respuesta.status(409).json({
        mensaje: "El libro ya está eliminado.",
      });
    }

    if (
      libro.estatus === "RESERVADO" ||
      libro.estatus === "ENTREGADO"
    ) {
      return respuesta.status(409).json({
        mensaje:
          "No puedes eliminar un libro reservado o entregado.",
      });
    }

    await prisma.libro.update({
      where: {
        id,
        estatus: libro.estatus,
      },
      data: {
        estatus: "ELIMINADO",
      },
    });

    return respuesta.json({
      mensaje: "Libro marcado como eliminado correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar libro:", error);

    return respuesta.status(500).json({
      mensaje: "No se pudo eliminar el libro.",
    });
  }
});

export default router;
