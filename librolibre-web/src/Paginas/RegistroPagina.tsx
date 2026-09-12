import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Eye,
  EyeOff,
  ImagePlus,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  UserRound,
  X,
} from "lucide-react";

const estadosMexico = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Coahuila de Zaragoza",
  "Colima",
  "Ciudad de México",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán de Ocampo",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz de Ignacio de la Llave",
  "Yucatán",
  "Zacatecas",
];

const tiposImagenPermitidos = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const tamanoMaximoFoto = 5 * 1024 * 1024;

function RegistroPagina() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [estado, setEstado] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [vistaPreviaFoto, setVistaPreviaFoto] = useState<string | null>(null);
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [estaEnviando, setEstaEnviando] = useState(false);

  useEffect(() => {
    return () => {
      if (vistaPreviaFoto) {
        URL.revokeObjectURL(vistaPreviaFoto);
      }
    };
  }, [vistaPreviaFoto]);

  const limpiarFoto = () => {
    setFoto(null);
    setVistaPreviaFoto(null);
  };

  const manejarFoto = (evento: ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0] ?? null;

    if (!archivo) {
      limpiarFoto();
      return;
    }

    if (!tiposImagenPermitidos.includes(archivo.type)) {
      setMensaje("La foto debe ser JPG, PNG o WebP.");
      evento.target.value = "";
      return;
    }

    if (archivo.size > tamanoMaximoFoto) {
      setMensaje("La foto no puede superar los 5 MB.");
      evento.target.value = "";
      return;
    }

    setMensaje("");
    setFoto(archivo);
    setVistaPreviaFoto(URL.createObjectURL(archivo));
  };

  const limpiarFormulario = () => {
    setNombre("");
    setCorreo("");
    setTelefono("");
    setCiudad("");
    setEstado("");
    setDescripcion("");
    limpiarFoto();
    setContrasena("");
    setConfirmarContrasena("");
    setAceptaTerminos(false);
    setAceptaPrivacidad(false);
  };

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setMensaje("");

    if (
      !nombre.trim() ||
      !correo.trim() ||
      !telefono.trim() ||
      !ciudad.trim() ||
      !estado ||
      !contrasena ||
      !confirmarContrasena
    ) {
      setMensaje("Completa todos los campos obligatorios.");
      return;
    }

    const telefonoLimpio = telefono.replace(/\D/g, "");

    if (telefonoLimpio.length !== 10) {
      setMensaje("Ingresa un teléfono válido de 10 dígitos.");
      return;
    }

    if (contrasena.length < 6) {
      setMensaje("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (contrasena !== confirmarContrasena) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    if (!aceptaTerminos || !aceptaPrivacidad) {
      setMensaje(
        "Debes aceptar los términos y el aviso de privacidad para continuar.",
      );
      return;
    }

    try {
      setEstaEnviando(true);

      const datosFormulario = new FormData();
      datosFormulario.append("nombre", nombre.trim());
      datosFormulario.append("correo", correo.trim().toLowerCase());
      datosFormulario.append("telefono", telefonoLimpio);
      datosFormulario.append("ciudad", ciudad.trim());
      datosFormulario.append("estado", estado);
      datosFormulario.append("descripcion", descripcion.trim());
      datosFormulario.append("contrasena", contrasena);

      if (foto) {
        datosFormulario.append("foto", foto);
      }

      const respuesta = await fetch(
        "http://localhost:3000/api/auth/registro",
        {
          method: "POST",
          body: datosFormulario,
        },
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(datos.mensaje ?? "No fue posible crear la cuenta.");
        return;
      }

      setMensaje("Cuenta creada correctamente. Redirigiendo...");
      limpiarFormulario();

      setTimeout(() => {
        navigate("/iniciar-sesion");
      }, 1200);
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      setMensaje(
        "No se pudo conectar con el servidor. Verifica que la API esté ejecutándose.",
      );
    } finally {
      setEstaEnviando(false);
    }
  };

  return (
    <main className="auth-page register-page">
      <section className="auth-visual register-visual">
        <Link className="auth-logo" to="/">
          <span className="auth-logo-icon">
            <BookOpen size={24} />
          </span>
          <span>
            <strong>LibroLibre</strong>
            <small>Comparte. Lee. Reutiliza.</small>
          </span>
        </Link>

        <div className="auth-visual-content">
          <span className="auth-badge">Únete a la comunidad</span>
          <h1>
            Comparte historias,
            <span> crea nuevas conexiones.</span>
          </h1>
          <p>
            Crea tu cuenta para regalar, intercambiar y encontrar libros que
            merecen seguir circulando.
          </p>

          <div className="register-book-stack" aria-hidden="true">
            <div className="stack-book stack-book-one">LEER</div>
            <div className="stack-book stack-book-two">COMPARTIR</div>
            <div className="stack-book stack-book-three">REUTILIZAR</div>
          </div>
        </div>

        <p className="auth-quote">
          “Lee, comparte y dale una nueva vida a tus libros.”
        </p>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-wrapper register-form-wrapper">
          <button
            className="back-link"
            type="button"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={18} />
            Volver al inicio
          </button>

          <div className="auth-title">
            <span className="section-label">Forma parte de LibroLibre</span>
            <h2>Crea tu cuenta</h2>
            <p>Completa tus datos para empezar a compartir libros.</p>
          </div>

          <form
            className="auth-form"
            onSubmit={manejarEnvio}
            encType="multipart/form-data"
          >
            <div className="two-columns">
              <label>
                Nombre completo *
                <span className="input-wrapper">
                  <UserRound size={19} />
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(evento) => setNombre(evento.target.value)}
                    autoComplete="name"
                    required
                  />
                </span>
              </label>

              <label>
                Correo electrónico *
                <span className="input-wrapper">
                  <Mail size={19} />
                  <input
                    type="email"
                    placeholder="tu.correo@ejemplo.com"
                    value={correo}
                    onChange={(evento) => setCorreo(evento.target.value)}
                    autoComplete="email"
                    required
                  />
                </span>
              </label>
            </div>

            <div className="two-columns">
              <label>
                Teléfono *
                <span className="input-wrapper">
                  <Phone size={19} />
                  <input
                    type="tel"
                    placeholder="10 dígitos"
                    value={telefono}
                    onChange={(evento) => setTelefono(evento.target.value)}
                    autoComplete="tel"
                    maxLength={14}
                    required
                  />
                </span>
                <small>
                  Se utilizará para facilitar el contacto por WhatsApp.
                </small>
              </label>

              <label>
                Ciudad *
                <span className="input-wrapper">
                  <MapPin size={19} />
                  <input
                    type="text"
                    placeholder="Ej. Cocula"
                    value={ciudad}
                    onChange={(evento) => setCiudad(evento.target.value)}
                    autoComplete="address-level2"
                    required
                  />
                </span>
              </label>
            </div>

            <label>
              Estado *
              <span className="input-wrapper select-wrapper">
                <MapPin size={19} />
                <select
                  value={estado}
                  onChange={(evento) => setEstado(evento.target.value)}
                  autoComplete="address-level1"
                  required
                >
                  <option value="">Selecciona tu estado</option>
                  {estadosMexico.map((estadoMexico) => (
                    <option key={estadoMexico} value={estadoMexico}>
                      {estadoMexico}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-icon" size={18} />
              </span>
            </label>

            <label>
              Descripción sobre ti
              <span className="input-wrapper">
                <textarea
                  placeholder="Ej. Amante de la lectura y de compartir libros."
                  value={descripcion}
                  onChange={(evento) => setDescripcion(evento.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </span>
              <small>Opcional. Máximo 500 caracteres.</small>
            </label>

            <label>
              Foto de perfil
              <span className="input-wrapper input-file-wrapper">
                <ImagePlus size={19} />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="user"
                  onChange={manejarFoto}
                />
              </span>
              <small>Opcional. JPG, PNG o WebP. Máximo 5 MB.</small>
            </label>

            {vistaPreviaFoto && (
              <div className="vista-previa-perfil">
                <img
                  src={vistaPreviaFoto}
                  alt="Vista previa de la foto de perfil"
                />
                <button
                  type="button"
                  className="quitar-imagen"
                  onClick={limpiarFoto}
                  aria-label="Quitar foto de perfil"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            <div className="two-columns">
              <label>
                Contraseña *
                <span className="input-wrapper">
                  <LockKeyhole size={19} />
                  <input
                    type={mostrarContrasena ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={contrasena}
                    onChange={(evento) => setContrasena(evento.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setMostrarContrasena(!mostrarContrasena)}
                    aria-label={
                      mostrarContrasena
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {mostrarContrasena ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </span>
              </label>

              <label>
                Confirmar contraseña *
                <span className="input-wrapper">
                  <LockKeyhole size={19} />
                  <input
                    type={mostrarConfirmacion ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={confirmarContrasena}
                    onChange={(evento) =>
                      setConfirmarContrasena(evento.target.value)
                    }
                    autoComplete="new-password"
                    required
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() =>
                      setMostrarConfirmacion(!mostrarConfirmacion)
                    }
                    aria-label={
                      mostrarConfirmacion
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {mostrarConfirmacion ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </span>
              </label>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={(evento) =>
                    setAceptaTerminos(evento.target.checked)
                  }
                  required
                />
                <span>
                  Acepto los <button type="button">términos y condiciones</button>.
                </span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={aceptaPrivacidad}
                  onChange={(evento) =>
                    setAceptaPrivacidad(evento.target.checked)
                  }
                  required
                />
                <span>
                  Acepto el <button type="button">aviso de privacidad</button>.
                </span>
              </label>
            </div>

            {mensaje && <p className="form-message">{mensaje}</p>}

            <button
              type="submit"
              className="button button-primary auth-submit"
              disabled={estaEnviando}
            >
              {estaEnviando ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="auth-switch">
            ¿Ya tienes una cuenta? {" "}
            <Link to="/iniciar-sesion">Inicia sesión</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default RegistroPagina;
