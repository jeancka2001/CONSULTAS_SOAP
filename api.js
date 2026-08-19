const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const {
  ConsultarNombreCliente,
  Validaciones,
  RealizarPago,
  ReversoPago,
  GeneralinkPago,
  GenerarLinkContrato,
  consultarGetClientsDetails,
  consultarGetClientsDetailsAllServices,
  consultargetdetalleolt,
  consultaGetInvoices,
  pagarfacturaPaidInvoice,
  consultaListTicket,
  consultaAutosoporteConsecutivo,
  ConsultarSSID,
  CreateInvoice,
  CreatePromesaPagoe,
  Preregistro,
} = require("./consultas");
const { pool } = require("./conexion/conexcion");
const { generarArchivoConciliacion } = require("./utils/conciliacionExport");
const { guardarLogAPI } = require("./utils/logs");
const {
  GetRouters,
  get_onu_details,
  get_olt_pon_ports_details,
  get_onu_status,
  get_onu_signal,
  listarTicketsusuario,
  Newtickte,
  CloseTicket,
  CrearTicketConCheck,
  DispositivosConectados,
  reiniciarequipo,
  Cambiarclave,
  CambiarNombreSSID,
  CambiarVisibilidadSSID,
  resincronizacion,
} = require("./soporte/soporte");
const { VerPotentcia, RxEquipos, PotenciaZte } = require("./acs/acs");
const { consultarCedulaLRSoft } = require("./utils/lrsoftsolution");
const { guardarConciliacionPago } = require("./utils/conciliacion");
const { EnviarCorreo } = require("./mail/mail");
const {
  generarTokenWhatsapp,
  validarTokenWhatsapp,
  enviarMensajeWhatsappSoporte,
  generarTokenCorreo,
  validarTokenCorreo,
} = require("./utils/tokens");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Detrás de proxies, confiar en X-Forwarded-*
app.set("trust proxy", true);

require("dotenv").config(); // asegúrate de tener dotenv configurado

let WHITELIST_IPS = [];
let TENANTS_CONFIG = { default: {} };

// Rate Limiter por cédula para /devices/conectados
// Estructura: { cedula: { count: number, timestamp: milliseconds } }
let requestCountByCedula = new Map();
const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto

/**
 * Verifica si una cédula ha excedido el límite de intentos en la ventana configurada
 * @param {string} cedula - Cédula del cliente
 * @returns {object} { allowed: boolean, max_intentos: boolean, remaining: number }
 */
function verificarRateLimitCedula(cedula) {
  const ahora = Date.now();
  const registro = requestCountByCedula.get(cedula);
  
  // Si no hay registro o ya pasó la ventana, resetear
  if (!registro || (ahora - registro.timestamp) > RATE_LIMIT_WINDOW_MS) {
    requestCountByCedula.set(cedula, { count: 1, timestamp: ahora });
    return { allowed: true, max_intentos: false, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  
  // Incrementar contador
  registro.count++;
  
  // Verificar si excedió el límite
  const excedido = registro.count > RATE_LIMIT_MAX_REQUESTS;
  
  return {
    allowed: !excedido,
    max_intentos: excedido,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - registro.count)
  };
}

/// Cargar configuración multi-tenant desde archivo
//cambios hechos con id onu nuevo
function cargarTenantsConfig() {
  try {
    const cfgPath = path.join(__dirname, "config", "tenants.json");
    if (!fs.existsSync(cfgPath)) {
      TENANTS_CONFIG = {};
      console.log("ℹ️ tenants.json no presente. Usando solo configuración de base de datos.");
      return;
    }

    const raw = (fs.readFileSync(cfgPath, "utf8") || "").trim();
    if (!raw) {
      TENANTS_CONFIG = {};
      console.log("ℹ️ tenants.json vacío. Usando solo configuración de base de datos.");
      return;
    }
    try {
      TENANTS_CONFIG = JSON.parse(raw);
      console.log("✅ Configuración de tenants desde archivo cargada");
    } catch (parseErr) {
      TENANTS_CONFIG = {};
      console.log("ℹ️ tenants.json inválido. Usando solo configuración de base de datos.");
    }
  } catch (e) {
    TENANTS_CONFIG = {};
    console.log("ℹ️ No se pudo cargar tenants.json. Usando solo configuración de base de datos.");
  }
}

function obtenerTenantConfig(tenantId) {
  const tenantKey = tenantId || "default";

  // Configuración base desde default
  const base = TENANTS_CONFIG?.default || {};

  // Configuración específica del tenant
  const specific = TENANTS_CONFIG?.[tenantKey] || {};

  // Base + específico (specific tiene prioridad sobre base)
  const merged = { ...base, ...specific };

  // Solo usar variables de entorno como FALLO-por-defecto (si no existe en merged)
  // const envFallbacks = {
  //   HOST_CONSULTA: process.env.HOST_CONSULTA,
  //   HOST_SERV: process.env.HOST_SERV,
  //   HOST_OLLA: process.env.HOST_OLLA,
  //   TOKEN: process.env.TOKEN,
  //   TOKEN_PREREGISTRO: process.env.TOKEN_PREREGISTRO,
  //   whatsapp_session: process.env.SESSION_NAME || undefined,
  // };
  // for (const [k, v] of Object.entries(envFallbacks)) {
  //   if (merged[k] === undefined && v !== undefined) {
  //     merged[k] = v;
  //   }
  // }

  // IPs permitidas (combinar arrays)
  merged.allowedIps = [
    ...(Array.isArray(base?.allowedIps) ? base.allowedIps : []),
    ...(Array.isArray(specific?.allowedIps) ? specific.allowedIps : []),
  ];

  return merged;
}

async function cargarWhitelistIPs() {
  try {
    // Intento multitenant (requiere columna tenant_id en ip_address)
    const [globalRows] = await pool.query(
      "SELECT whitelist_ips FROM ip_address WHERE is_estado = 1 AND (tenant_id IS NULL OR tenant_id = 1)"
    );

    const globalIPs = globalRows.map((row) => row.whitelist_ips.trim());

    const [tenantRows] = await pool.query(
      `SELECT 
    t.tenant_key, 
    GROUP_CONCAT(ia.whitelist_ips) as ips 
FROM ip_address ia 
INNER JOIN tenants t ON ia.tenant_id = t.id 
WHERE ia.is_estado = 1 
GROUP BY t.tenant_key 
ORDER BY t.tenant_key;`
    );

    const tenantIPs = {};
    tenantRows.forEach((row) => {
      tenantIPs[row.tenant_key] = row.ips ? row.ips.split(",").map((ip) => ip.trim()) : [];
    });

    WHITELIST_IPS = { global: globalIPs, tenants: tenantIPs };
    console.log("✅ Whitelist IPs cargadas (multitenant)");
  } catch (error) {
    if (error?.code === "ER_BAD_FIELD_ERROR") {
      try {
        // Esquema legacy: no existe tenant_id, usar sólo lista global
        const [rows] = await pool.query(
          "SELECT whitelist_ips FROM ip_address WHERE is_estado = 1"
        );
        const globalIPs = rows.map((row) => row.whitelist_ips.trim());
        WHITELIST_IPS = { global: globalIPs, tenants: {} };
        console.warn("⚠️ Esquema legacy detectado en ip_address (sin tenant_id). Usando whitelist global.");
      } catch (fallbackErr) {
        console.error("❌ Error en carga legacy de IPs permitidas:", fallbackErr);
      }
    } else {
      console.error("❌ Error al cargar IPs permitidas:", error);
    }
  }
}

const validarIP = (req, res, next) => {
  const fwd = req.headers["x-forwarded-for"];
  let ip = (typeof fwd === "string" ? fwd.split(",")[0] : (Array.isArray(fwd) ? fwd[0] : null)) || req.socket.remoteAddress || "";
  ip = String(ip).replace("::ffff:", "").trim();

  // Resolver posible tenant antes del token: permitir cabecera 'x-tenant-id'
  const preTenantKey = req.headers["x-tenant-id"] || req.tenant?.id;
  console.log(`🔐 Verificando IP: ${ip} para tenant: ${preTenantKey}`);
  if (WHITELIST_IPS.global?.includes(ip)) {
    return next();
  }
  const tenantSpecificIPs = WHITELIST_IPS.tenants?.[preTenantKey] || [];
  if (tenantSpecificIPs.includes(ip)) {
    return next();
  }

  // 3. Verificar IPs del archivo de configuración (si no hay tenant resuelto, usar default)
  const tenantCfg = req.tenant?.config || (TENANTS_CONFIG?.default || {});
  const allowedTenantIps = tenantCfg.allowedIps || [];

  if (allowedTenantIps.includes(ip)) {
    return next();
  }

  console.warn(`❌ IP bloqueada: ${ip} para tenant: ${preTenantKey}`);
  return res.status(403).json({ error: "Acceso no autorizado desde esta IP" });
};

const validarToken = async (req, res, next) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();

  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  try {
    const [rows] = await pool.query(
      `SELECT at.*, t.tenant_key, t.name as tenant_name, t.theme 
       FROM api_token at
       INNER JOIN tenants t ON at.tenant_id = t.id
       WHERE at.token = ? AND at.is_active = 1 AND t.is_active = 1`,
      [token]
    );
console.log("rows:", rows);
    if (rows.length === 0) {
      return res.status(403).json({ error: "Token inválido, inactivo o tenant deshabilitado" });
    }

    const [tokenSystema] = await pool.query(
      "SELECT * FROM token_systema WHERE idToken = ? AND tenant_id = ?",
      [rows[0].id, rows[0].tenant_id]
    );

    if (tokenSystema.length === 0) {
      return res.status(403).json({ error: "Token de sistema no encontrado para este tenant" });
    }

    // Manejo robusto de theme: puede venir como objeto (JSON) o como string
    let themeVal = null;
    const rawTheme = rows[0].theme;
    if (rawTheme && typeof rawTheme === "string" && rawTheme !== "0") {
      try {
        themeVal = JSON.parse(rawTheme);
      } catch (e) {
        console.warn("⚠️ Theme no es JSON válido, usando valor como string");
        themeVal = rawTheme;
      }
    } else if (rawTheme && typeof rawTheme === "object") {
      themeVal = rawTheme;
    }

    req.auth = {
      tokenData: rows[0],
      tokenSystema: tokenSystema[0].token,
      pasarela: tokenSystema[0].recaudador,
      tenant: {
        id: rows[0].tenant_id,
        key: rows[0].tenant_key,
        name: rows[0].tenant_name,
        theme: themeVal
      }
    };

    next();
  } catch (error) {
    console.error("❌ Error al validar token:", error);
    return res.status(500).json({ error: "Error interno al validar token" });
  }
};

