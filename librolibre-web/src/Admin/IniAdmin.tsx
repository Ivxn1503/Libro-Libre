import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { URL_API } from "../config";

import {
  BookOpen,
  Users,
  Gift,
  ArrowLeftRight,
  Search,
  Trash2,
  UserPlus,
  ShieldCheck,
  Ban,
  CheckCircle,
  X,
  LogOut,
} from "lucide-react";

type Usuario = {
  id: number;
  nombre?: string;
  nombres?: string;
  apellidos?: string;
  correo: string;
  rol?: string;
  activo?: boolean;
};

type Libro = {
  id: number;
  titulo: string;
  autor: string;
  modalidad: "REGALO" | "INTERCAMBIO";
  estatus: string;
};

type EstadisticasAdmin = {
  usuarios: number;
  libros: number;
  intercambios: number;
  regalos: number;
};


function IniAdmin() {
  const navegar = useNavigate();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [libros, setLibros] = useState<Libro[]>([]);

  const [estadisticas, setEstadisticas] =
    useState<EstadisticasAdmin>({
      usuarios: 0,
      libros: 0,
      intercambios: 0,
      regalos: 0,
    });

  const [seccionActiva, setSeccionActiva] = useState<
    "inicio" | "usuarios" | "libros"
  >("inicio");

  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [busquedaLibro, setBusquedaLibro] = useState("");

  const [mostrarFormularioUsuario, setMostrarFormularioUsuario] =
    useState(false);

  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<Usuario | null>(null);

  const [mostrarConfirmacion, setMostrarConfirmacion] =
    useState(false);

  const [cargando, setCargando] = useState(false);

  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    correo: "",
    password: "",
    rol: "USUARIO",
  });

  /*
   * Verificar sesión y permisos
   */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!token || !usuarioGuardado) {
      navegar("/iniciar-sesion");
      return;
    }

    try {
      const usuario = JSON.parse(usuarioGuardado);

      /*
       * IMPORTANTE:
       * Aquí asumimos que tu usuario tiene una propiedad "rol".
       * Si en tu backend se llama diferente, la cambiamos.
       */
      if (usuario.rol !== "ADMIN") {
        navegar("/");
      }
    } catch (error) {
      console.error("No se pudo comprobar el usuario:", error);
      navegar("/iniciar-sesion");
    }
  }, [navegar]);

  /*
   * Cargar información administrativa
   */
  useEffect(() => {
    cargarDatos();
  }, []);

  const obtenerHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);

      const [respuestaUsuarios, respuestaLibros] = await Promise.all([
        fetch(`${URL_API}/api/admin/usuarios`, {
          headers: obtenerHeaders(),
        }),

        fetch(`${URL_API}/api/admin/libros`, {
          headers: obtenerHeaders(),
        }),
      ]);

      if (!respuestaUsuarios.ok) {
        throw new Error("No se pudieron obtener los usuarios.");
      }

      if (!respuestaLibros.ok) {
        throw new Error("No se pudieron obtener los libros.");
      }

      const datosUsuarios = await respuestaUsuarios.json();
      const datosLibros = await respuestaLibros.json();

      setUsuarios(datosUsuarios.usuarios ?? datosUsuarios ?? []);
      setLibros(datosLibros.libros ?? datosLibros ?? []);

      calcularEstadisticas(
        datosUsuarios.usuarios ?? datosUsuarios ?? [],
        datosLibros.libros ?? datosLibros ?? [],
      );
    } catch (error) {
      console.error("Error al cargar información administrativa:", error);
    } finally {
      setCargando(false);
    }
  };

  /*
   * Estadísticas
   */
  const calcularEstadisticas = (
    listaUsuarios: Usuario[],
    listaLibros: Libro[],
  ) => {
    const intercambios = listaLibros.filter(
      (libro) => libro.modalidad === "INTERCAMBIO",
    ).length;

    const regalos = listaLibros.filter(
      (libro) => libro.modalidad === "REGALO",
    ).length;

    setEstadisticas({
      usuarios: listaUsuarios.length,
      libros: listaLibros.length,
      intercambios,
      regalos,
    });
  };

  /*
   * Crear usuario
   */
  const crearUsuario = async () => {
    if (
      !nuevoUsuario.nombre ||
      !nuevoUsuario.correo ||
      !nuevoUsuario.password
    ) {
      alert("Completa todos los campos.");
      return;
    }

    try {
      const respuesta = await fetch(
        `${URL_API}/api/admin/usuarios`,
        {
          method: "POST",
          headers: obtenerHeaders(),
          body: JSON.stringify(nuevoUsuario),
        },
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || "No se pudo crear el usuario.",
        );
      }

      alert("Usuario creado correctamente.");

      setNuevoUsuario({
        nombre: "",
        correo: "",
        password: "",
        rol: "USUARIO",
      });

      setMostrarFormularioUsuario(false);

      cargarDatos();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "No se pudo crear el usuario.",
      );
    }
  };

  /*
   * Eliminar usuario
   */
  const eliminarUsuario = async () => {
    if (!usuarioSeleccionado) return;

    try {
      const respuesta = await fetch(
        `${URL_API}/api/admin/usuarios/${usuarioSeleccionado.id}`,
        {
          method: "DELETE",
          headers: obtenerHeaders(),
        },
      );

      if (!respuesta.ok) {
        throw new Error("No se pudo eliminar el usuario.");
      }

      alert("Usuario eliminado correctamente.");

      setUsuarioSeleccionado(null);
      setMostrarConfirmacion(false);

      cargarDatos();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el usuario.",
      );
    }
  };

  /*
   * Eliminar libro
   */
  const eliminarLibro = async (id: number) => {
    const confirmar = window.confirm(
      "¿Seguro que quieres eliminar este libro?",
    );

    if (!confirmar) return;

    try {
      const respuesta = await fetch(
        `${URL_API}/api/admin/libros/${id}`,
        {
          method: "DELETE",
          headers: obtenerHeaders(),
        },
      );

      if (!respuesta.ok) {
        throw new Error("No se pudo eliminar el libro.");
      }

      alert("Libro eliminado correctamente.");

      cargarDatos();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el libro.",
      );
    }
  };

  /*
   * Cerrar sesión
   */
  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    navegar("/");
  };

  /*
   * Filtrar usuarios
   */
  const usuariosFiltrados = useMemo(() => {
    const texto = busquedaUsuario.trim().toLowerCase();

    if (!texto) return usuarios;

    return usuarios.filter((usuario) => {
      const nombre = `${usuario.nombre ?? ""} ${
        usuario.apellidos ?? ""
      }`.toLowerCase();

      return (
        nombre.includes(texto) ||
        usuario.correo.toLowerCase().includes(texto)
      );
    });
  }, [usuarios, busquedaUsuario]);

  /*
   * Filtrar libros
   */
  const librosFiltrados = useMemo(() => {
    const texto = busquedaLibro.trim().toLowerCase();

    if (!texto) return libros;

    return libros.filter(
      (libro) =>
        libro.titulo.toLowerCase().includes(texto) ||
        libro.autor.toLowerCase().includes(texto),
    );
  }, [libros, busquedaLibro]);

  return (
    <main className="pagina admin-pagina">
      {/* HEADER */}

      <header className="encabezado admin-encabezado">
        <button
          className="marca"
          type="button"
          onClick={() => setSeccionActiva("inicio")}
        >
          LibroLibre
        </button>

        <div className="admin-titulo">
          <ShieldCheck size={20} />
          <span>Panel de administración</span>
        </div>

        <div className="acciones-encabezado">
          <button
            className="boton secundario"
            type="button"
            onClick={() => navegar("/")}
          >
            <ArrowLeftRight size={17} />
            Volver a LibroLibre
          </button>

          <button
            className="boton primario"
            type="button"
            onClick={cerrarSesion}
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* CONTENIDO */}

      <section className="admin-contenido">
        <div className="admin-bienvenida">
          <div>
            <p className="etiqueta">ADMINISTRACIÓN</p>

            <h1>
              Panel de control de <span>LibroLibre</span>
            </h1>

            <p>
              Administra usuarios, publicaciones y actividad de la
              comunidad.
            </p>
          </div>
        </div>

        {/* ESTADÍSTICAS */}

        <div className="admin-estadisticas">
          <article className="admin-estadistica">
            <Users size={25} />

            <div>
              <strong>
                {cargando ? "—" : estadisticas.usuarios}
              </strong>

              <span>Usuarios</span>
            </div>
          </article>

          <article className="admin-estadistica">
            <BookOpen size={25} />

            <div>
              <strong>
                {cargando ? "—" : estadisticas.libros}
              </strong>

              <span>Libros publicados</span>
            </div>
          </article>

          <article className="admin-estadistica">
            <ArrowLeftRight size={25} />

            <div>
              <strong>
                {cargando ? "—" : estadisticas.intercambios}
              </strong>

              <span>Intercambios</span>
            </div>
          </article>

          <article className="admin-estadistica">
            <Gift size={25} />

            <div>
              <strong>
                {cargando ? "—" : estadisticas.regalos}
              </strong>

              <span>Regalos</span>
            </div>
          </article>
        </div>

        {/* MENÚ */}

        <div className="admin-menu">
          <button
            className={
              seccionActiva === "inicio" ? "activo" : ""
            }
            onClick={() => setSeccionActiva("inicio")}
          >
            <ShieldCheck size={18} />
            Resumen
          </button>

          <button
            className={
              seccionActiva === "usuarios" ? "activo" : ""
            }
            onClick={() => setSeccionActiva("usuarios")}
          >
            <Users size={18} />
            Usuarios
          </button>

          <button
            className={
              seccionActiva === "libros" ? "activo" : ""
            }
            onClick={() => setSeccionActiva("libros")}
          >
            <BookOpen size={18} />
            Libros
          </button>
        </div>

        {/* RESUMEN */}

        {seccionActiva === "inicio" && (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <p className="etiqueta">RESUMEN</p>
                <h2>Actividad de LibroLibre</h2>
              </div>
            </div>

            <div className="admin-resumen-grid">
              <button
                className="admin-opcion"
                onClick={() => setSeccionActiva("usuarios")}
              >
                <Users size={32} />

                <div>
                  <h3>Gestionar usuarios</h3>
                  <p>
                    Agrega, consulta y elimina cuentas de la
                    comunidad.
                  </p>
                </div>
              </button>

              <button
                className="admin-opcion"
                onClick={() => setSeccionActiva("libros")}
              >
                <BookOpen size={32} />

                <div>
                  <h3>Gestionar libros</h3>
                  <p>
                    Consulta y administra las publicaciones.
                  </p>
                </div>
              </button>
            </div>
          </section>
        )}

        {/* USUARIOS */}

        {seccionActiva === "usuarios" && (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <p className="etiqueta">COMUNIDAD</p>
                <h2>Usuarios</h2>
                <p>
                  Administra las cuentas registradas en
                  LibroLibre.
                </p>
              </div>

              <button
                className="boton primario"
                type="button"
                onClick={() =>
                  setMostrarFormularioUsuario(true)
                }
              >
                <UserPlus size={18} />
                Agregar usuario
              </button>
            </div>

            <div className="admin-buscador">
              <Search size={20} />

              <input
                type="search"
                placeholder="Buscar por nombre o correo..."
                value={busquedaUsuario}
                onChange={(evento) =>
                  setBusquedaUsuario(evento.target.value)
                }
              />
            </div>

            <div className="tabla-contenedor">
              <table className="tabla-admin">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>#{usuario.id}</td>

                      <td>
                        <strong>
                          {usuario.nombre ??
                            usuario.nombres ??
                            "Sin nombre"}
                        </strong>
                      </td>

                      <td>{usuario.correo}</td>

                      <td>
                        <span className="admin-etiqueta">
                          {usuario.rol ?? "USUARIO"}
                        </span>
                      </td>

                      <td>
                        {usuario.activo === false ? (
                          <span className="estado-inactivo">
                            <Ban size={15} />
                            Inactivo
                          </span>
                        ) : (
                          <span className="estado-activo">
                            <CheckCircle size={15} />
                            Activo
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          className="boton-icono peligro"
                          type="button"
                          title="Eliminar usuario"
                          onClick={() => {
                            setUsuarioSeleccionado(usuario);
                            setMostrarConfirmacion(true);
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {usuariosFiltrados.length === 0 && (
                <div className="estado-vacio">
                  <Users size={40} />

                  <h3>No encontramos usuarios</h3>

                  <p>
                    No hay usuarios que coincidan con tu
                    búsqueda.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* LIBROS */}

        {seccionActiva === "libros" && (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <p className="etiqueta">PUBLICACIONES</p>

                <h2>Libros</h2>

                <p>
                  Administra las publicaciones realizadas por
                  los usuarios.
                </p>
              </div>
            </div>

            <div className="admin-buscador">
              <Search size={20} />

              <input
                type="search"
                placeholder="Buscar por título o autor..."
                value={busquedaLibro}
                onChange={(evento) =>
                  setBusquedaLibro(evento.target.value)
                }
              />
            </div>

            <div className="tabla-contenedor">
              <table className="tabla-admin">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Título</th>
                    <th>Autor</th>
                    <th>Modalidad</th>
                    <th>Estatus</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {librosFiltrados.map((libro) => (
                    <tr key={libro.id}>
                      <td>#{libro.id}</td>

                      <td>
                        <strong>{libro.titulo}</strong>
                      </td>

                      <td>{libro.autor}</td>

                      <td>
                        {libro.modalidad === "REGALO"
                          ? "Regalo"
                          : "Intercambio"}
                      </td>

                      <td>{libro.estatus}</td>

                      <td>
                        <button
                          className="boton-icono peligro"
                          type="button"
                          title="Eliminar libro"
                          onClick={() =>
                            eliminarLibro(libro.id)
                          }
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {librosFiltrados.length === 0 && (
                <div className="estado-vacio">
                  <BookOpen size={40} />

                  <h3>No encontramos libros</h3>

                  <p>
                    No hay publicaciones que coincidan con tu
                    búsqueda.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </section>

      {/* MODAL AGREGAR USUARIO */}

      {mostrarFormularioUsuario && (
        <div className="modal-fondo">
          <div className="modal-admin">
            <button
              className="modal-cerrar"
              type="button"
              onClick={() =>
                setMostrarFormularioUsuario(false)
              }
            >
              <X size={20} />
            </button>

            <p className="etiqueta">NUEVO USUARIO</p>

            <h2>Agregar usuario</h2>

            <div className="formulario-admin">
              <label>
                Nombre
                <input
                  type="text"
                  value={nuevoUsuario.nombre}
                  onChange={(evento) =>
                    setNuevoUsuario({
                      ...nuevoUsuario,
                      nombre: evento.target.value,
                    })
                  }
                  placeholder="Nombre del usuario"
                />
              </label>

              <label>
                Correo electrónico
                <input
                  type="email"
                  value={nuevoUsuario.correo}
                  onChange={(evento) =>
                    setNuevoUsuario({
                      ...nuevoUsuario,
                      correo: evento.target.value,
                    })
                  }
                  placeholder="correo@ejemplo.com"
                />
              </label>

              <label>
                Contraseña
                <input
                  type="password"
                  value={nuevoUsuario.password}
                  onChange={(evento) =>
                    setNuevoUsuario({
                      ...nuevoUsuario,
                      password: evento.target.value,
                    })
                  }
                  placeholder="Contraseña"
                />
              </label>

              <label>
                Rol
                <select
                  value={nuevoUsuario.rol}
                  onChange={(evento) =>
                    setNuevoUsuario({
                      ...nuevoUsuario,
                      rol: evento.target.value,
                    })
                  }
                >
                  <option value="USUARIO">Usuario</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </label>

              <div className="modal-botones">
                <button
                  type="button"
                  className="boton secundario"
                  onClick={() =>
                    setMostrarFormularioUsuario(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="boton primario"
                  onClick={crearUsuario}
                >
                  Crear usuario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}

      {mostrarConfirmacion && usuarioSeleccionado && (
        <div className="modal-fondo">
          <div className="modal-confirmacion">
            <h2>¿Eliminar usuario?</h2>

            <p>
              ¿Estás seguro de que quieres eliminar a{" "}
              <strong>
                {usuarioSeleccionado.nombre ??
                  usuarioSeleccionado.nombres ??
                  usuarioSeleccionado.correo}
              </strong>
              ?
            </p>

            <div className="modal-botones">
              <button
                type="button"
                className="boton secundario"
                onClick={() => {
                  setMostrarConfirmacion(false);
                  setUsuarioSeleccionado(null);
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="boton primario"
                onClick={eliminarUsuario}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default IniAdmin;