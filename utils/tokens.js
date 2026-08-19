const axios = require("axios");
const crypto = require("crypto");
const { pool } = require("../conexion/conexcion");
const { EnviarCorreo } = require("../mail/mail");

const WHATSAPP_API_VERSION = "v24.0";

function formatearNumero(numero) {
  const digits = String(numero || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("593")) return digits;
  if (digits.startsWith("0")) return `593${digits.substring(1)}`;
  if (digits.length === 9 || digits.length === 10) return `593${digits}`;
  return digits;
}

function generarCodigo(length = 6) {
  // 6-digit numeric OTP
  const buf = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += (buf[i] % 10).toString();
  }
  return code;
}

function construirMensajeToken(codigo, ttlMin) {
  return `🔐 TOKEN DE ACCESO\nCódigo: *${codigo}*\nVálido por *${ttlMin}* min\n¿No lo solicitaste? Contacta a Soporte Técnico`;
}

function extraerErrorProveedor(error) {
  const providerData = error?.response?.data;
  return (
    providerData?.error?.message ||
    providerData?.message ||
    error?.message ||
    "No se pudo enviar el mensaje"
  );
}

function enmascararNumero(numero) {
  const digits = String(numero || "").replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  return `${"*".repeat(Math.max(digits.length - 4, 1))}${digits.slice(-4)}`;
}



function parsearNumerosSoporte(raw) {
  const value = String(raw || "").trim();
  if (!value) return [];

  const list = value
    .split(",")
    .map((n) => formatearNumero(n))
    .filter(Boolean);

  return [...new Set(list)];
}