const resolverTenant = (req, res, next) => {
  try {
  
    let tenantId;

    if (req.headers["x-tenant-id"]) {
      tenantId = req.headers["x-tenant-id"];
    } else if (req.auth?.tenant?.key) {
      tenantId = req.auth.tenant.key;
    } else {
      tenantId = "default";
    }

    // Config desde archivo + env
    let cfg = obtenerTenantConfig(tenantId);

    // Mezclar configuración desde DB (columna theme), si existe; DB tiene prioridad
    const cfgDb = (req.auth?.tenant?.theme && typeof req.auth.tenant.theme === 'object')
      ? req.auth.tenant.theme
      : {};
    cfg = { ...cfg, ...cfgDb };

    req.tenant = {
      id: tenantId,
      config: cfg,
      db: req.auth?.tenant || { id: 1, key: "default", name: "Default" }
    };

    return next();
  } catch (e) {
    console.error("❌ Error resolviendo tenant:", e);
    return res.status(500).json({ error: "Error resolviendo tenant" });
  }
};

// Definir la cadena de middlewares antes de usarlos en rutas
const validarIPyToken = [validarIP, validarToken, resolverTenant];

app.post("/admin/tenants", validarIPyToken, async (req, res) => {
  try {
    const { tenant_key, name, theme, whatsapp_session } = req.body;

    // Validar que el usuario sea admin
    if (!req.auth?.tokenData?.is_admin) {
      return res.status(403).json({ error: "Se requieren permisos de administrador" });
    }

    const [result] = await pool.query(
      `INSERT INTO tenants (tenant_key, name, theme, whatsapp_session) 
       VALUES (?, ?, ?, ?)`,
      [tenant_key, name, theme ? JSON.stringify(theme) : null, whatsapp_session]
    );

    res.json({
      ok: true,
      message: "Tenant creado exitosamente",
      tenant_id: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "El tenant_key ya existe" });
    }
    res.status(500).json({ error: "Error creando tenant" });
  }
});
app.get("/admin/tenants", validarIPyToken, async (req, res) => {
  try {
    const [tenants] = await pool.query(
      "SELECT id, tenant_key, name, theme, whatsapp_session, is_active FROM tenants ORDER BY name"
    );
    const parsedTenants = tenants.map(t => ({
      ...t,
      theme: t.theme ? JSON.parse(t.theme) : null
    }));

    res.json({
      ok: true,
      tenants: parsedTenants
    });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo tenants" });
  }
});

app.post("/consultar", validarIPyToken, async (req, res) => {
  console.log("Petición a /consultar", req.body);
  // ontner la ip del cliente que hace la peticion
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
  const { Cod_Obligacion } = req.body;
  const tokenSystema = req.body?.tokenSystema || req.auth?.tokenSystema;
  console.log("Cod_Obligacion:", req.body);
  const cliente = await ConsultarNombreCliente(Cod_Obligacion, tokenSystema, req.tenant?.config);
  const validacion = Validaciones(cliente, Cod_Obligacion);
  // Guardar log
  // await guardarLogAPI("/consultar", ip, token, req.body, validacion, validacion.Metodo_de_ConsultaResult.Codigo_Respuesta);
  res.json(validacion);
});


