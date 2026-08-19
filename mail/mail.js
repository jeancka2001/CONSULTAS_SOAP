const nodemailer = require("nodemailer");

function crearTransporte(cfg) {
  return nodemailer.createTransport({
    host: cfg.MAIL_HOST,
    port: cfg.MAIL_PORT || 587,
    secure: cfg.MAIL_SECURE || false,
    auth: {
      user: cfg.MAIL_USER,
      pass: cfg.MAIL_PASS,
    },
  });
}

function construirRemitente(from, cfg) {
  const fromRaw = String(from || cfg.MAIL_FROM || cfg.MAIL_USER || "").trim();
  const fromName = String(cfg.MAIL_FROM_NAME || "").trim();

  if (!fromRaw) return "";

  // If caller already sends a full RFC address, preserve it.
  if (fromRaw.includes("<") && fromRaw.includes(">")) {
    return fromRaw;
  }

  if (!fromName) {
    return fromRaw;
  }

  return {
    name: fromName,
    address: fromRaw,
  };
}

async function EnviarCorreo({ from, to, subject, text, html }, cfg) {
  const remitente = construirRemitente(from, cfg);
  console.log(`[EnviarCorreo] Enviando correo a: ${to} | Asunto: ${subject}`);
  try {
    const transporter = crearTransporte(cfg);
    const info = await transporter.sendMail({
      from: remitente,
      to,
      subject,
      text,
      attachDataUrls: true,
      html,
    });
    console.log(`[EnviarCorreo] Correo enviado correctamente. MessageId: ${info.messageId}`);
    return { ok: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EnviarCorreo] Error al enviar correo:`, error.message);
    return { ok: false, error: error.message };
  }
}

module.exports = { EnviarCorreo };
