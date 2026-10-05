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

export async function enviarEnlaceRecuperacion({
  correo,
  nombre,
  token,
}: {
  correo: string;
  nombre: string;
  token: string;
}) {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("Falta FRONTEND_URL en el archivo .env.");
  }

  const enlace = `${frontendUrl}/restablecer-contrasena/${encodeURIComponent(token)}`;

  await transportador.sendMail({
    from: `LibroLibre <${correoRemitente}>`,
    to: correo,
    subject: "Cambia tu contraseña de LibroLibre",
    text: `Hola ${nombre},\n\nPara cambiar tu contraseña, abre este enlace:\n${enlace}\n\nEl enlace es válido durante 15 minutos y solo puede utilizarse una vez.\n\nSi no solicitaste este cambio, ignora este correo.\n\nEquipo LibroLibre`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #26352f;">
        <h2>Cambia tu contraseña</h2>
        <p>Hola ${nombre},</p>
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
    text: `Hola ${nombre},\n\nTu contraseña de LibroLibre fue cambiada correctamente.\n\nSi no realizaste este cambio, responde inmediatamente a este correo o contacta al administrador de LibroLibre para bloquear tu cuenta.\n\nPor seguridad, nunca compartas tu contraseña ni códigos de recuperación.\n\nEquipo LibroLibre`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #26352f;">
        <h2>Tu contraseña fue cambiada</h2>
        <p>Hola ${nombre},</p>
        <p>La contraseña de tu cuenta de LibroLibre fue cambiada correctamente.</p>
        <p><strong>¿No fuiste tú?</strong> Responde inmediatamente a este correo o contacta al administrador de LibroLibre para bloquear tu cuenta.</p>
        <p>Por seguridad, nunca compartas tu contraseña ni códigos de recuperación.</p>
        <p>Equipo LibroLibre</p>
      </div>
    `,
  });
}