async function enviarWhatsappCodigo({ numero, codigo, ttlMin }, config) {
  console.log("[enviarWhatsappCodigo] Inicio", {
    numero: enmascararNumero(numero),
    ttlMin,
  });

  const phoneNumberId =
    config?.WHATSAPP_PHONE_NUMBER_ID || config?.META_WHATSAPP_PHONE_NUMBER_ID;
  const accessToken =
    config?.WHATSAPP_ACCESS_TOKEN || config?.META_WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId) {
    console.warn("[enviarWhatsappCodigo] Falta WHATSAPP_PHONE_NUMBER_ID");
    return {
      ok: false,
      error: "WHATSAPP_PHONE_NUMBER_ID no configurado",
      estado_envio: "configuracion_incompleta",
      mensaje_envio: "Falta configurar el identificador del número de WhatsApp",
      proveedor: "meta_whatsapp",
    };
  }

  if (!accessToken) {
    console.warn("[enviarWhatsappCodigo] Falta WHATSAPP_ACCESS_TOKEN");
    return {
      ok: false,
      error: "WHATSAPP_ACCESS_TOKEN no configurado",
      estado_envio: "configuracion_incompleta",
      mensaje_envio: "Falta configurar el token de acceso de WhatsApp",
      proveedor: "meta_whatsapp",
    };
  }

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${encodeURIComponent(
    String(phoneNumberId)
  )}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: numero,
    type: "text",
    text: {
      preview_url: false,
      body: construirMensajeToken(codigo, ttlMin),
    },
  };

  try {
    const { status, data } = await axios.post(url, payload, {
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const waId = data?.contacts?.[0]?.wa_id || null;
    const messageId = data?.messages?.[0]?.id || null;

    console.log("[enviarWhatsappCodigo] Envio aceptado", {
      status,
      numero: enmascararNumero(numero),
      messageId,
      waId,
    });

    return {
      ok: true,
      data,
      proveedor: "meta_whatsapp",
      estado_envio: "aceptado",
      mensaje_envio: "Mensaje aceptado correctamente por WhatsApp Cloud API",
      destinatario: numero,
      wa_id: waId,
      message_id: messageId,
      phone_number_id: String(phoneNumberId),
      http_status: status,
    };
  } catch (error) {
    const errorMessage = extraerErrorProveedor(error);
    console.error("[enviarWhatsappCodigo] Error enviando WhatsApp", {
      numero: enmascararNumero(numero),
      status: error?.response?.status || null,
      error: error?.response?.data || error?.message || error,
    });
    return {
      ok: false,
      error: errorMessage,
      proveedor: "meta_whatsapp",
      estado_envio: "rechazado",
      mensaje_envio: "WhatsApp Cloud API rechazó o no pudo procesar el mensaje",
      destinatario: numero,
      phone_number_id: String(phoneNumberId),
      http_status: error?.response?.status || null,
      detalle: error?.response?.data || null,
    };
  }
}



async function generarTokenWhatsapp({ cedula, movil, ttlMin = 3, sessionName }, config) {
  if (!cedula) return { ok: false, estado: "error", mensaje: "cedula es requerido" };
  if (!movil) return { ok: false, estado: "error", mensaje: "movil es requerido" };
  console.log("Generando token para", { cedula, movil, ttlMin, sessionName });
  const numeroFmt = formatearNumero(movil);

  if (!numeroFmt) return { ok: false, estado: "error", mensaje: "Número inválido" };

  const codigo = generarCodigo(6);
  console.log("token generado", codigo);
  // Insertar registro en BD
  const insertSQL =
    "INSERT INTO `tokengenerate`.`token` (`created_at`, `cedula`, `estado`, `token`) VALUES (NOW(), ?, 'activo', ?);";
  await pool.query(insertSQL, [cedula, codigo]);
  console.log("insertSQL: ", insertSQL);
  // Enviar por WhatsApp
  const envio = await enviarWhatsappCodigo({ numero: numeroFmt, codigo, ttlMin, sessionName }, config);
  console.log(envio);
  if (!envio.ok) {
    // Si falla el envío, marcar inactivo
    await pool.query(
      "UPDATE `tokengenerate`.`token` SET estado='inactivo' WHERE cedula=? AND token=?",
      [cedula, codigo]
    );
    return {
      ok: false,
      estado: "error",
      mensaje: envio.error,
      estado_envio: envio.estado_envio || "fallido",
      mensaje_envio: envio.mensaje_envio || envio.error,
      proveedor: envio.proveedor || "meta_whatsapp",
      destinatario: numeroFmt,
      envio,
    };
  }

  return {
    ok: true,
    estado: "exito",
    mensaje: "Token enviado por WhatsApp correctamente",
    estado_envio: envio.estado_envio,
    mensaje_envio: envio.mensaje_envio,
    proveedor: envio.proveedor,
    ttlMin,
    token: codigo,
    destinatario: numeroFmt,
    wa_id: envio.wa_id,
    message_id: envio.message_id,
    phone_number_id: envio.phone_number_id,
    http_status: envio.http_status,
  };
}

async function validarTokenWhatsapp({ cedula, token, ttlMin = 5 }) {

  if (!cedula || !token) return { ok: false, estado: "error", mensaje: "cedula y token son requeridos" };

  const [rows] = await pool.query(
    "SELECT id, created_at, estado FROM `tokengenerate`.`token` WHERE cedula=? AND token=? ORDER BY created_at DESC LIMIT 1",
    [cedula, token]
  );
  console.log("datos token encontrado", { cedula, token, rows });
  if (!rows || rows.length === 0) {
    console.warn("[validarTokenWhatsapp] Token no encontrado", { cedula });
    return { ok: false, estado: "error", mensaje: "Token no encontrado" };
  }
  const row = rows[0];
  if (row.estado !== "activo") {
    console.warn("[validarTokenWhatsapp] Token inactivo", { cedula, estado: row.estado });
    return { ok: false, estado: "error", mensaje: "Token inválido o inactivo" };
  }

  // Validar tiempo
  const [ageRows] = await pool.query(
    "SELECT TIMESTAMPDIFF(SECOND, ?, NOW()) AS age_seconds",
    [row.created_at]
  );
  const ageSeconds = ageRows?.[0]?.age_seconds ?? 0;
  const ttlSeconds = ttlMin * 60;
  console.log("[validarTokenWhatsapp] Edad token", { cedula, ageSeconds, ttlSeconds });

  if (ageSeconds > ttlSeconds) {
    await pool.query("UPDATE `tokengenerate`.`token` SET estado='inactivo' WHERE id=?", [row.id]);
    console.warn("[validarTokenWhatsapp] Token expirado", { cedula, ageSeconds, ttlSeconds });
    return { ok: false, estado: "error", mensaje: "Token expirado" };
  }

  // Consumir token: invalidar tras uso
  await pool.query("UPDATE `tokengenerate`.`token` SET estado='inactivo' WHERE id=?", [row.id]);
  console.log("[validarTokenWhatsapp] Token validado y consumido", { cedula, id: row.id });
  return { ok: true, estado: "exito", mensaje: "Token válido" };
}


async function enviarMensajeWhatsappSoporte({ mensaje, numerosSoporte }, config) {

  if (!mensaje || !String(mensaje).trim()) {
    console.log("enviar mensaje whatsapp soporte sin mensaje");
    return { ok: false, estado: "error", mensaje: "mensaje es requerido" };
  }

  const numerosRaw =
    numerosSoporte ||
    config?.WHATSAPP_SOPORTE_NUMEROS;

  const numeros = parsearNumerosSoporte(numerosRaw);
  console.log("Números de soporte encontrados para enviar mensaje", {
    numeros: numeros.map(enmascararNumero),
  });

  if (!numeros.length) {
    console.warn("[enviarMensajeWhatsappSoporte] Sin numeros configurados");
    return {
      ok: false,
      estado: "error",
      mensaje:
        "No hay números de soporte configurados. Define WHATSAPP_SOPORTE_NUMEROS en el tenant",
    };
  }

  const resultados = [];
  for (const numero of numeros) {
    console.log("enviar mensaje a numero de soporte", { numero: enmascararNumero(numero) });
    const envio = await enviarWhatsappTexto({ numero, mensaje }, config);
    resultados.push({
      numero,
      ok: envio.ok,
      estado_envio: envio.estado_envio,
      mensaje_envio: envio.mensaje_envio,
      error: envio.error || null,
      wa_id: envio.wa_id || null,
      message_id: envio.message_id || null,
      http_status: envio.http_status || null,
    });
  }

  const enviados = resultados.filter((r) => r.ok).length;
  const fallidos = resultados.length - enviados;

  return {
    ok: enviados > 0,
    estado: enviados > 0 ? "exito" : "error",
    mensaje:
      enviados > 0
        ? `Mensaje enviado a ${enviados} de ${resultados.length} número(s) de soporte`
        : "No se pudo enviar el mensaje a los números de soporte",
    total: resultados.length,
    enviados,
    fallidos,
    resultados,
  };
}
async function enviarWhatsappTexto({ numero, mensaje }, config) {
  const phoneNumberId =
    config?.WHATSAPP_PHONE_NUMBER_ID || config?.META_WHATSAPP_PHONE_NUMBER_ID;
  const accessToken =
    config?.WHATSAPP_ACCESS_TOKEN || config?.META_WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId) {
    return {
      ok: false,
      error: "WHATSAPP_PHONE_NUMBER_ID no configurado",
      estado_envio: "configuracion_incompleta",
      mensaje_envio: "Falta configurar el identificador del número de WhatsApp",
      proveedor: "meta_whatsapp",
      destinatario: numero,
    };
  }

  if (!accessToken) {
    return {
      ok: false,
      error: "WHATSAPP_ACCESS_TOKEN no configurado",
      estado_envio: "configuracion_incompleta",
      mensaje_envio: "Falta configurar el token de acceso de WhatsApp",
      proveedor: "meta_whatsapp",
      destinatario: numero,
    };
  }

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${encodeURIComponent(
    String(phoneNumberId)
  )}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: numero,
    type: "text",
    text: {
      preview_url: false,
      body: String(mensaje || ""),
    },
  };

  try {
    const { status, data } = await axios.post(url, payload, {
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const waId = data?.contacts?.[0]?.wa_id || null;
    const messageId = data?.messages?.[0]?.id || null;

    return {
      ok: true,
      data,
      proveedor: "meta_whatsapp",
      estado_envio: "aceptado",
      mensaje_envio: "Mensaje aceptado correctamente por WhatsApp Cloud API",
      destinatario: numero,
      wa_id: waId,
      message_id: messageId,
      phone_number_id: String(phoneNumberId),
      http_status: status,
    };
  } catch (error) {
    const errorMessage = extraerErrorProveedor(error);
    return {
      ok: false,
      error: errorMessage,
      proveedor: "meta_whatsapp",
      estado_envio: "rechazado",
      mensaje_envio: "WhatsApp Cloud API rechazó o no pudo procesar el mensaje",
      destinatario: numero,
      phone_number_id: String(phoneNumberId),
      http_status: error?.response?.status || null,
      detalle: error?.response?.data || null,
    };
  }
}

function construirHtmlTokenCorreo(codigo, ttlMin) {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#1a73e8;padding:28px 40px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:0.5px;">🔐 Token de Acceso</h1>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <p style="color:#333333;font-size:15px;margin:0 0 16px;">Estimado cliente,</p>
          <p style="color:#555555;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Ha solicitado un <strong>código de verificación</strong> para acceder a la configuración de su router.
            Utilice el siguiente token para completar el proceso:
          </p>
          <div style="text-align:center;margin:32px 0;">
            <span style="display:inline-block;background:#f0f7ff;border:2px dashed #1a73e8;border-radius:8px;padding:18px 48px;font-size:36px;font-weight:bold;letter-spacing:10px;color:#1a73e8;">${codigo}</span>
          </div>
          <p style="color:#888888;font-size:13px;text-align:center;margin:0 0 24px;">⏱ Este código es válido por <strong>${ttlMin} minutos</strong>.</p>
          <hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;">
          <p style="color:#aaaaaa;font-size:12px;line-height:1.6;margin:0;">
            Si usted no realizó esta solicitud, por favor ignore este mensaje o comuníquese con nuestro equipo de soporte técnico.<br>
            <strong>No comparta este código con nadie.</strong>
          </p>
        </td></tr>
        <tr><td style="background:#f8f9fa;padding:18px 40px;text-align:center;">
          <p style="color:#aaaaaa;font-size:12px;margin:0;">Este es un mensaje automático, por favor no responda este correo.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function generarTokenCorreo({ cedula, correo, ttlMin = 3 }, config) {
  if (!cedula) return { ok: false, estado: "error", mensaje: "cedula es requerido" };
  if (!correo) return { ok: false, estado: "error", mensaje: "correo es requerido" };

  console.log("[generarTokenCorreo] Generando token para", { cedula, correo: correo.replace(/(.{2}).*(@.*)/, "$1***$2"), ttlMin });

  const codigo = generarCodigo(6);

  const insertSQL =
    "INSERT INTO `tokengenerate`.`token` (`created_at`, `cedula`, `estado`, `token`) VALUES (NOW(), ?, 'activo', ?);";
  await pool.query(insertSQL, [cedula, codigo]);

  const html = construirHtmlTokenCorreo(codigo, ttlMin);
  const texto = `Token de acceso: ${codigo}\nVálido por ${ttlMin} minutos.\nSi no lo solicitaste, ignora este mensaje.`;

  const envio = await EnviarCorreo({
    to: correo,
    subject: "🔐 Tu código de acceso al router",
    text: texto,
    html,
  }, config);

  if (!envio.ok) {
    await pool.query(
      "UPDATE `tokengenerate`.`token` SET estado='inactivo' WHERE cedula=? AND token=?",
      [cedula, codigo]
    );
    console.error("[generarTokenCorreo] Fallo al enviar correo", envio);
    return {
      ok: false,
      estado: "error",
      mensaje: envio.error || "No se pudo enviar el correo",
      destinatario: correo,
    };
  }

  console.log("[generarTokenCorreo] Token enviado correctamente", { cedula, messageId: envio.messageId });
  return {
    ok: true,
    estado: "exito",
    mensaje: "Token enviado por correo correctamente",
    ttlMin,
    destinatario: correo,
    messageId: envio.messageId,
  };
}

async function validarTokenCorreo({ cedula, token, ttlMin = 5 }) {
  if (!cedula || !token) return { ok: false, estado: "error", mensaje: "cedula y token son requeridos" };

  const [rows] = await pool.query(
    "SELECT id, created_at, estado FROM `tokengenerate`.`token` WHERE cedula=? AND token=? ORDER BY created_at DESC LIMIT 1",
    [cedula, token]
  );
  console.log("[validarTokenCorreo] Token encontrado", { cedula, rows });

  if (!rows || rows.length === 0) {
    console.warn("[validarTokenCorreo] Token no encontrado", { cedula });
    return { ok: false, estado: "error", mensaje: "Token no encontrado" };
  }

  const row = rows[0];
  if (row.estado !== "activo") {
    console.warn("[validarTokenCorreo] Token inactivo", { cedula, estado: row.estado });
    return { ok: false, estado: "error", mensaje: "Token inválido o inactivo" };
  }

  const [ageRows] = await pool.query(
    "SELECT TIMESTAMPDIFF(SECOND, ?, NOW()) AS age_seconds",
    [row.created_at]
  );
  const ageSeconds = ageRows?.[0]?.age_seconds ?? 0;
  const ttlSeconds = ttlMin * 60;
  console.log("[validarTokenCorreo] Edad token", { cedula, ageSeconds, ttlSeconds });

  if (ageSeconds > ttlSeconds) {
    await pool.query("UPDATE `tokengenerate`.`token` SET estado='inactivo' WHERE id=?", [row.id]);
    console.warn("[validarTokenCorreo] Token expirado", { cedula, ageSeconds });
    return { ok: false, estado: "error", mensaje: "Token expirado" };
  }

  await pool.query("UPDATE `tokengenerate`.`token` SET estado='inactivo' WHERE id=?", [row.id]);
  console.log("[validarTokenCorreo] Token validado y consumido", { cedula, id: row.id });
  return { ok: true, estado: "exito", mensaje: "Token válido" };
}

module.exports = {
  generarTokenWhatsapp,
  validarTokenWhatsapp,
  enviarMensajeWhatsappSoporte,
  generarTokenCorreo,
  validarTokenCorreo,
};
