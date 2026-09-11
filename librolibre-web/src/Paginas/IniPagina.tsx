import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Gift,
  Heart,
  HeartHandshake,
  Leaf,
  MapPin,
  Menu,
  Repeat2,
  Search,
  Sparkles,
  Upload,
  UsersRound,
  X,
} from "lucide-react";

type Libro = {
  id: number;
  titulo: string;
  autor: string;
  categoria: string;
  tipo: "Regalo" | "Intercambio";
  ciudad: string;
  estado: string;
  disponibilidad: "Disponible" | "Reservado";
  condicion: string;
  imagen: string;
};

const categorias = [
  "Todos",
  "Literatura",
  "Académicos",
  "Infantil",
  "Ciencia",
  "Negocios",
  "Desarrollo personal",
  "Novela",
  "Tecnología",
];

const libros: Libro[] = [
  {
    id: 1,
    titulo: "Cien años de soledad",
    autor: "Gabriel García Márquez",
    categoria: "Literatura",
    tipo: "Intercambio",
    ciudad: "Zapopan",
    estado: "Jalisco",
    disponibilidad: "Disponible",
    condicion: "Muy buen estado",
    imagen:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    titulo: "El Principito",
    autor: "Antoine de Saint-Exupéry",
    categoria: "Infantil",
    tipo: "Regalo",
    ciudad: "Guadalajara",
    estado: "Jalisco",
    disponibilidad: "Disponible",
    condicion: "Buen estado",
    imagen:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    titulo: "Hábitos atómicos",
    autor: "James Clear",
    categoria: "Desarrollo personal",
    tipo: "Intercambio",
    ciudad: "Tlaquepaque",
    estado: "Jalisco",
    disponibilidad: "Reservado",
    condicion: "Como nuevo",
    imagen:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    titulo: "Introducción a la programación",
    autor: "Luis Joyanes",
    categoria: "Tecnología",
    tipo: "Regalo",
    ciudad: "Ciudad de México",
    estado: "CDMX",
    disponibilidad: "Disponible",
    condicion: "Uso considerable",
    imagen:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 5,
    titulo: "Breve historia del tiempo",
    autor: "Stephen Hawking",
    categoria: "Ciencia",
    tipo: "Intercambio",
    ciudad: "Monterrey",
    estado: "Nuevo León",
    disponibilidad: "Disponible",
    condicion: "Buen estado",
    imagen:
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 6,
    titulo: "Harry Potter y la piedra filosofal",
    autor: "J. K. Rowling",
    categoria: "Novela",
    tipo: "Regalo",
    ciudad: "Zapopan",
    estado: "Jalisco",
    disponibilidad: "Disponible",
    condicion: "Muy buen estado",
    imagen:
      "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?auto=format&fit=crop&w=900&q=80",
  },
];

