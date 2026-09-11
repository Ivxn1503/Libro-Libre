import { Router } from "express";

import {
  type PeticionAutenticada,
  requiereAutenticacion,
} from "../intermedios/autenticacion.js";
import prisma from "../prisma.js";

const router = Router();

type ModalidadLibro = "REGALO" | "INTERCAMBIO";

type CondicionLibro =
  | "COMO_NUEVO"
  | "MUY_BUEN_ESTADO"
  | "BUEN_ESTADO"
  | "USO_CONSIDERABLE"
  | "DANADO";

type EstadoLibro =
  | "DISPONIBLE"
  | "RESERVADO"
  | "ENTREGADO"
  | "OCULTO"
  | "ELIMINADO";

const modalidadesValidas: ModalidadLibro[] = [
  "REGALO",
  "INTERCAMBIO",
];

const condicionesValidas: CondicionLibro[] = [
  "COMO_NUEVO",
  "MUY_BUEN_ESTADO",
  "BUEN_ESTADO",
  "USO_CONSIDERABLE",
  "DANADO",
];

const estadosValidos: EstadoLibro[] = [
  "DISPONIBLE",
  "RESERVADO",
  "ENTREGADO",
  "OCULTO",
  "ELIMINADO",
];

function esModalidadValida(
  valor: unknown,
): valor is ModalidadLibro {
  return (
    typeof valor === "string" &&
    modalidadesValidas.includes(valor as ModalidadLibro)
  );
}

function esCondicionValida(
  valor: unknown,
): valor is CondicionLibro {
  return (
    typeof valor === "string" &&
    condicionesValidas.includes(valor as CondicionLibro)
  );
}

function esEstadoValido(
  valor: unknown,
): valor is EstadoLibro {
  return (
    typeof valor === "string" &&
    estadosValidos.includes(valor as EstadoLibro)
  );
}

function obtenerTextoConsulta(
  valor: unknown,
): string | undefined {
  if (typeof valor !== "string") {
    return undefined;
  }

  const texto = valor.trim();

  return texto || undefined;
}

function obtenerNumeroConsulta(
  valor: unknown,
): number | undefined {
  if (typeof valor !== "string" || !valor.trim()) {
    return undefined;
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero < 1) {
    return undefined;
  }

  return numero;
}

