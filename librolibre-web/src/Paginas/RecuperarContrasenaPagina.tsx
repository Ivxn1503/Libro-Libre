import { useState } from "react";
import type { FormEvent } from "react";

import { URL_API } from "../config";

import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Mail } from "lucide-react";

function RecuperarContrasenaPagina() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [estaEnviando, setEstaEnviando] = useState(false);

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setMensaje("");
    setError("");

    if (!correo.trim()) {
      setError("Escribe tu correo electrónico.");
      return;
    }

    try {
      setEstaEnviando(true);

      const respuesta = await fetch(
  `${URL_API}/api/auth/solicitar-recuperacion`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      correo: correo.trim().toLowerCase(),
    }),
  },
);

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(datos.mensaje ?? "No fue posible procesar la solicitud.");
        return;
      }

      setMensaje(datos.mensaje ?? "Revisa las instrucciones de recuperación.");

      if (datos.tokenDesarrollo) {
        setTimeout(() => {
          navigate(`/restablecer-contrasena/${datos.tokenDesarrollo}`);
        }, 1200);
      }
    } catch (error) {
      console.error("Error al solicitar recuperación:", error);
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
          <span className="auth-badge">Recupera el acceso a tu cuenta</span>
          <h1>Vuelve a compartir tus historias<span> con la comunidad.</span></h1>
          <p>Solicita un enlace temporal para crear una nueva contraseña.</p>
        </div>

        <p className="auth-quote">“Un libro puede tener muchas vidas.”</p>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-wrapper">
          <button className="back-link" type="button" onClick={() => navigate("/iniciar-sesion")}>
            <ArrowLeft size={18} /> Volver al inicio de sesión
          </button>

          <div className="auth-title">
            <span className="section-label">Recuperación de cuenta</span>
            <h2>¿Olvidaste tu contraseña?</h2>
            <p>Escribe tu correo y te indicaremos cómo continuar.</p>
          </div>

          <form className="auth-form" onSubmit={manejarEnvio}>
            <label>
              Correo electrónico
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

            {error && <p className="form-message">{error}</p>}
            {mensaje && <p className="form-message">{mensaje}</p>}

            <button className="button button-primary auth-submit" type="submit" disabled={estaEnviando}>
              {estaEnviando ? "Enviando instrucciones..." : "Continuar"}
            </button>
          </form>

          <p className="auth-switch">
            ¿Recordaste tu contraseña? <Link to="/iniciar-sesion">Inicia sesión</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default RecuperarContrasenaPagina;