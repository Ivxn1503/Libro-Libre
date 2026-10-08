import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { URL_API } from "../config";

import "../Estilos/IniAdmin.css";

import {
  BookOpen, Users, Gift, ArrowLeftRight, Search, Trash2,
  UserPlus, ShieldCheck, Ban, CheckCircle, X, LogOut,
  EyeOff, Eye, RefreshCw, AlertCircle,
} from "lucide-react";

type Rol = "USUARIO" | "ADMINISTRADOR";
type EstadoUsuario = "ACTIVO" | "INACTIVO" | "BLOQUEADO";
type EstadoLibro = "DISPONIBLE" | "RESERVADO" | "ENTREGADO" | "OCULTO" | "ELIMINADO";
type Seccion = "inicio" | "usuarios" | "libros";

type Usuario = {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  estatus: EstadoUsuario;
  creadoEn?: string;
};

type Libro = {
  id: number;
  titulo: string;
  autor: string;
  modalidad: "REGALO" | "INTERCAMBIO";
  estatus: EstadoLibro;
  usuario?: { id: number; nombre: string; correo: string };
};

type NuevoUsuario = {
  nombre: string;
  correo: string;
  password: string;
  rol: Rol;
};

const usuarioInicial: NuevoUsuario = {
  nombre: "", correo: "", password: "", rol: "USUARIO",
};

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

