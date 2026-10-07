import { Router } from "express";

import supabase from "../supabase.js";

import {

  type PeticionAutenticada,

  requiereAutenticacion,

} from "../intermedios/autenticacion.js";

import {

  autenticacionOpcional,

} from "../rutas/noauth.js";

import subirImagen from "../intermedios/subidaImagen.js";

import prisma from "../prisma.js";

const router = Router();

type ModalidadLibro = "REGALO" | "INTERCAMBIO";

type CondicionLibro =

  | "COMO_NUEVO"

  | "MUY_BUEN_ESTADO"

  | "BUEN_ESTADO"

  | "USO_CONSIDERABLE"

  | "DANADO";

async function subirImagenLibro(
  archivo: Express.Multer.File,
) {
  const extension =
    archivo.originalname.split(".").pop()?.toLowerCase() ||
    "jpg";

  const nombreArchivo =
    `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const ruta = `libros/${nombreArchivo}`;

  console.log("=== SUBIENDO IMAGEN ===");
  console.log("Nombre original:", archivo.originalname);
  console.log("MIME:", archivo.mimetype);
  console.log("Tamaño:", archivo.size);
  console.log("Buffer:", Buffer.isBuffer(archivo.buffer));
  console.log("Bytes buffer:", archivo.buffer?.length);
  console.log("Ruta:", ruta);

  try {
    const { data, error } = await supabase.storage
      .from("librolibre-imagenes")
      .upload(ruta, archivo.buffer, {
        contentType: archivo.mimetype,
        upsert: false,
      });

    if (error) {
      console.error(
        "ERROR COMPLETO DE SUPABASE STORAGE:",
        error,
      );

      throw new Error(
        `Error al subir imagen a Supabase: ${error.message}`,
      );
    }

    console.log("Imagen subida:", data);

    const { data: datosUrl } = supabase.storage
      .from("librolibre-imagenes")
      .getPublicUrl(ruta);

    console.log("URL pública:", datosUrl.publicUrl);

    return datosUrl.publicUrl;
  } catch (error) {
    console.error(
      "ERROR CAPTURADO AL SUBIR LA IMAGEN:",
      error,
    );

    if (error instanceof Error && "cause" in error) {
      console.error(
        "CAUSA DEL ERROR:",
        (error as Error & { cause?: unknown }).cause,
      );
    }

    throw error;
  }
}

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

const incluirDatosLibro = {

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

      telefono: true,

      ciudad: true,

      estado: true,

      foto: true,

      descripcion: true,

    },

  },

  imagenes: {

    orderBy: {

      orden: "asc" as const,

    },

    select: {

      id: true,

      url: true,

      esPortada: true,

      orden: true,

    },

  },

};

/**

 * Obtener libros para explorar.

 *

 * Sin sesión:

 * - Muestra todos los libros disponibles.

 *

 * Con sesión:

 * - Muestra libros disponibles, excepto los libros

 *   publicados por el mismo usuario autenticado.

 */

router.get(

  "/",

  autenticacionOpcional,

  async (

    peticion: PeticionAutenticada,

    respuesta,

  ) => {

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

          mensaje: "La modalidad debe ser REGALO o INTERCAMBIO.",

        });

      }

      if (

        condicionConsulta &&

        !esCondicionValida(condicionConsulta)

      ) {

        return respuesta.status(400).json({

          mensaje: "La condición indicada no es válida.",

        });

      }

      const estatusTexto = estadoConsulta || "DISPONIBLE";

      if (!esEstadoValido(estatusTexto)) {

        return respuesta.status(400).json({

          mensaje: "El estatus indicado no es válido.",

        });

      }

      const libros = await prisma.libro.findMany({

        where: {

          estatus: estatusTexto as never,

          /*

           * Si hay sesión, se excluyen los libros publicados

           * por el usuario actual.

           *

           * Si no hay sesión, esta condición no se agrega y

           * el visitante ve todos los libros disponibles.

           */

          ...(peticion.usuario

            ? {

              usuarioId: {

                not: peticion.usuario.id,

              },

            }

            : {}),

          ...(categoriaId ? { categoriaId } : {}),

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

        include: incluirDatosLibro,

      });

      return respuesta.json({

        total: libros.length,

        libros,

      });

    } catch (error) {

      console.error("Error al obtener libros:", error);

      return respuesta.status(500).json({

        mensaje: "Ocurrió un error al obtener los libros.",

      });

    }

  },

);

/**

 * Obtener mis publicaciones.

 *

 * Esta ruta debe estar antes de /:id.

 */

router.get(

  "/mios",

  requiereAutenticacion,

  async (

    peticion: PeticionAutenticada,

    respuesta,

  ) => {

    try {

      if (!peticion.usuario) {

        return respuesta.status(401).json({

          mensaje:

            "No fue posible identificar al usuario autenticado.",

        });

      }

      const libros = await prisma.libro.findMany({

        where: {

          usuarioId: peticion.usuario.id,

          estatus: {

            not: "ELIMINADO" as never,

          },

        },

        orderBy: {

          creadoEn: "desc",

        },

        include: incluirDatosLibro,

      });

      return respuesta.json({

        total: libros.length,

        libros,

      });

    } catch (error) {

      console.error(

        "Error al obtener mis publicaciones:",

        error,

      );

      return respuesta.status(500).json({

        mensaje:

          "No fue posible obtener tus publicaciones.",

      });

    }

  },

);

/**

 * Obtener estadísticas.

 */

router.get(

  "/estadisticas",

  async (_peticion, respuesta) => {

    try {

      const [

        librosReutilizados,

        usuariosEnComunidad,

        intercambiosRealizados,

        librosRegalados,

      ] = await Promise.all([

        prisma.libro.count({

          where: {

            estatus: {

              in: ["RESERVADO", "ENTREGADO"] as never,

            },

          },

        }),

        prisma.usuario.count({

          where: {

            estatus: "ACTIVO" as never,

          },

        }),

        prisma.libro.count({

          where: {

            modalidad: "INTERCAMBIO" as never,

            estatus: "ENTREGADO" as never,

          },

        }),

        prisma.libro.count({

          where: {

            modalidad: "REGALO" as never,

            estatus: "ENTREGADO" as never,

          },

        }),

      ]);

      return respuesta.json({

        librosReutilizados,

        usuariosEnComunidad,

        intercambiosRealizados,

        librosRegalados,

      });

    } catch (error) {

      console.error(

        "Error al obtener estadísticas:",

        error,

      );

      return respuesta.status(500).json({

        mensaje:

          "No fue posible obtener las estadísticas.",

      });

    }

  },

);

/**

 * Publicar libro.

 */

router.post(

  "/",

  requiereAutenticacion,

  subirImagen.array("imagenes", 6),

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

      const categoriaIdNumero = Number(categoriaId);

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

      let anoPublicacionNumero: number | null = null;

      if (

        anoPublicacion !== undefined &&

        anoPublicacion !== null &&

        anoPublicacion !== ""

      ) {

        anoPublicacionNumero = Number(anoPublicacion);

        const anoActual = new Date().getFullYear();

        if (

          !Number.isInteger(anoPublicacionNumero) ||

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

      const archivos = Array.isArray(peticion.files)

        ? peticion.files

        : [];

      if (archivos.length === 0) {

        return respuesta.status(400).json({

          mensaje:

            "Debes agregar al menos una imagen.",

        });

      }

      const libroNuevo = await prisma.libro.create({

        data: {

          titulo: titulo.trim(),

          autor: autor.trim(),

          editorial: editorial?.trim() || null,

          isbn: isbn?.trim() || null,

          anoPublicacion: anoPublicacionNumero,

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

      });

      const urlsImagenes = await Promise.all(

        archivos.map((archivo) =>

          subirImagenLibro(archivo),

        ),

      );

      await prisma.imagenLibro.createMany({

        data: urlsImagenes.map((url, indice) => ({

          libroId: libroNuevo.id,

          url,

          esPortada: indice === 0,

          orden: indice + 1,

        })),

      });

      const libroConImagenes =

        await prisma.libro.findUnique({

          where: {

            id: libroNuevo.id,

          },

          include: incluirDatosLibro,

        });

      return respuesta.status(201).json({

        mensaje: "Libro publicado correctamente.",

        libro: libroConImagenes,

      });

    } catch (error) {

      console.error("Error al publicar libro:", error);

      return respuesta.status(500).json({

        mensaje:

          "Ocurrió un error interno al publicar el libro.",

      });

    }

  },

);

/**

 * Editar publicación.

 *

 * Si no se envían imágenes nuevas,

 * conserva las imágenes actuales.

 *

 * Si se envían imágenes nuevas,

 * reemplaza las imágenes anteriores.

 */

router.put(

  "/:id",

  requiereAutenticacion,

  subirImagen.array("imagenes", 6),

  async (

    peticion: PeticionAutenticada,

    respuesta,

  ) => {

    try {

      const id = Number(peticion.params.id);

      if (!Number.isInteger(id) || id < 1) {

        return respuesta.status(400).json({

          mensaje:

            "El identificador del libro no es válido.",

        });

      }

      if (!peticion.usuario) {

        return respuesta.status(401).json({

          mensaje:

            "No fue posible identificar al usuario autenticado.",

        });

      }

      const libroExistente =

        await prisma.libro.findFirst({

          where: {

            id,

            usuarioId: peticion.usuario.id,

            estatus: {

              not: "ELIMINADO" as never,

            },

          },

          select: {

            id: true,

          },

        });

      if (!libroExistente) {

        return respuesta.status(404).json({

          mensaje:

            "No se encontró la publicación o no tienes permiso para editarla.",

        });

      }

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

      const categoriaIdNumero = Number(categoriaId);

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

      let anoPublicacionNumero: number | null = null;

      if (

        anoPublicacion !== undefined &&

        anoPublicacion !== null &&

        anoPublicacion !== ""

      ) {

        anoPublicacionNumero = Number(anoPublicacion);

        const anoActual = new Date().getFullYear();

        if (

          !Number.isInteger(anoPublicacionNumero) ||

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

      const archivos = Array.isArray(peticion.files)

        ? peticion.files

        : [];

      const urlsImagenesNuevas =

        archivos.length > 0

          ? await Promise.all(

              archivos.map((archivo) =>

                subirImagenLibro(archivo),

              ),

            )

          : [];

      const libroActualizado =

        await prisma.$transaction(

          async (transaccion) => {

            const libro =

              await transaccion.libro.update({

                where: {

                  id: libroExistente.id,

                },

                data: {

                  titulo: titulo.trim(),

                  autor: autor.trim(),

                  editorial: editorial?.trim() || null,

                  isbn: isbn?.trim() || null,

                  anoPublicacion: anoPublicacionNumero,

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

                },

              });

            if (archivos.length > 0) {

              await transaccion.imagenLibro.deleteMany({

                where: {

                  libroId: libroExistente.id,

                },

              });

              await transaccion.imagenLibro.createMany({

                data: urlsImagenesNuevas.map((url, indice) => ({

                  libroId: libroExistente.id,

                  url,

                  esPortada: indice === 0,

                  orden: indice + 1,

                })),

              });

            }

            return libro;

          },

        );

      const libroConImagenes =

        await prisma.libro.findUnique({

          where: {

            id: libroActualizado.id,

          },

          include: incluirDatosLibro,

        });

      return respuesta.json({

        mensaje:

          "Publicación actualizada correctamente.",

        libro: libroConImagenes,

      });

    } catch (error) {

      console.error(

        "Error al actualizar libro:",

        error,

      );

      return respuesta.status(500).json({

        mensaje:

          "Ocurrió un error interno al actualizar la publicación.",

      });

    }

  },

);

/**

 * Eliminar publicación.

 *

 * Se utiliza borrado lógico:

 * el registro permanece en la base de datos

 * y su estatus cambia a ELIMINADO.

 */

router.delete(

  "/:id",

  requiereAutenticacion,

  async (

    peticion: PeticionAutenticada,

    respuesta,

  ) => {

    try {

      const id = Number(peticion.params.id);

      if (!Number.isInteger(id) || id < 1) {

        return respuesta.status(400).json({

          mensaje:

            "El identificador del libro no es válido.",

        });

      }

      if (!peticion.usuario) {

        return respuesta.status(401).json({

          mensaje:

            "No fue posible identificar al usuario autenticado.",

        });

      }

      const libro =

        await prisma.libro.findFirst({

          where: {

            id,

            usuarioId: peticion.usuario.id,

            estatus: {

              not: "ELIMINADO" as never,

            },

          },

          select: {

            id: true,

          },

        });

      if (!libro) {

        return respuesta.status(404).json({

          mensaje:

            "No se encontró la publicación o no tienes permiso para eliminarla.",

        });

      }

      await prisma.libro.update({

        where: {

          id: libro.id,

        },

        data: {

          estatus: "ELIMINADO" as never,

        },

      });

      return respuesta.json({

        mensaje:

          "La publicación fue eliminada correctamente.",

      });

    } catch (error) {

      console.error(

        "Error al eliminar libro:",

        error,

      );

      return respuesta.status(500).json({

        mensaje:

          "Ocurrió un error interno al eliminar la publicación.",

      });

    }

  },

);

/**

 * Obtener detalle de un libro.

 */

router.get(

  "/:id",

  async (peticion, respuesta) => {

    try {

      const id = Number(peticion.params.id);

      if (!Number.isInteger(id) || id < 1) {

        return respuesta.status(400).json({

          mensaje:

            "El identificador del libro no es válido.",

        });

      }

      const libro =

        await prisma.libro.findFirst({

          where: {

            id,

            estatus: {

              not: "ELIMINADO" as never,

            },

          },

          include: incluirDatosLibro,

        });

      if (!libro) {

        return respuesta.status(404).json({

          mensaje:

            "No se encontró el libro solicitado.",

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

  },

);

export default router;
