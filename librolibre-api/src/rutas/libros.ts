import { Router } from "express";
import supabase from "../supabase.js";
import {
  type PeticionAutenticada,
  requiereAutenticacion,
} from "../intermedios/autenticacion.js";
import { autenticacionOpcional } from "../rutas/noauth.js";
import subirImagen from "../intermedios/subidaImagen.js";
import prisma from "../prisma.js";
import { optimizarImagen } from "../servicios/procesarImagen.js";

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

const modalidadesValidas: ModalidadLibro[] = ["REGALO", "INTERCAMBIO"];

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

function esModalidadValida(valor: unknown): valor is ModalidadLibro {
  return (
    typeof valor === "string" &&
    modalidadesValidas.includes(valor as ModalidadLibro)
  );
}

function esCondicionValida(valor: unknown): valor is CondicionLibro {
  return (
    typeof valor === "string" &&
    condicionesValidas.includes(valor as CondicionLibro)
  );
}

function esEstadoValido(valor: unknown): valor is EstadoLibro {
  return (
    typeof valor === "string" &&
    estadosValidos.includes(valor as EstadoLibro)
  );
}

function obtenerTextoConsulta(valor: unknown): string | undefined {
  if (typeof valor !== "string") {
    return undefined;
  }
  const texto = valor.trim();
  return texto || undefined;
}

function obtenerNumeroConsulta(valor: unknown): number | undefined {
  if (typeof valor !== "string" || !valor.trim()) {
    return undefined;
  }
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 1) {
    return undefined;
  }
  return numero;
}

const BUCKET_IMAGENES = "librolibre-imagenes";

type ImagenSubida = { url: string; ruta: string };

class ErrorImagen extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorImagen";
  }
}

// Procesar primero todos los archivos, uno a la vez. No subir imágenes
// si alguna es inválida; esto también evita ejecutar varios HEIC a la vez.
async function prepararImagenes(archivos: Express.Multer.File[]): Promise<Buffer[]> {
  const imagenes: Buffer[] = [];
  for (const archivo of archivos) {
    try {
      imagenes.push(await optimizarImagen(
        archivo.buffer,
        archivo.mimetype,
        archivo.originalname,
      ));
    } catch (error) {
      console.error("Error al procesar imagen:", archivo.originalname, error);
      throw new ErrorImagen(
        `No se pudo procesar «${archivo.originalname}». Comprueba que sea una fotografía válida de hasta 5 MB.`,
      );
    }
  }
  return imagenes;
}

async function subirImagenes(imagenes: Buffer[], rutas: string[]): Promise<ImagenSubida[]> {
  const subidas: ImagenSubida[] = [];
  for (const imagen of imagenes) {
    const ruta = `libros/${crypto.randomUUID()}.jpg`;
    // Registrar la ruta antes de subir para intentar limpiar incluso si la
    // respuesta del servicio falla después de almacenar el objeto.
    rutas.push(ruta);
    const { error } = await supabase.storage
      .from(BUCKET_IMAGENES)
      .upload(ruta, imagen, { contentType: "image/jpeg", upsert: false });
    if (error) {
      throw new Error(`Error al subir fotografía a Supabase: ${error.message}`);
    }
    const { data } = supabase.storage.from(BUCKET_IMAGENES).getPublicUrl(ruta);
    subidas.push({ ruta, url: data.publicUrl });
  }
  return subidas;
}

async function limpiarImagenes(rutas: string[]): Promise<void> {
  if (rutas.length === 0) return;
  try {
    const { error } = await supabase.storage.from(BUCKET_IMAGENES).remove(rutas);
    if (error) console.error("No se pudieron limpiar imágenes:", error);
  } catch (error) {
    console.error("Error al limpiar imágenes de Supabase:", error);
  }
}

