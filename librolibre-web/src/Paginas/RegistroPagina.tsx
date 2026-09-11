import { useState } from "react";
import type { FormEvent } from "react";

import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  UserRound,
} from "lucide-react";

function RegistroPagina() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [estado, setEstado] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const manejarEnvio = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();

    if (
      !nombre.trim() ||
      !correo.trim() ||
      !ciudad.trim() ||
      !estado ||
      !contrasena ||
      !confirmarContrasena
    ) {
      setMensaje("Completa todos los campos obligatorios.");
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

    setMensaje(
      "Formulario validado. En el siguiente paso guardaremos el usuario en la base de datos.",
    );
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

          <form className="auth-form" onSubmit={manejarEnvio}>
            <div className="two-columns">
              <label>
                Nombre completo

                <span className="input-wrapper">
                  <UserRound size={19} />

                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(evento) => setNombre(evento.target.value)}
                    autoComplete="name"
                  />
                </span>
              </label>

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
                  />
                </span>
              </label>
            </div>

            <div className="two-columns">
              <label>
                Ciudad

                <span className="input-wrapper">
                  <MapPin size={19} />

                  <input
                    type="text"
                    placeholder="Ej. Ciudad de México"
                    value={ciudad}
                    onChange={(evento) => setCiudad(evento.target.value)}
                  />
                </span>
              </label>

              <label>
                Estado

                <span className="input-wrapper select-wrapper">
                  <MapPin size={19} />

                  <select
                    value={estado}
                    onChange={(evento) => setEstado(evento.target.value)}
                  >
                    <option value="">Selecciona tu estado</option>

                    <option value="Aguascalientes">Aguascalientes</option>
                    <option value="Baja California">Baja California</option>
                    <option value="Baja California Sur">
                      Baja California Sur
                    </option>
                    <option value="Campeche">Campeche</option>
                    <option value="Chiapas">Chiapas</option>
                    <option value="Chihuahua">Chihuahua</option>
                    <option value="Coahuila de Zaragoza">
                      Coahuila de Zaragoza
                    </option>
                    <option value="Colima">Colima</option>
                    <option value="Ciudad de México">
                      Ciudad de México
                    </option>
                    <option value="Durango">Durango</option>
                    <option value="Estado de México">
                      Estado de México
                    </option>
                    <option value="Guanajuato">Guanajuato</option>
                    <option value="Guerrero">Guerrero</option>
                    <option value="Hidalgo">Hidalgo</option>
                    <option value="Jalisco">Jalisco</option>
                    <option value="Michoacán de Ocampo">
                      Michoacán de Ocampo
                    </option>
                    <option value="Morelos">Morelos</option>
                    <option value="Nayarit">Nayarit</option>
                    <option value="Nuevo León">Nuevo León</option>
                    <option value="Oaxaca">Oaxaca</option>
                    <option value="Puebla">Puebla</option>
                    <option value="Querétaro">Querétaro</option>
                    <option value="Quintana Roo">Quintana Roo</option>
                    <option value="San Luis Potosí">
                      San Luis Potosí
                    </option>
                    <option value="Sinaloa">Sinaloa</option>
                    <option value="Sonora">Sonora</option>
                    <option value="Tabasco">Tabasco</option>
                    <option value="Tamaulipas">Tamaulipas</option>
                    <option value="Tlaxcala">Tlaxcala</option>
                    <option value="Veracruz de Ignacio de la Llave">
                      Veracruz de Ignacio de la Llave
                    </option>
                    <option value="Yucatán">Yucatán</option>
                    <option value="Zacatecas">Zacatecas</option>
                  </select>

                  <ChevronDown className="select-icon" size={18} />
                </span>
              </label>
            </div>

            <div className="two-columns">
              <label>
                Contraseña

                <span className="input-wrapper">
                  <LockKeyhole size={19} />

                  <input
                    type={mostrarContrasena ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={contrasena}
                    onChange={(evento) => setContrasena(evento.target.value)}
                    autoComplete="new-password"
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

              <label>
                Confirmar contraseña

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
                />

                <span>
                  Acepto los{" "}
                  <button type="button">términos y condiciones</button>.
                </span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={aceptaPrivacidad}
                  onChange={(evento) =>
                    setAceptaPrivacidad(evento.target.checked)
                  }
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
            >
              Crear cuenta
            </button>
          </form>

          <p className="auth-switch">
            ¿Ya tienes una cuenta?{" "}
            <Link to="/iniciar-sesion">Inicia sesión</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default RegistroPagina;