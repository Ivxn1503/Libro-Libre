import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

type Categoria = {
  id: number;
  nombre: string;
  icono: string | null;
};

type Usuario = {
  id: number;
  nombre: string;
  ciudad: string | null;
  estado: string | null;
  foto: string | null;
};

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
  condicion: string;
  descripcion: string;
  modalidad: "REGALO" | "INTERCAMBIO";
  ciudad: string;
  estado: string;
  colonia: string | null;
  estatus: string;
  categoria: Categoria;
  usuario: Usuario;
  imagenes: ImagenLibro[];
};

type RespuestaLibros = {
  total: number;
  libros: Libro[];
};

function traducirCondicion(condicion: string) {
  const condiciones: Record<string, string> = {
    COMO_NUEVO: "Como nuevo",
    MUY_BUEN_ESTADO: "Muy buen estado",
    BUEN_ESTADO: "Buen estado",
    USO_CONSIDERABLE: "Uso considerable",
    DANADO: "Dañado",
  };

  return condiciones[condicion] || condicion;
}

function App() {
  return (
    <main className="pagina">
      <header className="encabezado">
        <a className="marca" href="/">
          LibroLibre
        </a>

        <nav className="navegacion">
          <a href="#explorar">Explorar libros</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#impacto">Impacto</a>
        </nav>

        <div className="acciones-encabezado">
          <button className="boton texto" type="button">
            Iniciar sesión
          </button>

          <button className="boton primario" type="button">
            Publicar un libro
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-contenido">
          <p className="etiqueta">
            COMUNIDAD · LECTURA · REUTILIZACIÓN
          </p>

          <h1>Dale una nueva vida a tus libros.</h1>

          <p className="hero-descripcion">
            Intercambia, regala y encuentra libros usados cerca de ti.
            Una comunidad para compartir historias y hacer que sigan
            circulando.
          </p>

          <div className="hero-acciones">
            <a className="boton primario grande" href="#explorar">
              Explorar libros
            </a>

            <button className="boton secundario grande" type="button">
              + Publicar un libro
            </button>
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
          onSubmit={(evento) => evento.preventDefault()}
        >
          <label htmlFor="buscar-libro">
            ¿Qué libro estás buscando?
          </label>

          <div className="buscador-campo">
            <input
              id="buscar-libro"
              placeholder="Ejemplo: Cien años de soledad"
              type="search"
            />

            <button className="boton primario" type="submit">
              Buscar
            </button>
          </div>
        </form>
      </section>

      <section className="seccion-libros" id="explorar">
        <div className="seccion-encabezado">
          <div>
            <p className="etiqueta">EXPLORA LA COMUNIDAD</p>
            <h2>Libros disponibles</h2>
            <p>Encuentra historias que esperan un nuevo lector.</p>
          </div>

          <a className="enlace-ver-todos" href="#explorar">
            Ver todos →
          </a>
        </div>

        <ListadoLibros />
      </section>
    </main>
  );
}

function ListadoLibros() {
  const [libros, establecerLibros] = useState<Libro[]>([]);
  const [cargando, establecerCargando] = useState(true);
  const [error, establecerError] = useState("");

  useEffect(() => {
    async function cargarLibros() {
      try {
        establecerCargando(true);
        establecerError("");

        const respuesta = await fetch(
          "http://localhost:3000/api/libros",
        );

        if (!respuesta.ok) {
          throw new Error("No se pudieron obtener los libros.");
        }

        const datos = (await respuesta.json()) as RespuestaLibros;

        establecerLibros(datos.libros);
      } catch (error) {
        console.error(error);

        establecerError(
          "No fue posible cargar los libros. Verifica que la API esté activa.",
        );
      } finally {
        establecerCargando(false);
      }
    }

    cargarLibros();
  }, []);

  if (cargando) {
    return (
      <p className="mensaje-estado">
        Cargando libros disponibles…
      </p>
    );
  }

  if (error) {
    return (
      <p className="mensaje-estado error">
        {error}
      </p>
    );
  }

  if (libros.length === 0) {
    return (
      <div className="estado-vacio">
        <span aria-hidden="true">📚</span>
        <h3>Aún no hay libros disponibles</h3>
        <p>
          Sé la primera persona en compartir una historia con la comunidad.
        </p>
        <button className="boton primario" type="button">
          Publicar un libro
        </button>
      </div>
    );
  }

  return (
    <div className="rejilla-libros">
      {libros.map((libro) => (
        <article className="tarjeta-libro" key={libro.id}>
          <div className="imagen-libro">
            {libro.imagenes.length > 0 ? (
              <img
                src={libro.imagenes[0].url}
                alt={`Portada de ${libro.titulo}`}
              />
            ) : (
              <div className="portada-sin-imagen">
                <span aria-hidden="true">📖</span>
                <strong>{libro.titulo}</strong>
              </div>
            )}

            <span
              className={
                libro.modalidad === "REGALO"
                  ? "insignia regalo"
                  : "insignia intercambio"
              }
            >
              {libro.modalidad === "REGALO"
                ? "Regalo"
                : "Intercambio"}
            </span>
          </div>

          <div className="tarjeta-contenido">
            <p className="categoria">{libro.categoria.nombre}</p>

            <h3>{libro.titulo}</h3>

            <p className="autor">{libro.autor}</p>

            <p className="ubicacion">
              📍 {libro.ciudad}, {libro.estado}
            </p>

            <div className="tarjeta-pie">
              <span>{traducirCondicion(libro.condicion)}</span>

              <a
                className="enlace-detalle"
                href={`#libro-${libro.id}`}
              >
                Ver libro →
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);