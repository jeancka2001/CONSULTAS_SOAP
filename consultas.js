const axios = require("axios");
const moment = require("moment");
const { guardarConciliacionPago } = require("./utils/conciliacion");
const { RxEquipos } = require("./acs/acs");
const { Console } = require("console");
require("dotenv").config();


// Helper: obtener entorno por tenant (cfg) con fallback al .env
// function envFrom(cfg) {
//   const c = cfg || {};
//   return {
//     HOST_CONSULTA: c.HOST_CONSULTA || process.env.HOST_CONSULTA,
//     HOST_SERV: c.HOST_SERV || process.env.HOST_SERV,
//     HOST_OLLA: c.HOST_OLLA || process.env.HOST_OLLA,
//     TOKEN: c.TOKEN || process.env.TOKEN,
//     TOKEN_PREREGISTRO: c.TOKEN_PREREGISTRO || process.env.TOKEN_PREREGISTRO,
//     TICKETS_CREATE_URL: c.TICKETS_CREATE_URL || process.env.TICKETS_CREATE_URL,
//   };
// }


// 1) Helper para parsear el string serializado de PHP: a:17:{s:"key";s:"value";...}
function parseSmartOlt(serialized) {
  if (!serialized || typeof serialized !== "string") return {};
  const out = {};
  const re = /s:\d+:"([^"]+)";s:\d+:"([^"]*)"/g; // key, value
  let m;
  while ((m = re.exec(serialized)) !== null) {
    out[m[1]] = m[2];
  }
  return out;
}

// const Dely = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ConsultarNombreCliente = async (cedula, tokenSystema, cfg) => {
  const ENV = (cfg);

  try {
    var info = {};
    const { data, status } = await axios.post(
      `${ENV.HOST_CONSULTA}GetClientsDetails`,
      {
        cedula: cedula,
        token: tokenSystema ||`${ENV.TOKEN}`,
      }
    );
    
    if (data.estado !== "exito") return null;
    
    // ⚠️ CORRECCIÓN CRÍTICA: Seleccionar servicio CON SmartOLT
    let servicioSeleccionado = null;
    
    // Buscar el primer servicio que tenga datos de SmartOLT
    for (const servicio of data.datos[0].servicios) {
      if (servicio.smartolt && servicio.smartolt !== '' && servicio.smartolt !== 'a:0:{}') {
        servicioSeleccionado = servicio;
        break;
      }
    }
    
    // Si no hay ninguno con SmartOLT, tomar el primero
    if (!servicioSeleccionado && data.datos[0].servicios.length > 0) {
      servicioSeleccionado = data.datos[0].servicios[0];
    }
    
    if (!servicioSeleccionado) {
      console.error("❌ No hay servicios disponibles para el cliente");
      return null;
    }
    
    const parsed = parseSmartOlt(servicioSeleccionado.smartolt);

    // Extraer id_externo_onu siempre desde el servicio (priorizar valores largos/no-numéricos).
    const clienteRaw = data.datos[0] || {};

    const isShortNumeric = (s) => {
      if (!s) return false;
      return /^\d{1,6}$/.test(String(s).trim());
    };

    const isLongCandidate = (s) => {
      if (!s) return false;
      const str = String(s).trim();
      // Requerir que tenga al menos una de las señales fuertes de ser un ID largo:
      // - contiene %252D (doble-encoded hyphen)
      // - contiene al menos two hyphens and length > 12 (ej: ABC-DEF-GHI...)
      // - contiene a mix of letters/numbers and hyphen and length > 12
      if (str.includes('%252D')) return true;
      const hyphenCount = (str.match(/-/g) || []).length;
      if (hyphenCount >= 2 && str.length > 12) return true;
      if (/[A-Za-z0-9].*-.*/.test(str) && str.length > 12) return true;
      return false;
    };

    let candidatoIdExterno = "";

    // Priorizar: servicio seleccionado -> sus `personalizados` -> su `smartolt` -> otros servicios
    const serviciosArr = Array.isArray(data.datos[0].servicios) ? data.datos[0].servicios : [];

    const checkPersonalizados = (servicio, clienteNombre) => {
      const raw = servicio.personalizados;
      if (!raw) return null;
      try {
        const parsedCustom = JSON.parse(raw);
        for (const k of Object.keys(parsedCustom)) {
          const val = parsedCustom[k];
          if (!val) continue;
          const s = String(val).trim();
          // Evitar capturar el nombre del cliente u otros textos simples
          if (clienteNombre && s === String(clienteNombre).trim()) continue;
          if (isLongCandidate(s)) return s; // mantener crudo, p.e. contains %252D
        }
      } catch (e) {
        const s = String(raw).trim();
        if (clienteNombre && s === String(clienteNombre).trim()) return null;
        if (isLongCandidate(s)) return s;
      }
      return null;
    };

    // Búsqueda explícita por patrón dentro de la cadena raw (si JSON.parse no lo extrae)
    const explicitRegexSearchInPersonalizados = () => {
      const re = /[A-Za-z0-9\-]+%252D[A-Za-z0-9\-]+/g; // e.g. 74FECE-XC220%252DG3-74FECE446000
      for (const servicio of serviciosArr) {
        const raw = servicio.personalizados;
        if (!raw) continue;
        const match = String(raw).match(re);
        if (match && match.length > 0) return match[0];
      }
      return null;
    };

    // 1) servicio seleccionado
    if (servicioSeleccionado) {
      const fromPersonal = checkPersonalizados(servicioSeleccionado, data.datos[0].nombre);
      if (fromPersonal) {
        candidatoIdExterno = fromPersonal;
        console.log('Seleccionado desde personalizados del servicio seleccionado:', candidatoIdExterno);
      }
      if (!candidatoIdExterno) {
        if (parsed && parsed.onu_external_id && isLongCandidate(parsed.onu_external_id)) {
          candidatoIdExterno = String(parsed.onu_external_id);
        }
      }
    }

    // 2) buscar en otros servicios
    if (!candidatoIdExterno) {
      for (const servicio of serviciosArr) {
        const fromPersonal = checkPersonalizados(servicio, data.datos[0].nombre);
        if (fromPersonal) {
          candidatoIdExterno = fromPersonal;
          console.log('Seleccionado desde personalizados en otros servicios:', candidatoIdExterno);
          break;
        }
        const p = parseSmartOlt(servicio.smartolt);
        if (p && p.onu_external_id && isLongCandidate(p.onu_external_id)) {
          candidatoIdExterno = String(p.onu_external_id);
          break;
        }
      }
    }

    // 3) fallback: si no encontramos id largo, usar cualquier campo existente (smartolt or root)
    if (!candidatoIdExterno) {
      if (parsed && parsed.onu_external_id) candidatoIdExterno = String(parsed.onu_external_id);
      else if (clienteRaw.ID_EXTERNO_ONU) candidatoIdExterno = String(clienteRaw.ID_EXTERNO_ONU);
    }

    // Si aún no encontramos un id largo, intentar búsqueda explícita en raw personalizados
    if ((!candidatoIdExterno || isShortNumeric(candidatoIdExterno)) ) {
      const explicit = explicitRegexSearchInPersonalizados();
      if (explicit) {
        candidatoIdExterno = explicit;
        console.log('Encontrado id_externo_onu en personalizados (regex):', explicit);
      }
    }

    console.log('Fuente id_externo_onu seleccionada:', candidatoIdExterno ? 'servicio/personalizados/smartolt/root' : 'ninguna', candidatoIdExterno);
    // Nuevo comportamiento:
    // - id_externo_onu: id del servicio seleccionado
    // - id_externo_onu_root: external onu resuelto por búsqueda (con fallback al root original)
    const id_externo_onu_root = candidatoIdExterno || clienteRaw.ID_EXTERNO_ONU || "";
    
    // Crear array de servicios con SmartOLT primero
    const servicios = data.datos[0].servicios.map((servicio) => {
      const parsedServ = parseSmartOlt(servicio.smartolt);
      
      return {
        id: servicio.id,
        idPerfil: servicio.idPerfil,
        nodo: servicio.nodo,
        costo: servicio.costo,
        ipap: servicio.ipap,
        mac: servicio.mac,
        ip: servicio.ip,
        direccion: servicio.direccion,
        smartolt: servicio.smartolt,

        // nuevos campos desde smartolt
        olt_id: parsedServ.olt_id ?? null,
        board: parsedServ.board ?? null,
        port: parsedServ.port ?? null,
        onu_external_id: parsedServ.onu_external_id ?? null,
        onu_type_id: parsedServ.onu_type_id ?? null,
        onu_type: parsedServ.onu_type ?? null,
        pon_type: parsedServ.pon_type ?? null,
        zone: parsedServ.zone ?? null,
        vlan: parsedServ.vlan ?? null,
        sn: parsedServ.sn ?? null,

        perfil: servicio.perfil,
      };
    });
    
    // Ordenar: servicios CON SmartOLT primero
    servicios.sort((a, b) => {
      if (a.olt_id && !b.olt_id) return -1;
      if (!a.olt_id && b.olt_id) return 1;
      return 0;
    });

    info = {
      idCliente: data.datos[0].id,
      nombre: data.datos[0].nombre,
      correo: data.datos[0].correo,
      facturacion: data.datos[0].facturacion,
      estado: data.datos[0].estado,
      movil: data.datos[0].movil,
      perfil: servicioSeleccionado.perfil, // ⚠️ Usar del servicio seleccionado
      numeroFacturas: data.datos[0].facturacion.facturas_nopagadas,
      totalFacturaNopagadas: data.datos[0].facturacion.total_facturas,
      id_externo_onu: servicioSeleccionado.id || "",
      id_externo_onu_root: data.datos[0].ID_EXTERNO_ONU,
      id_externo_antena: data.datos[0].ID_EXTERNO_ANTENA || "",
      feccha_suspencion: data.datos[0].fecha_suspendido || "",
      direccion_principal: data.datos[0].direccion_principal || "",
      servicio_smartolt: { // Agregar objeto con datos para /soporte
        onu_external_id: parsed.onu_external_id || null,
        ideservicio: servicioSeleccionado.id || null,
        olt_id: parsed.olt_id || null,
        board: parsed.board || null,
        port: parsed.port || null,
        nodo: servicioSeleccionado.nodo || null 
        
      },
      
      servicios,
      nodo: servicios, // Array ordenado
      totalFacturas: 0,
      totalCobros: 0,
      infoNodo: {}
    };
    console.log("id_externo_onu_root: ", id_externo_onu_root)
      console.log("Servicio seleccionado para SmartOLT: ", servicioSeleccionado.smartolt);
      console.log("Solicitando RxEquipos para IdExterno:", id_externo_onu_root, cfg);
      if (id_externo_onu_root !== "") {
        await RxEquipos(id_externo_onu_root, cfg);
      }
    const detallesAcumulados = [];
    let totalCobros = 0;
    let totalFacturas = 0;

    for (let i = 0; i < data.datos.length; i++) {
      const cliente = data.datos[i];

      const facturas = await FacturaNOPagadas(cliente.id, tokenSystema, ENV);
      if (!facturas) continue;

      // tambien se recorre el array de facturas
      for (let j = 0; j < facturas.length; j++) {
        const factura = facturas[j];
        if (!factura) continue;

        const detalles = await DetallesFactura(
          factura.idfactura,
          cliente.direccion_principal,
          tokenSystema,
          ENV
        );
        if (!detalles) continue;

        detalles.forEach((item) => {
          const valor = parseFloat(item.ItemsConsulta?.Valor_Cobro || 0);
          totalCobros += valor;
          detallesAcumulados.push(item);
        });
      }

      totalFacturas += cliente.facturacion?.facturas_nopagadas || 0;
    }

    if (detallesAcumulados.length > 0) {
      const totalCobro = detallesAcumulados.reduce(
        (sum, item) => sum + parseFloat(item.ItemsConsulta?.Valor_Cobro || 0),
        0
      );
      //ordenar por fecha maxima de cobro 20250823, 20250723 ascendente
      detallesAcumulados.sort((a, b) => {
        return (
          parseInt(a.ItemsConsulta.Fecha_Maxima_Cobro) -
          parseInt(b.ItemsConsulta.Fecha_Maxima_Cobro)
        );
      });
    
      info.detalles = detallesAcumulados;
      info.totalCobros = totalCobro.toFixed(2);
    } else {
      info.detalles = [];
      info.totalCobros = "0.00";
    }
    info.totalFacturas = totalFacturas;
    // info.infoNodo = await EstadoNodo(info.nodo[0].nodo, tokenSystema);
    info.infoNodo = await EstadoNodo(servicioSeleccionado.nodo, tokenSystema, ENV);
    // await Dely(1000)

    return info;
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      return null;
    } else {
      console.log(error);
      return null;
    }
  }
};


