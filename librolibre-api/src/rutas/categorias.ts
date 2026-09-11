import { Router } from "express";

import prisma from "../prisma.js";

const router = Router();

router.get("/", async (_peticion, respuesta) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where: {
        activa: true,
      },
      orderBy: {
        nombre: "asc",
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        icono: true,
      },
    });

    return respuesta.json({
      categorias,
    });
  } catch (error) {
    console.error("Error al obtener categorías:", error);

    return respuesta.status(500).json({
      mensaje: "Ocurrió un error al obtener las categorías.",
    });
  }
});

router.post("/", async (peticion, respuesta) => {
  try {
    const { nombre, descripcion, icono } = peticion.body;

    if (!nombre?.trim()) {
      return respuesta.status(400).json({
        mensaje: "El nombre de la categoría es obligatorio.",
      });
    }

    const nombreNormalizado = nombre.trim();

    const categoriaExistente = await prisma.categoria.findUnique({
      where: {
        nombre: nombreNormalizado,
      },
    });

    if (categoriaExistente) {
      return respuesta.status(409).json({
        mensaje: "Ya existe una categoría con ese nombre.",
      });
    }

    const categoriaNueva = await prisma.categoria.create({
      data: {
        nombre: nombreNormalizado,
        descripcion: descripcion?.trim() || null,
        icono: icono?.trim() || null,
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        icono: true,
        activa: true,
        creadoEn: true,
      },
    });

    return respuesta.status(201).json({
      mensaje: "Categoría creada correctamente.",
      categoria: categoriaNueva,
    });
  } catch (error) {
    console.error("Error al crear categoría:", error);

    return respuesta.status(500).json({
      mensaje: "Ocurrió un error al crear la categoría.",
    });
  }
});

export default router;