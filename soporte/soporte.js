const { default: axios } = require("axios");
const { Console } = require("console");
const { CONNREFUSED } = require("dns");
const https = require("https");

const agent = new https.Agent({ rejectUnauthorized: false }); // ⚠️ Solo para entornos de prueba

// 🔧 Helper para logging
function logRequest(name, url, start, status, error = null) {
  console.log("\n");
  const elapsed = (Date.now() - start) / 1000;
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📡 ${name}`);
  console.log(`🌐 URL: ${url}`);
  console.log(`⏱️  Tiempo: ${elapsed.toFixed(2)}s`);
  if (status) console.log(`✅ HTTP ${status}`);
  if (error) console.error(`❌ Error: ${error}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

/**
 * Consulta Mikrowisp → GetRouters
 */
async function GetRouters(id, config) {
  ENV = config;
  console.log("Configuración recibida en GetRouters:", ENV);
  const name = "GetRouters (Mikrowisp)";
  const url = `${ENV.HOST_CONSULTA}GetRouters`;
  console.log("URL construida para GetRouters:", url);
  // const url = `${process.env.HOST_CONSULTA}GetRouters`;
  const start = Date.now();

  try {
    // const payload = { token: process.env.TOKEN, id };
    const payload = { token: ENV.TOKEN, id };
    const { data, status } = await axios.post(url, payload);
    
    logRequest(name, url, start, status);
    return data;
  } catch (error) {
    logRequest(name, url, start, error.response?.status, error.message);
    return { status: false, error: error.response?.data || error.message };
  }
}

/**
 * Obtiene detalles de una ONU (SmartOLT)
 */
async function get_onu_details(onu_external_id, config) {
  ENV = config
  const name = "get_onu_details (SmartOLT)";
  const url = `${ENV.HOST_SMARTOLT}get_onu_details/${onu_external_id}`;
  console.log("URL construida para get_onu_details:", url);
  const start = Date.now();

  try {
    const { data, status } = await axios.get(url, {
      // headers: { "X-Token": process.env.TOKEN_SMARTOLT },
      headers: { "X-Token": ENV.TOKEN_SMARTOLT },
      httpsAgent: agent,
      proxy: false,
    });
    
    logRequest(name, url, start, status);
    return data;
  } catch (error) {
    logRequest(name, url, start, error.response?.status, error.message);
    return { status: false, error: error.response?.data || error.message };
  }
}

/**
 * Obtiene los puertos PON de una OLT (SmartOLT System)
 */
async function get_olt_pon_ports_details(olt_id, config) {
  const ENV = config;
  const name = "get_olt_pon_ports_details (SmartOLT System)";
  const url = `${ENV.HOST_SMARTOLT_SYSTEM}get_olt_pon_ports_details/${olt_id}`;
  const start = Date.now();

  try {
    const { data, status } = await axios.get(url, {
      // headers: { "X-Token": process.env.TOKEN_SMARTOLT },
      headers: { "X-Token": ENV.TOKEN_SMARTOLT },
      httpsAgent: agent,
      proxy: false,
    });
    
    logRequest(name, url, start, status);
    return data;
  } catch (error) {
    logRequest(name, url, start, error.response?.status, error.message);
    return { status: false, error: error.response?.data || error.message };
  }
}

/**
 * Obtiene el estado de una ONU (SmartOLT)
 */
async function get_onu_status(onu_external_id, config) {
  const ENV = config;
  const name = "get_onu_status (SmartOLT)";
  const url = `${ENV.HOST_SMARTOLT}get_onu_status/${onu_external_id}`;
  const start = Date.now();

  try {
    const { data, status } = await axios.get(url, {
      // headers: { "X-Token": process.env.TOKEN_SMARTOLT },
      headers: { "X-Token": ENV.TOKEN_SMARTOLT },
      httpsAgent: agent,
      proxy: false,
    });
    console.log("Respuesta de get_onu_status:", data);
    logRequest(name, url, start, status);
    return data;
  } catch (error) {
    logRequest(name, url, start, error.response?.status, error.message);
    return { status: false, error: error.response?.data || error.message };
  }
}

/**
 * Obtiene la potencia de señal de una ONU (SmartOLT)
 */
async function get_onu_signal(onu_external_id, config) {
  const ENV = config;
  const name = "get_onu_signal (SmartOLT)";
  const url = `${ENV.HOST_SMARTOLT}get_onu_signal/${onu_external_id}`;
  const start = Date.now();

  try {
    const { data, status } = await axios.get(url, {
      // headers: { "X-Token": process.env.TOKEN_SMARTOLT },
      headers: { "X-Token": ENV.TOKEN_SMARTOLT },
      httpsAgent: agent,
      proxy: false,
    });
    logRequest(name, url, start, status);
    return data;
  } catch (error) {
    logRequest(name, url, start, error.response?.status, error.message);
    return { status: false, error: error.response?.data || error.message };
  }
}

const resincronizacion = async (idcliente, cfg) => {
  const ENV = cfg;
  const name = "resincronizacion (SmartOLT)";
  const baseUrl = String(ENV?.HOST_SMARTOLT || "").replace(/\/+$/, "");
  const url = `${baseUrl}/resync_config/${idcliente}`;
  const start = Date.now();

  const token = String(ENV?.TOKEN_SMARTOLT || "").trim();
  if (!token) {
    return { estado: "001", mensaje: "Token para Resincronizacion no configurado" };
  }
console.log("Llamando a URL de resincronizacion:", url);
  try {
    const { data, status } = await axios.post(url, {}, {
      headers: { "X-Token": token },
      httpsAgent: agent,
      proxy: false,
    });
    logRequest(name, url, start, status);
    console.log("Respuesta de resincronizacion:", data);
    return data;
  } catch (error) {
    logRequest(name, url, start, error.response?.status, error.message);
    return error?.response?.data || { estado: "001", mensaje: error?.message || "Error de conexión" };
  }
};

// Lista tickets por usuario/cliente
const listarTicketsusuario = async (params, cfg) => {
  const ENV = (cfg);
  try {
    const url = ENV?.HOST_CONSULTA + "/ListTicket";
    const token =
      ENV?.TOKEN

    const payload = {
      ...params,
      token: token || params?.token,
    };

    if (!payload?.token) {
      return { estado: "001", mensaje: "Token para ListTicket no configurado" };
    }

    const { data } = await axios.post(url, payload, { timeout: 15000 });
    
    return data;
  } catch (error) {
    return error?.response?.data || { success: false, mensaje: "Error de conexión" };
  }
};

// Crea un ticket directamente en el backend
const Newtickte = async (parms, cfg) => {
  const ENV = (cfg);

  console.log("Parámetros recibidos en Newtickte:", parms);
  console.log("URL base para Newtickte:", ENV?.HOST_CONSULTA);
  console.log("Token para Newtickte:", ENV?.TOKEN);
  try {
    const url = ENV?.HOST_CONSULTA + "NewTicket";
    const token = ENV?.TOKEN;

    const payload = {
      ...parms,
      token: token || parms?.token,
    };
    console.log("Payload construido para Newtickte:", payload);
    if (!payload?.token) {
      return { estado: "001", mensaje: "Token para NewTicket no configurado" };
    }

    const { data } = await axios.post(url, payload, { timeout: 15000 });
    console.log("Crear ticket respuesta:", data);
    return data; // { estado: "exito", idticket, mensaje }
  } catch (error) {
    return (
      error?.response?.data || {
        estado: "001",
        mensaje: error?.message || "Error de conexión",
      }
    );
  }
};

// Crea ticket, previa verificación de abiertos
const CrearTicketConCheck = async (ticketData, cfg) => {
  const ENV = (cfg);
  try {
    // 1) Verificar tickets abiertos
    const idcliente = ticketData?.idcliente;
    if (!idcliente) {
      return { estado: "001", mensaje: "idcliente es requerido" };
    }

    const listado = await listarTicketsusuario({ idcliente }, ENV);
    const abiertosCount =
      (listado?.data?.abiertos ?? listado?.abiertos ?? (
        Array.isArray(listado?.data?.tickets)
          ? listado.data.tickets.filter((t) => t?.estado === "abierto").length
          : 0
      ));
    console.log(`Tickets abiertos para cliente ${idcliente}:`, abiertosCount);
    if (abiertosCount >= 1) {
      return {
        estado: "001",
        mensaje: "Ya existe un ticket abierto. Por favor, revise sus tickets.",
        abiertos: abiertosCount,
      };
    } else {
      // 2) Crear ticket usando configuración externa (URL + token)
      return await Newtickte(ticketData, ENV);
    }


  } catch (error) {
    if (error.response) {
      return {
        estado: "001",
        error: error.response.data || error.message,
        status: error.response.status,
      };
    }
    if (error.request) {
      return { estado: "001", error: "No se pudo conectar con el servidor externo" };
    }
    return { estado: "001", error: error.message || "Error interno" };
  }
};

// Obtiene dispositivos conectados (lista detallada por host) para un equipo
const DispositivosConectados = async ({ info }, cfg) => {
  const ENV = cfg;
console.log("id_external onu: ", info);
  const infoRaw = String(info).trim();
  let infoNormalizado = infoRaw;
  try {
    infoNormalizado = decodeURIComponent(infoRaw);
  } catch (_e) {
    infoNormalizado = infoRaw;
  }
  try {
    if (!info) {
      return { estado: "001", cantidad: 0, dispositivos: [], mensaje: "info es requerido" };
    }

    const hostACS = ENV?.HOST_ACS;
    const tokenAcs = ENV?.TOKEN_SMARTOLT;
    if (!hostACS) {
      return { estado: "001", cantidad: 0, dispositivos: [], mensaje: "HOST_ACS no configurado" };
    }
    if (!tokenAcs) {
      return { estado: "001", cantidad: 0, dispositivos: [], mensaje: "TOKEN_SMARTOLT no configurado" };
    }

    const commonHeaders = {
      "Content-Type": "application/json",
      "X-Token": String(tokenAcs),
    };

    // Servicio para actualizar los dispositivos conectados (no bloqueante si falla)
    try {
      const queryact = `${hostACS}/devices/${infoNormalizado}/tasks?connection_request`;
      const actroute = await axios.post(
        queryact,
        {
          name: "refreshObject",
          objectName: "Device.Hosts.HostNumberOfEntries",
        },
        { headers: commonHeaders, timeout: 15000 }
      );
      const queryact2 = `${hostACS}/devices/${infoNormalizado}/tasks?connection_request`;
      const actroute2 = await axios.post(
        queryact2,
        {
          name: "refreshObject",
          objectName: "Device.Hosts.Host",
        },
        { headers: commonHeaders, timeout: 15000 }
      );
      const actroute3 = await axios.post(
        queryact2,
        {
          name: "refreshObject",
          objectName: "InternetGatewayDevice.LANDevice.1.Hosts.HostNumberOfEntries",
        },
        { headers: commonHeaders, timeout: 15000 }
      );
      const actroute4 = await axios.post(
        queryact2,
        {
          name: "refreshObject",
          objectName: "InternetGatewayDevice.LANDevice.1.Hosts.Host",
        },
        { headers: commonHeaders, timeout: 15000 }
      );
      console.log("Respuesta de refresco de dispositivos conectados:", actroute?.data ?? actroute);
      console.log("Respuesta de refresco de dispositivos conectados (Host):", actroute2?.data ?? actroute2);
      console.log("Respuesta de refresco IGD HostNumberOfEntries:", actroute3?.data ?? actroute3);
      console.log("Respuesta de refresco IGD Host:", actroute4?.data ?? actroute4);
    } catch (refreshErr) {
      console.warn("Advertencia: fallo al solicitar refresh de hosts (continuando):", refreshErr?.message || refreshErr);
    }

    // Evita doble encoding del _id (ej: %252D -> %25252D) al codificar el query completo.
    const query = JSON.stringify({ _id: infoNormalizado });
    const projection = [
      "Device.Hosts.Host",
      "Device.Hosts.HostNumberOfEntries",
      "InternetGatewayDevice.LANDevice.1.Hosts.Host",
      "InternetGatewayDevice.LANDevice.1.Hosts.HostNumberOfEntries",
    ].join(",");
    const url = `${hostACS}/devices/?query=${encodeURIComponent(query)}&projection=${encodeURIComponent(projection)}`;

    console.log("Llamando a URL de DispositivosConectados:", url);
    const { data } = await axios.get(url, {
      headers: commonHeaders,
      timeout: 15000,
    });

    // El ACS responde típicamente un arreglo con el CPE en la posición 0
    let root = null;
    if (Array.isArray(data) && data.length) {
      root = data[0];
    } else if (typeof data === "object" && data) {
      root = data;
    }

    if (!root) {
      return { estado: "000", cantidad: 0, dispositivos: [] };
    }

    // Hosts puede venir en Device.Hosts.Host o InternetGatewayDevice.LANDevice.X.Hosts.Host
    const extractHostData = (deviceRoot) => {
      const byDevice = deviceRoot?.Device?.Hosts || null;
      if (byDevice && byDevice.Host) {
        return {
          hosts: byDevice.Host,
          count: byDevice?.HostNumberOfEntries?._value ?? byDevice?.HostNumberOfEntries ?? null,
        };
      }

      const lanDevice = deviceRoot?.InternetGatewayDevice?.LANDevice || null;
      if (lanDevice && typeof lanDevice === "object") {
        const lanKeys = Object.keys(lanDevice).filter((k) => !isNaN(Number(k)));
        for (const key of lanKeys) {
          const hostsObj = lanDevice?.[key]?.Hosts;
          if (hostsObj && hostsObj.Host) {
            return {
              hosts: hostsObj.Host,
              count: hostsObj?.HostNumberOfEntries?._value ?? hostsObj?.HostNumberOfEntries ?? null,
            };
          }
        }
      }

      return { hosts: {}, count: null };
    };

    let { hosts: hostsRaw, count: countFromCpe } = extractHostData(root);

    // Fallback: si solo llegó _id por proyección, consultar sin proyección para recuperar árbol completo.
    if (!hostsRaw || (typeof hostsRaw === "object" && !Array.isArray(hostsRaw) && Object.keys(hostsRaw).length === 0)) {
      try {
        const fallbackUrl = `${hostACS}/devices/?query=${encodeURIComponent(query)}`;
        console.log("Fallback sin projection en DispositivosConectados:", fallbackUrl);
        const { data: fallbackData } = await axios.get(fallbackUrl, {
          headers: commonHeaders,
          timeout: 15000,
        });

        if (Array.isArray(fallbackData) && fallbackData.length > 0) {
          root = fallbackData[0];
          const extracted = extractHostData(root);
          hostsRaw = extracted.hosts;
          countFromCpe = extracted.count;
        }
      } catch (fallbackErr) {
        console.warn("Advertencia: fallback sin projection falló:", fallbackErr?.message || fallbackErr);
      }
    }

    const getField = (h, field) => {
      if (!h) return null;
      // valor puede venir como { _value: '...' } o directamente como string/number
      if (h[field] == null) return null;
      if (typeof h[field] === "object" && h[field]._value !== undefined) return h[field]._value;
      return h[field];
    };

    const dispositivos = [];
    if (Array.isArray(hostsRaw)) {
      hostsRaw.forEach((h, idx) => {
        const nombre = getField(h, "HostName") || "Desconocido";
        const activoRaw = getField(h, "Active");
        const leaseRaw = getField(h, "LeaseTimeRemaining");
        dispositivos.push({
          index: idx,
          nombre,
          ip: getField(h, "IPAddress"),
          mac: getField(h, "MACAddress"),
          activo: activoRaw === "1" || activoRaw === 1 || String(activoRaw).toLowerCase() === "true",
          interfaz: getField(h, "InterfaceType"),
          lease: leaseRaw != null ? Number(leaseRaw) : null,
          source: getField(h, "AddressSource"),
        });
      });
    } else {
      const deviceKeys = Object.keys(hostsRaw).filter((k) => !isNaN(Number(k)));
      for (const k of deviceKeys) {
        const h = hostsRaw[k];
        const nombre = getField(h, "HostName") || "Desconocido";
        const activoRaw = getField(h, "Active");
        const leaseRaw = getField(h, "LeaseTimeRemaining");
        dispositivos.push({
          index: Number(k),
          nombre,
          ip: getField(h, "IPAddress"),
          mac: getField(h, "MACAddress"),
          activo: activoRaw === "1" || activoRaw === 1 || String(activoRaw).toLowerCase() === "true",
          interfaz: getField(h, "InterfaceType"),
          lease: leaseRaw != null ? Number(leaseRaw) : null,
          source: getField(h, "AddressSource"),
        });
      }
    }

    const cantidad = dispositivos.length > 0
      ? dispositivos.length
      : (countFromCpe != null ? Number(countFromCpe) || 0 : 0);

    let nombresTexto = "";
    let cantdisp = 0;
    for (const dispositivo of dispositivos) {
      cantdisp=cantdisp+1;
      nombresTexto += `\n ${cantdisp}.- Nombre: ${dispositivo.nombre || "Desconocido"}`;
    }
    if (!nombresTexto) {
      nombresTexto = null;
    }

    return { estado: "000", cantidad, dispositivos, nombresTexto, _id: root?._id };
  } catch (error) {
    return {
      estado: "001",
      cantidad: 0,
      dispositivos: [],
      mensaje: error?.response?.data || error?.message || "Error de conexión",
    };
  }
};

const reiniciarequipo = async (id, cfg) => {
  const ENV = (cfg);
  try {
    if (!id) {
      return { status: false, error: "id es requerido" };
    }
    const hostSmartOlt =ENV?.HOST_SMARTOLT;
    const tokenSmartOlt = ENV?.TOKEN_SMARTOLT;
console.log("Configuración recibida en reiniciarequipo:", { hostSmartOlt, tokenSmartOlt });
    if (!hostSmartOlt) {
      return { status: false, error: "HOST_SMARTOLT no configurado" };
    }
    if (!tokenSmartOlt) {
      return { status: false, error: "TOKEN_SMARTOLT no configurado" };
    }

    const url = `${hostSmartOlt}/reboot/${id}`;
    console.log("Llamando a URL de reiniciarequipo:", url);
    const { data } = await axios.post(url, null, {
      headers: {
        "X-Token": String(tokenSmartOlt),
      },
      timeout: 20000,
      httpsAgent: agent,
      proxy: false,
    });
    console.log("Reinicio equipo respuesta:", data);
    return data;
  } catch (error) {
    return (
      error?.response?.data || {
        status: "001",
        error: error?.message || "Error de conexión",
      }
    );
  }
};

// Cierra un ticket (configurable por env; fallback al host base)
const CloseTicket = async (params, cfg) => {
  const ENV = (cfg);
  try {
    const url = ENV?.HOST_CONSULTA +"/CloseTicket";
    const token = ENV?.TOKEN;

    const payload = {
      ...params,
      token: token || params?.token,
      idticket: params?.idticket ,
      motivo_cierre: params?.motivo_cierre 
    };

    if (!payload?.token) {
      return { estado: "001", mensaje: "Token para CloseTicket no configurado" };
    }

    const { data } = await axios.post(url, payload, { timeout: 15000 });
    console.log("Cierre ticket respuesta:", data);
    return data;
  } catch (error) {
    return error?.response?.data || { estado: "001", mensaje: error?.message || "Error de conexión" };
  }
};

const Cambiarclave = async (datos, cfg) => {
  const ENV = (cfg);
  try {
    const hostAcs = ENV?.HOST_ACS;
    const tokenAcs = ENV?.TOKEN_SMARTOLT;
    if (!hostAcs) return { estado: "001", mensaje: "HOST_ACS no configurado" };
    if (!tokenAcs) return { estado: "001", mensaje: "TOKEN_SMARTOLT no configurado" };

    const info = String(datos?.info || "").trim();
    const claveRaw = datos?.booleas ?? datos?.clave ?? datos?.password ?? datos?.contrasena;
    const clave = String(claveRaw || "").trim();

    if (!info || !clave) {
      return { estado: "001", mensaje: "info y booleas/clave son requeridos" };
    }

    const idcliente = datos?.idcliente;
    const nombre = datos?.nombre;
    const movil = datos?.movil;

    const hostAcsBase = String(hostAcs).replace(/\/+$/, "");
    const query = JSON.stringify({ _id: info });
    let deviceId = info;

    try {
      const urlDevice = `${hostAcsBase}/devices/?query=${encodeURIComponent(query)}`;
      const { data: dataDevice } = await axios.get(urlDevice, {
        headers: {
          "Content-Type": "application/json",
          "X-Token": String(tokenAcs),
        },
        timeout: 15000,
      });
      if (Array.isArray(dataDevice) && dataDevice.length > 0 && dataDevice[0]?._id) {
        deviceId = String(dataDevice[0]._id).trim();
      }
    } catch (_e) {
      deviceId = info;
    }

    const urlTaskQueued = `${hostAcsBase}/devices/${deviceId}/tasks`;
    const urlTaskImmediate = `${hostAcsBase}/devices/${deviceId}/tasks?connection_request`;

    const requestConfig = {
      headers: {
        "Content-Type": "application/json",
        "X-Token": String(tokenAcs),
      },
      timeout: 15000,
    };

    const setBody = {
      name: "setParameterValues",
      parameterValues: [
        [
          "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase",
          clave,
          "xsd:string",
        ],
        [
          "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.PreSharedKey",
          clave,
          "xsd:string",
        ], 
        [
          "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.KeyPassphrase",
          clave,
          "xsd:string",
        ],
        [
          "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.X_TP_PreSharedKey",
          clave,
          "xsd:string",
        ],
        [
          "Device.WiFi.AccessPoint.1.Security.KeyPassphrase",
          clave,
          "xsd:string",
        ],
      ],
    };

    const { data: setResp } = await axios.post(urlTaskQueued, setBody, requestConfig);

    const refreshBody = {
      name: "refreshObject",
      objectName: "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1",
    };

    let refreshResp = null;
    let refreshOk = false;
    try {
      const { data } = await axios.post(urlTaskImmediate, refreshBody, requestConfig);
      refreshResp = data;
      refreshOk = true;
    } catch (refreshErr) {
      refreshResp = refreshErr?.response?.data || refreshErr?.message || "Error refrescando estado";
    }

    let ticket = { creado: false };
    if (idcliente) {
      const hoy = new Date().toISOString().split("T")[0];
      const asunto = "cambios - Se ha realizado correctamente, se cambio la contrasena del wifi";
      const solicitante = `Speedman ${nombre || ""}`.trim();
      const contenido = `cambios - Se ha realizado correctamente, se cambio la contrasena del wifi (${movil || ""}), LA NUEVA CONTRASEÑA ES: ${clave}`;

      const bodyTicket = {
        idcliente: String(idcliente),
        dp: 6,
        asunto,
        solicitante,
        fechavisita: hoy,
        turno: "TARDE",
        agendado: "RED SOCIAL",
        contenido,
      };

      const crea = await Newtickte(bodyTicket, ENV);
      ticket = { creado: crea?.estado === "exito", idticket: crea?.idticket, respuesta: crea };

      if (ticket.creado && ticket.idticket) {
        const cierre = await CloseTicket(
          { idticket: String(ticket.idticket), motivo_cierre: contenido },
          ENV
        );
        ticket.cerrado = cierre?.estado === "exito";
        ticket.cierre = cierre;
      }
    }

    return {
      estado: refreshOk ? "000" : "000_parcial",
      mensaje: refreshOk
        ? "Clave actualizada"
        : "Clave encolada; refresh por connection_request no confirmado",
      deviceId,
      total_parametros: setBody.parameterValues.length,
      setResp,
      refreshResp,
      ticket,
    };
  } catch (error) {
    if (error.response) {
      return {
        estado: "001",
        mensaje: error.response.data || error.message,
        status: error.response.status,
      };
    }
    if (error.request) {
      return { estado: "001", mensaje: "No se pudo conectar con el servidor externo" };
    }
    return { estado: "001", mensaje: error?.message || "Error interno" };
  }
};

// Construye SSID válido (base + sufijo, evitando vacío)
function construirSSIDValido(base = "", sufijo = "") {
  const limpio = String(sufijo || "").trim();
  if (!limpio) return null;
  return `${base}${limpio}`;
}

// Cambia nombre SSID, refresca estado y opcionalmente crea/cierra ticket
const CambiarNombreSSID = async ({
  info,
  nombrered,
  sufijo,
  base,
  idcliente,
  nombre,
  movil,
}, cfg) => {
  const ENV = (cfg);
  try {
    if (!info) return { estado: "error", mensaje: "info es requerido" };

    const hostAcs = ENV?.HOST_ACS ;
    const tokenAcs = ENV?.TOKEN_SMARTOLT;
    console.log("Configuración recibida en CambiarNombreSSID:", { hostAcs, tokenAcs });
    if (!hostAcs) return { estado: "error", mensaje: "HOST_ACS no configurado" };
    if (!tokenAcs) return { estado: "error", mensaje: "TOKEN_SMARTOLT no configurado" };

    let finalSSID = nombrered && String(nombrered).trim() ? String(nombrered).trim() : null;
    if (!finalSSID) {
      finalSSID = construirSSIDValido(base ||  sufijo);
    }
    if (!finalSSID) return { estado: "error", mensaje: "Ingrese un nombre para la red (no vacío)" };
console.log("idonu: ", info)  
    // 1) Cambiar nombre SSID (equivalente a namessi2)
    const urlNombre = `${hostAcs}/devices/${info}/tasks`;
    console.log("Llamando a URL de cambio de nombre SSID:", urlNombre);
    const bodyNombre = {
      name: "setParameterValues",
      parameterValues: [
        [
          "Device.WiFi.SSID.*.SSID",
          String(finalSSID),
          "xsd:string",
        ],
        [
          "InternetGatewayDevice.LANDevice.*.WLANConfiguration.*.SSID",
          String(finalSSID),
          "xsd:string",
        ],
      ],
    };
    console.log("Payload para cambio de nombre SSID:", bodyNombre);
    const respNombre = await axios.post(urlNombre, bodyNombre, {
      headers: {
        "Content-Type": "application/json",
        "X-Token": String(tokenAcs),
      },
      timeout: 15000,
    });
    console.log("Respuesta de cambio de nombre SSID:", respNombre?.data ?? respNombre);

    // 2) Refrescar estado SSID (equivalente a refres2)
    const urlRefres = `${hostAcs}/devices/${info}/tasks?connection_request`;
    console.log("Llamando a URL de refresco de SSID:", urlRefres);
    const bodyRefres = {
      name: "refreshObject",
      objectName: "Device.WiFi.SSID.1.SSID",
    };
    const respRefres = await axios.post(urlRefres, bodyRefres, {
      headers: {
        "Content-Type": "application/json",
        "X-Token": String(tokenAcs),
      },
      timeout: 15000,
    });
    console.log("Respuesta de refresco de SSID:", respRefres?.data ?? respRefres);

    // 3) Ticket
    let ticket = { creado: false };
    if (idcliente) {
      const hoy = new Date().toISOString().split('T')[0];
      const asunto = `cambios - Se ha realizado correctamente, se cambio el nombre a (${finalSSID})`;
      const solicitante = `Speedman  ${nombre || ''}`.trim();
      const contenido = `cambios - Se ha realizado correctamente, se cambio el nombre a (${finalSSID}) (${movil || ''})`;

      const body = {
        idcliente: String(idcliente),
        dp: 6,
        asunto,
        solicitante,
        fechavisita: hoy,
        turno: "TARDE",
        agendado: "RED SOCIAL",
        contenido,
      };
console.log("Datos para creación de ticket cambio de nombre wifi:", body);
      const crea = await Newtickte(body, ENV);

      ticket = { creado: crea?.estado === "exito", idticket: crea?.idticket, respuesta: crea };

      if (ticket.creado && ticket.idticket) {
        const cierre = await CloseTicket({ idticket: String(ticket.idticket), motivo_cierre: contenido }, ENV);
        ticket.cerrado = cierre?.estado === "exito";
        ticket.cierre = cierre;
      }
    }
    console.log("Cambio nombre SSID:", {
      ssid: finalSSID,
      respNombre: respNombre?.data ?? respNombre,
      respRefres: respRefres?.data ?? respRefres,
      ticket,
    });

    return {
      estado: "000",
      mensaje: "Nombre de red actualizado",
      ssid: finalSSID,
      nombreResp: respNombre?.data ?? respNombre,
      refrescoResp: respRefres?.data ?? respRefres,
      ticket,
    };
  } catch (error) {
    if (error.response) {
      return { estado: "001", mensaje: error.response.data || error.message, status: error.response.status };
    }
    if (error.request) {
      return { estado: "001", mensaje: "No se pudo conectar con el servidor externo" };
    }
    return { estado: "001", mensaje: error?.message || "Error interno" };
  }
};

// Cambia la visibilidad del SSID (mostrar/ocultar) y refresca estado automáticamente
const CambiarVisibilidadSSID = async ({ info, visible }, cfg) => {
  const ENV = (cfg);
  try {
    if (!info) return { estado: "error", mensaje: "info es requerido" };

    const hostAcs = ENV?.HOST_ACS;
    const tokenAcs = ENV?.TOKEN_SMARTOLT;
    if (!hostAcs) return { estado: "error", mensaje: "HOST_ACS no configurado" };
    if (!tokenAcs) return { estado: "error", mensaje: "TOKEN_SMARTOLT no configurado" };

    const urlDevices = `${hostAcs}/devices/?query=${encodeURIComponent(JSON.stringify({ _id: String(info) }))}&projection=${encodeURIComponent("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSIDAdvertisementEnabled")}`;
    const urlChange = `${hostAcs}/devices/${info}/tasks`;
    const urlRefresh = `${hostAcs}/devices/${info}/tasks?connection_request`;

    const requestConfig = {
      headers: {
        "Content-Type": "application/json",
        "X-Token": String(tokenAcs),
      },
      timeout: 15000,
    };

    // 1) Leer visibilidad actual del equipo
    const { data: devData } = await axios.get(urlDevices, requestConfig);
    let root = null;
    if (Array.isArray(devData)) {
      const first = devData[0];
      if (Array.isArray(first) && first.length && typeof first[0] === "object") {
        root = first[0];
      } else if (typeof first === "object") {
        root = first;
      }
    } else if (typeof devData === "object" && devData) {
      root = devData;
    }

    const actualVisible = Boolean(
      root?.InternetGatewayDevice?.LANDevice?.["1"]?.WLANConfiguration?.["1"]?.SSIDAdvertisementEnabled?._value
    );

    // 2) Determinar nuevo estado (usa `visible` si viene; si no, alterna)
    const nuevoVisible = typeof visible === "boolean" ? visible : !actualVisible;

    // Validación de IP (dejar comentada por ahora)
    // const clientIP = "";
    // const cleanedIP = String(clientIP).replace(/\./g, "");
    // const allowedFragment = "45224";
    // if (!cleanedIP.startsWith(allowedFragment)) {
    //   return { estado: "001", mensaje: "IP no autorizada", ip: clientIP };
    // }

    // 3) Cambiar visibilidad (equivalente a changessi)
    const cambioResp = await axios.post(
      urlChange,
      {
        name: "setParameterValues",
        parameterValues: [
          [
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.SSIDAdvertisementEnabled",
            String(nuevoVisible),
            "xsd:boolean",
          ],
        ],
      },
      requestConfig
    );

    // 4) Refrescar estado (equivalente a refres2)
    const refrescoResp = await axios.post(
      urlRefresh,
      {
        name: "refreshObject",
        objectName: "InternetGatewayDevice.LANDevice.1.WLANConfiguration.*.SSIDAdvertisementEnabled",
      },
      requestConfig
    );

    // 5) Verificar estado actualizado y devolver info util
    const { data: verData } = await axios.get(urlDevices, requestConfig);
    let verRoot = null;
    if (Array.isArray(verData)) {
      const first = verData[0];
      if (Array.isArray(first) && first.length && typeof first[0] === "object") {
        verRoot = first[0];
      } else if (typeof first === "object") {
        verRoot = first;
      }
    } else if (typeof verData === "object" && verData) {
      verRoot = verData;
    }

    const actualizadoVisible = Boolean(
      verRoot?.InternetGatewayDevice?.LANDevice?.["1"]?.WLANConfiguration?.["1"]?.SSIDAdvertisementEnabled?._value
    );

    let nombresTexto = null;
    console.log("Cambio visibilidad SSID:", {
      actualVisible,
      nuevoVisible,
      actualizadoVisible,
      cambioResp: cambioResp?.data ?? cambioResp,
      refrescoResp: refrescoResp?.data ?? refrescoResp,
      _id: verRoot?._id || root?._id || null,
      nombresTexto,
    });

    return {
      estado: "000",
      anterior: actualVisible,
      solicitado: nuevoVisible,
      visible: actualizadoVisible,
      cambioResp: cambioResp?.data ?? cambioResp,
      refrescoResp: refrescoResp?.data ?? refrescoResp,
      _id: verRoot?._id || root?._id || null,
      nombresTexto,
    };
  } catch (error) {
    if (error.response) {
      return { estado: "001", mensaje: error.response.data || error.message, status: error.response.status };
    }
    if (error.request) {
      return { estado: "001", mensaje: "No se pudo conectar con el servidor externo" };
    }
    return { estado: "001", mensaje: error?.message || "Error interno" };
  }
};
module.exports = {
  GetRouters,
  get_onu_details,
  get_olt_pon_ports_details,
  get_onu_status,
  get_onu_signal,
  listarTicketsusuario,
  Newtickte,
  CrearTicketConCheck,
  DispositivosConectados,
  reiniciarequipo,
  Cambiarclave,
  CloseTicket,
  CambiarNombreSSID,
  CambiarVisibilidadSSID,
  resincronizacion,
};