app.post("/ssid", validarIPyToken, async (req, res) => {
  console.log("Petición a /consultar", req.body);
  // ontner la ip del cliente que hace la peticion
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);;
  const ID_EXTERNO_ONU = req.body?.ID_EXTERNO_ONU || req.auth?.ID_EXTERNO_ONU;
  console.log("ID_EXTERNO_ONU:", ID_EXTERNO_ONU);
  const cliente = await ConsultarSSID(ID_EXTERNO_ONU, req.tenant?.config);
  // Guardar log
  // await guardarLogAPI("/consultar", ip, token, req.body, validacion, validacion.Metodo_de_ConsultaResult.Codigo_Respuesta);
  res.json(cliente);
});

app.post("/GetClientsDetails", validarIPyToken, async (req, res) => {
  console.log("Petición a /GetClientsDetails", req.body);
  // ontner la ip del cliente que hace la peticion
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
  // Aceptar tanto `Cedula` como `cedula` en el payload
  const cedula = req.body?.Cedula || req.body?.cedula || null;
  const tokenSystema = req.body?.tokenSystema || req.auth?.tokenSystema;
  console.log("cedula:", cedula);

  if (!cedula) {
    return res.status(400).json({ error: "Cedula es requerida" });
  }

  const cliente = await consultarGetClientsDetails(cedula, tokenSystema, req.tenant?.config);
  //const validacion = Validaciones(cliente, Cod_Obligacion);
  // Guardar log
  // await guardarLogAPI("/GetClientsDetails", ip, token, req.body, validacion, validacion.Metodo_de_ConsultaResult.Codigo_Respuesta);
  res.json(cliente);
});

app.post("/GetClientsDetailsAllServices", validarIPyToken, async (req, res) => {
  console.log("Petición a /GetClientsDetailsAllServices", req.body);
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);

  const cedula = req.body?.Cedula || req.body?.cedula || null;
  const tokenSystema = req.body?.tokenSystema || req.auth?.tokenSystema;
  console.log("cedula:", cedula);

  if (!cedula) {
    return res.status(400).json({ error: "Cedula es requerida" });
  }

  const cliente = await consultarGetClientsDetailsAllServices(cedula, tokenSystema, req.tenant?.config);
  res.json(cliente);
});

app.post("/consulta-cedula", async (req, res) => {
  console.log("Petición a /consulta-cedula", req.body);
  const cedula = req.body?.Cedula || req.body?.cedula || null;

  if (!cedula) {
    return res.status(400).json({ error: "Cedula es requerida" });
  }

  const resultado = await consultarCedulaLRSoft(cedula);
  res.json(resultado);
});


app.post("/detalleolt", validarIPyToken, async (req, res) => {
  console.log("Petición a /detalleolt", req.body);
  // ontner la ip del cliente que hace la peticion
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
  // Aceptar tanto `Cedula` como `cedula` en el payload
  const olt_id = req.body?.olt_id || req.body?.olt_id || null;
  const nap = req.body?.nap || null;
  const pon_port = req.body?.pon_port || null;
  const board = req.body?.board || null;
  const forceRefresh =
    req.body?.force_refresh === true ||
    req.body?.forceRefresh === true ||
    String(req.body?.force_refresh || "").toLowerCase() === "true" ||
    String(req.body?.forceRefresh || "").toLowerCase() === "true";

  console.log("olt_id:", olt_id);
  console.log("nap:", nap);
  console.log("pon_port:", pon_port);
  console.log("board:", board);
  console.log("forceRefresh:", forceRefresh);

  if (!olt_id) {
    return res.status(400).json({ error: "OLT ID es requerido" });
  }

  const detalleolt = await consultargetdetalleolt(
    olt_id,
    nap,
    board,
    pon_port,
    req.tenant?.config,
    { forceRefresh }
  );
  //const validacion = Validaciones(cliente, Cod_Obligacion);
  // Guardar log
  // await guardarLogAPI("/GetClientsDetails", ip, token, req.body, validacion, validacion.Metodo_de_ConsultaResult.Codigo_Respuesta);
  res.json(detalleolt);
});

app.post("/resincronizacion", validarIPyToken, async (req, res) => {
  console.log("Petición a /resincronizacion", req.body);
  // ontner la ip del cliente que hace la peticion
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
  // Aceptar tanto `Cedula` como `cedula` en el payload
  const servicios_id = req.body?.servicios_id || req.body?.servicios_id || null;
  console.log("servicios_id:", servicios_id);

  if (!servicios_id) {
    return res.status(400).json({ error: "Servicios ID es requerido" });
  }

  const detalleolt = await resincronizacion(
    servicios_id,
    req.tenant?.config
  );
  res.json(detalleolt);
});


app.post("/GetInvoices", validarIPyToken, async (req, res) => {
  console.log("Petición a /GetInvoices", req.body);
  // ontner la ip del cliente que hace la peticion
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
  // Aceptar tanto `Cedula` como `cedula` en el payload
  const idcliente = req.body?.idcliente || req.body?.idcliente || null;

  console.log("idcliente:", idcliente);

  if (!idcliente) {
    return res.status(400).json({ error: "ID Cliente es requerido" });
  }

  const detallefacturanp = await consultaGetInvoices(idcliente, req.tenant?.config);
  //const validacion = Validaciones(cliente, Cod_Obligacion);
  // Guardar log
  // await guardarLogAPI("/GetClientsDetails", ip, token, req.body, validacion, validacion.Metodo_de_ConsultaResult.Codigo_Respuesta);
  res.json(detallefacturanp);
});

app.post("/PaidInvoice", validarIPyToken, async (req, res) => {
  console.log("Petición a /PaidInvoice", req.body);
  // ontner la ip del cliente que hace la peticion
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
  // Aceptar tanto `Cedula` como `cedula` en el payload
  const idfactura = req.body?.idfactura || req.body?.idfactura || null;
  const pasarela = req.body?.pasarela || req.body?.pasarela || null;
  const cantidad = req.body?.cantidad || req.body?.cantidad || null;
  const idtransaccion = req.body?.idtransaccion || req.body?.idtransaccion || null;
  const nota = req.body?.nota || req.body?.nota || null;

  console.log("idfactura:", idfactura);
  console.log("pasarela:", pasarela);
  console.log("cantidad:", cantidad);
  console.log("idtransaccion:", idtransaccion);
  console.log("nota:", nota);

  if (!idfactura) {
    return res.status(400).json({ error: "ID Factura es requerido" });
  }

  const detallepagofact = await pagarfacturaPaidInvoice(idfactura, pasarela, cantidad, idtransaccion, nota, req.tenant?.config);
  res.json(detallepagofact);
});

app.post("/ListTicket", validarIPyToken, async (req, res) => {
  console.log("Petición a /ListTicket", req.body);
  // ontner la ip del cliente que hace la peticion
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
  // Aceptar tanto `Cedula` como `cedula` en el payload
  const id_cliente = req.body?.id_cliente || req.body?.id_cliente || null;

  console.log("id_cliente:", id_cliente);

  if (!id_cliente) {
    return res.status(400).json({ error: "ID Cliente es requerido" });
  }

  const tokenSystema = req.body?.tokenSystema || req.auth?.tokenSystema;
  const detallepagofact = await consultaListTicket(id_cliente, req.tenant?.config);
  res.json(detallepagofact);
});

