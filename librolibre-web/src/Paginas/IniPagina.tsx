import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Gift,
  HeartHandshake,
  Leaf,
  MapPin,
  Menu,
  Search,
  Upload,
  UsersRound,
  X,
} from "lucide-react";

type ImagenLibro = {
  id: number;
  url: string;
  esPortada: boolean;
  orden: number;
};

type Libro = {
  id: number;
  titulo: string;
  autor: string;
  modalidad: "REGALO" | "INTERCAMBIO";
  ciudad: string;
  estado: string;
  estatus: string;
  condicion: string;
  imagenes: ImagenLibro[];
  categoria?: {
    id: number;
    nombre: string;
    icono?: string | null;
  } | null;
};

type RespuestaLibros = {
  total: number;
  libros: Libro[];
};

const URL_API = "http://localhost:3000";
const FOTO_POR_DEFECTO = "/avatar-default.png";

const categorias = [
  "Todos",
  "Literatura",
  "Novela",
  "Ciencia",
  "Tecnología",
  "Negocios",
  "Educación",
  "Filosofía",
  "Psicología",
  "Infantil",
  "Juvenil",
  "Arte",
  "Cocina",
  "Biografías",
  "Otros",
];

function IniPagina() {
  const navegar = useNavigate();

  const [sesionIniciada, setSesionIniciada] = useState(
    Boolean(localStorage.getItem("token")),
  );
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [fotoUsuario, setFotoUsuario] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState("Todos");
  const [libros, setLibros] = useState<Libro[]>([]);
  const [estaCargandoLibros, setEstaCargandoLibros] = useState(true);
  const [errorLibros, setErrorLibros] = useState("");

  useEffect(() => {
    const actualizarSesion = () => {
      const token = localStorage.getItem("token");
      const usuarioGuardado = localStorage.getItem("usuario");

      setSesionIniciada(Boolean(token));

      if (!usuarioGuardado) {
        setNombreUsuario("");
        setFotoUsuario(null);
        return;
      }

      try {
        const usuario = JSON.parse(usuarioGuardado);

        setNombreUsuario(
          usuario.nombre ??
            usuario.nombres ??
            usuario.correo ??
            "Mi cuenta",
        );
        setFotoUsuario(usuario.foto ?? null);
      } catch (error) {
        console.error("No se pudo leer el usuario guardado:", error);
        setNombreUsuario("Mi cuenta");
        setFotoUsuario(null);
      }
    };

    actualizarSesion();
    window.addEventListener("storage", actualizarSesion);

    return () => {
      window.removeEventListener("storage", actualizarSesion);
    };
  }, []);

  useEffect(() => {
    const cargarLibros = async () => {
      try {
        setEstaCargandoLibros(true);
        setErrorLibros("");

        const respuesta = await fetch(`${URL_API}/api/libros`);
        const datos = (await respuesta.json()) as RespuestaLibros;

        if (!respuesta.ok) {
          throw new Error("No fue posible obtener los libros.");
        }

        setLibros(datos.libros ?? []);
      } catch (error) {
        console.error("Error al cargar libros:", error);
        setErrorLibros("No se pudieron cargar los libros publicados.");
      } finally {
        setEstaCargandoLibros(false);
      }
    };

    cargarLibros();
  }, []);

  const irASeccion = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
    setMenuAbierto(false);
  };

  const irAPublicarLibro = () => {
    navegar("/publicar-libro");
    setMenuAbierto(false);
  };

  const irAMiCuenta = () => {
    navegar("/app");
    setMenuAbierto(false);
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setSesionIniciada(false);
    setNombreUsuario("");
    setFotoUsuario(null);
    setMenuAbierto(false);
    navegar("/");
  };

  const obtenerUrlFotoUsuario = (foto: string | null) => {
    if (!foto) {
      return FOTO_POR_DEFECTO;
    }

    if (foto.startsWith("http://") || foto.startsWith("https://")) {
      return foto;
    }

    return `${URL_API}${foto.startsWith("/") ? foto : `/${foto}`}`;
  };

  const mostrarMensaje = (mensaje: string) => {
    window.alert(mensaje);
  };

  const librosFiltrados = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase();

    return libros.filter((libro) => {
      const nombreCategoria = libro.categoria?.nombre ?? "Otros";

      const coincideTexto =
        !textoBusqueda ||
        libro.titulo.toLowerCase().includes(textoBusqueda) ||
        libro.autor.toLowerCase().includes(textoBusqueda);

      const coincideCategoria =
        categoriaSeleccionada === "Todos" ||
        nombreCategoria === categoriaSeleccionada;

      return coincideTexto && coincideCategoria;
    });
  }, [libros, busqueda, categoriaSeleccionada]);

  const obtenerUrlImagen = (libro: Libro) => {
    const primeraImagen = libro.imagenes?.[0];

    if (!primeraImagen?.url) {
      return null;
    }

    if (
      primeraImagen.url.startsWith("http://") ||
      primeraImagen.url.startsWith("https://")
    ) {
      return primeraImagen.url;
    }

    return `${URL_API}${
      primeraImagen.url.startsWith("/")
        ? primeraImagen.url
        : `/${primeraImagen.url}`
    }`;
  };

  const obtenerNombreModalidad = (modalidad: Libro["modalidad"]) =>
    modalidad === "REGALO" ? "Regalo" : "Intercambio";

  const obtenerNombreEstatus = (estatus: string) => {
    if (estatus === "DISPONIBLE") return "Disponible";
    if (estatus === "RESERVADO") return "Reservado";
    if (estatus === "ENTREGADO") return "Entregado";
    return estatus;
  };

  return (
    <main className="pagina">
      <header className="encabezado">
        <button
          className="marca"
          type="button"
          onClick={() => irASeccion("inicio")}
        >
          LibroLibre
        </button>

        <nav className="navegacion">
          <button type="button" onClick={() => irASeccion("explorar")}>
            Explorar libros
          </button>
          <button
            type="button"
            onClick={() => irASeccion("como-funciona")}
          >
            Cómo funciona
          </button>
          <button type="button" onClick={() => irASeccion("impacto")}>
            Impacto
          </button>
        </nav>

        <div className="acciones-encabezado">
          {sesionIniciada ? (
            <>
              <button
                className="boton texto cuenta-encabezado"
                type="button"
                onClick={irAMiCuenta}
              >
                <img
                  src={obtenerUrlFotoUsuario(fotoUsuario)}
                  alt=""
                  className="avatar-encabezado"
                  onError={(evento) => {
                    evento.currentTarget.src = FOTO_POR_DEFECTO;
                  }}
                />
                <span>{nombreUsuario || "Mi cuenta"}</span>
              </button>
              <button
                className="boton primario"
                type="button"
                onClick={cerrarSesion}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button
                className="boton texto"
                type="button"
                onClick={() => navegar("/iniciar-sesion")}
              >
                Iniciar sesión
              </button>
              <button
                className="boton primario"
                type="button"
                onClick={irAPublicarLibro}
              >
                Publicar un libro
              </button>
            </>
          )}

          <button
            className="boton texto menu-movil"
            type="button"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          >
            {menuAbierto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {menuAbierto && (
        <nav className="navegacion-menu">
          <button type="button" onClick={() => irASeccion("inicio")}>
            Inicio
          </button>
          <button type="button" onClick={() => irASeccion("explorar")}>
            Explorar libros
          </button>
          <button type="button" onClick={irAPublicarLibro}>
            Publicar un libro
          </button>
          <button
            type="button"
            onClick={() => irASeccion("como-funciona")}
          >
            Cómo funciona
          </button>
          <button type="button" onClick={() => irASeccion("impacto")}>
            Impacto
          </button>

          {sesionIniciada ? (
            <>
              <button
                type="button"
                onClick={irAMiCuenta}
                className="cuenta-encabezado"
              >
                <img
                  src={obtenerUrlFotoUsuario(fotoUsuario)}
                  alt=""
                  className="avatar-encabezado"
                  onError={(evento) => {
                    evento.currentTarget.src = FOTO_POR_DEFECTO;
                  }}
                />
                <span>{nombreUsuario || "Mi cuenta"}</span>
              </button>
              <button type="button" onClick={cerrarSesion}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                navegar("/iniciar-sesion");
                setMenuAbierto(false);
              }}
            >
              Iniciar sesión
            </button>
          )}
        </nav>
      )}

      <section id="inicio" className="hero">
        <div className="hero-contenido">
          <p className="etiqueta">
            <Leaf size={16} /> COMUNIDAD · LECTURA · REUTILIZACIÓN
          </p>
          <h1>
            Dale una nueva vida <span>a tus libros.</span>
          </h1>
          <p className="hero-descripcion">
            Intercambia, regala y encuentra libros usados cerca de ti. Una
            comunidad para compartir historias, ahorrar y ayudar al planeta.
          </p>

          <div className="hero-acciones">
            <button
              className="boton primario grande"
              type="button"
              onClick={() => irASeccion("explorar")}
            >
              Explorar libros
              <ArrowRight size={19} />
            </button>
            <button
              className="boton secundario grande"
              type="button"
              onClick={irAPublicarLibro}
            >
              <Upload size={19} /> Publicar un libro
            </button>
          </div>

          <div className="hero-valores">
            <span>
              <Leaf size={17} /> Economía circular
            </span>
            <span>
              <UsersRound size={17} /> Comunidad
            </span>
            <span>
              <BookOpen size={17} /> Lectura
            </span>
          </div>
        </div>

        <div className="hero-ilustracion" aria-hidden="true">
          <span className="flor flor-uno">✦</span>
          <span className="flor flor-dos">✿</span>
          <span className="flor flor-tres">✦</span>
          <div className="pila-libros">
            <div className="libro libro-verde">Cuentos</div>
            <div className="libro libro-amarillo">Historias</div>
            <div className="libro libro-naranja">Lecturas</div>
            <div className="libro libro-crema">Libros</div>
          </div>
        </div>
      </section>

      <section className="buscador-seccion">
        <form
          className="buscador"
          onSubmit={(evento) => {
            evento.preventDefault();
            irASeccion("explorar");
          }}
        >
          <label htmlFor="buscar-libro">¿Qué libro estás buscando?</label>
          <div className="buscador-campo">
            <Search size={22} />
            <input
              id="buscar-libro"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Busca por título o autor..."
              type="search"
            />
            <button className="boton primario" type="submit">
              Buscar
            </button>
          </div>

          <div className="filtros-rapidos">
            <strong>Filtros rápidos:</strong>
            {categorias.map((categoria) => (
              <button
                key={categoria}
                className={`filtro ${
                  categoriaSeleccionada === categoria ? "seleccionado" : ""
                }`}
                type="button"
                onClick={() => {
                  setCategoriaSeleccionada(categoria);
                  irASeccion("explorar");
                }}
              >
                {categoria === "Literatura" && <BookOpen size={15} />}
                {categoria === "Infantil" && <BookOpen size={15} />}
                {categoria === "Ciencia" && <BookOpen size={15} />}
                {categoria === "Tecnología" && <BookOpen size={15} />}
                {categoria}
              </button>
            ))}
          </div>
        </form>
      </section>

      <section id="explorar" className="seccion-libros">
        <div className="seccion-encabezado">
          <div>
            <p className="etiqueta">EXPLORA LA COMUNIDAD</p>
            <h2>Libros que buscan un nuevo lector</h2>
            <p>
              Descubre publicaciones de personas que quieren regalar o
              intercambiar historias cerca de ti.
            </p>
          </div>
          <button
            className="enlace-ver-todos"
            type="button"
            onClick={() => {
              setBusqueda("");
              setCategoriaSeleccionada("Todos");
            }}
          >
            Ver todos los libros <ArrowRight size={18} />
          </button>
        </div>

        {estaCargandoLibros && (
          <div className="mensaje-estado">Cargando libros publicados...</div>
        )}

        {errorLibros && (
          <div className="mensaje-estado error">{errorLibros}</div>
        )}

        {!estaCargandoLibros &&
          !errorLibros &&
          (librosFiltrados.length === 0 ? (
            <div className="estado-vacio">
              <BookOpen size={45} />
              <h3>No encontramos libros con esa búsqueda</h3>
              <p>Prueba con otro título, autor o categoría.</p>
              <button
                className="boton primario"
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setCategoriaSeleccionada("Todos");
                }}
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="rejilla-libros">
              {librosFiltrados.map((libro) => {
                const urlImagen = obtenerUrlImagen(libro);
                const nombreCategoria = libro.categoria?.nombre ?? "Otros";
                const modalidad = obtenerNombreModalidad(libro.modalidad);
                const estatus = obtenerNombreEstatus(libro.estatus);

                return (
                  <article className="tarjeta-libro" key={libro.id}>
                    <div className="imagen-libro">
                      {urlImagen ? (
                        <img
                          src={urlImagen}
                          alt={`Portada de ${libro.titulo}`}
                        />
                      ) : (
                        <div className="portada-sin-imagen">
                          <span>📚</span>
                          <strong>{libro.titulo}</strong>
                        </div>
                      )}

                      <span
                        className={`insignia ${
                          libro.modalidad === "REGALO"
                            ? "regalo"
                            : "intercambio"
                        }`}
                      >
                        {libro.modalidad === "REGALO" ? (
                          <Gift size={14} />
                        ) : (
                          <span>↔</span>
                        )}
                        {modalidad}
                      </span>
                    </div>

                    <div className="tarjeta-contenido">
                      <p className="categoria">{nombreCategoria}</p>
                      <h3>{libro.titulo}</h3>
                      <p className="autor">{libro.autor}</p>
                      <p className="ubicacion">
                        <MapPin size={15} />
                        {libro.ciudad}, {libro.estado}
                      </p>

                      <div className="tarjeta-pie">
                        <span>{libro.condicion}</span>
                        <button
                          className="enlace-detalle"
                          type="button"
                          onClick={() => navegar(`/libros/${libro.id}`)}
                        >
                          Ver libro <ArrowRight size={16} />
                        </button>
                      </div>

                      <button
                        className="boton primario boton-contactar"
                        type="button"
                        disabled={libro.estatus !== "DISPONIBLE"}
                        onClick={() => navegar("/iniciar-sesion")}
                      >
                        {estatus === "Disponible" ? "Contactar" : estatus}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ))}
      </section>

      <section id="como-funciona" className="seccion-como-funciona">
        <div className="seccion-encabezado centrado">
          <div>
            <p className="etiqueta">SIMPLE, HUMANO Y CIRCULAR</p>
            <h2>¿Cómo funciona LibroLibre?</h2>
            <p>
              Compartir libros debe ser sencillo: publica, encuentra y conecta
              con alguien de tu comunidad.
            </p>
          </div>
        </div>

        <div className="pasos">
          <article className="paso">
            <span className="numero-paso">1</span>
            <Upload size={28} />
            <h3>Publica</h3>
            <p>
              Sube fotos y agrega la información de un libro que ya no utilizas.
            </p>
          </article>
          <article className="paso">
            <span className="numero-paso">2</span>
            <Search size={28} />
            <h3>Encuentra</h3>
            <p>
              Busca libros que quieras leer, recibir como regalo o intercambiar.
            </p>
          </article>
          <article className="paso">
            <span className="numero-paso">3</span>
            <HeartHandshake size={28} />
            <h3>Comparte</h3>
            <p>
              Contacta a la persona y acuerden un lugar y horario para la entrega.
            </p>
          </article>
        </div>
      </section>

      <section id="impacto" className="seccion-impacto">
        <div>
          <p className="etiqueta">
            <Leaf size={16} /> NUESTRO IMPACTO
          </p>
          <h2>Un libro compartido puede abrir muchas historias.</h2>
          <p>
            LibroLibre busca convertir los libros que ya no utilizas en nuevas
            oportunidades de lectura, comunidad y reutilización.
          </p>
          <button
            className="boton secundario"
            type="button"
            onClick={() =>
              mostrarMensaje("Después construiremos la página completa de Impacto.")
            }
          >
            Conoce nuestro impacto
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="estadisticas">
          <div>
            <strong>1,250</strong>
            <span>Libros reutilizados</span>
          </div>
          <div>
            <strong>850</strong>
            <span>Usuarios en comunidad</span>
          </div>
          <div>
            <strong>620</strong>
            <span>Intercambios realizados</span>
          </div>
          <div>
            <strong>630</strong>
            <span>Libros regalados</span>
          </div>
        </div>
      </section>

      <section className="seccion-comunidad">
        <div>
          <HeartHandshake size={32} />
          <h2>
            No se trata de acumular libros. Se trata de hacerlos circular.
          </h2>
          <p>
            Una red digital para transformar libros usados en oportunidades de
            lectura para otras personas.
          </p>
        </div>
        <button
          className="boton primario"
          type="button"
          onClick={irAPublicarLibro}
        >
          Únete a la comunidad
        </button>
      </section>

      <footer className="pie-pagina">
        <div>
          <BookOpen size={25} />
          <strong>LibroLibre</strong>
        </div>
        <p>
          Una comunidad para regalar, intercambiar y dar una nueva vida a los
          libros que ya no utilizas.
        </p>
        <div className="pie-enlaces">
          <button type="button" onClick={() => irASeccion("explorar")}>
            Libros disponibles
          </button>
          <button
            type="button"
            onClick={() => irASeccion("como-funciona")}
          >
            Cómo funciona
          </button>
          <button type="button" onClick={irAPublicarLibro}>
            Publicar un libro
          </button>
        </div>
        <small>© 2026 LibroLibre. Comparte, lee y reutiliza.</small>
      </footer>
    </main>
  );
}

export default IniPagina;
