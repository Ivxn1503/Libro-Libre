import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Camera,
  Edit3,
  MapPin,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type UsuarioPerfil = {
  id: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  foto: string | null;
  ciudad: string | null;
  estado: string | null;
  descripcion: string | null;
};

type LibroPerfil = {
  id: number;
  titulo: string;
  autor: string;
  modalidad: "REGALO" | "INTERCAMBIO";
  estatus: string;
  ciudad: string;
  estado: string;
  imagenes: {
    id: number;
    url: string;
    esPortada: boolean;
    orden: number;
  }[];
};

type RespuestaPerfil = {
  usuario?: UsuarioPerfil;
  libros?: LibroPerfil[];
  estadisticas?: {
    publicados: number;
    disponibles: number;
    reservados: number;
    entregados: number;
  };
  mensaje?: string;
};

type RespuestaEliminar = {
  mensaje?: string;
};

const URL_API = "http://localhost:3000";
const FOTO_POR_DEFECTO = "/avatar-default.png";

function PerfilPagina() {
  const navegar = useNavigate();

  const [usuario, setUsuario] =
    useState<UsuarioPerfil | null>(null);

  const [libros, setLibros] = useState<LibroPerfil[]>([]);

  const [estadisticas, setEstadisticas] = useState({
    publicados: 0,
    disponibles: 0,
    reservados: 0,
    entregados: 0,
  });

  const [estaCargando, setEstaCargando] =
    useState(true);

  const [modoEdicion, setModoEdicion] =
    useState(false);

  const [estaGuardando, setEstaGuardando] =
    useState(false);

  const [libroEliminando, setLibroEliminando] =
    useState<number | null>(null);

  const [mensaje, setMensaje] = useState("");

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [estado, setEstado] = useState("");
  const [descripcion, setDescripcion] =
    useState("");

  const [foto, setFoto] =
    useState<File | null>(null);

  const [vistaPreviaFoto, setVistaPreviaFoto] =
    useState<string | null>(null);

  const obtenerUrl = (
    valor: string | null | undefined,
  ) => {
    if (!valor) {
      return FOTO_POR_DEFECTO;
    }

    if (
      valor.startsWith("http://") ||
      valor.startsWith("https://")
    ) {
      return valor;
    }

    return `${URL_API}${
      valor.startsWith("/") ? valor : `/${valor}`
    }`;
  };

  const cargarPerfil = async () => {
    try {
      setEstaCargando(true);
      setMensaje("");

      const token = localStorage.getItem("token");

      if (!token) {
        navegar("/iniciar-sesion");
        return;
      }

      const respuesta = await fetch(
        `${URL_API}/api/perfil`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const datos =
        (await respuesta.json()) as RespuestaPerfil;

      if (!respuesta.ok || !datos.usuario) {
        throw new Error(
          datos.mensaje ??
            "No se pudo cargar el perfil.",
        );
      }

      setUsuario(datos.usuario);
      setLibros(datos.libros ?? []);

      setEstadisticas(
        datos.estadisticas ?? {
          publicados: datos.libros?.length ?? 0,
          disponibles: 0,
          reservados: 0,
          entregados: 0,
        },
      );

      setNombre(datos.usuario.nombre);
      setTelefono(datos.usuario.telefono ?? "");
      setCiudad(datos.usuario.ciudad ?? "");
      setEstado(datos.usuario.estado ?? "");
      setDescripcion(
        datos.usuario.descripcion ?? "",
      );
    } catch (error) {
      console.error(
        "Error al cargar el perfil:",
        error,
      );

      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el perfil.",
      );
    } finally {
      setEstaCargando(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const manejarFoto = (
    evento: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const archivo =
      evento.target.files?.[0] ?? null;

    if (!archivo) {
      return;
    }

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(archivo.type)) {
      setMensaje(
        "La foto debe ser JPG, PNG o WebP.",
      );
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setMensaje(
        "La foto no puede superar los 5 MB.",
      );
      return;
    }

    setMensaje("");
    setFoto(archivo);
    setVistaPreviaFoto(
      URL.createObjectURL(archivo),
    );
  };

  const guardarPerfil = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navegar("/iniciar-sesion");
      return;
    }

    if (
      !nombre.trim() ||
      !ciudad.trim() ||
      !estado.trim()
    ) {
      setMensaje(
        "Nombre, ciudad y estado son obligatorios.",
      );
      return;
    }

    try {
      setEstaGuardando(true);
      setMensaje("");

      const datosFormulario = new FormData();

      datosFormulario.append(
        "nombre",
        nombre.trim(),
      );

      datosFormulario.append(
        "telefono",
        telefono.replace(/\D/g, ""),
      );

      datosFormulario.append(
        "ciudad",
        ciudad.trim(),
      );

      datosFormulario.append(
        "estado",
        estado.trim(),
      );

      datosFormulario.append(
        "descripcion",
        descripcion.trim(),
      );

      if (foto) {
        datosFormulario.append("foto", foto);
      }

      const respuesta = await fetch(
        `${URL_API}/api/perfil`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: datosFormulario,
        },
      );

      const datos =
        (await respuesta.json()) as RespuestaPerfil;

      if (!respuesta.ok || !datos.usuario) {
        throw new Error(
          datos.mensaje ??
            "No se pudo actualizar el perfil.",
        );
      }

      setUsuario(datos.usuario);
      setNombre(datos.usuario.nombre);
      setTelefono(datos.usuario.telefono ?? "");
      setCiudad(datos.usuario.ciudad ?? "");
      setEstado(datos.usuario.estado ?? "");
      setDescripcion(
        datos.usuario.descripcion ?? "",
      );

      setFoto(null);
      setVistaPreviaFoto(null);
      setModoEdicion(false);

      localStorage.setItem(
        "usuario",
        JSON.stringify(datos.usuario),
      );

      setMensaje(
        "Perfil actualizado correctamente.",
      );
    } catch (error) {
      console.error(
        "Error al guardar el perfil:",
        error,
      );

      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el perfil.",
      );
    } finally {
      setEstaGuardando(false);
    }
  };

  const eliminarLibro = async (
    libro: LibroPerfil,
  ) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar la publicación "${libro.titulo}"?`,
    );

    if (!confirmar) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navegar("/iniciar-sesion");
      return;
    }

    try {
      setLibroEliminando(libro.id);
      setMensaje("");

      const respuesta = await fetch(
        `${URL_API}/api/libros/${libro.id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const datos =
        (await respuesta.json()) as RespuestaEliminar;

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ??
            "No se pudo eliminar la publicación.",
        );
      }

      setLibros((librosActuales) =>
        librosActuales.filter(
          (libroActual) =>
            libroActual.id !== libro.id,
        ),
      );

      setEstadisticas((estadisticasActuales) => ({
        ...estadisticasActuales,
        publicados: Math.max(
          0,
          estadisticasActuales.publicados - 1,
        ),

        disponibles:
          libro.estatus === "DISPONIBLE"
            ? Math.max(
                0,
                estadisticasActuales.disponibles - 1,
              )
            : estadisticasActuales.disponibles,

        reservados:
          libro.estatus === "RESERVADO"
            ? Math.max(
                0,
                estadisticasActuales.reservados - 1,
              )
            : estadisticasActuales.reservados,

        entregados:
          libro.estatus === "ENTREGADO"
            ? Math.max(
                0,
                estadisticasActuales.entregados - 1,
              )
            : estadisticasActuales.entregados,
      }));

      setMensaje(
        "La publicación fue eliminada correctamente.",
      );
    } catch (error) {
      console.error(
        "Error al eliminar publicación:",
        error,
      );

      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la publicación.",
      );
    } finally {
      setLibroEliminando(null);
    }
  };

  const cancelarEdicionPerfil = () => {
    if (!usuario) {
      return;
    }

    setModoEdicion(false);
    setFoto(null);
    setVistaPreviaFoto(null);
    setNombre(usuario.nombre);
    setTelefono(usuario.telefono ?? "");
    setCiudad(usuario.ciudad ?? "");
    setEstado(usuario.estado ?? "");
    setDescripcion(usuario.descripcion ?? "");
  };

  if (estaCargando) {
    return (
      <main className="perfil-pagina">
        <div className="perfil-mensaje">
          Cargando perfil...
        </div>
      </main>
    );
  }

  if (!usuario) {
    return (
      <main className="perfil-pagina">
        <div className="perfil-mensaje perfil-mensaje-error">
          {mensaje ||
            "No se pudo cargar el perfil."}
        </div>
      </main>
    );
  }

  const fotoMostrar =
    vistaPreviaFoto ?? obtenerUrl(usuario.foto);

  return (
    <main className="perfil-pagina">
      <header className="perfil-encabezado">
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

      <section className="perfil-contenedor">
        <div className="perfil-tarjeta">
          <div className="perfil-identidad">
            <div className="perfil-foto-contenedor">
              <img
                src={fotoMostrar}
                alt={`Foto de perfil de ${usuario.nombre}`}
                className="perfil-foto"
                onError={(evento) => {
                  evento.currentTarget.src =
                    FOTO_POR_DEFECTO;
                }}
              />

              {modoEdicion && (
                <label className="perfil-foto-boton">
                  <Camera size={17} />

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={manejarFoto}
                  />
                </label>
              )}
            </div>

            <div className="perfil-datos-principales">
              {modoEdicion ? (
                <input
                  className="perfil-input-nombre"
                  value={nombre}
                  onChange={(evento) =>
                    setNombre(evento.target.value)
                  }
                  maxLength={100}
                />
              ) : (
                <h1>{usuario.nombre}</h1>
              )}

              <p className="perfil-correo">
                {usuario.correo}
              </p>

              <p className="perfil-ubicacion">
                <MapPin size={16} />

                {modoEdicion ? (
                  <>
                    <input
                      value={ciudad}
                      onChange={(evento) =>
                        setCiudad(evento.target.value)
                      }
                      placeholder="Ciudad"
                    />

                    <span>,</span>

                    <input
                      value={estado}
                      onChange={(evento) =>
                        setEstado(evento.target.value)
                      }
                      placeholder="Estado"
                    />
                  </>
                ) : (
                  `${usuario.ciudad ?? "Sin ciudad"}, ${
                    usuario.estado ?? "Sin estado"
                  }`
                )}
              </p>
            </div>
          </div>

          <div className="perfil-acciones">
            {modoEdicion ? (
              <>
                <button
                  className="boton primario"
                  type="button"
                  onClick={guardarPerfil}
                  disabled={estaGuardando}
                >
                  <Save size={17} />

                  {estaGuardando
                    ? "Guardando..."
                    : "Guardar cambios"}
                </button>

                <button
                  className="boton secundario"
                  type="button"
                  onClick={cancelarEdicionPerfil}
                  disabled={estaGuardando}
                >
                  <X size={17} />
                  Cancelar
                </button>
              </>
            ) : (
              <button
                className="boton secundario"
                type="button"
                onClick={() => {
                  setMensaje("");
                  setModoEdicion(true);
                }}
              >
                <Edit3 size={17} />
                Editar perfil
              </button>
            )}
          </div>

          <div className="perfil-descripcion">
            {modoEdicion ? (
              <>
                <label htmlFor="descripcion-perfil">
                  Descripción
                </label>

                <textarea
                  id="descripcion-perfil"
                  value={descripcion}
                  onChange={(evento) =>
                    setDescripcion(evento.target.value)
                  }
                  rows={4}
                  maxLength={500}
                  placeholder="Cuéntale a la comunidad algo sobre ti."
                />

                <label htmlFor="telefono-perfil">
                  Teléfono
                </label>

                <input
                  id="telefono-perfil"
                  type="tel"
                  value={telefono}
                  onChange={(evento) =>
                    setTelefono(evento.target.value)
                  }
                  maxLength={14}
                  placeholder="10 dígitos"
                />
              </>
            ) : (
              <p>
                {usuario.descripcion ||
                  "Este usuario todavía no ha agregado una descripción."}
              </p>
            )}
          </div>

          {mensaje && (
            <p className="form-message">{mensaje}</p>
          )}
        </div>

        <div className="perfil-estadisticas">
          <div>
            <strong>
              {estadisticas.publicados}
            </strong>

            <span>Libros publicados</span>
          </div>

          <div>
            <strong>
              {estadisticas.disponibles}
            </strong>

            <span>Disponibles</span>
          </div>

          <div>
            <strong>
              {estadisticas.reservados}
            </strong>

            <span>Reservados</span>
          </div>

          <div>
            <strong>
              {estadisticas.entregados}
            </strong>

            <span>Entregados</span>
          </div>
        </div>

        <section className="perfil-libros-seccion">
          <div className="perfil-seccion-titulo">
            <div>
              <span className="section-label">
                Mi comunidad
              </span>

              <h2>Mis publicaciones</h2>
            </div>

            <button
              className="boton primario"
              type="button"
              onClick={() =>
                navegar("/publicar-libro")
              }
            >
              <BookOpen size={17} />
              Publicar libro
            </button>
          </div>

          {libros.length === 0 ? (
            <div className="perfil-vacio">
              <BookOpen size={38} />

              <h3>
                Aún no tienes publicaciones
              </h3>

              <p>
                Publica un libro para comenzar a compartirlo.
              </p>
            </div>
          ) : (
            <div className="perfil-libros-grid">
              {libros.map((libro) => {
                const imagen =
                  libro.imagenes?.[0]?.url;

                const estaEliminando =
                  libroEliminando === libro.id;

                return (
                  <article
  className="perfil-libro-card"
  key={libro.id}
>
  <button
    className="boton-libro-eliminar-superior"
    type="button"
    onClick={() => eliminarLibro(libro)}
    disabled={estaEliminando}
    aria-label={`Eliminar publicación ${libro.titulo}`}
    title="Eliminar publicación"
  >
    <Trash2 size={17} />

    <span>
      {estaEliminando ? "Eliminando..." : "Eliminar"}
    </span>
  </button>
                    <div className="perfil-libro-imagen">
                      {imagen ? (
                        <img
                          src={obtenerUrl(imagen)}
                          alt={`Portada de ${libro.titulo}`}
                          onError={(evento) => {
                            evento.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <BookOpen size={34} />
                      )}
                    </div>

                    <div className="perfil-libro-contenido">
                      <span className="perfil-libro-modalidad">
                        {libro.modalidad === "REGALO"
                          ? "Regalo"
                          : "Intercambio"}
                      </span>

                      <h3>{libro.titulo}</h3>

                      <p>{libro.autor}</p>

                      <span className="perfil-libro-estatus">
                        {libro.estatus}
                      </span>

                      <div className="perfil-libro-acciones">
                        <button
                          className="enlace-detalle"
                          type="button"
                          onClick={() =>
                            navegar(
                              `/libros/${libro.id}`,
                            )
                          }
                        >
                          Ver publicación
                        </button>

                        <button
                          className="boton-libro-editar"
                          type="button"
                          onClick={() =>
                            navegar(
                              `/libros/${libro.id}/editar`,
                            )
                          }
                        >
                          <Edit3 size={16} />
                          Editar
                        </button>

                        
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default PerfilPagina;