app.post("/tickets/autosoporte/validar", validarIPyToken, async (req, res) => {
  console.log("Petición a /tickets/autosoporte/validar", req.body);

  const idcliente = req.body?.idcliente || req.body?.id_cliente || null;
  const diasRaw = req.body?.dias;
  const cantidadRaw = req.body?.cantidad_tickets ?? req.body?.cantidadTickets;

  const dias = Number(diasRaw);
  const cantidadTickets = Number(cantidadRaw);

  if (!idcliente) {
    return res.status(400).json({
      estado: false,
      error: "idcliente es requerido",
    });
  }

  if (!Number.isInteger(dias) || dias <= 0) {
    return res.status(400).json({
      estado: false,
      error: "dias debe ser un entero mayor a 0",
    });
  }

  if (!Number.isInteger(cantidadTickets) || cantidadTickets <= 0) {
    return res.status(400).json({
      estado: false,
      error: "cantidad_tickets debe ser un entero mayor a 0",
    });
  }

  const resultado = await consultaAutosoporteConsecutivo(
    idcliente,
    dias,
    cantidadTickets,
    req.tenant?.config
  );

  return res.status(200).json(resultado);
});

app.post("/Newtickte", validarIPyToken, async (req, res) => {
  console.log("Petición a /Newtickte", req.body);
  // ontner la ip del cliente que hace la peticion
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
  const idcliente = req.body?.idcliente || req.body?.id_cliente || null;

  console.log("idcliente:", idcliente);

  if (!idcliente) {
    return res.status(400).json({ error: "ID Cliente es requerido" });
  }

  const payload = {
    ...req.body,
    idcliente: String(idcliente),
  };

  const crearfactura = await Newtickte(payload, req.tenant?.config);
  res.json(crearfactura);
});

app.post("/CloseTicket", validarIPyToken, async (req, res) => {
  console.log("Petición a /CloseTicket", req.body);
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);

  const idticket = req.body?.idticket || null;
  const motivo_cierre = req.body?.motivo_cierre || "";

  if (!idticket) {
    return res.status(400).json({ error: "idticket es requerido" });
  }

  const payload = {
    ...req.body,
    idticket: String(idticket),
    motivo_cierre,
  };

  const resultado = await CloseTicket(payload, req.tenant?.config);
  return res.json(resultado);
});


app.post("/CreateInvoice", validarIPyToken, async (req, res) => {
  console.log("Petición a /CreateInvoice", req.body);
  // ontner la ip del cliente que hace la peticion
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
  // Aceptar tanto `Cedula` como `cedula` en el payload
  const idcliente = req.body?.idcliente || req.body?.idcliente || null;
  const vencimiento = req.body?.vencimiento || req.body?.vencimiento || null;
  const tokenSystema = req.body?.tokenSystema || req.auth?.tokenSystema;

  console.log("idcliente:", idcliente);
  console.log("vencimiento:", vencimiento);

  if (!idcliente) {
    return res.status(400).json({ error: "ID Cliente es requerido" });
  }

  const detallepagofact = await CreateInvoice(idcliente, vencimiento, tokenSystema, req.tenant?.config);
  res.json(detallepagofact);
});

app.post("/PromesaPago", validarIPyToken, async (req, res) => {
  console.log("Petición a /PromesaPago", req.body);
  // ontner la ip del cliente que hace la peticion
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
  // Aceptar tanto `Cedula` como `cedula` en el payload
  const idfactura = req.body?.idfactura || req.body?.idfactura || null;
  const fechalimite = req.body?.fechalimite || req.body?.fechalimite || null;
  const descripcion = req.body?.descripcion || req.body?.descripcion || null;

  console.log("idfactura:", idfactura);
  console.log("fechalimite:", fechalimite);
  console.log("descripcion:", descripcion);

  if (!idfactura) {
    return res.status(400).json({ error: "ID Factura es requerido" });
  }
  if (!fechalimite) {
    return res.status(400).json({ error: "Fecha límite es requerida" });
  }
  if (!descripcion) {
    return res.status(400).json({ error: "Descripción es requerida" });
  }

  const tokenSystema = req.body?.tokenSystema || req.auth?.tokenSystema;
  const detallepagofact = await CreatePromesaPagoe(idfactura, fechalimite, descripcion, tokenSystema, req.tenant?.config);
  res.json(detallepagofact);
});





app.post("/facturas", validarIPyToken, async (req, res) => {
  console.log("Petición a /facturas", req.body);
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
  const { Cod_Obligacion, ID_Secuencia } = req.body;
  const tokenSystema = req.body?.tokenSystema || req.auth?.tokenSystema;
  const cliente = await ConsultarNombreCliente(Cod_Obligacion, tokenSystema, req.tenant?.config);
  const validacion = Validaciones(cliente, Cod_Obligacion);
  let facturas = [];
  if (validacion.Metodo_de_ConsultaResult.Codigo_Respuesta === "000") {
    facturas = cliente.Facturas || [];
  }
  // Guardar log
  // await guardarLogAPI("/facturas", ip, token, req.body, facturas, facturas.length > 0 ? "000" : "001");
  res.json({
    Metodo_de_FacturasResult: {
      Codigo_Respuesta: validacion.Metodo_de_ConsultaResult.Codigo_Respuesta,
      Mensaje_Respuesta: validacion.Metodo_de_ConsultaResult.Mensaje_Respuesta,
      Facturas: facturas,
    },
  });
});