/*
|--------------------------------------------------------------------------
| GET /api/libros
|--------------------------------------------------------------------------
| Feed público de libros disponibles.
*/
router.get("/", async (peticion, respuesta) => {
  try {
    const texto = obtenerTextoConsulta(
      peticion.query.texto,
    );

    const categoriaId = obtenerNumeroConsulta(
      peticion.query.categoriaId,
    );

    const ciudad = obtenerTextoConsulta(
      peticion.query.ciudad,
    );

    const estado = obtenerTextoConsulta(
      peticion.query.estado,
    );

    const modalidadConsulta = obtenerTextoConsulta(
      peticion.query.modalidad,
    );

    const condicionConsulta = obtenerTextoConsulta(
      peticion.query.condicion,
    );

    const estadoConsulta = obtenerTextoConsulta(
      peticion.query.estatus,
    );

    if (
      modalidadConsulta &&
      !esModalidadValida(modalidadConsulta)
    ) {
      return respuesta.status(400).json({
        mensaje:
          "La modalidad debe ser REGALO o INTERCAMBIO.",
      });
    }

    if (
      condicionConsulta &&
      !esCondicionValida(condicionConsulta)
    ) {
      return respuesta.status(400).json({
        mensaje:
          "La condición indicada no es válida.",
      });
    }

    const estatusTexto =
      estadoConsulta || "DISPONIBLE";

    if (!esEstadoValido(estatusTexto)) {
      return respuesta.status(400).json({
        mensaje:
          "El estatus indicado no es válido.",
      });
    }

    const estatus: EstadoLibro = estatusTexto;

    const libros = await prisma.libro.findMany({
      where: {
        estatus: estatus as never,

        ...(categoriaId
          ? {
              categoriaId,
            }
          : {}),

        ...(modalidadConsulta &&
        esModalidadValida(modalidadConsulta)
          ? {
              modalidad: modalidadConsulta as never,
            }
          : {}),

        ...(condicionConsulta &&
        esCondicionValida(condicionConsulta)
          ? {
              condicion: condicionConsulta as never,
            }
          : {}),

        ...(ciudad
          ? {
              ciudad: {
                equals: ciudad,
                mode: "insensitive",
              },
            }
          : {}),

        ...(estado
          ? {
              estado: {
                equals: estado,
                mode: "insensitive",
              },
            }
          : {}),

        ...(texto
          ? {
              OR: [
                {
                  titulo: {
                    contains: texto,
                    mode: "insensitive",
                  },
                },
                {
                  autor: {
                    contains: texto,
                    mode: "insensitive",
                  },
                },
                {
                  editorial: {
                    contains: texto,
                    mode: "insensitive",
                  },
                },
                {
                  descripcion: {
                    contains: texto,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },

      orderBy: {
        creadoEn: "desc",
      },

      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
            icono: true,
          },
        },

        usuario: {
          select: {
            id: true,
            nombre: true,
            ciudad: true,
            estado: true,
            foto: true,
          },
        },

        imagenes: {
          orderBy: {
            orden: "asc",
          },
          select: {
            id: true,
            url: true,
            esPortada: true,
            orden: true,
          },
        },
      },
    });

    return respuesta.json({
      total: libros.length,
      libros,
    });
  } catch (error) {
    console.error(
      "Error al obtener libros:",
      error,
    );

    return respuesta.status(500).json({
      mensaje:
        "Ocurrió un error al obtener los libros.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/libros
|--------------------------------------------------------------------------
| Publica un libro. Requiere JWT.
*/
router.post(
  "/",
  requiereAutenticacion,
  async (
    peticion: PeticionAutenticada,
    respuesta,
  ) => {
    try {
      const {
        titulo,
        autor,
        editorial,
        isbn,
        anoPublicacion,
        categoriaId,
        condicion,
        descripcion,
        modalidad,
        descripcionIntercambio,
        ciudad,
        estado,
        colonia,
      } = peticion.body;

      if (
        !titulo?.trim() ||
        !autor?.trim() ||
        !categoriaId ||
        !condicion ||
        !descripcion?.trim() ||
        !modalidad ||
        !ciudad?.trim() ||
        !estado?.trim()
      ) {
        return respuesta.status(400).json({
          mensaje:
            "Título, autor, categoría, condición, descripción, modalidad, ciudad y estado son obligatorios.",
        });
      }

      const categoriaIdNumero = Number(
        categoriaId,
      );

      if (
        !Number.isInteger(categoriaIdNumero) ||
        categoriaIdNumero < 1
      ) {
        return respuesta.status(400).json({
          mensaje:
            "La categoría seleccionada no es válida.",
        });
      }

      if (!esCondicionValida(condicion)) {
        return respuesta.status(400).json({
          mensaje:
            "La condición del libro no es válida.",
        });
      }

      if (!esModalidadValida(modalidad)) {
        return respuesta.status(400).json({
          mensaje:
            "La modalidad debe ser REGALO o INTERCAMBIO.",
        });
      }

      if (
        modalidad === "INTERCAMBIO" &&
        !descripcionIntercambio?.trim()
      ) {
        return respuesta.status(400).json({
          mensaje:
            "Describe qué te interesa recibir a cambio del libro.",
        });
      }

      let anoPublicacionNumero: number | null =
        null;

      if (
        anoPublicacion !== undefined &&
        anoPublicacion !== null &&
        anoPublicacion !== ""
      ) {
        anoPublicacionNumero = Number(
          anoPublicacion,
        );

        const anoActual =
          new Date().getFullYear();

        if (
          !Number.isInteger(
            anoPublicacionNumero,
          ) ||
          anoPublicacionNumero < 1000 ||
          anoPublicacionNumero > anoActual
        ) {
          return respuesta.status(400).json({
            mensaje:
              "El año de publicación no es válido.",
          });
        }
      }

      const categoria =
        await prisma.categoria.findFirst({
          where: {
            id: categoriaIdNumero,
            activa: true,
          },
          select: {
            id: true,
          },
        });

      if (!categoria) {
        return respuesta.status(404).json({
          mensaje:
            "La categoría no existe o no está activa.",
        });
      }

      if (!peticion.usuario) {
        return respuesta.status(401).json({
          mensaje:
            "No fue posible identificar al usuario autenticado.",
        });
      }

      const libroNuevo =
        await prisma.libro.create({
          data: {
            titulo: titulo.trim(),
            autor: autor.trim(),
            editorial:
              editorial?.trim() || null,
            isbn: isbn?.trim() || null,
            anoPublicacion:
              anoPublicacionNumero,
            categoriaId: categoria.id,
            condicion: condicion as never,
            descripcion: descripcion.trim(),
            modalidad: modalidad as never,
            descripcionIntercambio:
              modalidad === "INTERCAMBIO"
                ? descripcionIntercambio.trim()
                : null,
            ciudad: ciudad.trim(),
            estado: estado.trim(),
            colonia: colonia?.trim() || null,
            usuarioId: peticion.usuario.id,
          },

          include: {
            categoria: {
              select: {
                id: true,
                nombre: true,
                icono: true,
              },
            },

            usuario: {
              select: {
                id: true,
                nombre: true,
                ciudad: true,
                estado: true,
                foto: true,
              },
            },

            imagenes: {
              orderBy: {
                orden: "asc",
              },
            },
          },
        });

      return respuesta.status(201).json({
        mensaje:
          "Libro publicado correctamente.",
        libro: libroNuevo,
      });
    } catch (error) {
      console.error(
        "Error al publicar libro:",
        error,
      );

      return respuesta.status(500).json({
        mensaje:
          "Ocurrió un error interno al publicar el libro.",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| GET /api/libros/:id
|--------------------------------------------------------------------------
| Obtiene el detalle público de un libro.
*/
router.get("/:id", async (peticion, respuesta) => {
  try {
    const id = Number(peticion.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return respuesta.status(400).json({
        mensaje: "El identificador del libro no es válido.",
      });
    }

    const libro = await prisma.libro.findFirst({
      where: {
        id,
        estatus: {
          not: "ELIMINADO" as never,
        },
      },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
            descripcion: true,
            icono: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            ciudad: true,
            estado: true,
            foto: true,
            descripcion: true,
          },
        },
        imagenes: {
          orderBy: {
            orden: "asc",
          },
          select: {
            id: true,
            url: true,
            esPortada: true,
            orden: true,
          },
        },
      },
    });

    if (!libro) {
      return respuesta.status(404).json({
        mensaje: "No se encontró el libro solicitado.",
      });
    }

    return respuesta.json({
      libro,
    });
  } catch (error) {
    console.error(
      "Error al obtener el detalle del libro:",
      error,
    );

    return respuesta.status(500).json({
      mensaje:
        "Ocurrió un error al obtener el detalle del libro.",
    });
  }
});

export default router;