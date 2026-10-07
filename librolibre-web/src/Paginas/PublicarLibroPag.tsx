import { useEffect, useRef, useState } from "react";
import type {
  ChangeEvent,
  FormEvent,
  MouseEvent,
} from "react";
import {
  ArrowLeft,
  BookOpen,
  HelpCircle,
  ImagePlus,
  Send,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type ModalidadLibro = "REGALO" | "INTERCAMBIO";

type FormularioLibro = {
  titulo: string;
  autor: string;
  editorial: string;
  isbn: string;
  anoPublicacion: string;
  categoriaId: string;
  condicion: string;
  descripcion: string;
  modalidad: ModalidadLibro;
  descripcionIntercambio: string;
  codigoPostal: string;
  ciudad: string;
  estado: string;
  municipio: string;
  colonia: string;
  imagenes: File[];
};

type RespuestaApi = {
  mensaje?: string;
  libro?: {
    id: number;
    imagenPrincipal?: string;
  };
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

type RespuestaCodigoPostal = {
  mensaje?: string;
  codigoPostal?: string;
  estado?: string;
  ciudad?: string;
  municipio?: string;
  colonias?: string[];
};

const URL_API = "http://localhost:3000";
const MAXIMO_IMAGENES = 6;
const MAXIMO_TAMANO_IMAGEN = 5 * 1024 * 1024;

const TIPOS_IMAGEN_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const categorias = [
  { id: "1", nombre: "Literatura" },
  { id: "2", nombre: "Novela" },
  { id: "3", nombre: "Ciencia" },
  { id: "4", nombre: "Tecnología" },
  { id: "5", nombre: "Negocios" },
  { id: "6", nombre: "Educación" },
  { id: "7", nombre: "Filosofía" },
  { id: "8", nombre: "Psicología" },
  { id: "9", nombre: "Infantil" },
  { id: "10", nombre: "Juvenil" },
  { id: "11", nombre: "Arte" },
  { id: "12", nombre: "Cocina" },
  { id: "13", nombre: "Biografías" },
  { id: "14", nombre: "Otros" },
];

const condiciones = [
  { valor: "COMO_NUEVO", nombre: "Como nuevo" },
  { valor: "MUY_BUEN_ESTADO", nombre: "Muy buen estado" },
  { valor: "BUEN_ESTADO", nombre: "Buen estado" },
  { valor: "USO_CONSIDERABLE", nombre: "Uso considerable" },
  { valor: "DANADO", nombre: "Dañado" },
];

const formularioInicial: FormularioLibro = {
  titulo: "",
  autor: "",
  editorial: "",
  isbn: "",
  anoPublicacion: "",
  categoriaId: "",
  condicion: "",
  descripcion: "",
  modalidad: "REGALO",
  descripcionIntercambio: "",
  codigoPostal: "",
  ciudad: "",
  estado: "",
  municipio: "",
  colonia: "",
  imagenes: [],
};

function PublicarLibroPag() {
  const navegar = useNavigate();
  const entradaImagenesRef = useRef<HTMLInputElement>(null);

  const [formulario, setFormulario] =
    useState<FormularioLibro>(formularioInicial);

  const [estadosMexico, setEstadosMexico] =
    useState<EstadoApi[]>([]);

  const [ciudadesDisponibles, setCiudadesDisponibles] =
    useState<CiudadApi[]>([]);

  const [coloniasDisponibles, setColoniasDisponibles] =
    useState<string[]>([]);

  const [cargandoEstados, setCargandoEstados] =
    useState(true);

  const [cargandoCiudades, setCargandoCiudades] =
    useState(false);

  const [cargandoCodigoPostal, setCargandoCodigoPostal] =
    useState(false);

  const [mensaje, setMensaje] = useState("");
  const [mensajeImagenes, setMensajeImagenes] =
    useState("");

  const [mensajeCodigoPostal, setMensajeCodigoPostal] =
    useState("");

  const [esError, setEsError] = useState(false);
  const [estaEnviando, setEstaEnviando] =
    useState(false);

  const [vistasPreviasImagenes, setVistasPreviasImagenes] =
    useState<string[]>([]);

  const [mostrarAyudaIsbn, setMostrarAyudaIsbn] =
    useState(false);

  useEffect(() => {
    const cargarEstados = async () => {
      try {
        setCargandoEstados(true);

        const respuesta = await fetch(
          `${URL_API}/api/ubicaciones/estados`,
        );

        const datos =
          (await respuesta.json()) as RespuestaEstados;

        if (!respuesta.ok) {
          throw new Error(
            datos.mensaje ??
              "No se pudieron cargar los estados.",
          );
        }

        setEstadosMexico(datos.estados ?? []);
      } catch (error) {
        console.error(
          "Error al cargar estados:",
          error,
        );

        setEsError(true);
        setMensaje(
          "No se pudieron cargar los estados. Verifica que la API esté ejecutándose.",
        );
      } finally {
        setCargandoEstados(false);
      }
    };

    cargarEstados();
  }, []);

  useEffect(() => {
    if (!formulario.estado) {
      setCiudadesDisponibles([]);
      return;
    }

    const cargarCiudades = async () => {
      try {
        setCargandoCiudades(true);
        setCiudadesDisponibles([]);

        const respuesta = await fetch(
          `${URL_API}/api/ubicaciones/estados/${encodeURIComponent(
            formulario.estado,
          )}/ciudades`,
        );

        const datos =
          (await respuesta.json()) as RespuestaCiudades;

        if (!respuesta.ok) {
          throw new Error(
            datos.mensaje ??
              "No se pudieron cargar las ciudades.",
          );
        }

        setCiudadesDisponibles(datos.ciudades ?? []);
      } catch (error) {
        console.error(
          "Error al cargar ciudades:",
          error,
        );

        setEsError(true);
        setMensaje(
          "No se pudieron cargar las ciudades del estado seleccionado.",
        );
      } finally {
        setCargandoCiudades(false);
      }
    };

    cargarCiudades();
  }, [formulario.estado]);

  useEffect(() => {
    return () => {
      vistasPreviasImagenes.forEach((vistaPrevia) => {
        URL.revokeObjectURL(vistaPrevia);
      });
    };
  }, [vistasPreviasImagenes]);

  const actualizarCampo = <K extends keyof FormularioLibro>(
    campo: K,
    valor: FormularioLibro[K],
  ) => {
    setFormulario((formularioAnterior) => ({
      ...formularioAnterior,
      [campo]: valor,
    }));
  };

  const manejarCambioEstado = (
    evento: ChangeEvent<HTMLSelectElement>,
  ) => {
    const estado = evento.target.value;

    setColoniasDisponibles([]);
    setMensajeCodigoPostal("");

    setFormulario((formularioAnterior) => ({
      ...formularioAnterior,
      codigoPostal: "",
      estado,
      ciudad: "",
      municipio: "",
      colonia: "",
    }));
  };

  const manejarCambioCiudad = (
    evento: ChangeEvent<HTMLSelectElement>,
  ) => {
    const ciudad = evento.target.value;

    setColoniasDisponibles([]);
    setMensajeCodigoPostal("");

    setFormulario((formularioAnterior) => ({
      ...formularioAnterior,
      codigoPostal: "",
      ciudad,
      municipio: "",
      colonia: "",
    }));
  };

  const manejarCambioCodigoPostal = async (
    evento: ChangeEvent<HTMLInputElement>,
  ) => {
    const codigoPostal = evento.target.value
      .replace(/\D/g, "")
      .slice(0, 5);

    setMensajeCodigoPostal("");

    if (codigoPostal.length < 5) {
      setColoniasDisponibles([]);

      setFormulario((formularioAnterior) => ({
        ...formularioAnterior,
        codigoPostal,
        estado: "",
        ciudad: "",
        municipio: "",
        colonia: "",
      }));

      return;
    }

    try {
      setCargandoCodigoPostal(true);

      const respuesta = await fetch(
        `${URL_API}/api/ubicaciones/codigo-postal/${codigoPostal}`,
      );

      const datos =
        (await respuesta.json()) as RespuestaCodigoPostal;

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ??
            "No se encontró información para ese código postal.",
        );
      }

      const estadoEncontrado = datos.estado ?? "";
      const ciudadEncontrada = datos.ciudad ?? "";
      const municipioEncontrado = datos.municipio ?? "";
      const coloniasEncontradas = datos.colonias ?? [];

      setColoniasDisponibles(coloniasEncontradas);

      setFormulario((formularioAnterior) => ({
        ...formularioAnterior,
        codigoPostal,
        estado: estadoEncontrado,
        ciudad: ciudadEncontrada,
        municipio: municipioEncontrado,
        colonia:
          coloniasEncontradas.length === 1
            ? coloniasEncontradas[0]
            : "",
      }));
    } catch (error) {
      console.error(
        "Error al buscar código postal:",
        error,
      );

      setColoniasDisponibles([]);

      setFormulario((formularioAnterior) => ({
        ...formularioAnterior,
        codigoPostal,
        estado: "",
        ciudad: "",
        municipio: "",
        colonia: "",
      }));

      setMensajeCodigoPostal(
        error instanceof Error
          ? error.message
          : "No se encontró información para ese código postal.",
      );
    } finally {
      setCargandoCodigoPostal(false);
    }
  };

  const manejarImagenes = (
    evento: ChangeEvent<HTMLInputElement>,
  ) => {
    const archivosSeleccionados = Array.from(
      evento.target.files ?? [],
    );

    evento.target.value = "";

    if (formulario.imagenes.length >= MAXIMO_IMAGENES) {
      setMensajeImagenes(
        `Ya tienes ${MAXIMO_IMAGENES} fotos. Borra una para agregar otra.`,
      );
      return;
    }

    if (archivosSeleccionados.length === 0) {
      return;
    }

    const espaciosDisponibles =
      MAXIMO_IMAGENES - formulario.imagenes.length;

    if (archivosSeleccionados.length > espaciosDisponibles) {
      setMensajeImagenes(
        `Puedes agregar como máximo ${MAXIMO_IMAGENES} fotos. Borra una para agregar otra.`,
      );
      return;
    }

    const imagenInvalida = archivosSeleccionados.find(
      (archivo) =>
        !TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type),
    );

    if (imagenInvalida) {
      setMensajeImagenes(
        "Todas las imágenes deben ser JPG, PNG o WebP.",
      );
      return;
    }

    const imagenMuyGrande = archivosSeleccionados.find(
      (archivo) => archivo.size > MAXIMO_TAMANO_IMAGEN,
    );

    if (imagenMuyGrande) {
      setMensajeImagenes(
        "Cada imagen debe pesar como máximo 5 MB.",
      );
      return;
    }

    const imagenesActualizadas = [
      ...formulario.imagenes,
      ...archivosSeleccionados,
    ];

    const vistasPreviasNuevas = archivosSeleccionados.map(
      (archivo) => URL.createObjectURL(archivo),
    );

    setEsError(false);
    setMensajeImagenes("");

    actualizarCampo("imagenes", imagenesActualizadas);

    setVistasPreviasImagenes((vistasAnteriores) => [
      ...vistasAnteriores,
      ...vistasPreviasNuevas,
    ]);
  };

  const quitarImagen = (indice: number) => {
    const vistaPrevia = vistasPreviasImagenes[indice];

    if (vistaPrevia) {
      URL.revokeObjectURL(vistaPrevia);
    }

    actualizarCampo(
      "imagenes",
      formulario.imagenes.filter(
        (_, indiceActual) => indiceActual !== indice,
      ),
    );

    setVistasPreviasImagenes((vistasAnteriores) =>
      vistasAnteriores.filter(
        (_, indiceActual) => indiceActual !== indice,
      ),
    );

    setMensajeImagenes("");
  };

  const manejarClicSelector = (
    evento: MouseEvent<HTMLInputElement>,
  ) => {
    if (formulario.imagenes.length >= MAXIMO_IMAGENES) {
      evento.preventDefault();

      setMensajeImagenes(
        `Ya tienes ${MAXIMO_IMAGENES} fotos. Borra una para agregar otra.`,
      );
    }
  };

  const manejarEnvio = async (
    evento: FormEvent<HTMLFormElement>,
  ) => {
    evento.preventDefault();

    setMensaje("");
    setEsError(false);

    const estadoValido = estadosMexico.some(
      (estado) => estado.nombre === formulario.estado,
    );

    const ciudadValida = ciudadesDisponibles.some(
      (ciudad) => ciudad.nombre === formulario.ciudad,
    );

    if (
      !formulario.titulo.trim() ||
      !formulario.autor.trim() ||
      !formulario.categoriaId ||
      !formulario.condicion ||
      !formulario.descripcion.trim() ||
      !formulario.codigoPostal ||
      formulario.codigoPostal.length !== 5 ||
      !formulario.estado ||
      !formulario.ciudad ||
      !estadoValido ||
      !ciudadValida ||
      (coloniasDisponibles.length > 0 &&
        !formulario.colonia) ||
      formulario.imagenes.length === 0
    ) {
      setEsError(true);

      setMensaje(
        "Completa los campos obligatorios, ingresa un código postal válido, selecciona una ubicación válida y agrega al menos una imagen.",
      );

      return;
    }

    if (
      formulario.modalidad === "INTERCAMBIO" &&
      !formulario.descripcionIntercambio.trim()
    ) {
      setEsError(true);

      setMensaje(
        "Describe qué te interesa recibir a cambio.",
      );

      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setEsError(true);

      setMensaje(
        "Debes iniciar sesión antes de publicar un libro.",
      );

      return;
    }

    const anoPublicacion =
      formulario.anoPublicacion.trim() === ""
        ? null
        : Number(formulario.anoPublicacion);

    if (
      anoPublicacion !== null &&
      (!Number.isInteger(anoPublicacion) ||
        anoPublicacion < 1000 ||
        anoPublicacion > new Date().getFullYear())
    ) {
      setEsError(true);

      setMensaje(
        "Ingresa un año de publicación válido.",
      );

      return;
    }

    const datosFormulario = new FormData();

    datosFormulario.append(
      "titulo",
      formulario.titulo.trim(),
    );

    datosFormulario.append(
      "autor",
      formulario.autor.trim(),
    );

    datosFormulario.append(
      "editorial",
      formulario.editorial.trim(),
    );

    datosFormulario.append(
      "isbn",
      formulario.isbn.trim(),
    );

    if (anoPublicacion !== null) {
      datosFormulario.append(
        "anoPublicacion",
        String(anoPublicacion),
      );
    }

    datosFormulario.append(
      "categoriaId",
      String(Number(formulario.categoriaId)),
    );

    datosFormulario.append(
      "condicion",
      formulario.condicion,
    );

    datosFormulario.append(
      "descripcion",
      formulario.descripcion.trim(),
    );

    datosFormulario.append(
      "modalidad",
      formulario.modalidad,
    );

    datosFormulario.append(
      "descripcionIntercambio",
      formulario.modalidad === "INTERCAMBIO"
        ? formulario.descripcionIntercambio.trim()
        : "",
    );

    datosFormulario.append(
      "codigoPostal",
      formulario.codigoPostal.trim(),
    );

    datosFormulario.append(
      "estado",
      formulario.estado,
    );

    datosFormulario.append(
      "ciudad",
      formulario.ciudad,
    );

    datosFormulario.append(
      "municipio",
      formulario.municipio.trim(),
    );

    datosFormulario.append(
      "colonia",
      formulario.colonia.trim(),
    );

    formulario.imagenes.forEach((imagen) => {
      datosFormulario.append("imagenes", imagen);
    });

    try {
      setEstaEnviando(true);

      const respuesta = await fetch(
        `${URL_API}/api/libros`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: datosFormulario,
        },
      );

      const datos =
        (await respuesta.json()) as RespuestaApi;

      if (!respuesta.ok) {
        setEsError(true);

        setMensaje(
          datos.mensaje ??
            "No fue posible publicar el libro.",
        );

        return;
      }

      setEsError(false);

      setMensaje(
        "Libro publicado correctamente. Redirigiendo...",
      );

      vistasPreviasImagenes.forEach((vistaPrevia) => {
        URL.revokeObjectURL(vistaPrevia);
      });

      setFormulario(formularioInicial);
      setCiudadesDisponibles([]);
      setColoniasDisponibles([]);
      setVistasPreviasImagenes([]);
      setMensajeImagenes("");
      setMensajeCodigoPostal("");

      setTimeout(() => {
        navegar("/");
      }, 1200);
    } catch (error) {
      console.error(
        "Error al publicar libro:",
        error,
      );

      setEsError(true);

      setMensaje(
        "No se pudo conectar con el servidor. Verifica que la API esté ejecutándose.",
      );
    } finally {
      setEstaEnviando(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual register-visual">
        <button
          className="back-link"
          type="button"
          onClick={() => navegar("/")}
        >
          <ArrowLeft size={18} />
          Volver al inicio
        </button>

        <div className="auth-visual-content">
          <span className="auth-badge">
            Comparte · Lee · Reutiliza
          </span>

          <h1>
            Dale una nueva vida
            <span> a tus libros.</span>
          </h1>

          <p>
            Publica un libro para regalarlo o intercambiarlo
            con alguien de tu comunidad.
          </p>

          <div className="register-book-stack">
            <div className="stack-book stack-book-one">
              COMPARTE
            </div>
            <div className="stack-book stack-book-two">
              INTERCAMBIA
            </div>
            <div className="stack-book stack-book-three">
              REUTILIZA
            </div>
          </div>
        </div>

        <p className="auth-quote">
          “Cada libro puede tener muchas vidas.”
        </p>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-wrapper register-form-wrapper">
          <div className="auth-title">
            <span className="section-label">
              Nueva publicación
            </span>

            <h2>Publicar un libro</h2>

            <p>
              Completa la información para compartir tu libro
              con la comunidad.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={manejarEnvio}
          >
            <div className="two-columns">
              <label>
                Título del libro *
                <span className="input-wrapper">
                  <BookOpen size={19} />
                  <input
                    type="text"
                    placeholder="Ej. El Principito"
                    value={formulario.titulo}
                    onChange={(evento) =>
                      actualizarCampo(
                        "titulo",
                        evento.target.value,
                      )
                    }
                  />
                </span>
              </label>

              <label>
                Autor *
                <span className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Ej. Antoine de Saint-Exupéry"
                    value={formulario.autor}
                    onChange={(evento) =>
                      actualizarCampo(
                        "autor",
                        evento.target.value,
                      )
                    }
                  />
                </span>
              </label>
            </div>

            <div className="two-columns">
              <label>
                Editorial
                <span className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Editorial"
                    value={formulario.editorial}
                    onChange={(evento) =>
                      actualizarCampo(
                        "editorial",
                        evento.target.value,
                      )
                    }
                  />
                </span>
              </label>

              <label className="label-con-ayuda">
                <span className="titulo-con-ayuda">
                  ISBN
                  <button
                    type="button"
                    className="boton-ayuda"
                    onClick={() =>
                      setMostrarAyudaIsbn(
                        !mostrarAyudaIsbn,
                      )
                    }
                    aria-label="¿Qué es el ISBN?"
                    aria-expanded={mostrarAyudaIsbn}
                  >
                    <HelpCircle size={16} />
                  </button>
                </span>

                {mostrarAyudaIsbn && (
                  <span
                    className="ayuda-isbn"
                    role="tooltip"
                  >
                    El ISBN es un código único que identifica
                    una edición específica de un libro. Este
                    campo es opcional.
                  </span>
                )}

                <span className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={formulario.isbn}
                    onChange={(evento) =>
                      actualizarCampo(
                        "isbn",
                        evento.target.value,
                      )
                    }
                  />
                </span>
              </label>
            </div>

            <div className="two-columns">
              <label>
                Año de publicación
                <span className="input-wrapper">
                  <input
                    type="number"
                    min="1000"
                    max={new Date().getFullYear()}
                    placeholder="Opcional"
                    value={formulario.anoPublicacion}
                    onChange={(evento) =>
                      actualizarCampo(
                        "anoPublicacion",
                        evento.target.value,
                      )
                    }
                  />
                </span>
              </label>

              <label>
                Categoría *
                <span className="input-wrapper">
                  <select
                    value={formulario.categoriaId}
                    onChange={(evento) =>
                      actualizarCampo(
                        "categoriaId",
                        evento.target.value,
                      )
                    }
                  >
                    <option value="">
                      Selecciona una categoría
                    </option>

                    {categorias.map((categoria) => (
                      <option
                        key={categoria.id}
                        value={categoria.id}
                      >
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            </div>

            <label>
              Condición del libro *
              <span className="input-wrapper">
                <select
                  value={formulario.condicion}
                  onChange={(evento) =>
                    actualizarCampo(
                      "condicion",
                      evento.target.value,
                    )
                  }
                >
                  <option value="">
                    Selecciona la condición
                  </option>

                  {condiciones.map((condicion) => (
                    <option
                      key={condicion.valor}
                      value={condicion.valor}
                    >
                      {condicion.nombre}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <label>
              Descripción del libro *
              <span className="input-wrapper">
                <textarea
                  placeholder="Describe el estado y las características del libro."
                  value={formulario.descripcion}
                  onChange={(evento) =>
                    actualizarCampo(
                      "descripcion",
                      evento.target.value,
                    )
                  }
                  rows={4}
                />
              </span>
            </label>

            <label>
              Fotografías del libro *
              <span className="input-wrapper input-file-wrapper">
                <ImagePlus size={19} />
                <input
                  ref={entradaImagenesRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={manejarImagenes}
                  onClick={manejarClicSelector}
                />
              </span>

              <small className="ayuda-fotos">
                Puedes agregar hasta 6 fotos. Formatos permitidos:
                JPG, PNG o WebP. Máximo 5 MB por imagen.
              </small>
            </label>

            {vistasPreviasImagenes.length > 0 && (
              <div className="rejilla-vistas-previas">
                {vistasPreviasImagenes.map(
                  (vistaPrevia, indice) => (
                    <div
                      className="vista-previa-imagen"
                      key={vistaPrevia}
                    >
                      <img
                        src={vistaPrevia}
                        alt={`Vista previa ${
                          indice + 1
                        } del libro`}
                      />

                      {indice === 0 && (
                        <span className="insignia-portada">
                          Portada
                        </span>
                      )}

                      <button
                        type="button"
                        className="quitar-imagen"
                        onClick={() => quitarImagen(indice)}
                        aria-label={`Quitar imagen ${
                          indice + 1
                        }`}
                      >
                        <X size={17} />
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}

            {mensajeImagenes && (
              <p className="mensaje-imagenes-error">
                {mensajeImagenes}
              </p>
            )}

            <fieldset className="modalidad-grupo">
              <legend>Modalidad *</legend>

              <label className="modalidad-opcion">
                <input
                  type="radio"
                  name="modalidad"
                  value="REGALO"
                  checked={formulario.modalidad === "REGALO"}
                  onChange={(evento) =>
                    actualizarCampo(
                      "modalidad",
                      evento.target.value as ModalidadLibro,
                    )
                  }
                />

                <span>
                  <strong>Regalo</strong>
                  <small>
                    Quiero entregar este libro gratuitamente.
                  </small>
                </span>
              </label>

              <label className="modalidad-opcion">
                <input
                  type="radio"
                  name="modalidad"
                  value="INTERCAMBIO"
                  checked={
                    formulario.modalidad === "INTERCAMBIO"
                  }
                  onChange={(evento) =>
                    actualizarCampo(
                      "modalidad",
                      evento.target.value as ModalidadLibro,
                    )
                  }
                />

                <span>
                  <strong>Intercambio</strong>
                  <small>
                    Quiero recibir otro libro a cambio.
                  </small>
                </span>
              </label>
            </fieldset>

            {formulario.modalidad === "INTERCAMBIO" && (
              <label>
                ¿Qué te gustaría recibir a cambio? *
                <span className="input-wrapper">
                  <textarea
                    placeholder="Ej. Me interesa literatura clásica."
                    value={formulario.descripcionIntercambio}
                    onChange={(evento) =>
                      actualizarCampo(
                        "descripcionIntercambio",
                        evento.target.value,
                      )
                    }
                    rows={3}
                  />
                </span>
              </label>
            )}

            <label>
              Código postal *
              <span className="input-wrapper">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="Ej. 48500"
                  value={formulario.codigoPostal}
                  onChange={manejarCambioCodigoPostal}
                />
              </span>

              <small className="ayuda-fotos">
                Ingresa cinco dígitos para completar la ubicación
                automáticamente.
              </small>

              {cargandoCodigoPostal && (
                <small className="ayuda-fotos">
                  Buscando ubicación...
                </small>
              )}

              {mensajeCodigoPostal && (
                <small className="mensaje-imagenes-error">
                  {mensajeCodigoPostal}
                </small>
              )}
            </label>

            <div className="two-columns">
              <label>
                Estado *
                <span className="input-wrapper">
                  <select
                    value={formulario.estado}
                    onChange={manejarCambioEstado}
                    disabled={
                      cargandoEstados || cargandoCodigoPostal
                    }
                  >
                    <option value="">
                      {cargandoEstados
                        ? "Cargando estados..."
                        : "Selecciona tu estado"}
                    </option>

                    {estadosMexico.map((estado) => (
                      <option
                        key={estado.nombre}
                        value={estado.nombre}
                      >
                        {estado.nombre}
                      </option>
                    ))}
                  </select>
                </span>
              </label>

              <label>
                Ciudad *
                <span className="input-wrapper">
                  <select
                    value={formulario.ciudad}
                    onChange={manejarCambioCiudad}
                    disabled={
                      !formulario.estado ||
                      cargandoCiudades ||
                      cargandoCodigoPostal
                    }
                  >
                    <option value="">
                      {cargandoCiudades
                        ? "Cargando ciudades..."
                        : formulario.estado
                          ? "Selecciona tu ciudad"
                          : "Primero selecciona un estado"}
                    </option>

                    {ciudadesDisponibles.map((ciudad) => (
                      <option
                        key={ciudad.nombre}
                        value={ciudad.nombre}
                      >
                        {ciudad.nombre}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            </div>

            <label>
              Municipio o alcaldía
              <span className="input-wrapper">
                <input
                  type="text"
                  placeholder="Se completa con el código postal"
                  value={formulario.municipio}
                  readOnly
                />
              </span>
            </label>

            <label>
              Colonia
              <span className="input-wrapper">
                {coloniasDisponibles.length > 0 ? (
                  <select
                    value={formulario.colonia}
                    onChange={(evento) =>
                      actualizarCampo(
                        "colonia",
                        evento.target.value,
                      )
                    }
                    disabled={cargandoCodigoPostal}
                  >
                    <option value="">
                      Selecciona tu colonia
                    </option>

                    {coloniasDisponibles.map((colonia) => (
                      <option key={colonia} value={colonia}>
                        {colonia}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={formulario.colonia}
                    onChange={(evento) =>
                      actualizarCampo(
                        "colonia",
                        evento.target.value,
                      )
                    }
                  />
                )}
              </span>
            </label>

            {mensaje && (
              <p
                className={`form-message ${
                  esError ? "form-message-error" : ""
                }`}
              >
                {mensaje}
              </p>
            )}

            <button
              type="submit"
              className="button button-primary auth-submit"
              disabled={
                estaEnviando ||
                cargandoEstados ||
                cargandoCiudades ||
                cargandoCodigoPostal
              }
            >
              <Send size={18} />
              {estaEnviando
                ? "Publicando libro..."
                : "Publicar libro"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default PublicarLibroPag;