app.post("/pagar_factura", validarIPyToken, async (req, res) => {
  try {
    console.log("Petición a /pagar_factura", req.body);
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
    console.log(`Petición recibida desde la IP: ${ip}`);
    console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
    const { idfactura, pasarela, cantidad, idtransaccion, nota } = req.body;
    const tokenSystema = req.body?.tokenSystema || req.auth?.tokenSystema;
    var pagos = [];
    let info;
    let urlpdf = "";
    const hostConsulta = req.tenant?.config?.HOST_CONSULTA;
    const acortadorBase = req.tenant?.config?.ACORTADOR ;
    const tokenAcortador = req.tenant?.config?.TOKEN_ACORTADOR;
    const tokenAPublic = req.tenant?.config?.TOKEN_A_PUBLIC;
    const { data } = await axios.post(
      `${hostConsulta}PaidInvoice`,
      {
        token: tokenSystema || req.tenant?.config?.TOKEN,
        idfactura: idfactura,
        pasarela: pasarela,
        cantidad: cantidad,
        idtransaccion: idtransaccion,
        nota: nota,
      },
      { timeout: 15000 }
    );

    if (data.estado === "exito") {
      const { data: invoiceData } = await axios.post(
        `${hostConsulta}GetInvoice`,
        {
          token: tokenSystema || req.tenant?.config?.TOKEN,
          idfactura: idfactura,
        },
        { timeout: 15000 }
      );
console.log("invoiceData:", invoiceData);
      if (invoiceData?.estado === "exito") {
        urlpdf = invoiceData?.factura?.urlpdf || "";

        if (urlpdf && acortadorBase && tokenAcortador && tokenAPublic) {
          const acortadorUrl = acortadorBase;
          const { data: shortData } = await axios.post(
            acortadorUrl,
            {
              name: "factura_pagada",
              originalUrl: urlpdf,
              redirectDelay: 4,
              showAds: true,
              advertisementId: tokenAPublic,
            },
            {
              headers: {
                "Content-Type": "application/json",
                "x-api-key": tokenAcortador,
              },
              timeout: 15000,
            }
          );

          if (shortData?.success && shortData?.shortLink?.shortUrl) {
            urlpdf = shortData.shortLink.shortUrl;
          }
        }
      }

      info = {
        Codigo_Respuesta: "000", // Pago realizado con éxito
        Mensaje_Respuesta: "Pago realizado con éxito",
        urlpdf,
      };
      console.log("info:", info);
      pagos.push(info);
      console.log("data:", data);
      console.log("Guardando conciliación de pago...", req.tenant);
      await guardarConciliacionPago({
        cliente_nombre: req.body?.cliente_nombre || "",
        cliente_id: req.body?.cliente_id || "",
        codigo_operacion: idtransaccion || "",
        codigo_activa: data?.id != null ? String(data.id) : "",
        codigo_secuencial: idtransaccion || "",
        concepto_pago: `Pago de factura ${idfactura}`,
        valor: cantidad,
        idToken: req.tenant?.db.id,
      });
    } else {
      info = {
        Codigo_Respuesta: "001", // Pago fallido
        Mensaje_Respuesta: "Pago no realizado: " + data.mensaje,
      };
      pagos.push(info);
    }

    await guardarLogAPI("/pagar_factura", ip, token, req.body, pagos, pagos[0].Codigo_Respuesta);
    res.json({ Metodo_de_Pagar_FacturaResult: { Pagos: pagos, urlpdf } });
  } catch (error) {
    console.error("❌ Error en /pagar_factura:", error?.response?.data || error?.message || error);
    return res.status(500).json({
      Metodo_de_Pagar_FacturaResult: {
        Pagos: [{
          Codigo_Respuesta: "002",
          Mensaje_Respuesta: "Error interno al procesar el pago",
        }],
        urlpdf: "",
      },
    });
  }
});

app.post("/metodoPago", validarIPyToken, async (req, res) => {
  console.log("Método /metodoPago llamado", req.body);
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();

  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
  const {
    Cod_Obligacion,
    ID_Secuencia,
    Monto_1,
    Monto_2,
    Items,
    tokenData,
    tokenSystema,
    pasarela,
    
  } = req.body;
  const { ItemsPago } = Items;
  let monto = ItemsPago[0].Valor_Pagado;
  const tokenSystemaUse = tokenSystema || req.auth?.tokenSystema;
  const pago = await RealizarPago(
    ItemsPago,
    monto,
    ID_Secuencia,
    ItemsPago[0].Referencia,
    Cod_Obligacion,
    ItemsPago[0].IDTransaccion,
    tokenData.id,
    tokenSystemaUse,
    pasarela,
    req.tenant?.config
  );
  console.log("Pago: ", pago);
  // Guardar log
  await guardarLogAPI(
    "/metodoPago",
    ip,
    token,
    req.body,
    pago,
    pago.Codigo_Respuesta
  );
  res.json({
    Metodo_de_PagoResult: pago,
  });
});

app.post("/metodoReverso", validarIPyToken, async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
  const { Cod_Obligacion, ID_Secuencia, Items, tokenData, tokenSystema } =
    req.body;
  const { ItemsReverso } = Items;
  console.log(ItemsReverso);
  const valorReverso = ItemsReverso[0].Valor_Pagado;
  const tokenSystemaUse = tokenSystema || req.auth?.tokenSystema;
  const reverso = await ReversoPago(
    ItemsReverso,
    valorReverso,
    ID_Secuencia,
    Cod_Obligacion,
    ItemsReverso[0].IDTransaccion,
    tokenData.id,
    tokenSystemaUse,
    req.tenant?.config
  );
  console.log("Resverso: ", reverso);
  // Guardar log
  await guardarLogAPI(
    "/metodoReverso",
    ip,
    token,
    req.body,
    reverso,
    reverso.Codigo_Respuesta
  );
  res.json({
    Metodo_de_ReversoResult: reverso,
  });
});

app.post("/metodoTest", validarIPyToken, async (req, res) => {
  console.log("Método de prueba exitoso", req.body);
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
  const resultadoTest = {
    Tipo_Transaccion: "Test",
    CodigoRespuesta: "000",
    Mensaje_Respuesta: "Prueba exitosa",
  };
  // Guardar log
  await guardarLogAPI(
    "/metodoTest",
    ip,
    token,
    req.body,
    resultadoTest,
    resultadoTest.CodigoRespuesta
  );
  res.json({
    Metodo_de_TestResult: resultadoTest,
  });
});

app.post("/soporte", validarIPyToken, async (req, res) => {
  console.log("Petición a /soporte", req.body);
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  let status_onu;
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);
  // Aceptar campo correcto `port` (antes se usaba `poart` por error)
  const { onu_external_id, board, port, olt_id, nodo } = req.body;
  // Validación temprana: evitar placeholders tipo "{onu_external_id}"
  const isPlaceholder = (v) => typeof v === "string" && /^\{.*\}$/.test(v);
  if (!onu_external_id || isPlaceholder(onu_external_id)) {
    console.error("Parámetro onu_external_id inválido para /soporte:", onu_external_id);
    const Routers = await GetRouters(nodo, req.tenant?.config);
    return res.status(400).json({
      error: "Parámetros SmartOLT no válidos (onu_external_id)",
      routers: { ...Routers },
    });
  }
  if (board != undefined && port != undefined) {
    let Routers = await GetRouters(nodo, req.tenant?.config);
    let getonustatus = await get_onu_status(onu_external_id, req.tenant?.config);
    let getonusignal = await get_onu_signal(onu_external_id, req.tenant?.config);
    let oltport = await get_olt_pon_ports_details(olt_id, req.tenant?.config);
    let getonudetails = await get_onu_details(onu_external_id, req.tenant?.config);
    let oltstatus;
    if (oltport && Array.isArray(oltport.response)) {
      oltstatus =
        oltport.response.find((e) => e.board == board && e.pon_port == port) ||
        oltport.response;
    } else {
      oltstatus = oltport;
    }

if (getonustatus.onu_status == "Power fail") {
  status_onu = "001";  
} else if (getonustatus.onu_status == "LOS") {
  status_onu = "002";  
} else if (getonustatus.onu_status == "Online") {
  status_onu = "000";  
}

console.log("status_onu:", status_onu);
    return res.status(200).json({
      routers: { ...Routers },
      onudetail: { ...getonudetails },
      oltport: { ...oltstatus },
      status: { ...getonustatus },
      signal: { ...getonusignal },
      onustatus: { status_onu },
    });
  }
  
  let Routers = await GetRouters(nodo);
  console.log("routers:", Routers);
  let oltport = await get_olt_pon_ports_details(olt_id, req.tenant?.config);
  console.log("oltport:", oltport);
  let getonudetails = await get_onu_details(onu_external_id, req.tenant?.config);
  console.log("getonudetails:", getonudetails);
  let getonustatus = await get_onu_status(onu_external_id, req.tenant?.config);
  console.log("getonustatus:", getonustatus);
  let getonusignal = await get_onu_signal(onu_external_id, req.tenant?.config);
  console.log("getonusignal:", getonusignal);
  // Defensa: solo leer propiedades si existen
  let boards = null;
  let poarts = null;
  if (getonudetails && getonudetails.onu_details) {
    boards = getonudetails.onu_details["board"];
    poarts = getonudetails.onu_details["port"];
  }


console.log("getonustatus.onu_status:", getonustatus.onu_status);
    if (getonustatus.onu_status == "Power fail") {
  status_onu = "001";  
} else if (getonustatus.onu_status == "LOS") {
  status_onu = "002";  
} else if (getonustatus.onu_status == "Online") {
  status_onu = "000";  
}
    console.log("status_onu:", status_onu);
  let oltstatus;
  if (oltport && Array.isArray(oltport.response) && boards != null && poarts != null) {
    oltstatus =
      oltport.response.find((e) => e.board == boards && e.pon_port == poarts) ||
      oltport.response;
  } else {
    oltstatus = oltport;
  }
  console.log(oltstatus);

  return res.status(200).json({
    routers: { ...Routers },
    onudetail: { ...getonudetails },
    oltport: { ...oltstatus },
    status: { ...getonustatus },
    signal: { ...getonusignal },
    onustatus: {status_onu },
  });
});

