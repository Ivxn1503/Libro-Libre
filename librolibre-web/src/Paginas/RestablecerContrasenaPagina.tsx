import { useState } from "react";
import type { FormEvent } from "react";

import { URL_API } from "../config";

import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Eye, EyeOff, LockKeyhole } from "lucide-react";

function RestablecerContrasenaPagina() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [estaEnviando, setEstaEnviando] = useState(false);

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setMensaje("");
    setError("");

    if (!token) {
      setError("El enlace de recuperación no contiene un token válido.");
      return;
    }

    if (contrasena.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (contrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setEstaEnviando(true);

      const respuesta = await fetch(
  `${URL_API}/api/auth/restablecer-contrasena`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      contrasena,
      confirmarContrasena,
    }),
  },
);

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.mensaje ?? "No fue posible actualizar la contraseña.");
        return;
      }

      setMensaje(datos.mensaje ?? "Contraseña actualizada correctamente.");
      setTimeout(() => navigate("/iniciar-sesion"), 1500);
    } catch (error) {
      console.error("Error al restablecer contraseña:", error);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEstaEnviando(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <Link className="auth-logo" to="/">
          <span className="auth-logo-icon"><BookOpen size={24} /></span>
          <span><strong>LibroLibre</strong><small>Comparte. Lee. Reutiliza.</small></span>
        </Link>

        <div className="auth-visual-content">
          <span className="auth-badge">Nueva contraseña</span>
          <h1>Recupera tu cuenta<span> y continúa leyendo.</span></h1>
          <p>Crea una contraseña segura para volver a acceder a LibroLibre.</p>
        </div>

        <p className="auth-quote">“Un libro puede tener muchas vidas.”</p>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-wrapper">
          <button className="back-link" type="button" onClick={() => navigate("/iniciar-sesion")}>
            <ArrowLeft size={18} /> Volver al inicio de sesión
          </button>

          <div className="auth-title">
            <span className="section-label">Restablecer contraseña</span>
            <h2>Crea una nueva contraseña</h2>
            <p>Usa al menos 6 caracteres y confirma la contraseña.</p>
          </div>

          <form className="auth-form" onSubmit={manejarEnvio}>
            <label>
              Nueva contraseña
              <span className="input-wrapper">
                <LockKeyhole size={19} />
                <input
                  type={mostrarContrasena ? "text" : "password"}
                  placeholder="Escribe tu nueva contraseña"
                  value={contrasena}
                  onChange={(evento) => setContrasena(evento.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button className="password-toggle" type="button" onClick={() => setMostrarContrasena(!mostrarContrasena)} aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  {mostrarContrasena ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </span>
            </label>

            <label>
              Confirmar contraseña
              <span className="input-wrapper">
                <LockKeyhole size={19} />
                <input
                  type={mostrarConfirmacion ? "text" : "password"}
                  placeholder="Repite tu nueva contraseña"
                  value={confirmarContrasena}
                  onChange={(evento) => setConfirmarContrasena(evento.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button className="password-toggle" type="button" onClick={() => setMostrarConfirmacion(!mostrarConfirmacion)} aria-label={mostrarConfirmacion ? "Ocultar confirmación" : "Mostrar confirmación"}>
                  {mostrarConfirmacion ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </span>
            </label>

            {error && <p className="form-message">{error}</p>}
            {mensaje && <p className="form-message">{mensaje}</p>}

            <button className="button button-primary auth-submit" type="submit" disabled={estaEnviando}>
              {estaEnviando ? "Actualizando contraseña..." : "Actualizar contraseña"}
            </button>
          </form>

          <p className="auth-switch">
            ¿Prefieres volver? <Link to="/iniciar-sesion">Inicia sesión</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default RestablecerContrasenaPagina;