function IniAdmin() {
  const navegar = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [libros, setLibros] = useState<Libro[]>([]);
  const [seccionActiva, setSeccionActiva] = useState<Seccion>("inicio");
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [busquedaLibro, setBusquedaLibro] = useState("");
  const [mostrarFormularioUsuario, setMostrarFormularioUsuario] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [nuevoUsuario, setNuevoUsuario] = useState<NuevoUsuario>(usuarioInicial);
  const [miId, setMiId] = useState<number | null>(null);
  const [autorizado, setAutorizado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const obtenerHeaders = useCallback((): HeadersInit => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
  }), []);

  const solicitar = useCallback(async (ruta: string, opciones: RequestInit = {}) => {
    const respuesta = await fetch(`${URL_API}${ruta}`, {
      ...opciones,
      headers: { ...obtenerHeaders(), ...opciones.headers },
    });
    const datos: unknown = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      const mensaje = typeof datos === "object" && datos !== null &&
        "mensaje" in datos && typeof datos.mensaje === "string"
        ? datos.mensaje : `Error HTTP ${respuesta.status}`;
      const fallo = new Error(mensaje);
      if (respuesta.status === 401 || respuesta.status === 403) {
        // La API es quien decide si la sesión sigue autorizada.
        if (respuesta.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
          navegar("/iniciar-sesion", { replace: true });
        } else {
          navegar("/", { replace: true });
        }
      }
      throw fallo;
    }
    return datos;
  }, [navegar, obtenerHeaders]);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [respuestaUsuarios, respuestaLibros] = await Promise.all([
        solicitar("/api/admin/usuarios"),
        solicitar("/api/admin/libros"),
      ]);
      const listaUsuarios = (respuestaUsuarios as { usuarios?: Usuario[] }).usuarios;
      const listaLibros = (respuestaLibros as { libros?: Libro[] }).libros;
      if (!Array.isArray(listaUsuarios) || !Array.isArray(listaLibros)) {
        throw new Error("La API devolvió un formato de datos inesperado.");
      }
      setUsuarios(listaUsuarios);
      setLibros(listaLibros);
      setAutorizado(true);
    } catch (fallo) {
      setError(mensajeError(fallo));
    } finally {
      setCargando(false);
    }
  }, [solicitar]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuarioGuardado = localStorage.getItem("usuario");
    if (!token || !usuarioGuardado) {
      navegar("/iniciar-sesion", { replace: true });
      return;
    }
    try {
      const usuario: unknown = JSON.parse(usuarioGuardado);
      if (!usuario || typeof usuario !== "object" || !("rol" in usuario) ||
          usuario.rol !== "ADMINISTRADOR") {
        navegar("/", { replace: true });
        return;
      }
      if ("id" in usuario && typeof usuario.id === "number") setMiId(usuario.id);
      void cargarDatos();
    } catch {
      navegar("/iniciar-sesion", { replace: true });
    }
  }, [cargarDatos, navegar]);

  const estadisticas = useMemo(() => ({
    usuarios: usuarios.length,
    libros: libros.filter((libro) => libro.estatus !== "ELIMINADO").length,
    intercambios: libros.filter((libro) => libro.modalidad === "INTERCAMBIO" && libro.estatus !== "ELIMINADO").length,
    regalos: libros.filter((libro) => libro.modalidad === "REGALO" && libro.estatus !== "ELIMINADO").length,
  }), [usuarios, libros]);

  const usuariosFiltrados = useMemo(() => {
    const texto = busquedaUsuario.trim().toLocaleLowerCase();
    return usuarios.filter((usuario) =>
      usuario.nombre.toLocaleLowerCase().includes(texto) ||
      usuario.correo.toLocaleLowerCase().includes(texto));
  }, [usuarios, busquedaUsuario]);

  const librosFiltrados = useMemo(() => {
    const texto = busquedaLibro.trim().toLocaleLowerCase();
    return libros.filter((libro) =>
      libro.titulo.toLocaleLowerCase().includes(texto) ||
      libro.autor.toLocaleLowerCase().includes(texto));
  }, [libros, busquedaLibro]);

  const ejecutar = async (accion: () => Promise<void>, exito: string) => {
    setProcesando(true);
    setError("");
    setAviso("");
    try {
      await accion();
      setAviso(exito);
      await cargarDatos();
    } catch (fallo) {
      setError(mensajeError(fallo));
    } finally {
      setProcesando(false);
    }
  };

  const crearUsuario = async () => {
    if (!nuevoUsuario.nombre.trim() || !nuevoUsuario.correo.trim() || nuevoUsuario.password.length < 8) {
      setError("Escribe nombre, correo y una contraseña de al menos 8 caracteres.");
      return;
    }
    await ejecutar(async () => {
      await solicitar("/api/admin/usuarios", {
        method: "POST", body: JSON.stringify(nuevoUsuario),
      });
      setNuevoUsuario(usuarioInicial);
      setMostrarFormularioUsuario(false);
    }, "Usuario creado correctamente.");
  };

  const cambiarEstadoUsuario = async (usuario: Usuario) => {
    if (usuario.rol === "ADMINISTRADOR" || usuario.id === miId) return;
    const estatus: EstadoUsuario = usuario.estatus === "ACTIVO" ? "BLOQUEADO" : "ACTIVO";
    if (!window.confirm(`¿Quieres ${estatus === "BLOQUEADO" ? "bloquear" : "activar"} a ${usuario.nombre}?`)) return;
    await ejecutar(async () => {
      await solicitar(`/api/admin/usuarios/${usuario.id}/estatus`, {
        method: "PATCH", body: JSON.stringify({ estatus }),
      });
    }, `Estado de ${usuario.nombre} actualizado.`);
  };

  const eliminarUsuario = async () => {
    if (!usuarioSeleccionado || usuarioSeleccionado.rol === "ADMINISTRADOR" || usuarioSeleccionado.id === miId) return;
    await ejecutar(async () => {
      await solicitar(`/api/admin/usuarios/${usuarioSeleccionado.id}`, { method: "DELETE" });
      setUsuarioSeleccionado(null);
    }, "Usuario eliminado correctamente.");
  };

  const cambiarEstadoLibro = async (libro: Libro) => {
    const estatus: EstadoLibro = libro.estatus === "OCULTO" ? "DISPONIBLE" : "OCULTO";
    if (!window.confirm(`¿Quieres ${estatus === "OCULTO" ? "ocultar" : "restaurar"} «${libro.titulo}»?`)) return;
    await ejecutar(async () => {
      await solicitar(`/api/admin/libros/${libro.id}/estatus`, {
        method: "PATCH", body: JSON.stringify({ estatus }),
      });
    }, "Estado de la publicación actualizado.");
  };

  const eliminarLibro = async (libro: Libro) => {
    if (!window.confirm(`¿Marcar «${libro.titulo}» como eliminado?`)) return;
    await ejecutar(async () => {
      await solicitar(`/api/admin/libros/${libro.id}`, { method: "DELETE" });
    }, "Publicación marcada como eliminada.");
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navegar("/");
  };

  if (!autorizado) {
    return (
      <main className="pagina admin-pagina">
        <section className="admin-contenido">
          <h1>Panel de administración</h1>
          {cargando ? <p>Verificando permisos y cargando información...</p> : (
            <>
              <p role="alert">{error || "No se pudo acceder al panel."}</p>
              <button className="boton secundario" onClick={() => void cargarDatos()}>Reintentar</button>
              <button className="boton secundario" onClick={() => navegar("/")}>Volver al inicio</button>
            </>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="pagina admin-pagina">
      <header className="encabezado admin-encabezado">
        <button className="marca" type="button" onClick={() => setSeccionActiva("inicio")}>LibroLibre</button>
        <div className="admin-titulo"><ShieldCheck size={20} /><span>Panel de administración</span></div>
        <div className="acciones-encabezado">
          <button className="boton secundario" type="button" onClick={() => navegar("/")}>
            <ArrowLeftRight size={17} /> Volver a LibroLibre
          </button>
          <button className="boton primario" type="button" onClick={cerrarSesion}>
            <LogOut size={17} /> Cerrar sesión
          </button>
        </div>
      </header>

      <section className="admin-contenido">
        <div className="admin-bienvenida">
          <div>
            <p className="etiqueta">ADMINISTRACIÓN</p>
            <h1>Panel de control de <span>LibroLibre</span></h1>
            <p>Administra usuarios, publicaciones y actividad de la comunidad.</p>
          </div>
        </div>

        {error && <p role="alert" style={{ color: "#b42318" }}><AlertCircle size={16} /> {error}</p>}
        {aviso && <p role="status" style={{ color: "#167044" }}>{aviso}</p>}

        <div className="admin-estadisticas">
          {([
            { icono: Users, numero: estadisticas.usuarios, texto: "Usuarios" },
            { icono: BookOpen, numero: estadisticas.libros, texto: "Libros publicados" },
            { icono: ArrowLeftRight, numero: estadisticas.intercambios, texto: "Publicaciones de intercambio" },
            { icono: Gift, numero: estadisticas.regalos, texto: "Publicaciones de regalo" },
          ]).map(({ icono: Icono, numero, texto }) => (
            <article className="admin-estadistica" key={texto}>
              <Icono size={25} /><div><strong>{cargando ? "—" : numero}</strong><span>{texto}</span></div>
            </article>
          ))}
        </div>

        <div className="admin-menu">
          {([
            { id: "inicio", texto: "Resumen", icono: ShieldCheck },
            { id: "usuarios", texto: "Usuarios", icono: Users },
            { id: "libros", texto: "Libros", icono: BookOpen },
          ] as const).map(({ id, texto, icono: Icono }) => (
            <button key={id} type="button" className={seccionActiva === id ? "activo" : ""}
              onClick={() => setSeccionActiva(id)}><Icono size={18} /> {texto}</button>
          ))}
          <button type="button" onClick={() => void cargarDatos()} disabled={cargando || procesando}>
            <RefreshCw size={18} /> Actualizar
          </button>
        </div>

        {seccionActiva === "inicio" && (
          <section className="admin-panel">
            <div className="admin-panel-header"><div><p className="etiqueta">RESUMEN</p><h2>Actividad de LibroLibre</h2></div></div>
            <div className="admin-resumen-grid">
              <button className="admin-opcion" type="button" onClick={() => setSeccionActiva("usuarios")}>
                <Users size={32} /><div><h3>Gestionar usuarios</h3><p>Consulta, crea, bloquea y administra las cuentas de la comunidad.</p></div>
              </button>
              <button className="admin-opcion" type="button" onClick={() => setSeccionActiva("libros")}>
                <BookOpen size={32} /><div><h3>Gestionar libros</h3><p>Consulta, oculta, restaura y administra las publicaciones.</p></div>
              </button>
            </div>
          </section>
        )}

        {seccionActiva === "usuarios" && (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div><p className="etiqueta">COMUNIDAD</p><h2>Usuarios</h2><p>Administra las cuentas registradas en LibroLibre.</p></div>
              <button className="boton primario" type="button" onClick={() => setMostrarFormularioUsuario(true)}>
                <UserPlus size={18} /> Agregar usuario
              </button>
            </div>
            <div className="admin-buscador"><Search size={20} />
              <input type="search" aria-label="Buscar usuarios" placeholder="Buscar por nombre o correo..."
                value={busquedaUsuario} onChange={(evento) => setBusquedaUsuario(evento.target.value)} />
            </div>
            <div className="tabla-contenedor">
              <table className="tabla-admin">
                <thead><tr><th>ID</th><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>{usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>#{usuario.id}</td><td><strong>{usuario.nombre}</strong></td><td>{usuario.correo}</td>
                    <td><span className="admin-etiqueta">{usuario.rol}</span></td>
                    <td>{usuario.estatus === "ACTIVO" ?
                      <span className="estado-activo"><CheckCircle size={15} /> Activo</span> :
                      <span className="estado-inactivo"><Ban size={15} /> {usuario.estatus === "BLOQUEADO" ? "Bloqueado" : "Inactivo"}</span>}
                    </td>
                    <td>
                      {usuario.rol !== "ADMINISTRADOR" && usuario.id !== miId && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button className="boton-icono" type="button" disabled={procesando}
                            title={usuario.estatus === "ACTIVO" ? "Bloquear usuario" : "Activar usuario"}
                            aria-label={usuario.estatus === "ACTIVO" ? "Bloquear usuario" : "Activar usuario"}
                            onClick={() => void cambiarEstadoUsuario(usuario)}>
                            {usuario.estatus === "ACTIVO" ? <Ban size={18} /> : <CheckCircle size={18} />}
                          </button>
                          <button className="boton-icono peligro" type="button" disabled={procesando}
                            title="Eliminar usuario" aria-label="Eliminar usuario"
                            onClick={() => setUsuarioSeleccionado(usuario)}><Trash2 size={18} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
              {usuariosFiltrados.length === 0 && <div className="estado-vacio"><Users size={40} /><h3>No encontramos usuarios</h3><p>No hay usuarios que coincidan con tu búsqueda.</p></div>}
            </div>
          </section>
        )}

        {seccionActiva === "libros" && (
          <section className="admin-panel">
            <div className="admin-panel-header"><div><p className="etiqueta">PUBLICACIONES</p><h2>Libros</h2><p>Administra las publicaciones realizadas por los usuarios.</p></div></div>
            <div className="admin-buscador"><Search size={20} />
              <input type="search" aria-label="Buscar libros" placeholder="Buscar por título o autor..."
                value={busquedaLibro} onChange={(evento) => setBusquedaLibro(evento.target.value)} />
            </div>
            <div className="tabla-contenedor">
              <table className="tabla-admin">
                <thead><tr><th>ID</th><th>Título</th><th>Autor</th><th>Modalidad</th><th>Estatus</th><th>Acciones</th></tr></thead>
                <tbody>{librosFiltrados.map((libro) => (
                  <tr key={libro.id}>
                    <td>#{libro.id}</td><td><strong>{libro.titulo}</strong></td><td>{libro.autor}</td>
                    <td>{libro.modalidad === "REGALO" ? "Regalo" : "Intercambio"}</td><td>{libro.estatus}</td>
                    <td><div style={{ display: "flex", gap: "0.5rem" }}>
                      {libro.estatus !== "ELIMINADO" && (
                        <>
                          <button className="boton-icono" type="button" disabled={procesando}
                            title={libro.estatus === "OCULTO" ? "Restaurar como disponible" : "Ocultar libro"}
                            aria-label={libro.estatus === "OCULTO" ? "Restaurar libro" : "Ocultar libro"}
                            onClick={() => void cambiarEstadoLibro(libro)}>
                            {libro.estatus === "OCULTO" ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                          <button className="boton-icono peligro" type="button" disabled={procesando}
                            title="Marcar libro como eliminado" aria-label="Eliminar libro"
                            onClick={() => void eliminarLibro(libro)}><Trash2 size={18} /></button>
                        </>
                      )}
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
              {librosFiltrados.length === 0 && <div className="estado-vacio"><BookOpen size={40} /><h3>No encontramos libros</h3><p>No hay publicaciones que coincidan con tu búsqueda.</p></div>}
            </div>
          </section>
        )}
      </section>

      {mostrarFormularioUsuario && (
        <div className="modal-fondo" role="presentation">
          <div className="modal-admin" role="dialog" aria-modal="true" aria-labelledby="titulo-nuevo-usuario">
            <button className="modal-cerrar" type="button" aria-label="Cerrar" onClick={() => setMostrarFormularioUsuario(false)}><X size={20} /></button>
            <p className="etiqueta">NUEVO USUARIO</p><h2 id="titulo-nuevo-usuario">Agregar usuario</h2>
            <form className="formulario-admin" onSubmit={(evento) => { evento.preventDefault(); void crearUsuario(); }}>
              <label>Nombre<input type="text" required value={nuevoUsuario.nombre}
                onChange={(evento) => setNuevoUsuario((anterior) => ({ ...anterior, nombre: evento.target.value }))}
                placeholder="Nombre del usuario" /></label>
              <label>Correo electrónico<input type="email" required value={nuevoUsuario.correo}
                onChange={(evento) => setNuevoUsuario((anterior) => ({ ...anterior, correo: evento.target.value }))}
                placeholder="correo@ejemplo.com" /></label>
              <label>Contraseña<input type="password" minLength={8} required value={nuevoUsuario.password}
                onChange={(evento) => setNuevoUsuario((anterior) => ({ ...anterior, password: evento.target.value }))}
                placeholder="Mínimo 8 caracteres" /></label>
              <label>Rol<select value={nuevoUsuario.rol}
                onChange={(evento) => setNuevoUsuario((anterior) => ({ ...anterior, rol: evento.target.value as Rol }))}>
                <option value="USUARIO">Usuario</option><option value="ADMINISTRADOR">Administrador</option>
              </select></label>
              <div className="modal-botones">
                <button type="button" className="boton secundario" onClick={() => setMostrarFormularioUsuario(false)}>Cancelar</button>
                <button type="submit" className="boton primario" disabled={procesando}>{procesando ? "Creando..." : "Crear usuario"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {usuarioSeleccionado && (
        <div className="modal-fondo" role="presentation">
          <div className="modal-confirmacion" role="dialog" aria-modal="true" aria-labelledby="titulo-eliminar-usuario">
            <h2 id="titulo-eliminar-usuario">¿Eliminar usuario?</h2>
            <p>¿Estás seguro de que quieres eliminar a <strong>{usuarioSeleccionado.nombre}</strong>? Sus libros asociados también podrían eliminarse de la base de datos.</p>
            <div className="modal-botones">
              <button type="button" className="boton secundario" onClick={() => setUsuarioSeleccionado(null)}>Cancelar</button>
              <button type="button" className="boton primario" disabled={procesando} onClick={() => void eliminarUsuario()}>
                {procesando ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default IniAdmin;