app.post("/rxequipos", validarIPyToken, async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
  console.log(`Petición recibida desde la IP: ${ip}`);
  console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);

  const { IdExterno } = req.body;

  if (!IdExterno) {
    return res.status(400).json({ error: "IdExterno es requerido" });
  }

  try {
    await RxEquipos(IdExterno,req.tenant?.config); // lanza las tareas al ACS

    if (IdExterno.includes("ZTE")) {
      const potenciaZte = await PotenciaZte(IdExterno, req.tenant?.config);
      const potenciaOnu =
        potenciaZte.data?.[0]?.InternetGatewayDevice?.WANDevice?.["1"]
          ?.["X_ZTE-COM_WANPONInterfaceConfig"]?.RXPower?._value;

      if (potenciaOnu == null) {
        return res
          .status(500)
          .json({ error: "No se pudo leer RXPower para ZTE" });
      }

      const potenciaDbm = (potenciaOnu / 100).toFixed(2);
      return res.json({ potenciaOnu, potenciaDbm });
    } else if (
      IdExterno.includes("GPON") ||
      IdExterno.includes("00259E") ||
      IdExterno.includes("5CE931") ||
      IdExterno.includes("DE37")
    ) {
      const potencia = await VerPotentcia(IdExterno, req.tenant?.config);
      const potenciaOnu =
        potencia.data?.[0]?.InternetGatewayDevice?.WANDevice?.["1"]
          ?.["X_GponInterafceConfig"]?.RXPower?._value;

      if (potenciaOnu == null) {
        return res
          .status(500)
          .json({ error: "No se pudo leer RXPower para GPON" });
      }

      const potenciaDbm = (potenciaOnu / 100).toFixed(2);
      return res.json({ potenciaOnu, potenciaDbm });
    } else {
      return res
        .status(400)
        .json({ error: "Tipo de IdExterno no soportado para RX" });
    }
  } catch (error) {
    console.error("Error en /rxequipos:", error);
    return res
      .status(500)
      .json({ error: "Error procesando la potencia de la ONU" });
  }
});


app.get(
  "/conciliaciones/:idInstitucion/descargar",
  validarIPyToken,
  async (req, res) => {
    try {
      console.log("Generando archivo de conciliación...", req.body);
      const { idInstitucion } = req.params;
      const idToken = req.body.tokenData.id;
      if (!idInstitucion) {
        return res.status(400).json({
          ok: false,
          message: "ID de institución es requerido",
        });
      }
      const { rutaArchivo, nombreArchivo } = await generarArchivoConciliacion(
        idInstitucion,
        idToken
      );

      // fuerza descarga
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${nombreArchivo}"`
      );
      return res.download(rutaArchivo, nombreArchivo);
    } catch (e) {
      console.error("❌ Error en /conciliaciones/:idInstitucion/descargar:", e);
      return res.status(500).json({
        ok: false,
        message: "Error generando el archivo de conciliación",
        error: e?.message || e,
      });
    }
  }
);

//Ollama
// app.get("/api/tags", async (req, res) => {
//   try {
//     console.log("Llamada a /api/tags", req.body);
//     const hostOlla = (req.tenant?.config?.HOST_OLLA || process.env.HOST_OLLA || "").trim();
//     const { data } = await axios.get(`${hostOlla}/tags`);
//     return res.status(200).json({
//       ok: true,
//       message: "Tags obtenidos correctamente",
//       tags: data,
//     });
//   } catch (error) {
//     console.error("❌ Error en /api/tags:", error);
//     return res.status(500).json({
//       ok: false,
//       message: "Error obteniendo los tags",
//       error: error?.message || error,
//     });
//   }
// })

// app.post("/api/generate", async (req, res) => {
//   console.log("Llamada a /api/generate", req.body);
//   try {
//     const hostOlla = (req.tenant?.config?.HOST_OLLA || process.env.HOST_OLLA || "").trim();
//     const { data } = await axios.post(`${hostOlla}/generate`, req.body);
//     return res.status(200).json(data);
//   } catch (error) {
//     console.error("❌ Error en /api/tags:", error);
//     return res.status(500).json({
//       ok: false,
//       message: "Error obteniendo los tags",
//       error: error?.message || error,
//     });
//   }
// })

// app.post("/api/chat", async (req, res) => {
//   console.log("Llamada a /api/chat", req.body);
//   try {
//     const hostOlla = (req.tenant?.config?.HOST_OLLA || process.env.HOST_OLLA || "").trim();
//     const { data } = await axios.post(`${hostOlla}/chat`, req.body);
//     return res.status(200).json(data);
//   } catch (error) {
//     console.error("❌ Error en /api/tags:", error);
//     return res.status(500).json({
//       ok: false,
//       message: "Error obteniendo los tags",
//       error: error?.message || error,
//     });
//   }
// })

app.post("/linkpagotc", validarIPyToken, async (req, res) => {
  console.log("Llamada a /linkpagotc", req.body);
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
    console.log(`Petición recibida desde la IP: ${ip}`);
    console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);

    // Admite payload en req.body.datosxlink o directamente en req.body
    const payload = req.body.datosxlink || req.body;
    const resultado = await GeneralinkPago(payload, req.tenant?.config);

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("❌ Error en /linkpagotc:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno",
      error: error?.message || error,
    });
  }
});

