import { useEffect, useState } from "react";

import "../Estilos/editarlib.css";
import { URL_API } from "../config";

import {
  ArrowLeft,
  BookOpen,
  Gift,
  ImagePlus,
  Repeat2,
  Save,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

type ImagenLibro = {
  id: number;
  url: string;
  esPortada: boolean;
  orden: number;
};

type CategoriaLibro = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  icono?: string | null;
};

type LibroEditar = {
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
  categoria?: CategoriaLibro | null;
  imagenes: ImagenLibro[];
};

type RespuestaLibro = {
  libro?: LibroEditar;
  mensaje?: string;
};

type Categoria = {
  id: number;
  nombre: string;
};

type RespuestaCategorias = {
  categorias?: Categoria[];
  mensaje?: string;
};

type EstadoApi = {
  nombre: string;
};

type CiudadApi = {
  nombre: string;
  municipios?: string[];
};

type RespuestaEstados = {
  estados?: EstadoApi[];
  mensaje?: string;
};

type RespuestaCiudades = {
  estado?: string;
  ciudades?: CiudadApi[];
  mensaje?: string;
};


function EditarLibroPag() {
  const navegar = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [libro, setLibro] = useState<LibroEditar | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [estadosMexico, setEstadosMexico] = useState<EstadoApi[]>([]);
  const [ciudadesDisponibles, setCiudadesDisponibles] = useState<CiudadApi[]>([]);
  const [cargandoEstados, setCargandoEstados] = useState(true);
  const [cargandoCiudades, setCargandoCiudades] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [editorial, setEditorial] = useState("");
  const [isbn, setIsbn] = useState("");
  const [anoPublicacion, setAnoPublicacion] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [condicion, setCondicion] = useState("COMO_NUEVO");
  const [descripcion, setDescripcion] = useState("");
  const [modalidad, setModalidad] = useState<"REGALO" | "INTERCAMBIO">("REGALO");
  const [descripcionIntercambio, setDescripcionIntercambio] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [estado, setEstado] = useState("");
  const [colonia, setColonia] = useState("");

  const [imagenesNuevas, setImagenesNuevas] = useState<File[]>([]);
  const [previsualizaciones, setPrevisualizaciones] = useState<string[]>([]);
  const [estaCargando, setEstaCargando] = useState(true);
  const [estaGuardando, setEstaGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const obtenerUrl = (url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    return `${URL_API}${url.startsWith("/") ? url : `/${url}`}`;
  };

  useEffect(() => {
    const cargarEstados = async () => {
      try {
        setCargandoEstados(true);

        const respuesta = await fetch(
          `${URL_API}/api/ubicaciones/estados`,
        );

        const datos = (await respuesta.json()) as RespuestaEstados;

        if (!respuesta.ok) {
          throw new Error(
            datos.mensaje ?? "No se pudieron cargar los estados.",
          );
        }

        setEstadosMexico(datos.estados ?? []);
      } catch (error) {
        console.error("Error al cargar estados:", error);
        setMensaje("No se pudieron cargar los estados.");
      } finally {
        setCargandoEstados(false);
      }
    };

    cargarEstados();
  }, []);

  useEffect(() => {
    if (!estado) {
      setCiudadesDisponibles([]);
      return;
    }

    const cargarCiudades = async () => {
      try {
        setCargandoCiudades(true);

        const respuesta = await fetch(
          `${URL_API}/api/ubicaciones/estados/${encodeURIComponent(
            estado,
          )}/ciudades`,
        );

        const datos = (await respuesta.json()) as RespuestaCiudades;

        if (!respuesta.ok) {
          throw new Error(
            datos.mensaje ?? "No se pudieron cargar las ciudades.",
          );
        }

        setCiudadesDisponibles(datos.ciudades ?? []);
      } catch (error) {
        console.error("Error al cargar ciudades:", error);
        setCiudadesDisponibles([]);
        setMensaje("No se pudieron cargar las ciudades.");
      } finally {
        setCargandoCiudades(false);
      }
    };

    cargarCiudades();
  }, [estado]);

  useEffect(() => {
    const cargarDatos = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navegar("/iniciar-sesion");
        return;
      }

      if (!id) {
        setMensaje("El identificador del libro no es válido.");
        setEstaCargando(false);
        return;
      }

      try {
        setEstaCargando(true);
        setMensaje("");

        const [respuestaLibro, respuestaCategorias] = await Promise.all([
          fetch(`${URL_API}/api/libros/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${URL_API}/api/categorias`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const datosLibro = (await respuestaLibro.json()) as RespuestaLibro;
        const datosCategorias =
          (await respuestaCategorias.json()) as RespuestaCategorias;

        if (!respuestaLibro.ok || !datosLibro.libro) {
          throw new Error(
            datosLibro.mensaje ?? "No se encontró el libro.",
          );
        }

        const libroCargado = datosLibro.libro;

        setLibro(libroCargado);
        setTitulo(libroCargado.titulo);
        setAutor(libroCargado.autor);
        setEditorial(libroCargado.editorial ?? "");
        setIsbn(libroCargado.isbn ?? "");
        setAnoPublicacion(
          libroCargado.anoPublicacion !== null
            ? String(libroCargado.anoPublicacion)
            : "",
        );
        setCategoriaId(
          libroCargado.categoria?.id !== undefined
            ? String(libroCargado.categoria.id)
            : "",
        );
        setCondicion(libroCargado.condicion);
        setDescripcion(libroCargado.descripcion);
        setModalidad(libroCargado.modalidad);
        setDescripcionIntercambio(
          libroCargado.descripcionIntercambio ?? "",
        );
        setEstado(libroCargado.estado);
        setCiudad(libroCargado.ciudad);
        setColonia(libroCargado.colonia ?? "");

        if (respuestaCategorias.ok && datosCategorias.categorias) {
          setCategorias(datosCategorias.categorias);
        }
      } catch (error) {
        console.error("Error al cargar datos de edición:", error);
        setMensaje(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la información.",
        );
      } finally {
        setEstaCargando(false);
      }
    };

    cargarDatos();
  }, [id, navegar]);

  const manejarImagenes = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(evento.target.files ?? []);

    if (archivos.length === 0) {
      return;
    }

    const imagenesValidas = archivos.filter(
      (archivo) =>
        ["image/jpeg", "image/png", "image/webp"].includes(archivo.type) &&
        archivo.size <= 8 * 1024 * 1024,
    );

    if (imagenesValidas.length !== archivos.length) {
      setMensaje("Solo se permiten imágenes JPG, PNG o WebP de máximo 8 MB.");
    } else {
      setMensaje("");
    }

    const imagenesLimitadas = imagenesValidas.slice(0, 6);

    setImagenesNuevas(imagenesLimitadas);
    setPrevisualizaciones(
      imagenesLimitadas.map((archivo) => URL.createObjectURL(archivo)),
    );
  };

  const quitarImagenNueva = (indice: number) => {
    setImagenesNuevas((actuales) =>
      actuales.filter((_, posicion) => posicion !== indice),
    );

    setPrevisualizaciones((actuales) =>
      actuales.filter((_, posicion) => posicion !== indice),
    );
  };

  const guardarCambios = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navegar("/iniciar-sesion");
      return;
    }

    if (!id) {
      setMensaje("El identificador del libro no es válido.");
      return;
    }

    const estadoValido = estadosMexico.some(
      (estadoDisponible) => estadoDisponible.nombre === estado,
    );

    const ciudadValida = ciudadesDisponibles.some(
      (ciudadDisponible) => ciudadDisponible.nombre === ciudad,
    );

    if (
      !titulo.trim() ||
      !autor.trim() ||
      !categoriaId ||
      !condicion ||
      !descripcion.trim() ||
      !estado.trim() ||
      !ciudad.trim() ||
      !estadoValido ||
      !ciudadValida
    ) {
      setMensaje(
        "Completa los campos obligatorios y selecciona un estado y una ciudad válidos.",
      );
      return;
    }

    if (modalidad === "INTERCAMBIO" && !descripcionIntercambio.trim()) {
      setMensaje("Describe qué deseas recibir a cambio.");
      return;
    }

    try {
      setEstaGuardando(true);
      setMensaje("");

      const datos = new FormData();

      datos.append("titulo", titulo.trim());
      datos.append("autor", autor.trim());
      datos.append("editorial", editorial.trim());
      datos.append("isbn", isbn.trim());
      datos.append("anoPublicacion", anoPublicacion);
      datos.append("categoriaId", categoriaId);
      datos.append("condicion", condicion);
      datos.append("descripcion", descripcion.trim());
      datos.append("modalidad", modalidad);
      datos.append(
        "descripcionIntercambio",
        modalidad === "INTERCAMBIO" ? descripcionIntercambio.trim() : "",
      );
      datos.append("ciudad", ciudad);
      datos.append("estado", estado);
      datos.append("colonia", colonia.trim());

      imagenesNuevas.forEach((imagen) => {
        datos.append("imagenes", imagen);
      });

      const respuesta = await fetch(`${URL_API}/api/libros/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: datos,
      });

      const resultado = (await respuesta.json()) as RespuestaLibro;

      if (!respuesta.ok) {
        throw new Error(
          resultado.mensaje ?? "No se pudo actualizar el libro.",
        );
      }

      navegar(`/libros/${id}`);
    } catch (error) {
      console.error("Error al actualizar libro:", error);
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el libro.",
      );
    } finally {
      setEstaGuardando(false);
    }
  };

  if (estaCargando) {
    return (
      <main className="editar-libro-pagina">
        <div className="detalle-mensaje">Cargando información...</div>
      </main>
    );
  }

  if (!libro) {
    return (
      <main className="editar-libro-pagina">
        <div className="detalle-mensaje detalle-mensaje-error">
          <p>{mensaje || "No se encontró la publicación."}</p>
          <button
            className="boton primario"
            type="button"
            onClick={() => navegar("/app")}
          >
            Volver al perfil
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="editar-libro-pagina">
      <header className="detalle-encabezado">
        <button className="back-link" type="button" onClick={() => navegar(-1)}>
          <ArrowLeft size={18} />
          Volver
        </button>

        <button className="marca" type="button" onClick={() => navegar("/")}>
          LibroLibre
        </button>
      </header>

      <section className="editar-libro-contenedor">
        <div className="editar-libro-encabezado">
          <div>
            <span className="section-label">Mi publicación</span>
            <h1>Editar libro</h1>
            <p>Actualiza la información de tu publicación.</p>
          </div>
          <BookOpen size={48} />
        </div>

        {mensaje && <p className="form-message-error">{mensaje}</p>}

        <div className="editar-libro-formulario">
          <div className="editar-libro-seccion">
            <h2>Información del libro</h2>

            <div className="editar-libro-grid">
              <label>
                Título *
                <input
                  value={titulo}
                  onChange={(evento) => setTitulo(evento.target.value)}
                  maxLength={150}
                />
              </label>

              <label>
                Autor *
                <input
                  value={autor}
                  onChange={(evento) => setAutor(evento.target.value)}
                  maxLength={150}
                />
              </label>

              <label>
                Editorial
                <input
                  value={editorial}
                  onChange={(evento) => setEditorial(evento.target.value)}
                  maxLength={150}
                />
              </label>

              <label>
                ISBN
                <input
                  value={isbn}
                  onChange={(evento) => setIsbn(evento.target.value)}
                  maxLength={30}
                />
              </label>

              <label>
                Año de publicación
                <input
                  type="number"
                  value={anoPublicacion}
                  onChange={(evento) => setAnoPublicacion(evento.target.value)}
                  min={1000}
                  max={new Date().getFullYear()}
                />
              </label>

              <label>
                Categoría *
                <select
                  value={categoriaId}
                  onChange={(evento) => setCategoriaId(evento.target.value)}
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Condición *
                <select
                  value={condicion}
                  onChange={(evento) => setCondicion(evento.target.value)}
                >
                  <option value="COMO_NUEVO">Como nuevo</option>
                  <option value="MUY_BUEN_ESTADO">Muy buen estado</option>
                  <option value="BUEN_ESTADO">Buen estado</option>
                  <option value="USO_CONSIDERABLE">Uso considerable</option>
                  <option value="DANADO">Dañado</option>
                </select>
              </label>
            </div>

            <label>
              Descripción *
              <textarea
                value={descripcion}
                onChange={(evento) => setDescripcion(evento.target.value)}
                rows={5}
                maxLength={1000}
              />
            </label>
          </div>

          <div className="editar-libro-seccion">
            <h2>Modalidad</h2>

            <div className="editar-libro-modalidades">
              <label className={modalidad === "REGALO" ? "modalidad-activa" : ""}>
                <input
                  type="radio"
                  name="modalidad"
                  value="REGALO"
                  checked={modalidad === "REGALO"}
                  onChange={() => setModalidad("REGALO")}
                />
                <Gift size={20} />
                <span>
                  <strong>Regalo</strong>
                  <small>Entregar el libro gratuitamente.</small>
                </span>
              </label>

              <label
                className={
                  modalidad === "INTERCAMBIO" ? "modalidad-activa" : ""
                }
              >
                <input
                  type="radio"
                  name="modalidad"
                  value="INTERCAMBIO"
                  checked={modalidad === "INTERCAMBIO"}
                  onChange={() => setModalidad("INTERCAMBIO")}
                />
                <Repeat2 size={20} />
                <span>
                  <strong>Intercambio</strong>
                  <small>Recibir otro libro a cambio.</small>
                </span>
              </label>
            </div>

            {modalidad === "INTERCAMBIO" && (
              <label>
                ¿Qué deseas recibir a cambio? *
                <textarea
                  value={descripcionIntercambio}
                  onChange={(evento) =>
                    setDescripcionIntercambio(evento.target.value)
                  }
                  rows={3}
                  maxLength={500}
                />
              </label>
            )}
          </div>

          <div className="editar-libro-seccion">
            <h2>Ubicación</h2>

            <div className="editar-libro-grid">
              <label>
                Estado *
                <select
                  value={estado}
                  onChange={(evento) => {
                    setEstado(evento.target.value);
                    setCiudad("");
                  }}
                  disabled={cargandoEstados}
                >
                  <option value="">
                    {cargandoEstados
                      ? "Cargando estados..."
                      : "Selecciona un estado"}
                  </option>
                  {estadosMexico.map((estadoDisponible) => (
                    <option
                      key={estadoDisponible.nombre}
                      value={estadoDisponible.nombre}
                    >
                      {estadoDisponible.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Ciudad *
                <select
                  value={ciudad}
                  onChange={(evento) => setCiudad(evento.target.value)}
                  disabled={!estado || cargandoCiudades}
                >
                  <option value="">
                    {cargandoCiudades
                      ? "Cargando ciudades..."
                      : estado
                        ? "Selecciona una ciudad"
                        : "Primero selecciona un estado"}
                  </option>
                  {ciudadesDisponibles.map((ciudadDisponible) => (
                    <option
                      key={ciudadDisponible.nombre}
                      value={ciudadDisponible.nombre}
                    >
                      {ciudadDisponible.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Colonia
                <input
                  value={colonia}
                  onChange={(evento) => setColonia(evento.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="editar-libro-seccion">
            <h2>Fotografías</h2>

            <p className="editar-libro-ayuda">
              Si no seleccionas nuevas imágenes, se conservarán las actuales.
              Si seleccionas nuevas, reemplazarán las anteriores.
            </p>

            <div className="editar-libro-imagenes-actuales">
              {libro.imagenes.map((imagen) => (
                <img
                  key={imagen.id}
                  src={obtenerUrl(imagen.url)}
                  alt={`Imagen actual de ${libro.titulo}`}
                />
              ))}
            </div>

            <label className="editar-libro-selector-imagenes">
              <ImagePlus size={22} />
              Seleccionar nuevas imágenes
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={manejarImagenes}
              />
            </label>

            {previsualizaciones.length > 0 && (
              <div className="editar-libro-imagenes-nuevas">
                {previsualizaciones.map((previsualizacion, indice) => (
                  <div key={previsualizacion}>
                    <img
                      src={previsualizacion}
                      alt={`Nueva imagen ${indice + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => quitarImagenNueva(indice)}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="editar-libro-acciones">
            <button
              className="boton secundario"
              type="button"
              onClick={() => navegar(-1)}
              disabled={estaGuardando}
            >
              Cancelar
            </button>

            <button
              className="boton primario"
              type="button"
              onClick={guardarCambios}
              disabled={estaGuardando || cargandoEstados || cargandoCiudades}
            >
              <Save size={18} />
              {estaGuardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default EditarLibroPag;