function IniPagina() {
  const navegar = useNavigate();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState("Todos");

  const irASeccion = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });

    setMenuAbierto(false);
  };

  const mostrarMensaje = (mensaje: string) => {
    window.alert(mensaje);
  };

  const librosFiltrados = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase();

    return libros.filter((libro) => {
      const coincideTexto =
        !textoBusqueda ||
        libro.titulo.toLowerCase().includes(textoBusqueda) ||
        libro.autor.toLowerCase().includes(textoBusqueda);

      const coincideCategoria =
        categoriaSeleccionada === "Todos" ||
        libro.categoria === categoriaSeleccionada;

      return coincideTexto && coincideCategoria;
    });
  }, [busqueda, categoriaSeleccionada]);

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
          <button
            type="button"
            onClick={() => irASeccion("explorar")}
          >
            Explorar libros
          </button>

          <button
            type="button"
            onClick={() => irASeccion("como-funciona")}
          >
            Cómo funciona
          </button>

          <button
            type="button"
            onClick={() => irASeccion("impacto")}
          >
            Impacto
          </button>
        </nav>

        <div className="acciones-encabezado">
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
            onClick={() => navegar("/registro")}
          >
            Publicar un libro
          </button>

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

          <button type="button" onClick={() => navegar("/registro")}>
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

          <button
            type="button"
            onClick={() => navegar("/iniciar-sesion")}
          >
            Iniciar sesión
          </button>
        </nav>
      )}

      <section id="inicio" className="hero">
        <div className="hero-contenido">
          <p className="etiqueta">
            <Leaf size={16} />
            COMUNIDAD · LECTURA · REUTILIZACIÓN
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
              onClick={() => navegar("/registro")}
            >
              <Upload size={19} />
              Publicar un libro
            </button>
          </div>

          <div className="hero-valores">
            <span>
              <Leaf size={17} />
              Economía circular
            </span>

            <span>
              <UsersRound size={17} />
              Comunidad
            </span>

            <span>
              <BookOpen size={17} />
              Lectura
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
          <label htmlFor="buscar-libro">
            ¿Qué libro estás buscando?
          </label>

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
                {categoria === "Académicos" && <BookOpen size={15} />}
                {categoria === "Infantil" && <BookOpen size={15} />}
                {categoria === "Ciencia" && <Brain size={15} />}
                {categoria === "Negocios" && (
                  <BriefcaseBusiness size={15} />
                )}
                {categoria === "Desarrollo personal" && (
                  <Sparkles size={15} />
                )}
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

        {librosFiltrados.length === 0 ? (
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
            {librosFiltrados.map((libro) => (
              <article className="tarjeta-libro" key={libro.id}>
                <div className="imagen-libro">
                  <img
                    src={libro.imagen}
                    alt={`Portada de ${libro.titulo}`}
                  />

                  <span
                    className={`insignia ${
                      libro.tipo === "Regalo"
                        ? "regalo"
                        : "intercambio"
                    }`}
                  >
                    {libro.tipo === "Regalo" ? (
                      <Gift size={14} />
                    ) : (
                      <Repeat2 size={14} />
                    )}

                    {libro.tipo}
                  </span>
                </div>

                <div className="tarjeta-contenido">
                  <p className="categoria">{libro.categoria}</p>

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
                      onClick={() =>
                        mostrarMensaje(
                          `Después crearemos el detalle de "${libro.titulo}".`,
                        )
                      }
                    >
                      Ver libro <ArrowRight size={16} />
                    </button>
                  </div>

                  <button
                    className="boton primario boton-contactar"
                    type="button"
                    disabled={libro.disponibilidad !== "Disponible"}
                    onClick={() => navegar("/iniciar-sesion")}
                  >
                    {libro.disponibilidad === "Disponible"
                      ? "Contactar"
                      : "Reservado"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="como-funciona" className="seccion-como-funciona">
        <div className="seccion-encabezado centrado">
          <div>
            <p className="etiqueta">SIMPLE, HUMANO Y CIRCULAR</p>

            <h2>¿Cómo funciona LibroLibre?</h2>

            <p>
              Compartir libros debe ser sencillo: publica, encuentra y
              conecta con alguien de tu comunidad.
            </p>
          </div>
        </div>

        <div className="pasos">
          <article className="paso">
            <span className="numero-paso">1</span>
            <Upload size={28} />
            <h3>Publica</h3>
            <p>
              Sube fotos y agrega la información de un libro que ya no
              utilizas.
            </p>
          </article>

          <article className="paso">
            <span className="numero-paso">2</span>
            <Search size={28} />
            <h3>Encuentra</h3>
            <p>
              Busca libros que quieras leer, recibir como regalo o
              intercambiar.
            </p>
          </article>

          <article className="paso">
            <span className="numero-paso">3</span>
            <HeartHandshake size={28} />
            <h3>Comparte</h3>
            <p>
              Contacta a la persona y acuerden un lugar y horario para la
              entrega.
            </p>
          </article>
        </div>
      </section>

      <section id="impacto" className="seccion-impacto">
        <div>
          <p className="etiqueta">
            <Leaf size={16} />
            NUESTRO IMPACTO
          </p>

          <h2>Un libro compartido puede abrir muchas historias.</h2>

          <p>
            LibroLibre busca convertir los libros que ya no utilizas en
            nuevas oportunidades de lectura, comunidad y reutilización.
          </p>

          <button
            className="boton secundario"
            type="button"
            onClick={() =>
              mostrarMensaje(
                "Después construiremos la página completa de Impacto.",
              )
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
            Una red digital para transformar libros usados en oportunidades
            de lectura para otras personas.
          </p>
        </div>

        <button
          className="boton primario"
          type="button"
          onClick={() => navegar("/registro")}
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
          Una comunidad para regalar, intercambiar y dar una nueva vida a
          los libros que ya no utilizas.
        </p>

        <div className="pie-enlaces">
          <button
            type="button"
            onClick={() => irASeccion("explorar")}
          >
            Libros disponibles
          </button>

          <button
            type="button"
            onClick={() => irASeccion("como-funciona")}
          >
            Cómo funciona
          </button>

          <button
            type="button"
            onClick={() => navegar("/registro")}
          >
            Publicar un libro
          </button>
        </div>

        <small>
          © 2026 LibroLibre. Comparte, lee y reutiliza.
        </small>
      </footer>
    </main>
  );
}

export default IniPagina;