app.post("/cambiar_contra", validarIPyToken, async (req, res) => {
  console.log("Llamada a /cambiar_contra", req.body);
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
    console.log(`Petición recibida desde la IP: ${ip}`);
    console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);

    // Admite payload en req.body.datosxlink o directamente en req.body
    const payload = req.body.datosxlink || req.body;
    const resultado = await Cambiarclave(payload, req.tenant?.config);
console.log("Resultado de cambio de contraseña:", resultado);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("❌ Error en /cambiar_contra:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno",
      error: error?.message || error,

      
    });
  }
});

// Dispositivos conectados (cantidad + estado)
app.post("/devices/conectados", validarIPyToken, async (req, res) => {
  console.log("Llamada a /devices/conectados", req.body);
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
    console.log(`Petición recibida desde la IP: ${ip}`);
    console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);

    const { info } = req.body;
    
    // Determinar identificador para rate limiting
    let identificador = null;
    
    // Si info está vacío, usar IP como identificador
    if (!info || (typeof info === 'string' && info.trim() === '')) {
      identificador = `empty-${ip}`;
    } else {
      // Extraer cedula/id de info
      if (typeof info === 'string') {
        identificador = info.trim();
      } else if (typeof info === 'object' && info !== null) {
        identificador = info.cedula || info.id || info.Referencia || null;
      }
    }
    
    // ⚠️ RATE LIMITING: Verificar intentos (se aplica ANTES de cualquier validación)
    if (identificador) {
      const rateLimitCheck = verificarRateLimitCedula(String(identificador));
      
      if (!rateLimitCheck.allowed) {
        const recordExcedido = requestCountByCedula.get(String(identificador));
        const max_intentos_num = String(recordExcedido?.count || "");
        console.warn(`⚠️ Rate limit excedido para: ${identificador}`);
        return res.status(429).json({
          estado: "error",
          mensaje: "Máximo de intentos excedido (3 intentos por minuto)",
          cantidad: 0,
          max_intentos: max_intentos_num !== "",
          max_intentos_num,
          identificador: identificador,
          remaining: rateLimitCheck.remaining
        });
      }
    }
    
    // Validación mejorada: info puede ser objeto o string con datos
    if (!info || (typeof info === 'string' && info.trim() === '')) {
      const recordActual = identificador ? requestCountByCedula.get(String(identificador)) : null;
      const max_intentos_num = recordActual ? String(recordActual.count) : "";
      return res.status(400).json({ 
        estado: "error", 
        mensaje: "info es requerido (debe ser un objeto con datos o una cédula/ID)",
        cantidad: 0,
        max_intentos: (recordActual?.count || 0) > RATE_LIMIT_MAX_REQUESTS,
        max_intentos_num,
        identificador: identificador,
        remaining: recordActual ? Math.max(0, RATE_LIMIT_MAX_REQUESTS - recordActual.count) : RATE_LIMIT_MAX_REQUESTS
      });
    }
    
    // Extraer cédula/ID final para respuesta
    let cedula = null;
    if (typeof info === 'string') {
      cedula = info.trim();
    } else if (typeof info === 'object' && info !== null) {
      cedula = info.cedula || info.id || info.Referencia || null;
    }
    
    if (!cedula || String(cedula).trim() === '') {
      const recordActual = identificador ? requestCountByCedula.get(String(identificador)) : null;
      const max_intentos_num = recordActual ? String(recordActual.count) : "";
      return res.status(400).json({ 
        estado: "error", 
        mensaje: "No se encontró cédula/ID en info",
        cantidad: 0,
        max_intentos: (recordActual?.count || 0) > RATE_LIMIT_MAX_REQUESTS,
        max_intentos_num,
        identificador: identificador,
        remaining: recordActual ? Math.max(0, RATE_LIMIT_MAX_REQUESTS - recordActual.count) : RATE_LIMIT_MAX_REQUESTS
      });
    }

    const resultado = await DispositivosConectados({ info }, req.tenant?.config);
    
    // Agregar info del rate limiting en la respuesta
    const recordActual = requestCountByCedula.get(String(identificador));
    resultado.max_intentos_num = recordActual ? String(recordActual.count) : "";
    resultado.max_intentos = (recordActual?.count || 0) > RATE_LIMIT_MAX_REQUESTS;
    resultado.cedula = cedula;
    resultado.identificador = identificador;
    
    // Obtener remaining actual
    resultado.remaining = recordActual ? Math.max(0, RATE_LIMIT_MAX_REQUESTS - recordActual.count) : RATE_LIMIT_MAX_REQUESTS;
    
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("❌ Error en /devices/conectados:", error);
    return res.status(500).json({ 
      estado: "error", 
      mensaje: "Error interno", 
      error: error?.message || error, 
      cantidad: 0, 
      max_intentos: false 
    });
  }
});

app.post("/router/reiniciar", validarIPyToken, async (req, res) => {
  console.log("Llamada a /router/reiniciar", req.body);
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ status: false, error: "id es requerido" });
    }
    const resultado = await reiniciarequipo(id, req.tenant?.config);
    console.log("Resultado de reinicio de equipo:", resultado);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("❌ Error en /router/reiniciar:", error);
    return res.status(500).json({ status: false, error: error?.message || error });
  }
});



// Cambiar nombre de red WiFi (SSID) y opcionalmente crear/cerrar ticket
app.post("/wifi/ssid", validarIPyToken, async (req, res) => {
  console.log("Llamada a /wifi/ssid", req.body);
  try {
    const { info, nombrered, sufijo, base, idcliente, nombre, movil } = req.body;
    if (!info || (!nombrered && !sufijo)) {
      return res.status(400).json({ estado: "error", mensaje: "info y (nombrered o sufijo) son requeridos" });
    }
    const resultado = await CambiarNombreSSID({ info, nombrered, sufijo, base, idcliente, nombre, movil }, req.tenant?.config);
    console.log("Resultado de cambio de SSID:", resultado);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("❌ Error en /wifi/ssid:", error);
    return res.status(500).json({ estado: "error", mensaje: error?.message || "Error interno" });
  }
});

// Cambiar visibilidad del SSID (mostrar/ocultar)
app.post("/wifi/ssid/visibility", validarIPyToken, async (req, res) => {
  console.log("Llamada a /wifi/ssid/visibility", req.body);
  try {
    const { info, visible } = req.body;
    if (!info) {
      return res.status(400).json({ estado: "error", mensaje: "info es requerido" });
    }
    const resultado = await CambiarVisibilidadSSID({ info, visible }, req.tenant?.config);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("❌ Error en /wifi/ssid/visibility:", error);
    return res.status(500).json({ estado: "error", mensaje: error?.message || "Error interno" });
  }
});

// Listar tickets por usuario
app.post("/tickets/listar", validarIPyToken, async (req, res) => {
  console.log("Llamada a /tickets/listar", req.body);
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
    console.log(`Petición recibida desde la IP: ${ip}`);
    console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);

    const payload = req.body;
    const resultado = await listarTicketsusuario(payload, req.tenant?.config);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("❌ Error en /tickets/listar:", error);
    return res.status(500).json({ ok: false, message: "Error interno", error: error?.message || error });
  }
});