const consultarGetClientsDetails = async (cedula, tokenSystema, cfg) => {
  const ENV = (cfg);
  try {
    const { data, status } = await axios.post(
      `${ENV.HOST_CONSULTA}GetClientsDetails`,
        {
          cedula: cedula,
          token: tokenSystema || `${ENV.TOKEN}`,
        }
    );
    console.log(`${ENV.HOST_CONSULTA}GetClientsDetails`);
    console.log("status consulta cliente: ", status);
    console.log("cfg consulta cliente: ", data);
    if (data.estado === "exito") {
      const clienteRaw = data.datos[0] || {};
// Extraer el primer seervicio en formato json 
      const servicios = clienteRaw.servicios[0]
      const servicios2 =clienteRaw.servicios[1]

      // Parsear smartolt y personalizados en cada servicio (si existe)
      const serviciosParsed = (Array.isArray(clienteRaw.servicios) ? clienteRaw.servicios : []).map((srv) => {
        const parsed = parseSmartOlt(srv.smartolt);
        
        // Parsear personalizados (JSON string)
        let personalizados_parsed = {};
        if (srv.personalizados) {
          try {
            personalizados_parsed = JSON.parse(srv.personalizados);
          } catch (e) {
            console.warn("Error parseando personalizados:", e.message);
            personalizados_parsed = {};
          }
        }
        
        return {
          ...srv,
          smartolt_parsed: parsed,
          personalizados_parsed: personalizados_parsed,
        };
      });
      // Obtener estado del nodo usando la función EstadoNodo (async)
      const GetRoutersconsulte = await EstadoNodo(serviciosParsed[0]?.nodo, tokenSystema, ENV);
      const nombreNodo = GetRoutersconsulte?.nombrenodo || "";
      const estadoNodo = GetRoutersconsulte?.nodoconectado || "";
      // Seleccionar el smartolt parseado principal (primero con contenido, si existe)
      let primary = serviciosParsed.find((s) => s.smartolt_parsed && Object.keys(s.smartolt_parsed).length > 0);
      if (!primary) primary = serviciosParsed[0] || null;

      const parsed_smartolt = primary ? (primary.smartolt_parsed || {}) : {};
      const parsed_personalizados = primary ? (primary.personalizados_parsed || {}) : {};

      const cliente = {
        ...clienteRaw,
        servicios,
        parsed_smartolt,
        parsed_personalizados,
        GetRoutersconsulte,
        nombreNodo,
        estadoNodo
      };

      // Estado de la consulta para el cliente
      cliente.Mensaje_Respuesta = "Consulta exitosa";

      console.log("cliente parsed_smartolt: ", JSON.stringify(parsed_smartolt));
      console.log("cliente parsed_personalizados: ", JSON.stringify(parsed_personalizados));

      return cliente;
    } else {
      // Normalizar respuesta cuando no se encuentra el cliente
      return { Mensaje_Respuesta: "Cliente no encontrado" };
    }
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      return { Mensaje_Respuesta: "Cliente no encontrado" };
    } else {
      console.log(error);
      return { Mensaje_Respuesta: "Cliente no encontrado" };
    }

  }
};