function rutaPropiaDesdeUrl(url: string): string | null {
  try {
    const objeto = new URL(url);
    const marcador = `/storage/v1/object/public/${BUCKET_IMAGENES}/`;
    const posicion = objeto.pathname.indexOf(marcador);
    if (posicion === -1) return null;
    const ruta = decodeURIComponent(objeto.pathname.slice(posicion + marcador.length));
    return /^libros\/[a-f0-9-]+\.jpg$/i.test(ruta) ? ruta : null;
  } catch {
    return null;
  }
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
 *   publicados por el mismo usuario autenticado.
 */
router.get(
  "/",
  autenticacionOpcional,
  async (peticion: PeticionAutenticada, respuesta) => {
    try {
      const texto = obtenerTextoConsulta(peticion.query.texto);
      const categoriaId = obtenerNumeroConsulta(peticion.query.categoriaId);
      const ciudad = obtenerTextoConsulta(peticion.query.ciudad);
      const estado = obtenerTextoConsulta(peticion.query.estado);
      const modalidadConsulta = obtenerTextoConsulta(peticion.query.modalidad);
      const condicionConsulta = obtenerTextoConsulta(peticion.query.condicion);
      const estadoConsulta = obtenerTextoConsulta(peticion.query.estatus);

      if (modalidadConsulta && !esModalidadValida(modalidadConsulta)) {
        return respuesta.status(400).json({
          mensaje: "La modalidad debe ser REGALO o INTERCAMBIO.",
        });
      }

      if (condicionConsulta && !esCondicionValida(condicionConsulta)) {
        return respuesta.status(400).json({
          mensaje: "La condición indicada no es válida.",
        });
      }

      // La consulta pública solo permite publicaciones disponibles.
      // Evita revelar libros ocultos, eliminados, reservados o entregados
      // mediante el parámetro ?estatus=.
      if (estadoConsulta && estadoConsulta !== "DISPONIBLE") {
        return respuesta.status(400).json({
          mensaje: "El catálogo no es público, solo pudes consultar libros disponibles.",
        });
      }

      const libros = await prisma.libro.findMany({
        where: {
          estatus: "DISPONIBLE",
          // Solo mostrar publicaciones de propietarios activos.
          // No modifica el estatus original de los libros.
          usuario: {
            estatus: "ACTIVO",
          },
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
          ...(modalidadConsulta && esModalidadValida(modalidadConsulta)
            ? { modalidad: modalidadConsulta as never }
            : {}),
          ...(condicionConsulta && esCondicionValida(condicionConsulta)
            ? { condicion: condicionConsulta as never }
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
  async (peticion: PeticionAutenticada, respuesta) => {
    try {
      if (!peticion.usuario) {
        return respuesta.status(401).json({
          mensaje: "No fue posible identificar al usuario autenticado.",
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
      console.error("Error al obtener mis publicaciones:", error);
      return respuesta.status(500).json({
        mensaje: "No fue posible obtener tus publicaciones.",
      });
    }
  },
);

/**
 * Obtener estadísticas.
 */
router.get("/estadisticas", async (_peticion, respuesta) => {
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
    console.error("Error al obtener estadísticas:", error);
    return respuesta.status(500).json({
      mensaje: "No fue posible obtener las estadísticas.",
    });
  }
});

/**
 * Publicar libro.
 */
router.post(
  "/",
  requiereAutenticacion,
  subirImagen.array("imagenes", 6),
  async (peticion: PeticionAutenticada, respuesta) => {
    const rutasNuevas: string[] = [];
    let guardado = false;
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
      if (!Number.isInteger(categoriaIdNumero) || categoriaIdNumero < 1) {
        return respuesta.status(400).json({
          mensaje: "La categoría seleccionada no es válida.",
        });
      }

      if (!esCondicionValida(condicion)) {
        return respuesta.status(400).json({
          mensaje: "La condición del libro no es válida.",
        });
      }

      if (!esModalidadValida(modalidad)) {
        return respuesta.status(400).json({
          mensaje: "La modalidad debe ser REGALO o INTERCAMBIO.",
        });
      }

      if (modalidad === "INTERCAMBIO" && !descripcionIntercambio?.trim()) {
        return respuesta.status(400).json({
          mensaje: "Describe qué te interesa recibir a cambio del libro.",
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
            mensaje: "El año de publicación no es válido.",
          });
        }
      }

      const categoria = await prisma.categoria.findFirst({
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
          mensaje: "La categoría no existe o no está activa.",
        });
      }

      if (!peticion.usuario) {
        return respuesta.status(401).json({
          mensaje: "No fue posible identificar al usuario autenticado.",
        });
      }

      const archivos = Array.isArray(peticion.files) ? peticion.files : [];
      if (archivos.length === 0) {
        return respuesta.status(400).json({
          mensaje: "Debes agregar al menos una imagen.",
        });
      }

      const imagenes = await prepararImagenes(archivos);
      const subidas = await subirImagenes(imagenes, rutasNuevas);

      // Libro e imágenes se guardan en una única transacción PostgreSQL.
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
          imagenes: {
            create: subidas.map((imagen, indice) => ({
              url: imagen.url,
              esPortada: indice === 0,
              orden: indice + 1,
            })),
          },
        },
      });
      guardado = true;

      const libroConImagenes = await prisma.libro.findUnique({
        where: { id: libroNuevo.id },
        include: incluirDatosLibro,
      });

      return respuesta.status(201).json({
        mensaje: "Libro publicado correctamente.",
        libro: libroConImagenes,
      });
    } catch (error) {
      if (!guardado) await limpiarImagenes(rutasNuevas);
      if (error instanceof ErrorImagen) {
        return respuesta.status(422).json({ mensaje: error.message });
      }
      console.error("Error al publicar libro:", error);
      return respuesta.status(500).json({
        mensaje: "Ocurrió un error interno al publicar el libro.",
      });
    }
  },
);

/**
 * Editar publicación.
 *
 * Si no se envían imágenes nuevas, conserva las imágenes actuales.
 * Si se envían imágenes nuevas, reemplaza las imágenes anteriores.
 */
router.put(
  "/:id",
  requiereAutenticacion,
  subirImagen.array("imagenes", 6),
  async (peticion: PeticionAutenticada, respuesta) => {
    const rutasNuevas: string[] = [];
    let guardado = false;
    try {
      const id = Number(peticion.params.id);
      if (!Number.isInteger(id) || id < 1) {
        return respuesta.status(400).json({
          mensaje: "El identificador del libro no es válido.",
        });
      }

      if (!peticion.usuario) {
        return respuesta.status(401).json({
          mensaje: "No fue posible identificar al usuario autenticado.",
        });
      }

      const libroExistente = await prisma.libro.findFirst({
        where: {
          id,
          usuarioId: peticion.usuario.id,
          estatus: "DISPONIBLE",
        },
        select: {
          id: true,
        },
      });

      if (!libroExistente) {
        return respuesta.status(404).json({
          mensaje:
            "La publicación no existe, no te pertenece o no está disponible para editar.",
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
      if (!Number.isInteger(categoriaIdNumero) || categoriaIdNumero < 1) {
        return respuesta.status(400).json({
          mensaje: "La categoría seleccionada no es válida.",
        });
      }

      if (!esCondicionValida(condicion)) {
        return respuesta.status(400).json({
          mensaje: "La condición del libro no es válida.",
        });
      }

      if (!esModalidadValida(modalidad)) {
        return respuesta.status(400).json({
          mensaje: "La modalidad debe ser REGALO o INTERCAMBIO.",
        });
      }

      if (modalidad === "INTERCAMBIO" && !descripcionIntercambio?.trim()) {
        return respuesta.status(400).json({
          mensaje: "Describe qué te interesa recibir a cambio del libro.",
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
            mensaje: "El año de publicación no es válido.",
          });
        }
      }

      const categoria = await prisma.categoria.findFirst({
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
          mensaje: "La categoría no existe o no está activa.",
        });
      }

      const archivos = Array.isArray(peticion.files) ? peticion.files : [];

      const imagenesAnteriores = archivos.length > 0
        ? await prisma.imagenLibro.findMany({
            where: { libroId: libroExistente.id },
            select: { url: true },
          })
        : [];

      const imagenesPreparadas = await prepararImagenes(archivos);
      const imagenesNuevas = await subirImagenes(imagenesPreparadas, rutasNuevas);

      const libroActualizado = await prisma.$transaction(
        async (transaccion) => {
          // Comprobar propietario y estado de forma atómica al guardar.
          const actualizacion = await transaccion.libro.updateMany({
            where: {
              id: libroExistente.id,
              usuarioId: peticion.usuario!.id,
              estatus: "DISPONIBLE",
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

          if (actualizacion.count !== 1) {
            throw new Error("LIBRO_NO_DISPONIBLE");
          }

          if (archivos.length > 0) {
            await transaccion.imagenLibro.deleteMany({
              where: {
                libroId: libroExistente.id,
              },
            });

            await transaccion.imagenLibro.createMany({
              data: imagenesNuevas.map((imagen, indice) => ({
                libroId: libroExistente.id,
                url: imagen.url,
                esPortada: indice === 0,
                orden: indice + 1,
              })),
            });
          }

          return transaccion.libro.findUniqueOrThrow({
            where: { id: libroExistente.id },
          });
        },
      );

      guardado = true;
      // Borrar las imágenes anteriores solo después de confirmar la transacción.
      // Una falla de limpieza no revierte la edición ya guardada.
      const rutasAnteriores = imagenesAnteriores
        .map((imagen) => rutaPropiaDesdeUrl(imagen.url))
        .filter((ruta): ruta is string => ruta !== null);
      await limpiarImagenes(rutasAnteriores);

      const libroConImagenes = await prisma.libro.findUnique({
        where: {
          id: libroActualizado.id,
        },
        include: incluirDatosLibro,
      });

      return respuesta.json({
        mensaje: "Publicación actualizada correctamente.",
        libro: libroConImagenes,
      });
    } catch (error) {
      if (!guardado) await limpiarImagenes(rutasNuevas);
      if (error instanceof ErrorImagen) {
        return respuesta.status(422).json({ mensaje: error.message });
      }
      if (error instanceof Error && error.message === "LIBRO_NO_DISPONIBLE") {
        return respuesta.status(409).json({
          mensaje: "La publicación cambió de estado y ya no se puede editar.",
        });
      }
      console.error("Error al actualizar libro:", error);
      return respuesta.status(500).json({
        mensaje: "Ocurrió un error interno al actualizar la publicación.",
      });
    }
  },
);

/**
 * Eliminar publicación.
 *
 * Se utiliza borrado lógico: el registro permanece en la base de datos
 * y su estatus cambia a ELIMINADO.
 */
router.delete(
  "/:id",
  requiereAutenticacion,
  async (peticion: PeticionAutenticada, respuesta) => {
    try {
      const id = Number(peticion.params.id);
      if (!Number.isInteger(id) || id < 1) {
        return respuesta.status(400).json({
          mensaje: "El identificador del libro no es válido.",
        });
      }

      if (!peticion.usuario) {
        return respuesta.status(401).json({
          mensaje: "No fue posible identificar al usuario autenticado.",
        });
      }

      const libro = await prisma.libro.findFirst({
        where: {
          id,
          usuarioId: peticion.usuario.id,
          estatus: {
            in: ["DISPONIBLE", "OCULTO"],
          },
        },
        select: {
          id: true,
        },
      });

      if (!libro) {
        return respuesta.status(404).json({
          mensaje:
            "La publicación no existe, no te pertenece o su estado no permite eliminarla.",
        });
      }

      // La condición se vuelve a comprobar al modificar el registro.
      const resultado = await prisma.libro.updateMany({
        where: {
          id: libro.id,
          usuarioId: peticion.usuario.id,
          estatus: {
            in: ["DISPONIBLE", "OCULTO"],
          },
        },
        data: {
          estatus: "ELIMINADO",
        },
      });

      if (resultado.count !== 1) {
        return respuesta.status(409).json({
          mensaje: "La publicación cambió de estado y ya no se puede eliminar.",
        });
      }

      return respuesta.json({
        mensaje: "La publicación fue eliminada correctamente.",
      });
    } catch (error) {
      console.error("Error al eliminar libro:", error);
      return respuesta.status(500).json({
        mensaje: "Ocurrió un error interno al eliminar la publicación.",
      });
    }
  },
);

/**
 * Obtener detalle de un libro.
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
        // Solo los libros disponibles tienen detalle público.
        estatus: "DISPONIBLE",
        // Evita acceder por URL directa a libros de cuentas bloqueadas.
        usuario: {
          estatus: "ACTIVO",
        },
      },
      include: incluirDatosLibro,
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
    console.error("Error al obtener el detalle del libro:", error);
    return respuesta.status(500).json({
      mensaje: "Ocurrió un error al obtener el detalle del libro.",
    });
  }
});

export default router;