// Crear ticket con verificación previa de abiertos
app.post("/tickets/crear", validarIPyToken, async (req, res) => {
  console.log("Llamada a /tickets/crear", req.body);
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
    console.log(`Petición recibida desde la IP: ${ip}`);
    console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);

    const ticketData = req.body;

    // Validaciones básicas
    if (!ticketData?.idcliente) {
      return res.status(400).json({ estado: "error", mensaje: "idcliente es requerido" });
    }
    if (!ticketData?.asunto) {
      ticketData.asunto = "TICKET DE SOPORTE";
    }

    const resultado = await CrearTicketConCheck(ticketData, req.tenant?.config);
    console.log("Resultado de creación de ticket:", resultado);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("❌ Error en /tickets/crear:", error);
    return res.status(500).json({ ok: false, message: "Error interno", error: error?.message || error });
  }
});

// Preregistro de cliente
app.post("/preregistro", validarIPyToken, async (req, res) => {
  console.log("Llamada a /preregistro", req.body);
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
    console.log(`Petición recibida desde la IP: ${ip}`);
    console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);

    const payload = req.body;
    if (!payload?.cedula) {
      return res.status(400).json({ estado: "error", mensaje: "cedula es requerido" });
    }

    const resultado = await Preregistro(payload, req.tenant?.config);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("❌ Error en /preregistro:", error);
    return res.status(500).json({ estado: "error", mensaje: error?.message || "Error interno" });
  }
});

// Generar token y enviar por WhatsApp
app.post("/token/generar", validarIPyToken, async (req, res) => {
  console.log("Llamada a /token/generar", req.body);
  try {
    let { cedula, movil, ttlMin, sessionName } = req.body;
    if (!cedula || !movil) {
      return res.status(400).json({ ok: false, estado: "error", mensaje: "cedula y movil son requeridos" });
    }
    
    const result = await generarTokenWhatsapp({ cedula, movil, ttlMin, sessionName }, req.tenant?.config);
    console.log("Resultado de generación de token:", result);
    const statusCode = result.ok ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    console.error("❌ Error en /token/generar:", error);
    return res.status(500).json({ ok: false, estado: "error", mensaje: error?.message || "Error interno" });
  }
});

// Validar token (con expiración y consumo)
app.post("/token/validar", validarIPyToken, async (req, res) => {
  console.log("Llamada a /token/validar", req.body);
  try {
    const { cedula, token, ttlMin } = req.body;
    console.log("Datos recibidos para validación de token:", { cedula, token, ttlMin });
    if (!cedula || !token) {
      return res.status(400).json({ ok: false, estado: "error", mensaje: "cedula y token son requeridos" });
    }
    const result = await validarTokenWhatsapp({ cedula, token, ttlMin });
    console.log("Resultado de validación de token:", result);
    const statusCode = result.ok ? 200 : 400;
    console.log("Enviando respuesta con status code:", statusCode);
    return res.status(statusCode).json(result);
  } catch (error) {
    console.error("❌ Error en /token/validar:", error);
    return res.status(500).json({ ok: false, estado: "error", mensaje: error?.message || "Error interno" });
  }
});

// Enviar mensaje de WhatsApp al equipo de soporte configurado en tenant
app.post("/soporte/whatsapp", validarIPyToken, async (req, res) => {
  console.log("Llamada a /soporte/whatsapp", req.body);
  try {
    const { mensaje, numerosSoporte } = req.body;
    if (!mensaje) {
      return res.status(400).json({ ok: false, estado: "error", mensaje: "mensaje es requerido" });
    }

    const result = await enviarMensajeWhatsappSoporte(
      { mensaje, numerosSoporte },
      req.tenant?.config
    );
console.log("Resultado de envío de mensaje de WhatsApp:", result);
    const statusCode = result.ok ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    console.error("❌ Error en /soporte/whatsapp:", error);
    return res.status(500).json({ ok: false, estado: "error", mensaje: error?.message || "Error interno" });
  }
});


// Generar token y enviar por correo electrónico
app.post("/token/correo/generar", validarIPyToken, async (req, res) => {
  console.log("Llamada a /token/correo/generar", req.body);
  try {
    const { cedula, correo, ttlMin } = req.body;
    if (!cedula || !correo) {
      return res.status(400).json({ ok: false, estado: "error", mensaje: "cedula y correo son requeridos" });
    }
    const result = await generarTokenCorreo({ cedula, correo, ttlMin }, req.tenant?.config);
    return res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    console.error("❌ Error en /token/correo/generar:", error);
    return res.status(500).json({ ok: false, estado: "error", mensaje: error?.message || "Error interno" });
  }
});

// Validar token generado por correo
app.post("/token/correo/validar", validarIPyToken, async (req, res) => {
  console.log("Llamada a /token/correo/validar", req.body);
  try {
    const { cedula, token, ttlMin } = req.body;
    if (!cedula || !token) {
      return res.status(400).json({ ok: false, estado: "error", mensaje: "cedula y token son requeridos" });
    }
    const result = await validarTokenCorreo({ cedula, token, ttlMin });
    return res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    console.error("❌ Error en /token/correo/validar:", error);
    return res.status(500).json({ ok: false, estado: "error", mensaje: error?.message || "Error interno" });
  }
});

// Generar link de contrato
app.post("/contrato/link", validarIPyToken, async (req, res) => {
  console.log("Llamada a /contrato/link", req.body);
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const token = req.headers["authorization"]?.replace("Bearer ", "").trim();
    console.log(`Petición recibida desde la IP: ${ip}`);
    console.log(`Hora de la peticion: ${new Date().toLocaleString()}`);

    const { cedula } = req.body;
    if (!cedula) {
      return res.status(400).json({ estado: false, mensaje: "cedula es requerida" });
    }

    const resultado = await GenerarLinkContrato({ cedula }, req.tenant?.config);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("❌ Error en /contrato/link:", error);
    return res.status(500).json({
      ok: false,
      message: "Error generando el link de contrato",
      error: error?.message || error,
    });
  }
});


// Configuración del tenant (tema, nombre, etc.)
app.get("/tenant/config", validarIPyToken, async (req, res) => {
  try {
    const cfg = req.tenant?.config || {};
    const { name, theme } = cfg;
    console.log("Configuración del tenant:", req.tenant?.id, cfg);
    return res.status(200).json({ tenant: req.tenant?.id || "default", name, theme });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Error obteniendo configuración" });
  }
});




app.post("/EnviarCorreo", validarIPyToken, async (req, res) => {
  const { from, to, subject, text, html } = req.body;
  if (!to) return res.status(400).json({ ok: false, message: "El campo 'to' es requerido" });
  const cfg = req.tenant?.config;
  try {
    const result = await EnviarCorreo({ from, to, subject, text, html }, cfg);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Error al enviar correo", error: error.message });
  }
});

const PORT = process.env.PORTAPI || 5000;

app.listen(PORT, "0.0.0.0", async () => {
  cargarTenantsConfig();
  await cargarWhitelistIPs(); // primera carga
  setInterval(cargarWhitelistIPs, 1 * 60 * 1000); // cada 1 minutos
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
