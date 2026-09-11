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
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todos");

  const irASeccion = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });

    setMenuAbierto(false);
  };

  const mostrarMensaje = (mensaje: string) => {
    alert(mensaje);
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
    <>
      <header className="navbar">
        <div className="container navbar-content">
          <button className="brand" onClick={() => irASeccion("inicio")}>
            <span className="brand-icon">
              <BookOpen size={23} />
            </span>

            <span>
              <strong>LibroLibre</strong>
              <small>Comparte. Lee. Reutiliza.</small>
            </span>
          </button>

          <nav className="desktop-nav">
            <button className="active" onClick={() => irASeccion("inicio")}>
              Inicio
            </button>

            <button onClick={() => irASeccion("explorar")}>
              Explorar libros
            </button>

            <button onClick={() => navegar("/registro")}>
              Publicar libro
            </button>

            <button onClick={() => irASeccion("como-funciona")}>
              Cómo funciona
            </button>

            <button onClick={() => irASeccion("impacto")}>Impacto</button>
          </nav>

          <div className="desktop-actions">
            <button
              className="icon-button"
              title="Buscar"
              onClick={() => irASeccion("explorar")}
            >
              <Search size={20} />
            </button>

            <button
              className="icon-button"
              title="Favoritos"
              onClick={() =>
                mostrarMensaje(
                  "Los favoritos estarán disponibles al iniciar sesión.",
                )
              }
            >
              <Heart size={20} />
            </button>

            <button
              className="login-button"
              onClick={() => navegar("/iniciar-sesion")}
            >
              Iniciar sesión
            </button>
          </div>

          <button
            className="mobile-menu-button"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          >
            {menuAbierto ? <X size={25} /> : <Menu size={25} />}
          </button>
        </div>

        {menuAbierto && (
          <nav className="mobile-nav">
            <button onClick={() => irASeccion("inicio")}>Inicio</button>

            <button onClick={() => irASeccion("explorar")}>
              Explorar libros
            </button>

            <button onClick={() => navegar("/registro")}>
              Publicar libro
            </button>

            <button onClick={() => irASeccion("como-funciona")}>
              Cómo funciona
            </button>

            <button onClick={() => irASeccion("impacto")}>Impacto</button>

            <button onClick={() => navegar("/iniciar-sesion")}>
              Iniciar sesión
            </button>
          </nav>
        )}
      </header>

      <main>
        <section id="inicio" className="hero-section">
          <div className="container hero-grid">
            <div className="hero-content">
              <span className="eyebrow">
                <Leaf size={16} />
                Economía circular · Comunidad · Lectura
              </span>

              <h1>
                Dale una nueva vida <span>a tus libros.</span>
              </h1>

              <p className="hero-description">
                Intercambia, regala y encuentra libros usados cerca de ti. Una
                comunidad para compartir historias, ahorrar y ayudar al
                planeta.
              </p>

              <div className="hero-actions">
                <button
                  className="button button-primary button-large"
                  onClick={() => irASeccion("explorar")}
                >
                  Explorar libros
                  <ArrowRight size={19} />
                </button>

                <button
                  className="button button-secondary button-large"
                  onClick={() => navegar("/registro")}
                >
                  <Upload size={19} />
                  Publicar un libro
                </button>
              </div>

              <div className="hero-values">
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

            <div className="hero-visual">
              <div className="hero-circle" />

              <div className="visual-book book-one">LIBRO</div>
              <div className="visual-book book-two">LIBRE</div>
              <div className="visual-book book-three" />

              <div className="open-book">
                <div>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              <div className="hero-mini-card">
                <HeartHandshake size={23} />

                <div>
                  <strong>Historias que siguen circulando</strong>
                  <small>Regala o intercambia cerca de ti</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="search-section">
          <div className="container">
            <div className="search-box">
              <div className="search-header">
                <div>
                  <span className="section-label">
                    Encuentra tu próxima lectura
                  </span>

                  <h2>¿Qué libro estás buscando?</h2>
                </div>

                <em>Ejemplo: “Cien años de soledad”</em>
              </div>

              <div className="main-search">
                <Search size={22} />

                <input
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                  onKeyDown={(evento) => {
                    if (evento.key === "Enter") {
                      irASeccion("explorar");
                    }
                  }}
                  placeholder="Busca por título o autor..."
                />

                <button
                  className="button button-primary"
                  onClick={() => irASeccion("explorar")}
                >
                  Buscar
                </button>
              </div>

              <div className="quick-filters">
                <strong>Filtros rápidos:</strong>

                {categorias.map((categoria) => (
                  <button
                    key={categoria}
                    className={`chip ${
                      categoriaSeleccionada === categoria ? "selected" : ""
                    }`}
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
            </div>
          </div>
        </section>

        <section id="explorar" className="books-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="section-label">Explora la comunidad</span>

                <h2>Libros que buscan un nuevo lector</h2>

                <p>
                  Descubre publicaciones de personas que quieren regalar o
                  intercambiar historias cerca de ti.
                </p>
              </div>

              <button
                className="all-books-link"
                onClick={() => {
                  setBusqueda("");
                  setCategoriaSeleccionada("Todos");
                }}
              >
                Ver todos los libros
                <ArrowRight size={18} />
              </button>
            </div>

            {librosFiltrados.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={45} />

                <h3>No encontramos libros con esa búsqueda</h3>

                <p>Prueba con otro título, autor o categoría.</p>

                <button
                  className="button button-primary"
                  onClick={() => {
                    setBusqueda("");
                    setCategoriaSeleccionada("Todos");
                  }}
                >
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              <div className="books-grid">
                {librosFiltrados.map((libro) => (
                  <article className="book-card" key={libro.id}>
                    <div className="book-image-container">
                      <img
                        src={libro.imagen}
                        alt={`Portada de ${libro.titulo}`}
                      />

                      <span
                        className={`book-type ${
                          libro.tipo === "Regalo" ? "gift" : "exchange"
                        }`}
                      >
                        {libro.tipo === "Regalo" ? (
                          <Gift size={14} />
                        ) : (
                          <Repeat2 size={14} />
                        )}

                        {libro.tipo}
                      </span>

                      <button
                        className="card-heart"
                        onClick={() =>
                          mostrarMensaje(
                            "Para guardar un libro en favoritos debes iniciar sesión.",
                          )
                        }
                        aria-label={`Guardar ${libro.titulo} en favoritos`}
                      >
                        <Heart size={19} />
                      </button>
                    </div>

                    <div className="book-content">
                      <span className="book-category">
                        {libro.categoria}
                      </span>

                      <h3>{libro.titulo}</h3>

                      <p className="book-author">{libro.autor}</p>

                      <div className="book-info">
                        <span>
                          <MapPin size={15} />
                          {libro.ciudad}, {libro.estado}
                        </span>

                        <strong
                          className={
                            libro.disponibilidad === "Disponible"
                              ? "available"
                              : "reserved"
                          }
                        >
                          {libro.disponibilidad}
                        </strong>
                      </div>

                      <p className="condition">{libro.condicion}</p>

                      <div className="book-actions">
                        <button
                          className="button button-outline"
                          onClick={() =>
                            mostrarMensaje(
                              `Después crearemos el detalle de "${libro.titulo}".`,
                            )
                          }
                        >
                          Ver libro
                        </button>

                        <button
                          className="button button-primary"
                          disabled={libro.disponibilidad !== "Disponible"}
                          onClick={() => navegar("/iniciar-sesion")}
                        >
                          Contactar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="como-funciona" className="how-section">
          <div className="container">
            <div className="centered-heading">
              <span className="section-label">Simple, humano y circular</span>

              <h2>¿Cómo funciona LibroLibre?</h2>

              <p>
                Compartir libros debe ser sencillo: publica, encuentra y
                conecta con alguien de tu comunidad.
              </p>
            </div>

            <div className="steps-grid">
              <article className="step-card">
                <span className="step-number">1</span>

                <div className="step-icon">
                  <Upload size={28} />
                </div>

                <h3>Publica</h3>

                <p>
                  Sube fotos y agrega la información de un libro que ya no
                  utilizas.
                </p>
              </article>

              <article className="step-card">
                <span className="step-number">2</span>

                <div className="step-icon">
                  <Search size={28} />
                </div>

                <h3>Encuentra</h3>

                <p>
                  Busca libros que quieras leer, recibir como regalo o
                  intercambiar.
                </p>
              </article>

              <article className="step-card">
                <span className="step-number">3</span>

                <div className="step-icon">
                  <HeartHandshake size={28} />
                </div>

                <h3>Comparte</h3>

                <p>
                  Contacta a la persona y acuerden un lugar y horario para la
                  entrega.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="impacto" className="impact-section">
          <div className="container impact-grid">
            <div>
              <span className="impact-label">
                <Leaf size={16} />
                Nuestro impacto
              </span>

              <h2>Un libro compartido puede abrir muchas historias.</h2>

              <p>
                LibroLibre busca convertir los libros que ya no utilizas en
                nuevas oportunidades de lectura, comunidad y reutilización.
              </p>

              <button
                className="button impact-button"
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

            <div className="stats-grid">
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
          </div>
        </section>

        <section className="community-section">
          <div className="container community-card">
            <div className="community-icon">
              <HeartHandshake size={32} />
            </div>

            <div>
              <h2>
                No se trata de acumular libros. Se trata de hacerlos circular.
              </h2>

              <p>
                Una red digital para transformar libros usados en oportunidades
                de lectura para otras personas.
              </p>
            </div>

            <button
              className="button button-primary"
              onClick={() => navegar("/registro")}
            >
              Únete a la comunidad
            </button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="footer-brand">
              <BookOpen size={25} />
              <strong>LibroLibre</strong>
            </div>

            <p>
              Una comunidad para regalar, intercambiar y dar una nueva vida a
              los libros que ya no utilizas.
            </p>
          </div>

          <div>
            <h4>Explora</h4>
            <button onClick={() => irASeccion("explorar")}>
              Libros disponibles
            </button>
            <button onClick={() => irASeccion("explorar")}>
              Categorías
            </button>
            <button onClick={() => irASeccion("como-funciona")}>
              Cómo funciona
            </button>
          </div>

          <div>
            <h4>Comunidad</h4>
            <button onClick={() => irASeccion("impacto")}>Impacto</button>
            <button onClick={() => navegar("/registro")}>
              Publicar un libro
            </button>
            <button
              onClick={() =>
                mostrarMensaje(
                  "La sección de ayuda y seguridad se construirá más adelante.",
                )
              }
            >
              Ayuda y seguridad
            </button>
          </div>
        </div>

        <div className="container footer-bottom">
          <span>© 2026 LibroLibre. Comparte, lee y reutiliza.</span>
          <span>Hecho para hacer circular más historias.</span>
        </div>
      </footer>
    </>
  );
}

export default IniPagina;