const consultarGetClientsDetailsAllServices = async (cedula, tokenSystema, cfg) => {
  const ENV = (cfg);
  try {
    const { data, status } = await axios.post(
      `${ENV.HOST_CONSULTA}GetClientsDetails`,
      {
        cedula: cedula,
        token: tokenSystema || `${ENV.TOKEN}`,
      }
    );
    console.log(`${ENV.HOST_CONSULTA}GetClientsDetails`);
    console.log("status consulta cliente (all services): ", status);
    console.log("cfg consulta cliente (all services): ", data);

    if (data.estado === "exito") {
      const clienteRaw = data.datos[0] || {};

      const serviciosParsed = (Array.isArray(clienteRaw.servicios) ? clienteRaw.servicios : []).map((srv) => {
        const parsed = parseSmartOlt(srv.smartolt);

        let personalizados_parsed = {};
        if (srv.personalizados) {
          try {
            personalizados_parsed = JSON.parse(srv.personalizados);
          } catch (e) {
            console.warn("Error parseando personalizados:", e.message);
            personalizados_parsed = {};
          }
        }

        return {
          ...srv,
          smartolt_parsed: parsed,
          personalizados_parsed,
        };
      });

      const serviciosConNodo = await Promise.all(
        serviciosParsed.map(async (srv) => {
          const GetRoutersconsulte = await EstadoNodo(srv.nodo, tokenSystema, ENV);
          return {
            ...srv,
            GetRoutersconsulte,
            nombreNodo: GetRoutersconsulte?.nombrenodo || "",
            estadoNodo: GetRoutersconsulte?.nodoconectado || "",
          };
        })
      );

      const cliente = {
        ...clienteRaw,
        servicios: serviciosConNodo,
        total_servicios: serviciosConNodo.length,
      };

      cliente.Mensaje_Respuesta = "Consulta exitosa";

      return cliente;
    }

    return { Mensaje_Respuesta: "Cliente no encontrado" };
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      return { Mensaje_Respuesta: "Cliente no encontrado" };
    }

    console.log(error);
    return { Mensaje_Respuesta: "Cliente no encontrado" };
  }
};

const ConsultarSSID = async (idExternoOnu, cfg) => {
  const ENV = (cfg);
  try {
    if (!idExternoOnu) {
      return { Mensaje_Respuesta: "ID_EXTERNO_ONU es requerido", ssid: null };
    }

    const hostAcs = ENV?.HOST_ACS;
    if (!hostAcs) {
      return { Mensaje_Respuesta: "HOST_ACS no configurado", ssid: null };
    }
    const url = `${hostAcs}/devices/?projection=InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID._value&query={"_id": "${idExternoOnu}"}`;

    console.log("URL consulta SSID:", url);
    const { data } = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        ...(ENV?.TOKEN_SMARTOLT ? { "X-Token": String(ENV.TOKEN_SMARTOLT) } : {}),
      },
      timeout: 15000,
    });

    console.log("data consulta SSID:", JSON.stringify(data));
    const ssidValue = Array.isArray(data)
      ? data[0]?.InternetGatewayDevice?.LANDevice?.["1"]?.WLANConfiguration?.["1"]?.SSID?._value
      : null;

      nombressid= ssidValue;
    SSID={
      SSID: ssidValue || null,
    }

    if (ssidValue) {
      return SSID;
    }

    return null;
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      return {
        Mensaje_Respuesta: "Error al consultar SSID",
        detalle: error.response.data,
        ssid: null,
      };
    }
    console.log(error);
    return {
      Mensaje_Respuesta: "Error interno al consultar SSID",
      detalle: error.message || null,
      ssid: null,
    };
  }
};

const oltPortsCache = new Map();

const delayMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetrySmartolt = (error) => {
  const status = error?.response?.status;
  if (!status) return true;
  return [408, 429, 500, 502, 503, 504].includes(status);
};

async function getOltPortsWithRetry(url, headers, options = {}) {
  const timeoutMs = Number(options.timeoutMs || 20000);
  const maxRetries = Number(options.maxRetries || 2);
  const retryDelayMs = Number(options.retryDelayMs || 700);

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers,
        timeout: timeoutMs,
      });
      return response;
    } catch (error) {
      lastError = error;
      if (!shouldRetrySmartolt(error) || attempt === maxRetries) break;
      await delayMs(retryDelayMs * (attempt + 1));
    }
  }

  throw lastError;
}

const consultargetdetalleolt = async (olt_id, nap, board, pon_port, cfg, options = {}) => {
  const ENV = (cfg);
  const startedAt = Date.now();
  const baseUrl = String(ENV?.HOST_SMARTOLT_SYSTEM || "").replace(/\/+$/, "");
  const tokenSmartolt = String(ENV?.TOKEN_SMARTOLT || "").trim();
  const timeoutMs = Number(ENV?.SMARTOLT_TIMEOUT_MS || 20000);
  const maxRetries = Number(ENV?.SMARTOLT_RETRIES || 2);
  const cacheTtlMs = Number(ENV?.SMARTOLT_CACHE_TTL_MS || 45000);
  const cacheMaxStaleMs = Number(ENV?.SMARTOLT_CACHE_MAX_STALE_MS || 300000);
  const cacheStrategy = String(ENV?.SMARTOLT_CACHE_STRATEGY || "fallback").toLowerCase();
  const forceRefresh = Boolean(options?.forceRefresh);
  const cacheKey = String(olt_id);
  const bStr = String(board);
  const pStr = String(pon_port);

  const elapsed = () => Date.now() - startedAt;
  const toOperational = (raw) => {
    const text = String(raw || "").toLowerCase();
    if (text.includes("down")) return "down";
    if (text.includes("up")) return "up";
    return "desconocido";
  };
  const findPort = (list) =>
    (Array.isArray(list) ? list : []).find(
      (item) => String(item.board) === bStr && String(item.pon_port) === pStr
    );
  const withMeta = (extra = {}) => ({
    board: bStr,
    pon_port: pStr,
    cache_strategy: cacheStrategy,
    force_refresh: forceRefresh,
    tiempo_ms: elapsed(),
    ...extra,
  });

  if (!baseUrl) {
    return {
      Mensaje_Respuesta: "HOST_SMARTOLT_SYSTEM no configurado",
      estado: "error_configuracion",
      operational_status: "desconocido",
    };
  }

  if (!tokenSmartolt) {
    return {
      Mensaje_Respuesta: "TOKEN_SMARTOLT no configurado",
      estado: "error_configuracion",
      operational_status: "desconocido",
    };
  }

  const url = `${baseUrl}/get_olt_pon_ports_details/${olt_id}`;
  const now = Date.now();
  const cached = oltPortsCache.get(cacheKey);
  const cacheAgeMs = cached ? now - cached.ts : null;
  const allowWarmCache = cacheStrategy === "prefer_cache" && !forceRefresh;

  try {
    let data;
    let cacheHit = false;

    if (allowWarmCache && cached && cacheAgeMs <= cacheTtlMs) {
      data = cached.data;
      cacheHit = true;
    } else {
      console.log("Consultando SmartOLT:", url, "timeout:", timeoutMs, "retries:", maxRetries);
      const response = await getOltPortsWithRetry(
        url,
        {
          "X-Token": tokenSmartolt,
          "Content-Type": "application/json",
        },
        { timeoutMs, maxRetries }
      );
      data = response.data;
      oltPortsCache.set(cacheKey, { ts: now, data });
    }

    const list = Array.isArray(data?.response) ? data.response : [];
    const match = findPort(list);

    console.log(
      "detalle olt ->",
      "olt_id:",
      olt_id,
      "board:",
      bStr,
      "pon_port:",
      pStr,
      "items:",
      list.length,
      "cache_hit:",
      cacheHit,
      "cache_strategy:",
      cacheStrategy,
      "force_refresh:",
      forceRefresh
    );

    if (!match) {
      return {
        Mensaje_Respuesta: "No encontrado",
        estado: "no_encontrado",
        operational_status: "desconocido",
        total_items: list.length,
        cache_hit: cacheHit,
        detalle: null,
        ...withMeta(),
      };
    }

    const operationalRaw = String(match.operational_status || "");
    return {
      Mensaje_Respuesta: "Consulta exitosa",
      estado: "exito",
      operational_status: toOperational(operationalRaw),
      operational_status_raw: operationalRaw,
      total_items: list.length,
      cache_hit: cacheHit,
      ...withMeta(),
    };
  } catch (error) {
    const staleAgeMs = cached ? Date.now() - cached.ts : null;
    const canUseStaleCache =
      cached?.data?.response &&
      !forceRefresh &&
      staleAgeMs != null &&
      staleAgeMs <= cacheMaxStaleMs;

    if (canUseStaleCache) {
      const list = Array.isArray(cached.data.response) ? cached.data.response : [];
      const match = findPort(list);
      if (match) {
        const operationalRaw = String(match.operational_status || "");
        return {
          Mensaje_Respuesta: "Consulta desde cache por timeout/fallo en SmartOLT",
          estado: "exito_cache",
          operational_status: toOperational(operationalRaw),
          operational_status_raw: operationalRaw,
          total_items: list.length,
          cache_hit: true,
          cache_age_ms: staleAgeMs,
          ...withMeta(),
        };
      }
    }

    const status = error?.response?.status || null;
    const isTimeout = /timeout/i.test(String(error?.message || ""));
    console.error(
      "Error en consultargetdetalleolt:",
      "status:",
      status,
      "mensaje:",
      error?.message,
      "detalle:",
      error?.response?.data || null
    );

    return {
      Mensaje_Respuesta: isTimeout
        ? "Timeout en SmartOLT al consultar puertos OLT"
        : "Error interno en SmartOLT",
      estado: isTimeout ? "timeout" : "error",
      operational_status: "desconocido",
      cache_hit: false,
      error: error?.response?.data || error?.message || null,
      status,
      ...withMeta(),
    };
  }
};

