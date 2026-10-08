
import { useState } from "react";
import type { FormEvent } from "react";

import { URL_API } from "../config";

import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldAlert,
  Send,
  X,
} from "lucide-react";

function IniSesionPagina() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] =
    useState(false);

  const [mensaje, setMensaje] = useState("");
  const [estaEnviando, setEstaEnviando] = useState(false);

  // Estados para revisión de cuenta
  const [cuentaBloqueada, setCuentaBloqueada] =
    useState(false);
  const [mostrarRevision, setMostrarRevision] =
    useState(false);
  const [motivoRevision, setMotivoRevision] =
    useState("");
  const [enviandoRevision, setEnviandoRevision] =
    useState(false);
  const [mensajeRevision, setMensajeRevision] =
    useState("");
  const [revisionEnviada, setRevisionEnviada] =
    useState(false);

  const manejarEnvio = async (
    evento: FormEvent<HTMLFormElement>,
  ) => {
    evento.preventDefault();

    setMensaje("");
    setCuentaBloqueada(false);

    if (!correo.trim() || !contrasena.trim()) {
      setMensaje(
        "Completa tu correo electrónico y contraseña.",
      );
      return;
    }

    try {
      setEstaEnviando(true);

      const respuesta = await fetch(
        `${URL_API}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            correo: correo.trim().toLowerCase(),
            contrasena,
          }),
        },
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(
          datos.mensaje ??
            "No fue posible iniciar sesión.",
        );

        if (
          respuesta.status === 403 &&
          datos.codigo === "CUENTA_BLOQUEADA"
        ) {
          setCuentaBloqueada(true);
        }

        return;
      }

      localStorage.setItem("token", datos.token);
      localStorage.setItem(
        "usuario",
        JSON.stringify(datos.usuario),
      );

      setMensaje(
        "Inicio de sesión correcto. Redirigiendo...",
      );

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error(
        "Error al iniciar sesión:",
        error,
      );

      setMensaje(
        "No se pudo conectar con el servidor. Verifica que la API esté ejecutándose.",
      );
    } finally {
      setEstaEnviando(false);
    }
  };

  const abrirRevision = () => {
    setMotivoRevision("");
    setMensajeRevision("");
    setRevisionEnviada(false);
    setMostrarRevision(true);
  };

  const cerrarRevision = () => {
    if (enviandoRevision) return;

    setMostrarRevision(false);
    setMensajeRevision("");
  };

  const enviarSolicitudRevision = async (
    evento: FormEvent<HTMLFormElement>,
  ) => {
    evento.preventDefault();

    setMensajeRevision("");

    const motivo = motivoRevision.trim();

    if (motivo.length < 10) {
      setMensajeRevision(
        "Explica tu situación con al menos 10 caracteres.",
      );
      return;
    }

    if (motivo.length > 1000) {
      setMensajeRevision(
        "El motivo no puede superar los 1000 caracteres.",
      );
      return;
    }

    try {
      setEnviandoRevision(true);

      const respuesta = await fetch(
        `${URL_API}/api/solicitudes/solicitar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            correo: correo.trim().toLowerCase(),
            motivo,
          }),
        },
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setMensajeRevision(
          datos.mensaje ??
            "No fue posible procesar la solicitud.",
        );
        return;
      }

      setRevisionEnviada(true);
      setMensajeRevision(
        datos.mensaje ??
          "Si corresponde, recibirás un correo para verificar tu solicitud.",
      );
    } catch (error) {
      console.error(
        "Error al solicitar revisión:",
        error,
      );

      setMensajeRevision(
        "No se pudo conectar con el servidor. Inténtalo nuevamente.",
      );
    } finally {
      setEnviandoRevision(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
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
          <span className="auth-badge">
            Comunidad · Lectura · Reutilización
          </span>

          <h1>
            Tus libros pueden encontrar
            <span> una nueva historia.</span>
          </h1>

          <p>
            Inicia sesión para publicar, guardar tus
            libros favoritos y conectar con otros
            lectores de tu comunidad.
          </p>

          <div className="auth-visual-points">
            <span>✓ Regala o intercambia libros</span>
            <span>✓ Encuentra lecturas cerca de ti</span>
            <span>✓ Construye una comunidad lectora</span>
          </div>
        </div>

        <p className="auth-quote">
          “Un libro puede tener muchas vidas.”
        </p>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-wrapper">
          <button
            className="back-link"
            type="button"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={18} />
            Volver al inicio
          </button>

          <div className="auth-title">
            <span className="section-label">
              Bienvenido de nuevo
            </span>

            <h2>Inicia sesión</h2>

            <p>
              Accede a tu comunidad de libros
              compartidos.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={manejarEnvio}
          >
            <label>
              Correo electrónico

              <span className="input-wrapper">
                <Mail size={19} />

                <input
                  type="email"
                  placeholder="tu.correo@ejemplo.com"
                  value={correo}
                  onChange={(evento) => {
                    setCorreo(evento.target.value);
                    setCuentaBloqueada(false);
                    setMensaje("");
                  }}
                  autoComplete="email"
                  required
                />
              </span>
            </label>

            <label>
              Contraseña

              <span className="input-wrapper">
                <LockKeyhole size={19} />

                <input
                  type={
                    mostrarContrasena
                      ? "text"
                      : "password"
                  }
                  placeholder="Ingresa tu contraseña"
                  value={contrasena}
                  onChange={(evento) => {
                    setContrasena(evento.target.value);
                    setCuentaBloqueada(false);
                    setMensaje("");
                  }}
                  autoComplete="current-password"
                  required
                />

                <button
                  className="password-toggle"
                  type="button"
                  onClick={() =>
                    setMostrarContrasena(
                      !mostrarContrasena,
                    )
                  }
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

            <Link
              className="forgot-password"
              to="/recuperar-contrasena"
            >
              ¿Olvidaste tu contraseña?
            </Link>

            {mensaje && (
              <p className="form-message">
                {mensaje}
              </p>
            )}

            {cuentaBloqueada && (
              <div className="revision-aviso">
                <div className="revision-aviso-titulo">
                  <ShieldAlert size={22} />
                  <strong>Cuenta bloqueada</strong>
                </div>

                <p>
                  Si consideras que tu cuenta fue
                  bloqueada por error, puedes solicitar
                  que un administrador revise tu caso.
                </p>

                <button
                  type="button"
                  className="revision-boton"
                  onClick={abrirRevision}
                >
                  Solicitar revisión de cuenta
                </button>
              </div>
            )}

            <button
              type="submit"
              className="button button-primary auth-submit"
              disabled={estaEnviando}
            >
              {estaEnviando
                ? "Iniciando sesión..."
                : "Iniciar sesión"}
            </button>
          </form>

          <p className="auth-switch">
            ¿Aún no tienes una cuenta?{" "}
            <Link to="/registro">
              Crear cuenta
            </Link>
          </p>
        </div>
      </section>

      {mostrarRevision && (
        <div
          className="revision-modal-fondo"
          onClick={cerrarRevision}
        >
          <div
            className="revision-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="revision-modal-titulo"
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >
            <button
              type="button"
              className="revision-cerrar"
              onClick={cerrarRevision}
              aria-label="Cerrar"
              disabled={enviandoRevision}
            >
              <X size={22} />
            </button>

            {!revisionEnviada ? (
              <>
                <div className="revision-modal-icono">
                  <ShieldAlert size={28} />
                </div>

                <h2 id="revision-modal-titulo">
                  Solicitar revisión de cuenta
                </h2>

                <p>
                  Cuéntanos por qué consideras que
                  deberíamos revisar el bloqueo de
                  tu cuenta.
                </p>

                <form
                  onSubmit={enviarSolicitudRevision}
                  className="revision-formulario"
                >
                  <label htmlFor="revision-correo">
                    Correo registrado
                  </label>

                  <input
                    id="revision-correo"
                    type="email"
                    value={correo}
                    readOnly
                  />

                  <label htmlFor="revision-motivo">
                    Motivo de la solicitud
                  </label>

                  <textarea
                    id="revision-motivo"
                    placeholder="Explica lo sucedido y por qué solicitas una revisión..."
                    value={motivoRevision}
                    onChange={(evento) =>
                      setMotivoRevision(
                        evento.target.value,
                      )
                    }
                    minLength={10}
                    maxLength={1000}
                    rows={5}
                    required
                  />

                  <small>
                    {motivoRevision.length}/1000
                    caracteres
                  </small>

                  {mensajeRevision && (
                    <p className="form-message">
                      {mensajeRevision}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="revision-boton"
                    disabled={enviandoRevision}
                  >
                    <Send size={18} />
                    {enviandoRevision
                      ? "Enviando..."
                      : "Enviar solicitud"}
                  </button>
                </form>
              </>
            ) : (
              <div className="revision-exito">
                <Mail size={42} />

                <h2 id="revision-modal-titulo">
                  Revisa tu correo
                </h2>

                <p>{mensajeRevision}</p>

                <p>
                  Si recibes un enlace de
                  verificación, ábrelo para
                  confirmar tu solicitud.
                </p>

                <button
                  type="button"
                  className="revision-boton"
                  onClick={cerrarRevision}
                >
                  Entendido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default IniSesionPagina;
