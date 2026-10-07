import { useEffect, useMemo, useState } from "react";

import { URL_API } from "../config";

import {
  ArrowLeft,
  BookOpen,
  Gift,
  MapPin,
  MessageCircle,
  Repeat2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

type ImagenLibro = {
  id: number;
  url: string;
  esPortada: boolean;
  orden: number;
};

type LibroDetalle = {
  id: number;
  titulo: string;
  autor: string;
  editorial: string | null;
  isbn: string | null;
  anoPublicacion: number | null;
  condicion: string;
  descripcion: string;
  modalidad: "REGALO" | "INTERCAMBIO";
  descripcionIntercambio: string | null;
  ciudad: string;
  estado: string;
  colonia: string | null;
  estatus:
    | "DISPONIBLE"
    | "RESERVADO"
    | "ENTREGADO"
    | string;
  imagenes: ImagenLibro[];

  categoria?: {
    id: number;
    nombre: string;
    descripcion?: string | null;
    icono?: string | null;
  } | null;

  usuario?: {
    id: number;
    nombre: string;
    telefono?: string | null;
    ciudad?: string | null;
    estado?: string | null;
    foto?: string | null;
    descripcion?: string | null;
  } | null;
};

type RespuestaApi = {
  libro?: LibroDetalle;
  mensaje?: string;
};

type UsuarioGuardado = {
  id?: number;
};


function DetalleLibroPag() {
  const navegar = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [libro, setLibro] =
    useState<LibroDetalle | null>(null);

  const [indiceImagen, setIndiceImagen] =
    useState(0);

  const [estaCargando, setEstaCargando] =
    useState(true);

  const [mensajeError, setMensajeError] =
    useState("");

  const obtenerIdUsuarioActual = (): number | null => {
    const usuarioGuardado =
      localStorage.getItem("usuario");

    if (!usuarioGuardado) {
      return null;
    }

    try {
      const usuario = JSON.parse(
        usuarioGuardado,
      ) as UsuarioGuardado;

      if (
        typeof usuario.id !== "number" ||
        !Number.isInteger(usuario.id)
      ) {
        return null;
      }

      return usuario.id;
    } catch {
      return null;
    }
  };

  const idUsuarioActual =
    obtenerIdUsuarioActual();

  useEffect(() => {
    const cargarLibro = async () => {
      if (!id) {
        setMensajeError(
          "El identificador del libro no es válido.",
        );
        setEstaCargando(false);
        return;
      }

      try {
        setEstaCargando(true);
        setMensajeError("");

        const respuesta = await fetch(
          `${URL_API}/api/libros/${id}`,
        );

        const datos =
          (await respuesta.json()) as RespuestaApi;

        if (!respuesta.ok || !datos.libro) {
          throw new Error(
            datos.mensaje ??
              "No se encontró el libro.",
          );
        }

        setLibro(datos.libro);
        setIndiceImagen(0);
      } catch (error) {
        console.error(
          "Error al cargar el detalle:",
          error,
        );

        setMensajeError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el libro.",
        );
      } finally {
        setEstaCargando(false);
      }
    };

    cargarLibro();
  }, [id]);

  const imagenesOrdenadas = useMemo(() => {
    return [...(libro?.imagenes ?? [])].sort(
      (imagenA, imagenB) =>
        imagenA.orden - imagenB.orden,
    );
  }, [libro]);

  const imagenActual =
    imagenesOrdenadas[indiceImagen];

  const esLibroPropio =
    idUsuarioActual !== null &&
    libro?.usuario?.id === idUsuarioActual;

  const obtenerUrlImagen = (url: string) => {
    if (
      url.startsWith("http://") ||
      url.startsWith("https://")
    ) {
      return url;
    }

    return `${URL_API}${
      url.startsWith("/") ? url : `/${url}`
    }`;
  };

  const obtenerUrlFotoUsuario = (
    foto: string | null | undefined,
  ) => {
    if (!foto) {
      return "/avatar-default.png";
    }

    if (
      foto.startsWith("http://") ||
      foto.startsWith("https://")
    ) {
      return foto;
    }

    return `${URL_API}${
      foto.startsWith("/") ? foto : `/${foto}`
    }`;
  };

  const obtenerNombreCondicion = (
    condicion: string,
  ) => {
    const nombres: Record<string, string> = {
      COMO_NUEVO: "Como nuevo",
      MUY_BUEN_ESTADO: "Muy buen estado",
      BUEN_ESTADO: "Buen estado",
      USO_CONSIDERABLE: "Uso considerable",
      DANADO: "Dañado",
    };

    return nombres[condicion] ?? condicion;
  };

  const obtenerNombreEstatus = (
    estatus: string,
  ) => {
    const nombres: Record<string, string> = {
      DISPONIBLE: "Disponible",
      RESERVADO: "Reservado",
      ENTREGADO: "Entregado",
    };

    return nombres[estatus] ?? estatus;
  };

  const obtenerUrlWhatsApp = () => {
    if (
      esLibroPropio ||
      !libro?.usuario?.telefono
    ) {
      return null;
    }

    const telefono =
      libro.usuario.telefono.replace(/\D/g, "");

    if (!telefono) {
      return null;
    }

    const numeroWhatsApp =
      telefono.startsWith("52")
        ? telefono
        : `52${telefono}`;

    const mensaje = encodeURIComponent(
      `Hola, vi tu publicación de "${libro.titulo}" en LibroLibre y me interesa. ¿Sigue disponible?`,
    );

    return `https://wa.me/${numeroWhatsApp}?text=${mensaje}`;
  };

  const urlWhatsApp = obtenerUrlWhatsApp();

  if (estaCargando) {
    return (
      <main className="detalle-pagina">
        <div className="detalle-mensaje">
          Cargando información del libro...
        </div>
      </main>
    );
  }

  if (mensajeError || !libro) {
    return (
      <main className="detalle-pagina">
        <div className="detalle-mensaje detalle-mensaje-error">
          <p>
            {mensajeError ||
              "No se encontró el libro."}
          </p>

          <button
            className="boton primario"
            type="button"
            onClick={() => navegar("/")}
          >
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="detalle-pagina">
      <header className="detalle-encabezado">
        <button
          className="back-link"
          type="button"
          onClick={() => navegar(-1)}
        >
          <ArrowLeft size={18} />
          Volver
        </button>

        <button
          className="marca"
          type="button"
          onClick={() => navegar("/")}
        >
          LibroLibre
        </button>
      </header>

      <section className="detalle-contenedor">
        <div className="detalle-galeria">
          <div className="detalle-imagen-principal">
            {imagenActual ? (
              <img
                src={obtenerUrlImagen(
                  imagenActual.url,
                )}
                alt={`Imagen ${
                  indiceImagen + 1
                } de ${libro.titulo}`}
              />
            ) : (
              <div className="detalle-sin-imagen">
                <BookOpen size={58} />
                <strong>{libro.titulo}</strong>
              </div>
            )}
          </div>

          {imagenesOrdenadas.length > 1 && (
            <div className="detalle-miniaturas">
              {imagenesOrdenadas.map(
                (imagen, indice) => (
                  <button
                    className={`detalle-miniatura ${
                      indice === indiceImagen
                        ? "seleccionada"
                        : ""
                    }`}
                    type="button"
                    key={imagen.id}
                    onClick={() =>
                      setIndiceImagen(indice)
                    }
                  >
                    <img
                      src={obtenerUrlImagen(
                        imagen.url,
                      )}
                      alt={`Miniatura ${
                        indice + 1
                      }`}
                    />
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        <div className="detalle-informacion">
          <div className="detalle-etiquetas">
            <span className="detalle-categoria">
              {libro.categoria?.nombre ?? "Otros"}
            </span>

            <span
              className={`detalle-modalidad ${
                libro.modalidad === "REGALO"
                  ? "detalle-modalidad-regalo"
                  : "detalle-modalidad-intercambio"
              }`}
            >
              {libro.modalidad === "REGALO" ? (
                <Gift size={15} />
              ) : (
                <Repeat2 size={15} />
              )}

              {libro.modalidad === "REGALO"
                ? "Regalo"
                : "Intercambio"}
            </span>
          </div>

          <h1>{libro.titulo}</h1>

          <p className="detalle-autor">
            {libro.autor}
          </p>

          <div className="detalle-estado">
            <span>Estado de publicación</span>

            <strong>
              {obtenerNombreEstatus(
                libro.estatus,
              )}
            </strong>
          </div>

          <div className="detalle-datos">
            <div>
              <span>Condición</span>

              <strong>
                {obtenerNombreCondicion(
                  libro.condicion,
                )}
              </strong>
            </div>

            <div>
              <span>Categoría</span>

              <strong>
                {libro.categoria?.nombre ?? "Otros"}
              </strong>
            </div>

            {libro.editorial && (
              <div>
                <span>Editorial</span>
                <strong>
                  {libro.editorial}
                </strong>
              </div>
            )}

            {libro.anoPublicacion && (
              <div>
                <span>Año de publicación</span>
                <strong>
                  {libro.anoPublicacion}
                </strong>
              </div>
            )}

            {libro.isbn && (
              <div>
                <span>ISBN</span>
                <strong>{libro.isbn}</strong>
              </div>
            )}
          </div>

          <div className="detalle-ubicacion">
            <MapPin size={18} />

            <div>
              <span>Ubicación aproximada</span>

              <strong>
                {libro.ciudad}, {libro.estado}
              </strong>
            </div>
          </div>

          <div className="detalle-descripcion">
            <h2>Descripción</h2>
            <p>{libro.descripcion}</p>
          </div>

          {libro.modalidad === "INTERCAMBIO" &&
            libro.descripcionIntercambio && (
              <div className="detalle-intercambio">
                <h2>¿Qué busca a cambio?</h2>
                <p>
                  {libro.descripcionIntercambio}
                </p>
              </div>
            )}

          <div className="detalle-usuario">
            <img
              src={obtenerUrlFotoUsuario(
                libro.usuario?.foto,
              )}
              alt={`Foto de ${
                libro.usuario?.nombre ?? "usuario"
              }`}
              className="detalle-usuario-foto"
              onError={(evento) => {
                evento.currentTarget.src =
                  "/avatar-default.png";
              }}
            />

            <div>
              <span>Publicado por</span>

              <strong>
                {libro.usuario?.nombre ??
                  "Usuario de LibroLibre"}
              </strong>
            </div>
          </div>

          {esLibroPropio ? (
            <div className="detalle-propietario">
              Esta publicación pertenece a tu cuenta.
            </div>
          ) : libro.estatus === "DISPONIBLE" ? (
            urlWhatsApp ? (
              <a
                className="boton primario detalle-contactar"
                href={urlWhatsApp}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={18} />
                Contactar por WhatsApp
              </a>
            ) : (
              <p className="form-message-error detalle-contactar-mensaje">
                El propietario todavía no tiene un
                teléfono registrado.
              </p>
            )
          ) : (
            <button
              className="boton primario detalle-contactar"
              type="button"
              disabled
            >
              <MessageCircle size={18} />

              {obtenerNombreEstatus(
                libro.estatus,
              )}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export default DetalleLibroPag;