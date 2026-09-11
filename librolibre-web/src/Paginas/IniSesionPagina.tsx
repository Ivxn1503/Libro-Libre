import { useState } from "react";
import type { FormEvent } from "react";

import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

function IniSesionPagina() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [estaEnviando, setEstaEnviando] = useState(false);

  const manejarEnvio = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setMensaje("");

    if (!correo.trim() || !contrasena.trim()) {
      setMensaje("Completa tu correo electrónico y contraseña.");
      return;
    }

    try {
      setEstaEnviando(true);

      const respuesta = await fetch(
        "http://localhost:3000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            correo: correo.trim(),
            contrasena,
          }),
        },
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(
          datos.mensaje ?? "No fue posible iniciar sesión.",
        );
        return;
      }

      localStorage.setItem("token", datos.token);
      localStorage.setItem(
        "usuario",
        JSON.stringify(datos.usuario),
      );

      setMensaje("Inicio de sesión correcto. Redirigiendo...");

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);

      setMensaje(
        "No se pudo conectar con el servidor. Verifica que la API esté ejecutándose.",
      );
    } finally {
      setEstaEnviando(false);
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
            Inicia sesión para publicar, guardar tus libros favoritos y
            conectar con otros lectores de tu comunidad.
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

            <p>Accede a tu comunidad de libros compartidos.</p>
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
                  onChange={(evento) =>
                    setCorreo(evento.target.value)
                  }
                  autoComplete="email"
                />
              </span>
            </label>

            <label>
              Contraseña

              <span className="input-wrapper">
                <LockKeyhole size={19} />

                <input
                  type={mostrarContrasena ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={contrasena}
                  onChange={(evento) =>
                    setContrasena(evento.target.value)
                  }
                  autoComplete="current-password"
                />

                <button
                  className="password-toggle"
                  type="button"
                  onClick={() =>
                    setMostrarContrasena(!mostrarContrasena)
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

            <button
              type="button"
              className="forgot-password"
              onClick={() =>
                setMensaje(
                  "La recuperación de contraseña se agregará en el siguiente módulo.",
                )
              }
            >
              ¿Olvidaste tu contraseña?
            </button>

            {mensaje && <p className="form-message">{mensaje}</p>}

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
            <Link to="/registro">Crear cuenta</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default IniSesionPagina;