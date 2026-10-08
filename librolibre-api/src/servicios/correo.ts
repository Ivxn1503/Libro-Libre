
import nodemailer from "nodemailer";

const correoRemitente = process.env.CORREO_REMITENTE;
const correoContrasena = process.env.CORREO_CONTRASENA;

if (!correoRemitente || !correoContrasena) {
  throw new Error(
    "Faltan CORREO_REMITENTE y CORREO_CONTRASENA en el archivo .env.",
  );
}

const transportador = nodemailer.createTransport({
  service: process.env.CORREO_SERVICIO || "gmail",
  auth: {
    user: correoRemitente,
    pass: correoContrasena,
  },
});

// Escapar texto dinámico antes de insertarlo en HTML.
function escaparHtml(valor: string): string {
  return valor.replace(/[&<>"']/g, (caracter) => {
    const entidades: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entidades[caracter] ?? caracter;
  });
}

function obtenerFrontendUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("Falta FRONTEND_URL en el archivo .env.");
  }

  return frontendUrl.replace(/\/+$/, "");
}

// RECUPERACIÓN DE CONTRASEÑA
export async function enviarEnlaceRecuperacion({
  correo,
  nombre,
  token,
}: {
  correo: string;
  nombre: string;
  token: string;
}) {
  const enlace = `${obtenerFrontendUrl()}/restablecer-contrasena/${encodeURIComponent(token)}`;

  await transportador.sendMail({
    from: `LibroLibre <${correoRemitente}>`,
    to: correo,
    subject: "Cambia tu contraseña de LibroLibre",
    text: `Hola ${nombre},

Para cambiar tu contraseña, abre este enlace:
${enlace}

El enlace es válido durante 15 minutos y solo puede utilizarse una vez.

Si no solicitaste este cambio, ignora este correo.

Equipo LibroLibre`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #26352f;">
        <h2>Cambia tu contraseña</h2>
        <p>Hola ${escaparHtml(nombre)},</p>
        <p>Recibimos una solicitud para cambiar la contraseña de tu cuenta de LibroLibre.</p>
        <p>
          <a href="${enlace}" style="display:inline-block;padding:12px 20px;background:#26352f;color:#fff;text-decoration:none;border-radius:6px;">
            Cambiar contraseña
          </a>
        </p>
        <p>Este enlace es válido durante 15 minutos y solo puede utilizarse una vez.</p>
        <p>Si no solicitaste este cambio, ignora este correo. Tu contraseña actual permanecerá sin cambios.</p>
        <p>Equipo LibroLibre</p>
      </div>
    `,
  });
}

// AVISO DE CONTRASEÑA CAMBIADA
export async function enviarAvisoContrasenaCambiada({
  correo,
  nombre,
}: {
  correo: string;
  nombre: string;
}) {
  await transportador.sendMail({
    from: `LibroLibre <${correoRemitente}>`,
    to: correo,
    subject: "Tu contraseña de LibroLibre fue cambiada",
    text: `Hola ${nombre},

Tu contraseña de LibroLibre fue cambiada correctamente.

Si no realizaste este cambio, responde inmediatamente a este correo o contacta al administrador de LibroLibre para bloquear tu cuenta.

Por seguridad, nunca compartas tu contraseña ni códigos de recuperación.

Equipo LibroLibre`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #26352f;">
        <h2>Tu contraseña fue cambiada</h2>
        <p>Hola ${escaparHtml(nombre)},</p>
        <p>La contraseña de tu cuenta de LibroLibre fue cambiada correctamente.</p>
        <p><strong>¿No fuiste tú?</strong> Responde inmediatamente a este correo o contacta al administrador de LibroLibre para bloquear tu cuenta.</p>
        <p>Por seguridad, nunca compartas tu contraseña ni códigos de recuperación.</p>
        <p>Equipo LibroLibre</p>
      </div>
    `,
  });
}

// VERIFICACIÓN DE SOLICITUD DE REVISIÓN
export async function enviarEnlaceRevisionCuenta({
  correo,
  nombre,
  token,
}: {
  correo: string;
  nombre: string;
  token: string;
}) {
  const enlace = `${obtenerFrontendUrl()}/verificar-revision/${encodeURIComponent(token)}`;

  await transportador.sendMail({
    from: `LibroLibre <${correoRemitente}>`,
    to: correo,
    subject: "Verifica tu solicitud de revisión - LibroLibre",
    text: `Hola ${nombre},

Recibimos una solicitud para revisar el bloqueo de tu cuenta de LibroLibre.

Para verificar que eres el propietario de la cuenta y continuar con la solicitud, abre este enlace:

${enlace}

El enlace será válido durante 15 minutos y solo podrá utilizarse una vez.

Verificar tu correo no significa que tu cuenta será desbloqueada automáticamente. Un administrador revisará tu solicitud.

Si no solicitaste esta revisión, ignora este mensaje.

Equipo LibroLibre`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #26352f; max-width: 600px; margin: auto;">
        <h2>Solicitud de revisión de cuenta</h2>

        <p>Hola ${escaparHtml(nombre)},</p>

        <p>Recibimos una solicitud para revisar el bloqueo de tu cuenta de <strong>LibroLibre</strong>.</p>

        <p>Para confirmar que este correo te pertenece y continuar con la solicitud, selecciona el siguiente botón:</p>

        <p style="margin: 28px 0;">
          <a
            href="${enlace}"
            style="display:inline-block;padding:14px 24px;background:#2f7d39;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;"
          >
            Verificar solicitud
          </a>
        </p>

        <p>Este enlace es válido durante <strong>15 minutos</strong> y solo puede utilizarse una vez.</p>

        <p>La verificación no desbloquea automáticamente tu cuenta. Un administrador evaluará tu solicitud.</p>

        <p>Si no solicitaste esta revisión, puedes ignorar este correo.</p>

        <p>Equipo LibroLibre</p>
      </div>
    `,
  });
}