const guardarnap= async (nap, cfg) => {
  const ENV = (cfg);
  try {
    const url = `${ENV.HOST_SMARTOLT_SYSTEM}guardar_nap`;
    console.log(`Guardando NAP en ${ENV.HOST_SMARTOLT_SYSTEM}guardar_nap`);
    const payload = {
      nap: nap,
    };
    console.log("Payload guardarnap: ", JSON.stringify(payload));
    const { data } = await axios.post(url, payload, {

      headers: {
        'X-Token': String(ENV.TOKEN_SMARTOLT),
        'Content-Type': 'application/json',
      },
    });
    console.log("data guardarnap: ", JSON.stringify(data));
    if (data?.estado === 'exito') {
      return { Mensaje_Respuesta: 'NAP guardado exitosamente' };
    } else {
      return { Mensaje_Respuesta: 'Error al guardar NAP', detalle: data };
    }
  } catch (error) {
    console.error('Error en guardarnap:', error?.response?.data || error?.message || error);
    return { Mensaje_Respuesta: 'Error interno en SmartOLT', error: error?.response?.data || error?.message || null };
  }
};

const consultaGetInvoices = async (idcliente, cfg) => {
  const ENV = (cfg);
  console.log("env consultaGetInvoices: ", ENV);
  try {
    // 1) Obtener lista de facturas no pagadas
    const { data } = await axios.post(
      `${ENV.HOST_CONSULTA}GetInvoices`,
      {
        token: `${ENV.TOKEN}`,
        limit: 10,
        pagina: 1,
        idcliente: idcliente,
        estado: "1",
      }
    );
    console.log("data consulta facturas (GetInvoices): ", JSON.stringify(data));

    if (data.estado !== "exito") {
      return { estado: data.estado, mensaje: data.mensaje || "No existe ninguna factura." };
    }

    if (!data.facturas || data.facturas.length === 0) {
      return { estado: "error", mensaje: "No existe ninguna factura." };
    }

    const facturaResumen = data.facturas[data.facturas.length - 1];

    // 2) Obtener detalles completos de esa factura
    const { data: dataDetalle } = await axios.post(
      `${ENV.HOST_CONSULTA}GetInvoice`,
      {
        token: `${ENV.TOKEN}`,
        idfactura: facturaResumen.id,
      }
    );
    console.log("data consulta detalle factura (GetInvoice): ", JSON.stringify(dataDetalle));

    const factura = dataDetalle?.factura || {};
    const items = Array.isArray(dataDetalle?.items) ? dataDetalle.items : [];
    const item = items.length > 0 ? items[0] : {};
    const itemDescripcion = items
      .map((detalle) => String(detalle?.descrp || "").trim())
      .filter(Boolean);

    const itemDescripcionTexto = itemDescripcion
      .map((descripcion, index) => `Item ${index + 1}: ${descripcion}`)
      .join("\n\n");

    const fechaSuspensionRaw =
      itemDescripcion
        .map((descripcion) => {
          const match = descripcion.match(
            /(?:Fecha de Suspensi[oó]n|Fecha del corte anterior)\s*:\s*([^\r\n]+)/i
          );
          return match?.[1]?.trim() || null;
        })
        .find(Boolean) || null;

    const fechaSuspension = fechaSuspensionRaw
      ? moment(fechaSuspensionRaw, "DD/MM/YYYY", true).isValid()
        ? moment(fechaSuspensionRaw, "DD/MM/YYYY", true).format("YYYY-MM-DD")
        : fechaSuspensionRaw
      : null;

    let urlpdf = factura.urlpdf;
    const acortadorBase = ENV?.ACORTADOR;
    const tokenAcortador = ENV?.TOKEN_ACORTADOR;
    const tokenAPublic = ENV?.TOKEN_A_PUBLIC;

    if (urlpdf && acortadorBase && tokenAcortador && tokenAPublic) {
      try {
        const { data: shortData } = await axios.post(
          acortadorBase,
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
      } catch (e) {
        console.warn("No se pudo acortar la URL de la factura:", e?.message || e);
      }
    }
    const facturaNopagadas = {
      // Datos del resumen (GetInvoices)
      id_factura:           facturaResumen.id,
      emitido_factura:      facturaResumen.emitido,
      vencimiento_factura:  facturaResumen.vencimiento,
      estado_factura:       facturaResumen.estado,
      total_factura:        String(facturaResumen.total || "").replace("$ ", ""),
      saldo_factura:        String(facturaResumen.saldo || "").replace("$ ", ""),
      subtotal_factura:     String(facturaResumen.subtotal || "").replace("$ ", ""),
      impuesto_factura:     String(facturaResumen.impuesto || "").replace("$ ", ""),
      cobrado_factura:      String(facturaResumen.cobrado || "").replace("$ ", ""),
      fechapago_factura:    facturaResumen.fechapago || "",

      // Datos extra del detalle (GetInvoice)
      urlpdf:               urlpdf || "",
      estado_detalle:       factura.estado || "",
      fecha_suspension:     fechaSuspension,

      // Descripciones completas de los items de la factura en texto plano
      item_descripcion:     itemDescripcionTexto,
      item_unidades:        item.unidades ?? null,
      item_precio:          String(item.precio || "").replace("$ ", ""),
      item_impuesto:        String(item.imp || "").replace("$ ", ""),
      item_total:           item.total != null ? parseFloat(item.total).toFixed(2) : "0.00",
    };

    return facturaNopagadas;
  } catch (error) {
    if (error.response) {
      return { Mensaje_Respuesta: 'Error al consultar facturas', detalle: error.response.data };
    } else {
      console.log(error);
      return { Mensaje_Respuesta: 'Error interno al consultar la factura', error: error?.message || null };
    }
  }
}

const pagarfacturaPaidInvoice = async (idfactura, pasarela, cantidad, idtransaccion, nota, cfg) => {
  const ENV = (cfg);
  try {
    console.log("RealizarPago");
    console.log(`${ENV.HOST_CONSULTA}PaidInvoice`);
    const { data } = await axios.post(`${ENV.HOST_CONSULTA}PaidInvoice`, {
      token: `${ENV.TOKEN_PAGO_SPEED}`,
      idfactura: idfactura,
      pasarela: pasarela,
      cantidad: cantidad,
      idtransaccion: idtransaccion,
      fecha: moment().format("YYYYMMDDHHmmss"),
      nota: nota,
    });
    console.log("data: ", data);

    if (data.estado === "exito") {
      return { Mensaje_Respuesta: 'Pago realizado con éxito', detalle: data };
    } else {
      return { Mensaje_Respuesta: 'Error al pagar facturas', detalle: data };
    }
  } catch (error) {
    console.log("Error: ", error);
    if (error.response) {
      return { Mensaje_Respuesta: 'Error en el servicio pagar facturas', detalle: error.response.data };
    } else {
      console.log(error);
      return { Mensaje_Respuesta: 'Error en el servicio pagar facturas', detalle: error.message || null };
    }
  }
};


// Helper: Decodificar HTML entities (&lt; → <, &gt; → >, etc.)
const decodeHtmlEntities = (text) => {
  if (!text || typeof text !== 'string') return text;
  const htmlMap = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&apos;': "'",
    '&#39;': "'",
    '&nbsp;': ' ',
    '&ntilde;': 'ñ',
    '&Ntilde;': 'Ñ',
    '&aacute;': 'á',
    '&eacute;': 'é',
    '&iacute;': 'í',
    '&oacute;': 'ó',
    '&uacute;': 'ú',
  };
  let decoded = text;
  for (const [entity, char] of Object.entries(htmlMap)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  return decoded;
};

const consultaListTicket = async (idcliente, cfg) => {
  const ENV = (cfg);
  try {
    const hostConsulta = ENV?.HOST_CONSULTA;
    console.log("HOST_CONSULTA para ListTicket: ", hostConsulta);
    if (!hostConsulta) {
      return {
        Mensaje_Respuesta: 'Error interno al consultar los tickets',
        error: 'HOST_CONSULTA no configurado',
      };
    }

    const urlListTicket = `${hostConsulta.replace(/\/+$/, '')}/ListTicket`;
    const { data } = await axios.post(
      urlListTicket,
      {
        token: `${ENV.TOKEN}`,
        idcliente: idcliente,
      }
    );
    
    if (data.estado === "exito") {
      const ticketsData = data.data || data;
      const tickets = ticketsData.tickets || [];

      const normalizeText = (v) =>
        String(v || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();

      const normalizeEstado = (v) => normalizeText(v).replace(/_/g, " ");
      const esSoporteTecnico = (ticket) => normalizeText(ticket?.dp) === "soporte tecnico";
      const ticketsSoporte = tickets.filter(esSoporteTecnico);

      const countEstado = (arr, estadoNormalizado) =>
        arr.filter((t) => normalizeEstado(t?.estado) === estadoNormalizado).length;

      // 1) Contar tickets SOLO del departamento Soporte técnico
      const conteo = {
        abiertos: countEstado(ticketsSoporte, "abierto"),
        cerrados: countEstado(ticketsSoporte, "cerrado"),
        respondidos: countEstado(ticketsSoporte, "respondido"),
        respuesta_cliente: countEstado(ticketsSoporte, "respuesta cliente"),
        total: ticketsSoporte.length
      };

      let estado_tickets = "cerrado";
      if (conteo.abiertos > 0) {
        estado_tickets = "abierto";
      } else if (conteo.respondidos > 0) {
        estado_tickets = "contestado";
      }

      // 2) Seleccionar el ultimo ticket de Soporte tecnico.
      // El servicio normalmente devuelve primero el mas reciente,
      // por eso se toma la posicion 0 del arreglo filtrado.
      const ticketSeleccionado = ticketsSoporte[0] || null;

      // 3) Si hay ticket seleccionado, procesarlo
      let ticketProcesado = null;
      if (ticketSeleccionado) {
        // 3a) Extraer mensajes: cliente (idtecnico=0) y soporte (idtecnico>0)
        const mensajes = ticketSeleccionado.mensajes || [];
        const mensajeCliente = mensajes.find(m => m.idtecnico === 0 || m.idtecnico === '0');
        const mensajesoporte = mensajes.find(m => (m.idtecnico && m.idtecnico > 0) || (m.idtecnico && m.idtecnico !== 0 && m.idtecnico !== '0'));

        // 3b) Proceso: construir ticket procesado
        ticketProcesado = {
          id_ticket: ticketSeleccionado.id,
          asunto: ticketSeleccionado.asunto?.trim() || '',
          estado: ticketSeleccionado.estado,
          solicitante: ticketSeleccionado.solicitante || '',
          fecha_creacion: ticketSeleccionado.fecha_soporte || '',
          fecha_cierre: ticketSeleccionado.fecha_cerrado || '',
          fecha_ultima_actualizacion: ticketSeleccionado.lastdate || '',
          departamento: ticketSeleccionado.dp || '',
          fechavisita: ticketSeleccionado.fechavisita || '',
          turno: (ticketSeleccionado.turno || '').trim(),
          agendado: ticketSeleccionado.agendado || '',
          motivo_cierre: ticketSeleccionado.motivo_cierre || '',
          
          // Información de mensajes
          mensaje_cliente_contenido: mensajeCliente 
            ? decodeHtmlEntities(mensajeCliente.contenido || '').trim()
            : '',
          mensaje_cliente_fecha: mensajeCliente ? mensajeCliente.fecha_hora || '' : '',
          
          mensaje_soporte_contenido: mensajesoporte
            ? decodeHtmlEntities(mensajesoporte.contenido || '').trim()
            : '',
          mensaje_soporte_fecha: mensajesoporte ? mensajesoporte.fecha_hora || '' : '',
          mensaje_soporte_tecnico_id: mensajesoporte ? mensajesoporte.idtecnico || null : null,
        };
      }

      // 4) Retornar respuesta consolidada
      return {
        Mensaje_Respuesta: 'Consulta exitosa',
        estado_tickets,
        conteo_tickets: conteo,
        info_ticket: ticketProcesado || null
      };
    } else {
      return {
        Mensaje_Respuesta: 'No hay tickets disponibles',
        conteo_tickets: { abiertos: 0, cerrados: 0, respondidos: 0, respuesta_cliente: 0, total: 0 },
        info_ticket: null
      };
    }
  } catch (error) {
    if (error.response) {
      return { Mensaje_Respuesta: 'Error al consultar tickets', detalle: error.response.data };
    } else {
      console.log(error);
      return { Mensaje_Respuesta: 'Error interno al consultar los tickets', error: error?.message || null };
    }
  }
};

const consultaAutosoporteConsecutivo = async (idcliente, dias, cantidadTickets, cfg) => {
  const ENV = cfg;
  try {
    const hostConsulta = ENV?.HOST_CONSULTA;
    if (!hostConsulta) {
      return {
        estado: false,
        Mensaje_Respuesta: "HOST_CONSULTA no configurado",
      };
    }

    const urlListTicket = `${hostConsulta.replace(/\/+$/, "")}/ListTicket`;
    const { data } = await axios.post(urlListTicket, {
      token: `${ENV.TOKEN}`,
      idcliente: idcliente,
    });

    if (data.estado !== "exito") {
      return {
        estado: false,
        Mensaje_Respuesta: "No se pudo consultar tickets",
        detalle: data,
      };
    }

    const ticketsData = data.data || data;
    const tickets = Array.isArray(ticketsData.tickets) ? ticketsData.tickets : [];

    const normalizeText = (v) =>
      String(v || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const esAutosoporte = (ticket) => normalizeText(ticket?.dp) === "autosoporte";
    const parseDateTime = (dateTime) => {
      const raw = String(dateTime || "").trim();
      if (!raw) return null;
      const d = new Date(raw.replace(" ", "T"));
      return Number.isNaN(d.getTime()) ? null : d;
    };
    const ticketsAutosoporte = tickets
      .filter(esAutosoporte)
      .sort((a, b) => {
        const fa = parseDateTime(a?.fecha_soporte);
        const fb = parseDateTime(b?.fecha_soporte);
        const ta = fa ? fa.getTime() : 0;
        const tb = fb ? fb.getTime() : 0;
        return tb - ta;
      });

    const parseDateOnly = (dateTime) => {
      const raw = String(dateTime || "").trim();
      const datePart = raw.includes(" ") ? raw.split(" ")[0] : raw;
      if (!datePart) return null;
      const d = new Date(`${datePart}T00:00:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const ultimosTickets = ticketsAutosoporte.slice(0, cantidadTickets);
    const ticketsSuficientes = ultimosTickets.length === cantidadTickets;

    const fechas = ultimosTickets.map((t) => parseDateOnly(t?.fecha_soporte));
    let diasConsecutivos = ticketsSuficientes;

    if (ticketsSuficientes) {
      for (let i = 0; i < fechas.length - 1; i++) {
        const actual = fechas[i];
        const siguiente = fechas[i + 1];
        if (!actual || !siguiente) {
          diasConsecutivos = false;
          break;
        }
        const diffDias = Math.round((actual.getTime() - siguiente.getTime()) / 86400000);
        // Consecutivo sin saltos: puede ser el mismo dia (0) o el dia inmediato anterior (1).
        if (diffDias < 0 || diffDias > 1) {
          diasConsecutivos = false;
          break;
        }
      }
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const fechaMasReciente = fechas[0] || null;
    const fechaMasAntigua = fechas[fechas.length - 1] || null;

    const rangoDiasTickets =
      fechaMasReciente && fechaMasAntigua
        ? Math.round((fechaMasReciente.getTime() - fechaMasAntigua.getTime()) / 86400000) + 1
        : null;

    const diasDesdeUltimoTicket =
      fechaMasReciente
        ? Math.round((todayStart.getTime() - fechaMasReciente.getTime()) / 86400000)
        : null;

    const dentroDeDias =
      rangoDiasTickets != null &&
      diasDesdeUltimoTicket != null &&
      rangoDiasTickets <= dias &&
      diasDesdeUltimoTicket <= dias - 1;

    const cumple = ticketsSuficientes && diasConsecutivos && dentroDeDias;

    const contenidos = ultimosTickets.reduce((acc, t, index) => {
      const mensajes = Array.isArray(t.mensajes) ? t.mensajes : [];
      const mensajesNormalizados = mensajes.map((m) => ({
        fecha_hora: m?.fecha_hora || "",
        contenido: decodeHtmlEntities(m?.contenido || "").trim(),
      }));

      acc[`ticket_${index + 1}`] = {
        fecha_ticket: t.fecha_soporte || "",
        fecha_hora: mensajesNormalizados[0]?.fecha_hora || "",
        contenido: mensajesNormalizados
          .map((m) => m.contenido)
          .filter(Boolean)
          .join("\n\n"),
      };

      return acc;
    }, {});

    const ticketsDetalle = {
      fecha_ticket: ultimosTickets.map((t) => t.fecha_soporte || ""),
      contenidos,
    };

    return {
      estado: cumple,
      Mensaje_Respuesta: cumple
        ? "Cumple la condición de tickets consecutivos de Autosoporte"
        : "No cumple la condición de tickets consecutivos de Autosoporte",
      parametros: {
        idcliente,
        dias,
        cantidad_tickets: cantidadTickets,
      },
      validaciones: {
        tickets_suficientes: ticketsSuficientes,
        dias_consecutivos: diasConsecutivos,
        dentro_de_dias: dentroDeDias,
      },
      resumen: {
        total_tickets_autosoporte: ticketsAutosoporte.length,
        tickets_evaluados: ultimosTickets.length,
        rango_dias_tickets: rangoDiasTickets,
        dias_desde_ultimo_ticket: diasDesdeUltimoTicket,
      },
      rango_fechas: {
        desde: fechaMasAntigua ? fechaMasAntigua.toISOString().slice(0, 10) : null,
        hasta: fechaMasReciente ? fechaMasReciente.toISOString().slice(0, 10) : null,
      },
      tickets: ticketsDetalle,
    };
  } catch (error) {
    if (error.response) {
      return {
        estado: false,
        Mensaje_Respuesta: "Error al consultar tickets de Autosoporte",
        detalle: error.response.data,
      };
    }
    return {
      estado: false,
      Mensaje_Respuesta: "Error interno al consultar tickets de Autosoporte",
      error: error?.message || null,
    };
  }
};


const CreateInvoice = async (idcliente, vencimiento, tokenSystema, cfg) => {
  const ENV = (cfg);
  try {
    let vencimientoFinal = vencimiento;

    if (!vencimientoFinal) {
      const { data: facturasData } = await axios.post(
        `${ENV.HOST_CONSULTA}GetInvoices`,
        {
          token: tokenSystema || `${ENV.TOKEN}`,
          limit: 1,
          estado: 3,
          idcliente: idcliente,
        }
      );

      const facturaPagada = facturasData?.facturas?.[0] || null;
      const fechaVencimientoBase = facturaPagada?.vencimiento || null;

      if (!fechaVencimientoBase) {
        return {
          estado: "error",
          idfactura: null,
          mensaje:
            "No se encontró factura pagada con vencimiento para calcular la nueva factura",
        };
      }

      const fechaMoment = moment(fechaVencimientoBase, "YYYY-MM-DD", true);
      if (!fechaMoment.isValid()) {
        return {
          estado: "error",
          idfactura: null,
          mensaje: "Formato de vencimiento inválido en la factura pagada",
          vencimiento_base: fechaVencimientoBase,
        };
      }

      vencimientoFinal = fechaMoment.add(1, "month").format("YYYY-MM-DD");
      console.log("vencimiento base factura pagada:", fechaVencimientoBase);
      console.log("vencimiento calculado para CreateInvoice:", vencimientoFinal);
    }

    const { data } = await axios.post(
      `${ENV.HOST_CONSULTA}CreateInvoice`,
      {
        token: tokenSystema || `${ENV.TOKEN}`,
        idcliente: idcliente,
        vencimiento: vencimientoFinal,
      }
    );
    console.log("data crear factura CreateInvoice: ", JSON.stringify(data));
    if (data.estado === "exito") {
      return {
        estado: data.estado,
        idfactura: data.idfactura,
        mensaje: data.mensaje,
        vencimiento: vencimientoFinal,
      };
    } else {
      return {
        estado: data?.estado || "error",
        idfactura: data?.idfactura || null,
        mensaje: data?.mensaje || "No se pudo crear la factura",
        vencimiento: vencimientoFinal,
      };
    }
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      return {
        estado: "error",
        idfactura: null,
        mensaje: error?.response?.data?.mensaje || "Error al crear factura",
        detalle: error.response.data,
      };
    } else {
      console.log(error);
      return {
        estado: "error",
        idfactura: null,
        mensaje: error?.message || "Error interno al crear factura",
      };
    }
  }
};

const CreatePromesaPagoe = async (idfactura, fechalimite, descripcion, tokenSystema, cfg) => {
  const ENV = (cfg);
  try {
    const { data } = await axios.post(
      `${ENV.HOST_CONSULTA}PromesaPago`,
      {
        token: tokenSystema || `${ENV.TOKEN}`,
        idfactura: idfactura,
        fechalimite: fechalimite,
        descripcion: descripcion
      }
    );
    console.log("data crear promesa pago CreatePromesaPago: ", JSON.stringify(data));
    if (data.estado === "exito") {
      return {
        estado: data.estado,
        idpromesa: data.idpromesa,
        mensaje: data.mensaje,
      };
    } else {
      return {
        estado: data?.estado || "error",
        idpromesa: data?.idpromesa || null,
        mensaje: data?.mensaje || "No se pudo crear la promesa de pago",
      };
    }
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error .response.headers);
      return {
        estado: "error",
        idpromesa: null,
        mensaje: error?.response?.data?.mensaje || "Error al crear promesa de pago",
        detalle: error.response.data,
      };
    } else {
      console.log(error);
      return {
        estado: "error",
        idpromesa: null,
        mensaje: error?.message || "Error interno al crear promesa de pago",
      };
    }
  }
};


const EstadoNodo = async (idnodo, tokenSystema, cfg) => {
  const ENV = (cfg);
  try {
    const { data, status } = await axios.post(
      `${ENV.HOST_CONSULTA}GetRouters`,
      {
        token: tokenSystema || `${ENV.TOKEN}`,
        id: idnodo,
      }
    );
    console.log("data estado nodo: ", JSON.stringify(data));
    if (data.estado === "exito") {
      return {
        nodorespuesta: data.estado,
        nombrenodo: data.routers[0].nombre,
        nodoconectado: data.routers[0].estado,
      }
    } else {
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      return null;
    } else {
      console.log(error);
      return null;
    }
  }
};

const FacturaNOPagadas = async (idcliente, tokenSystema, cfg) => {
  const ENV = (cfg);
  try {
    var info = [];
    const { data, status } = await axios.post(
      `${ENV.HOST_CONSULTA}GetInvoices`,
      {
        token: tokenSystema || `${ENV.TOKEN}`,
        idcliente: idcliente,
        estado: "1",
      }
    );
    if (data.estado === "exito") {
      for (let index = 0; index < data.facturas.length; index++) {
        const element = data.facturas[index];
        info.push({
          idfactura: element.id,
          emitido: element.emitido,
          vencimiento: element.vencimiento,
          total: element.total.replace("$ ", ""),
          saldo: element.saldo.replace("$ ", ""),
        });
      }
      // info = {
      //     idfactura: data.facturas[0].id,
      //     emitido: data.facturas[0].emitido,
      //     vencimiento: data.facturas[0].vencimiento,
      // }
      return info;
    } else {
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      return null;
    } else {
      console.log(error);
      return null;
    }
  }
};

const DetallesFactura = async (idfactura, direccion_principal, tokenSystema, cfg) => {
  const ENV = (cfg);
  try {
    var info = [];
    const { data, status } = await axios.post(
      `${ENV.HOST_CONSULTA}GetInvoice`,
      {
        token: tokenSystema || `${ENV.TOKEN}`,
        idfactura: idfactura,
      }
    );
    if (data.estado === "exito") {
      console.log("data detalles factura: ", JSON.stringify(data));
      for (let index = 0; index < data.items.length; index++) {
        const element = data.items[index];
        //si tiene el mismo idfactura lo agrupo sumando los valores
        const existing = info.find(item => item.ItemsConsulta.Referencia === data.factura.id);
        if (existing) {
          existing.ItemsConsulta.Valor_Cobro = (parseFloat(existing.ItemsConsulta.Valor_Cobro) + parseFloat(element.total)).toFixed(2);
          existing.ItemsConsulta.Base_Imponible = (parseFloat(existing.ItemsConsulta.Base_Imponible) + parseFloat(element.precio)).toFixed(2);
        } else {
          info.push({
              ItemsConsulta: {
              Valor_Cobro: element.total,
              Valor_Minimo_Cobro: 0,
              Valor_Retener: 0,
              Base_Imponible: element.precio,
              Fecha_Maxima_Cobro: moment(data.factura.vencimiento).format("YYYYMMDD"),
              factura: data.factura.id,
              Periodo: moment(data.factura.emitido).format("YYYYMM"),
              Auxiliar: data.factura.id,
              Direccion_Servicio: direccion_principal,
            },
          });
        }
      }
      return info;
    } else {
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      return null;
    } else {
      console.log(error);
      return null;
    }
  }
};

const NumeroAleatorio = () => {
  return moment().format("YYYYMMDDHHmmss");
};

/*
  const pago = await RealizarPago(
    ItemsPago,
    monto,
    ID_Secuencia,
    ItemsPago[0].Referencia,
    Cod_Obligacion,
    ItemsPago[0].IDTransaccion,
    tokenData.id,
    tokenSystema,
    pasarela
  );
*/
const RealizarPago = async (
  idfactura,
  monto,
  numeroDocumento,
  Referencia,
  cedula,
  IDTransaccion,
  idToken,
  tokenSystema,
  pasarela,
  cfg
) => {
  const ENV = (cfg);
  try {
    let idtransaccion = NumeroAleatorio();
    if (IDTransaccion && IDTransaccion !== "") {
      idtransaccion = IDTransaccion;
    }
    console.log("RealizarPago");
    console.log("idfactura: ", idfactura);
    console.log("facturas: ", Referencia);

    var pagos = [];
    const { data, status } = await axios.post(`${ENV.HOST_CONSULTA}GetClientsDetails`,{
        cedula: cedula,
      token: tokenSystema || `${ENV.TOKEN}`,
      });
    if (data.estado === "exito") {
      let nombre = data.datos[0].nombre;
      for (let index = 0; index < idfactura.length; index++) {
        const items = idfactura[index];
        console.log("items: ", items);
        const { data, status } = await axios.post(
          `${ENV.HOST_CONSULTA}PaidInvoice`,
          {
            token: tokenSystema || `${ENV.TOKEN}`,
            idfactura: items.Referencia,
            pasarela: pasarela,
            cantidad: items.Valor_Pagado,
            idtransaccion: idtransaccion,
            nota: `${moment().format("YYYYMMDDHHMMSS")} / ${idtransaccion}`,
          }
        );
        console.log("data: ", data);
        if (data.estado === "exito") {
          info = {
            Codigo_Respuesta: "000", // Pago realizado con éxito
            Mensaje_Respuesta: data.salida,
            Parametro_Busqueda: 2,
            Cod_Obligacion: cedula,
            Nombre_Cliente: nombre,
            Fecha_Transaccion: moment().format("YYYYMMDD"),
            ID_Transaccion_Empresa: data.id,
            ID_Secuencia: idtransaccion, //data.id,
            Nro_Pagos: 1,
            Valor_Total_Pagado: monto,
            Tipo_Producto: "SERVICIO",
          };
          pagos.push(info);
          await guardarConciliacionPago({
            cliente_nombre: nombre,
            cliente_id: cedula,
            codigo_operacion: numeroDocumento,
            codigo_activa: data.id.toString(), // ID de transacción empresa
            codigo_secuencial: idtransaccion,
            concepto_pago: `Pago de factura ${items.Referencia}`,
            valor: items.Valor_Pagado,
            idToken: idToken
          });
        }
      }
      if (pagos.length > 0) {
        let pago = pagos[0];
        pago.Nro_Pagos = pagos.length;
        pago.Valor_Total_Pagado = pagos.reduce(
          (a, b) => a + parseFloat(b.Valor_Total_Pagado),
          0
        );
        return pago;
      } else {
        info = {
          Codigo_Respuesta: "002", // Error al realizar el pago
          Mensaje_Respuesta: "Error al realizar el pago",
          Parametro_Busqueda: 2,
          Cod_Obligacion: cedula,
          Nombre_Cliente: "",
          Fecha_Transaccion: "",
          ID_Transaccion_Empresa: "",
          ID_Secuencia: "",
          Nro_Pagos: "0",
          Valor_Total_Pagado: "0.0",
          Tipo_Producto: "SERVICIO",
        };
        return info;
      }
    } else {
      info = {
        Codigo_Respuesta: "001", // Cliente no encontrado
        Mensaje_Respuesta: "Cliente no encontrado",
        Parametro_Busqueda: 2,
        Cod_Obligacion: cedula,
        Nombre_Cliente: "",
        Fecha_Transaccion: "",
        ID_Transaccion_Empresa: "",
        ID_Secuencia: "",
        Nro_Pagos: "0",
        Valor_Total_Pagado: "0.0",
        Tipo_Producto: "SERVICIO",
      };
      return info;
    }
  } catch (error) {
    console.log("Error: ", error);
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      return {
        Codigo_Respuesta: "012", // Error desconocido
        Mensaje_Respuesta: error.message || "Error desconocido",
        Parametro_Busqueda: 2,
        Cod_Obligacion: cedula,
        Fecha_Transaccion: "",
        ID_Transaccion_Empresa: "",
        ID_Secuencia: "",
        Nro_Pagos: "0",
        Valor_Total_Pagado: "0.0",
        Tipo_Producto: "SERVICIO",
      };
    } else {
      console.log(error);
      return {
        Codigo_Respuesta: "012", // Error desconocido
        Mensaje_Respuesta: error.message || "Error desconocido",
        Parametro_Busqueda: 2,
        Cod_Obligacion: cedula,
        Fecha_Transaccion: "",
        ID_Transaccion_Empresa: "",
        ID_Secuencia: "",
        Nro_Pagos: "0",
        Valor_Total_Pagado: "0.0",
        Tipo_Producto: "SERVICIO",
      };
    }
  }
};

const ReversoPago = async (idfactura, monto, ID_Secuencia, cedula, IDTransaccion, idToken, tokenSystema, cfg) => {
  const ENV = (cfg);
  try {
    var pagos = [];
    for (let index = 0; index < idfactura.length; index++) {
      const items = idfactura[index];
      console.log(items);
      const { data, status } = await axios.post(`${ENV.HOST_CONSULTA}DeleteTransaccion`,
        {
          token: tokenSystema || `${ENV.TOKEN}`,
          factura: items.Referencia,
        }
      );
      console.log(data);
      if (data.estado === "exito") {
        info = {
          Codigo_Respuesta: "000",
          Mensaje_Respuesta: data.mensaje,
          Parametro_Busqueda: 2,
          Cod_Obligacion: cedula,
          Fecha_Transaccion: moment().format("YYYYMMDD"),
          ID_Transaccion_Empresa: items.Referencia,
          ID_Secuencia: ID_Secuencia,
          Nro_Pagos: 1,
          Valor_Total_Reversado: monto,
          Tipo_Producto: "SERVICIO",
        };
        pagos.push(info);
        await guardarConciliacionPago({
          cliente_nombre: cedula,
          cliente_id: cedula,
          codigo_operacion: ID_Secuencia,
          codigo_activa: items.Referencia, // ID de transacción externa
          codigo_secuencial: items.IDTransaccion,
          concepto_pago: "Reverso de pago de factura " + items.Referencia + " (ID Transacción: " + IDTransaccion + ")",
          valor: monto,
          idToken: idToken
        });
      }
    }

    if (pagos.length > 0) {
      let pago = pagos[0];
      pago.Nro_Pagos = pagos.length;
      pago.Valor_Total_Reversado = pagos.reduce(
        (a, b) => a + parseFloat(b.Valor_Total_Reversado),
        0
      );
      return pago;
    } else {
      info = {
        Codigo_Respuesta: "011",
        Mensaje_Respuesta: "Error al realizar el reverso",
        Parametro_Busqueda: 2,
        Cod_Obligacion: cedula,
        Fecha_Transaccion: "",
        ID_Transaccion_Empresa: "",
        ID_Secuencia: "",
        Nro_Pagos: "0",
        Valor_Total_Reversado: "0.0",
        Tipo_Producto: "SERVICIO",
      };
      return info;
    }
  } catch (error) {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      return {
        Codigo_Respuesta: "012", // Error desconocido
        Mensaje_Respuesta: error.message || "Error desconocido",
        Parametro_Busqueda: 2,
        Cod_Obligacion: cedula,
        Fecha_Transaccion: "",
        ID_Transaccion_Empresa: "",
        ID_Secuencia: "",
        Nro_Pagos: "0",
        Valor_Total_Reversado: "0.0",
        Tipo_Producto: "SERVICIO",
      }
    } else {
      console.log(error);
      return {
        Codigo_Respuesta: "012",
        Mensaje_Respuesta: error.message || "Error desconocido",
        Parametro_Busqueda: 2,
        Cod_Obligacion: cedula,
        Fecha_Transaccion: "",
        ID_Transaccion_Empresa: "",
        ID_Secuencia: "",
        Nro_Pagos: "0",
        Valor_Total_Reversado: "0.0",
        Tipo_Producto: "SERVICIO",
      };
    }
  }
};

const Validaciones = (cliente, cedula) => {
  if (cliente === null) {
    const requestConsulta = {
      Tipo_Producto: "02",
      Parametro_Busqueda: 2,
      Codigo_Respuesta: "001",
      Mensaje_Respuesta: "Cliente no encontrado",
      Cod_Obligacion: cedula,
      Nombre_Cliente: "",
      Valor_Total_a_Pagar: "0",
      Nro_Cobros: "0",
      Items: "",
    };
    return { Metodo_de_ConsultaResult: requestConsulta };
  } else if (cliente.facturaNopagadas === null) {
    const requestConsulta = {
      Tipo_Producto: "02",
      Parametro_Busqueda: 2,
      Codigo_Respuesta: "005", // Factura no tiene pagos pendientes
      Mensaje_Respuesta: "Cliente no tiene facturas pendientes",
      Cod_Obligacion: cedula,
      Nombre_Cliente: cliente.nombre,
      Valor_Total_a_Pagar: "0",
      Nro_Cobros: "0",
      Items: "",
    };
    return { Metodo_de_ConsultaResult: requestConsulta };
  } else if (cliente.detalles === null) {
    const requestConsulta = {
      Tipo_Producto: "02",
      Parametro_Busqueda: 2,
      Codigo_Respuesta: "003", // Factura no tiene detalles
      Mensaje_Respuesta: "Factura no tiene detalles",
      Cod_Obligacion: cedula,
      Nombre_Cliente: cliente.nombre,
      Valor_Total_a_Pagar: "0",
      Nro_Cobros: "0",
      Items: "",
    };
    return { Metodo_de_ConsultaResult: requestConsulta };
  } else {
    const requestConsulta = {
      
      Tipo_Producto: "SERVICIO",
      Parametro_Busqueda: 2,
      Codigo_Respuesta: "000", // Consulta exitosa
      Mensaje_Respuesta: "Consulta exitosa",
      Cod_Obligacion: cedula,
      Id_externo_onu: cliente.id_externo_onu,
      Id_externo_onu_root: cliente.id_externo_onu_root || "",
      Id_externo_antena: cliente.id_externo_antena,
      Facturas_Nopagadas: cliente.numeroFacturas,
      Nombre_Cliente: cliente.nombre,
      Valor_Total_a_Pagar: cliente.totalCobros,
      Nro_Cobros: cliente.facturacion.facturas_nopagadas,
      Fecha_Suspencion: cliente.feccha_suspencion,
      Direccion_Principal: cliente.direccion_principal,
      Id_cliente: cliente.idCliente,
      estado_Cliente: cliente.estado,
      perfil_Cliente: cliente.perfil,
      email: cliente.correo,  
      phones: cliente.movil,
      Items: cliente.detalles,
      servicios: cliente.servicios,
      Info_Nodo: cliente.infoNodo
    };
    return { Metodo_de_ConsultaResult: requestConsulta };
  }
};

const GeneralinkPago = async (datos, cfg) => {
  const ENV = (cfg);
  try {
    const url = `${ENV.HOST_SERV}/MovilApi/linkpago`;
console.log("URL GeneralinkPago: ", url);

    const { data } = await axios.post(url, datos, { timeout: 15000 });
    console.log("Respuesta GeneralinkPago: ", data);
    return data;
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        estado: false,
        error: error.response.data || error.message,
        status: error.response.status,
      };
    } else if (error.request) {
      return {
        success: false,
        estado: false,
        error: "No se pudo conectar con el servidor externo",
      };
    } else {
      return {
        success: false,
        estado: false,
        error: error.message || "Error interno",
      };
    }
  }
};

// Registra un preregistro de cliente (normalizado y con campos permitidos)
const Preregistro = async (params, cfg) => {
  const ENV = (cfg);
  try {
    
    const baseEnv = ENV.HOST_CONSULTA
    const url = `${baseEnv}NewPreRegistro`;
    
    console.log("URL Preregistro: ", url);
    // Solo enviar los campos esperados
    const permitidos = [
      "cedula",
      "cliente",
      "direccion",
      "telefono",
      "movil",
      "email",
      "notas",
      "fecha_instalacion",
    ];
    const limpio = {};
    for (const k of permitidos) {
      if (params && params[k] != null) limpio[k] = params[k];
    }

    // Completar valores por defecto coherentes con ejemplos
    if (!limpio.movil && limpio.telefono) limpio.movil = limpio.telefono;

    const token =
      params?.token ||
      params?.tokenSystema ||
      ENV.TOKEN_PREREGISTRO ||
      ENV.TOKEN;
    const payload = { token, ...limpio };

    const { data } = await axios.post(url, payload, {
      timeout: 15000,
      headers: { Accept: "application/json" },
    });
    console.log("Respuesta Preregistro: ", data);

    if (data && typeof data === "object") return data; // { estado, idregistro, mensaje }
    const txt = typeof data === "string" ? data.trim() : "";
    if (!txt || txt === "\n") {
      return { estado: "error", mensaje: "Respuesta inválida del servidor de preregistro" };
    }
    return { estado: "error", mensaje: txt };
  } catch (error) {
    if (error.response) {
      const resp = error.response.data;
      if (resp && typeof resp === "object") return resp;
      return {
        estado: "error",
        mensaje: (typeof resp === "string" ? resp : (error.message || "No se pudo completar el registro")),
        status: error.response.status,
      };
    }
    if (error.request) {
      return { estado: "error", mensaje: "No se pudo conectar con el servidor externo" };
    }
    return { estado: "error", mensaje: error?.message || "Error interno" };
  }
};
const GenerarLinkContrato = async (params, cfg) => {
  const ENV = (cfg);
  try {
    const cedula = params?.cedula;
    if (!cedula) {
      return { estado: false, mensaje: "cedula es requerida" };
    }

    // const url = "http://45.224.96.50:1211/api/v1/pdf";
    const url = `${ENV.HOST_PDF}`;
    console.log("URL GenerarLinkContrato: ", url);
    const { data } = await axios.post(url, { cedula }, { timeout: 15000 });
    console.log("Respuesta GenerarLinkContrato: ", data);
    // Esperado cuando correcto: { url, infos: { estado: true, url }, estado: true }
    // Esperado cuando incorrecto: { estado: false, datos: null, url: "speed.com.ec" }
    return data;
  } catch (error) {
    if (error.response) {
      return (
        error.response.data || {
          estado: false,
          mensaje: error.message || "Error en servicio externo",
          status: error.response.status,
        }
      );
    }
    if (error.request) {
      return { estado: false, mensaje: "No se pudo conectar con el servidor externo" };
    }
    return { estado: false, mensaje: error?.message || "Error interno" };
  }
};

module.exports = {
  ConsultarNombreCliente,
  FacturaNOPagadas,
  DetallesFactura,
  Validaciones,
  RealizarPago,
  ReversoPago,
  GeneralinkPago,
  Preregistro,
  GenerarLinkContrato,
  consultarGetClientsDetails,
  consultarGetClientsDetailsAllServices,
  consultargetdetalleolt,
  consultaGetInvoices,
  pagarfacturaPaidInvoice,
  consultaListTicket,
  consultaAutosoporteConsecutivo,
  CreateInvoice,
  ConsultarSSID,
  CreatePromesaPagoe,
};
