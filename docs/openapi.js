// Especificación OpenAPI 3 de la API REST (api.js).
// Se sirve en /docs (Swagger UI) y /docs/openapi.json.
// Si agregas o cambias un endpoint en api.js, actualízalo también aquí.

const { version } = require("../package.json");

// Respuesta genérica: los servicios devuelven lo que responde el sistema externo
const respuestaLibre = {
  description: "Respuesta del servicio",
  content: { "application/json": { schema: { type: "object", additionalProperties: true } } },
};

const errorSimple = (ejemplo) => ({
  description: "Error de validación",
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: ejemplo } },
});

const erroresAuth = {
  401: { $ref: "#/components/responses/SinToken" },
  403: { $ref: "#/components/responses/NoAutorizado" },
};

/**
 * Construye una operación protegida (IP whitelist + Bearer token + tenant).
 */
function op({ tag, summary, description, body, example, responses = {}, publico = false, parameters = [] }) {
  const operacion = {
    tags: [tag],
    summary,
    description,
    parameters: publico ? parameters : [{ $ref: "#/components/parameters/TenantId" }, ...parameters],
    responses: { 200: respuestaLibre, ...responses, ...(publico ? {} : erroresAuth) },
  };
  if (publico) operacion.security = [];
  if (body) {
    operacion.requestBody = {
      required: true,
      content: { "application/json": { schema: body, ...(example ? { example } : {}) } },
    };
  }
  return operacion;
}

const obj = (properties, required = []) => ({ type: "object", properties, ...(required.length ? { required } : {}) });
const str = (description, extra = {}) => ({ type: "string", description, ...extra });
const num = (description, extra = {}) => ({ type: "number", description, ...extra });
const int = (description, extra = {}) => ({ type: "integer", description, ...extra });
const bool = (description) => ({ type: "boolean", description });

const tokenSystemaProp = { tokenSystema: str("Opcional. Sobrescribe el token del sistema asociado al Bearer token.") };

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "API Consultas",
    version,
    description:
      "API REST de consultas, pagos, tickets y soporte técnico (multi-tenant).\n\n" +
      "**Autenticación:** todos los endpoints (salvo los marcados como públicos) requieren:\n" +
      "1. Que la IP de origen esté en la whitelist (tabla `ip_address` o `config/tenants.json`).\n" +
      "2. Un token válido en la cabecera `Authorization: Bearer <token>` (tabla `api_token`).\n\n" +
      "Usa el botón **Authorize** para cargar el token. Opcionalmente envía `x-tenant-id` para forzar el tenant.\n\n" +
      "> ⚠️ Las peticiones con *Try it out* se ejecutan contra el entorno real: los pagos, tickets y cambios de WiFi son operaciones reales.",
  },
  servers: [{ url: "/", description: "Este servidor" }],
  security: [{ bearerAuth: [] }],
  tags: [
    { name: "Clientes", description: "Consulta de datos de clientes" },
    { name: "Facturación", description: "Facturas, pagos y promesas de pago" },
    { name: "Pasarela", description: "Métodos para recaudadores (consulta, pago, reverso, test)" },
    { name: "Tickets", description: "Tickets de soporte" },
    { name: "Soporte técnico", description: "Estado de ONU/OLT, potencia y resincronización" },
    { name: "WiFi / Router", description: "Gestión remota del equipo del cliente vía ACS" },
    { name: "Verificación", description: "Generación y validación de códigos por WhatsApp o correo" },
    { name: "Registro y contratos", description: "Preregistro de clientes y links de contrato" },
    { name: "Notificaciones", description: "Envío de correos y mensajes de WhatsApp" },
    { name: "Conciliación", description: "Archivos de conciliación de pagos" },
    { name: "Tenant / Admin", description: "Configuración multi-tenant" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", description: "Token registrado en la tabla `api_token`" },
    },
    parameters: {
      TenantId: {
        name: "x-tenant-id",
        in: "header",
        required: false,
        description: "Opcional. Clave del tenant (`tenant_key`). Si no se envía, se usa el tenant del token.",
        schema: { type: "string" },
      },
    },
    responses: {
      SinToken: {
        description: "Token no proporcionado",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "Token no proporcionado" } } },
      },
      NoAutorizado: {
        description: "IP no autorizada o token inválido/inactivo",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { error: "Acceso no autorizado desde esta IP" } } },
      },
    },
    schemas: {
      Error: {
        type: "object",
        additionalProperties: true,
        properties: { error: { type: "string" }, estado: {}, mensaje: { type: "string" } },
      },
      ItemPago: obj({
        Referencia: str("ID de la factura a pagar"),
        Valor_Pagado: num("Monto pagado"),
        IDTransaccion: str("ID de transacción del recaudador"),
      }),
      TokenData: obj({ id: int("ID del token del recaudador (api_token.id)") }, ["id"]),
    },
  },
  paths: {
    // ───────────── Clientes ─────────────
    "/consultar": {
      post: op({
        tag: "Clientes",
        summary: "Consultar cliente y deuda",
        description: "Consulta el cliente por cédula/código de obligación y devuelve el resultado validado (`Metodo_de_ConsultaResult`).",
        body: obj({ Cod_Obligacion: str("Cédula o código de obligación del cliente"), ...tokenSystemaProp }, ["Cod_Obligacion"]),
        example: { Cod_Obligacion: "0912345678" },
      }),
    },
    "/GetClientsDetails": {
      post: op({
        tag: "Clientes",
        summary: "Detalle del cliente",
        body: obj({ cedula: str("Cédula del cliente (también acepta `Cedula`)"), ...tokenSystemaProp }, ["cedula"]),
        example: { cedula: "0912345678" },
        responses: { 400: errorSimple({ error: "Cedula es requerida" }) },
      }),
    },
    "/GetClientsDetailsAllServices": {
      post: op({
        tag: "Clientes",
        summary: "Detalle del cliente con todos sus servicios",
        body: obj({ cedula: str("Cédula del cliente (también acepta `Cedula`)"), ...tokenSystemaProp }, ["cedula"]),
        example: { cedula: "0912345678" },
        responses: { 400: errorSimple({ error: "Cedula es requerida" }) },
      }),
    },
    "/consulta-cedula/{cedula}": {
      get: op({
        tag: "Clientes",
        summary: "Consultar cédula en LR Soft (público)",
        description: "Endpoint **público**: no requiere token ni IP en whitelist.",
        publico: true,
        parameters: [{ name: "cedula", in: "path", required: true, schema: { type: "string" }, example: "0912345678" }],
      }),
    },

    // ───────────── Facturación ─────────────
    "/facturas": {
      post: op({
        tag: "Facturación",
        summary: "Facturas pendientes del cliente",
        body: obj({ Cod_Obligacion: str("Cédula o código de obligación"), ID_Secuencia: str("Secuencia (opcional)"), ...tokenSystemaProp }, ["Cod_Obligacion"]),
        example: { Cod_Obligacion: "0912345678" },
      }),
    },
    "/GetInvoices": {
      post: op({
        tag: "Facturación",
        summary: "Listar facturas por ID de cliente",
        body: obj({ idcliente: str("ID del cliente") }, ["idcliente"]),
        example: { idcliente: "1234" },
        responses: { 400: errorSimple({ error: "ID Cliente es requerido" }) },
      }),
    },
    "/PaidInvoice": {
      post: op({
        tag: "Facturación",
        summary: "Registrar pago de factura",
        description: "⚠️ Registra un pago real en el sistema.",
        body: obj(
          {
            idfactura: str("ID de la factura"),
            pasarela: str("Nombre de la pasarela/recaudador"),
            cantidad: num("Monto pagado"),
            idtransaccion: str("ID de transacción"),
            nota: str("Nota del pago"),
          },
          ["idfactura"]
        ),
        example: { idfactura: "5678", pasarela: "Banco X", cantidad: 25.0, idtransaccion: "TX-0001", nota: "Pago en línea" },
        responses: { 400: errorSimple({ error: "ID Factura es requerido" }) },
      }),
    },
    "/pagar_factura": {
      post: op({
        tag: "Facturación",
        summary: "Pagar factura y obtener PDF",
        description: "⚠️ Registra el pago, obtiene la URL del PDF de la factura (acortada si el tenant tiene acortador) y guarda la conciliación.",
        body: obj({
          idfactura: str("ID de la factura"),
          pasarela: str("Pasarela/recaudador"),
          cantidad: num("Monto pagado"),
          idtransaccion: str("ID de transacción"),
          nota: str("Nota del pago"),
          cliente_nombre: str("Nombre del cliente (para conciliación)"),
          cliente_id: str("ID del cliente (para conciliación)"),
          ...tokenSystemaProp,
        }, ["idfactura", "cantidad"]),
        example: { idfactura: "5678", pasarela: "Banco X", cantidad: 25.0, idtransaccion: "TX-0001", nota: "Pago en línea", cliente_nombre: "Juan Pérez", cliente_id: "1234" },
        responses: { 500: { description: "Error interno al procesar el pago (Codigo_Respuesta 002)" } },
      }),
    },
    "/CreateInvoice": {
      post: op({
        tag: "Facturación",
        summary: "Crear factura",
        body: obj({ idcliente: str("ID del cliente"), vencimiento: str("Fecha de vencimiento (YYYY-MM-DD)", { format: "date" }), ...tokenSystemaProp }, ["idcliente"]),
        example: { idcliente: "1234", vencimiento: "2026-11-05" },
        responses: { 400: errorSimple({ error: "ID Cliente es requerido" }) },
      }),
    },
    "/PromesaPago": {
      post: op({
        tag: "Facturación",
        summary: "Crear promesa de pago",
        body: obj(
          {
            idfactura: str("ID de la factura"),
            fechalimite: str("Fecha límite (YYYY-MM-DD)", { format: "date" }),
            descripcion: str("Descripción de la promesa"),
            ...tokenSystemaProp,
          },
          ["idfactura", "fechalimite", "descripcion"]
        ),
        example: { idfactura: "5678", fechalimite: "2026-10-20", descripcion: "Promesa de pago solicitada por el cliente" },
        responses: { 400: errorSimple({ error: "Fecha límite es requerida" }) },
      }),
    },
    "/linkpagotc": {
      post: op({
        tag: "Facturación",
        summary: "Generar link de pago con tarjeta",
        description: "Reenvía el payload a `HOST_SERV/MovilApi/linkpago`. Acepta los datos directamente o dentro de `datosxlink`.",
        body: { type: "object", additionalProperties: true, properties: { datosxlink: { type: "object", additionalProperties: true } } },
      }),
    },

    // ───────────── Pasarela ─────────────
    "/metodoPago": {
      post: op({
        tag: "Pasarela",
        summary: "Método de pago (recaudador)",
        description: "⚠️ Registra un pago real. Se toma el primer elemento de `Items.ItemsPago`.",
        body: obj(
          {
            Cod_Obligacion: str("Cédula / código de obligación"),
            ID_Secuencia: str("Secuencia del recaudador"),
            Monto_1: num("Monto 1"),
            Monto_2: num("Monto 2"),
            Items: obj({ ItemsPago: { type: "array", items: { $ref: "#/components/schemas/ItemPago" } } }, ["ItemsPago"]),
            tokenData: { $ref: "#/components/schemas/TokenData" },
            pasarela: str("Pasarela/recaudador"),
            ...tokenSystemaProp,
          },
          ["Cod_Obligacion", "Items", "tokenData"]
        ),
        example: {
          Cod_Obligacion: "0912345678",
          ID_Secuencia: "000123",
          Monto_1: 25.0,
          Monto_2: 0,
          Items: { ItemsPago: [{ Referencia: "5678", Valor_Pagado: 25.0, IDTransaccion: "TX-0001" }] },
          tokenData: { id: 1 },
          pasarela: "Banco X",
        },
      }),
    },
    "/metodoReverso": {
      post: op({
        tag: "Pasarela",
        summary: "Reverso de pago (recaudador)",
        description: "⚠️ Reversa un pago real. Se toma el primer elemento de `Items.ItemsReverso`.",
        body: obj(
          {
            Cod_Obligacion: str("Cédula / código de obligación"),
            ID_Secuencia: str("Secuencia del recaudador"),
            Items: obj({ ItemsReverso: { type: "array", items: { $ref: "#/components/schemas/ItemPago" } } }, ["ItemsReverso"]),
            tokenData: { $ref: "#/components/schemas/TokenData" },
            ...tokenSystemaProp,
          },
          ["Cod_Obligacion", "Items", "tokenData"]
        ),
        example: {
          Cod_Obligacion: "0912345678",
          ID_Secuencia: "000123",
          Items: { ItemsReverso: [{ Referencia: "5678", Valor_Pagado: 25.0, IDTransaccion: "TX-0001" }] },
          tokenData: { id: 1 },
        },
      }),
    },
    "/metodoTest": {
      post: op({
        tag: "Pasarela",
        summary: "Prueba de conectividad",
        description: "Devuelve `Prueba exitosa` si la IP y el token son válidos. Útil para verificar acceso.",
        body: { type: "object", additionalProperties: true },
        example: {},
      }),
    },

    // ───────────── Tickets ─────────────
    "/ListTicket": {
      post: op({
        tag: "Tickets",
        summary: "Listar tickets del cliente",
        body: obj({ id_cliente: str("ID del cliente") }, ["id_cliente"]),
        example: { id_cliente: "1234" },
        responses: { 400: errorSimple({ error: "ID Cliente es requerido" }) },
      }),
    },
    "/tickets/listar": {
      post: op({
        tag: "Tickets",
        summary: "Listar tickets (passthrough)",
        description: "Reenvía el body a `ListTicket` del sistema externo agregando el token del tenant.",
        body: { type: "object", additionalProperties: true, properties: { idcliente: str("ID del cliente") } },
        example: { idcliente: "1234" },
      }),
    },
    "/tickets/autosoporte/validar": {
      post: op({
        tag: "Tickets",
        summary: "Validar tickets de autosoporte consecutivos",
        description: "Verifica si el cliente generó `cantidad_tickets` o más tickets de autosoporte en los últimos `dias`.",
        body: obj(
          {
            idcliente: str("ID del cliente (también acepta `id_cliente`)"),
            dias: int("Ventana en días", { minimum: 1 }),
            cantidad_tickets: int("Cantidad de tickets a evaluar", { minimum: 1 }),
          },
          ["idcliente", "dias", "cantidad_tickets"]
        ),
        example: { idcliente: "1234", dias: 7, cantidad_tickets: 3 },
        responses: { 400: errorSimple({ estado: false, error: "dias debe ser un entero mayor a 0" }) },
      }),
    },
    "/Newtickte": {
      post: op({
        tag: "Tickets",
        summary: "Crear ticket",
        description: "Crea un ticket directamente. Los campos adicionales se reenvían al sistema externo (`NewTicket`).",
        body: {
          type: "object",
          additionalProperties: true,
          required: ["idcliente"],
          properties: {
            idcliente: str("ID del cliente (también acepta `id_cliente`)"),
            asunto: str("Asunto del ticket"),
            descripcion: str("Descripción del problema"),
          },
        },
        example: { idcliente: "1234", asunto: "TICKET DE SOPORTE", descripcion: "Cliente sin servicio" },
        responses: { 400: errorSimple({ error: "ID Cliente es requerido" }) },
      }),
    },
    "/tickets/crear": {
      post: op({
        tag: "Tickets",
        summary: "Crear ticket (verificando abiertos)",
        description: "Crea un ticket solo si el cliente no tiene otro abierto. `asunto` por defecto: `TICKET DE SOPORTE`.",
        body: {
          type: "object",
          additionalProperties: true,
          required: ["idcliente"],
          properties: {
            idcliente: str("ID del cliente"),
            asunto: str("Asunto del ticket"),
            descripcion: str("Descripción del problema"),
          },
        },
        example: { idcliente: "1234", asunto: "TICKET DE SOPORTE", descripcion: "Cliente sin servicio" },
      }),
    },
    "/CloseTicket": {
      post: op({
        tag: "Tickets",
        summary: "Cerrar ticket",
        body: obj({ idticket: str("ID del ticket"), motivo_cierre: str("Motivo de cierre") }, ["idticket"]),
        example: { idticket: "9876", motivo_cierre: "Resuelto por autosoporte" },
        responses: { 400: errorSimple({ error: "idticket es requerido" }) },
      }),
    },

    // ───────────── Soporte técnico ─────────────
    "/soporte": {
      post: op({
        tag: "Soporte técnico",
        summary: "Diagnóstico completo de la ONU",
        description:
          "Devuelve routers del nodo, detalle de la ONU, estado del puerto PON, estado y señal de la ONU.\n\n" +
          "`onustatus.status_onu`: `000` Online, `001` Power fail, `002` LOS.",
        body: obj(
          {
            onu_external_id: str("ID externo de la ONU en SmartOLT"),
            olt_id: str("ID de la OLT"),
            board: str("Board (opcional)"),
            port: str("Puerto PON (opcional)"),
            nodo: str("ID del nodo"),
          },
          ["onu_external_id"]
        ),
        example: { onu_external_id: "ZTEGC1234567", olt_id: "1", board: "1", port: "3", nodo: "10" },
        responses: { 400: { description: "onu_external_id inválido" } },
      }),
    },
    "/detalleolt": {
      post: op({
        tag: "Soporte técnico",
        summary: "Detalle de puertos de la OLT",
        body: obj(
          {
            olt_id: str("ID de la OLT"),
            nap: str("NAP (opcional)"),
            board: str("Board (opcional)"),
            pon_port: str("Puerto PON (opcional)"),
            force_refresh: bool("Ignorar caché y consultar de nuevo"),
          },
          ["olt_id"]
        ),
        example: { olt_id: "1", board: "1", pon_port: "3", force_refresh: false },
        responses: { 400: errorSimple({ error: "OLT ID es requerido" }) },
      }),
    },
    "/ssid": {
      post: op({
        tag: "Soporte técnico",
        summary: "Consultar SSID de la ONU",
        body: obj({ ID_EXTERNO_ONU: str("ID externo de la ONU") }, ["ID_EXTERNO_ONU"]),
        example: { ID_EXTERNO_ONU: "ZTEGC1234567" },
      }),
    },
    "/rxequipos": {
      post: op({
        tag: "Soporte técnico",
        summary: "Potencia RX de la ONU",
        description: "Soporta IDs ZTE, GPON, 00259E, 5CE931 y DE37. Devuelve `potenciaOnu` (crudo) y `potenciaDbm`.",
        body: obj({ IdExterno: str("ID del dispositivo en el ACS") }, ["IdExterno"]),
        example: { IdExterno: "ZTEGC1234567" },
        responses: { 400: errorSimple({ error: "IdExterno es requerido" }), 500: errorSimple({ error: "No se pudo leer RXPower para ZTE" }) },
      }),
    },
    "/resincronizacion": {
      post: op({
        tag: "Soporte técnico",
        summary: "Resincronizar servicio",
        body: obj({ servicios_id: str("ID del servicio") }, ["servicios_id"]),
        example: { servicios_id: "4321" },
        responses: { 400: errorSimple({ error: "Servicios ID es requerido" }) },
      }),
    },

    // ───────────── WiFi / Router ─────────────
    "/devices/conectados": {
      post: op({
        tag: "WiFi / Router",
        summary: "Dispositivos conectados al router",
        description: "Límite: **3 peticiones por minuto** por identificador (devuelve 429 si se excede).",
        body: obj({ info: str("ID del dispositivo en el ACS (o cédula/ID)") }, ["info"]),
        example: { info: "ZTEGC1234567" },
        responses: { 400: { description: "info es requerido" }, 429: { description: "Máximo de intentos excedido" } },
      }),
    },
    "/router/reiniciar": {
      post: op({
        tag: "WiFi / Router",
        summary: "Reiniciar router",
        description: "⚠️ Reinicia el equipo real del cliente.",
        body: obj({ id: str("ID del dispositivo en el ACS") }, ["id"]),
        example: { id: "ZTEGC1234567" },
      }),
    },
    "/cambiar_contra": {
      post: op({
        tag: "WiFi / Router",
        summary: "Cambiar contraseña WiFi",
        description: "⚠️ Cambia la clave real del WiFi. La clave se acepta como `clave`, `booleas`, `password` o `contrasena`.",
        body: obj(
          {
            info: str("ID del dispositivo en el ACS"),
            clave: str("Nueva contraseña WiFi"),
            idcliente: str("ID del cliente (opcional, para ticket)"),
            nombre: str("Nombre del cliente (opcional)"),
            movil: str("Móvil del cliente (opcional)"),
          },
          ["info", "clave"]
        ),
        example: { info: "ZTEGC1234567", clave: "NuevaClave2026", idcliente: "1234" },
      }),
    },
    "/wifi/ssid": {
      post: op({
        tag: "WiFi / Router",
        summary: "Cambiar nombre de la red (SSID)",
        description: "⚠️ Cambia el SSID real. Enviar `nombrered`, o `base` + `sufijo`.",
        body: obj(
          {
            info: str("ID del dispositivo en el ACS"),
            nombrered: str("Nuevo nombre de red"),
            base: str("Prefijo del SSID"),
            sufijo: str("Sufijo del SSID"),
            idcliente: str("ID del cliente (opcional)"),
            nombre: str("Nombre del cliente (opcional)"),
            movil: str("Móvil del cliente (opcional)"),
          },
          ["info"]
        ),
        example: { info: "ZTEGC1234567", nombrered: "MiRedCasa" },
        responses: { 400: errorSimple({ estado: "error", mensaje: "info y (nombrered o sufijo) son requeridos" }) },
      }),
    },
    "/wifi/ssid/visibility": {
      post: op({
        tag: "WiFi / Router",
        summary: "Mostrar/ocultar SSID",
        body: obj({ info: str("ID del dispositivo en el ACS"), visible: bool("true = visible, false = oculta") }, ["info"]),
        example: { info: "ZTEGC1234567", visible: true },
      }),
    },

    // ───────────── Verificación ─────────────
    "/token/generar": {
      post: op({
        tag: "Verificación",
        summary: "Generar código y enviarlo por WhatsApp",
        body: obj(
          {
            cedula: str("Cédula del cliente"),
            movil: str("Número móvil destino"),
            ttlMin: int("Minutos de validez (opcional)"),
            sessionName: str("Sesión de WhatsApp a usar (opcional)"),
          },
          ["cedula", "movil"]
        ),
        example: { cedula: "0912345678", movil: "593991234567", ttlMin: 5 },
      }),
    },
    "/token/validar": {
      post: op({
        tag: "Verificación",
        summary: "Validar código de WhatsApp",
        body: obj({ cedula: str("Cédula del cliente"), token: str("Código recibido"), ttlMin: int("Minutos de validez (opcional)") }, ["cedula", "token"]),
        example: { cedula: "0912345678", token: "123456" },
      }),
    },
    "/token/correo/generar": {
      post: op({
        tag: "Verificación",
        summary: "Generar código y enviarlo por correo",
        body: obj({ cedula: str("Cédula del cliente"), correo: str("Correo destino", { format: "email" }), ttlMin: int("Minutos de validez (opcional)") }, ["cedula", "correo"]),
        example: { cedula: "0912345678", correo: "cliente@ejemplo.com", ttlMin: 10 },
      }),
    },
    "/token/correo/validar": {
      post: op({
        tag: "Verificación",
        summary: "Validar código de correo",
        body: obj({ cedula: str("Cédula del cliente"), token: str("Código recibido"), ttlMin: int("Minutos de validez (opcional)") }, ["cedula", "token"]),
        example: { cedula: "0912345678", token: "123456" },
      }),
    },

    // ───────────── Registro y contratos ─────────────
    "/preregistro": {
      post: op({
        tag: "Registro y contratos",
        summary: "Preregistro de cliente",
        description: "Solo se reenvían los campos listados; `movil` toma el valor de `telefono` si no se envía.",
        body: obj(
          {
            cedula: str("Cédula"),
            cliente: str("Nombre completo"),
            direccion: str("Dirección"),
            telefono: str("Teléfono"),
            movil: str("Móvil"),
            email: str("Correo", { format: "email" }),
            notas: str("Notas"),
            fecha_instalacion: str("Fecha de instalación (YYYY-MM-DD)", { format: "date" }),
          },
          ["cedula"]
        ),
        example: {
          cedula: "0912345678",
          cliente: "Juan Pérez",
          direccion: "Av. Principal 123",
          telefono: "0991234567",
          email: "juan@ejemplo.com",
          notas: "Plan 300 Mbps",
          fecha_instalacion: "2026-10-20",
        },
      }),
    },
    "/contrato/link": {
      post: op({
        tag: "Registro y contratos",
        summary: "Generar link de contrato",
        body: obj({ cedula: str("Cédula del cliente") }, ["cedula"]),
        example: { cedula: "0912345678" },
      }),
    },

    // ───────────── Notificaciones ─────────────
    "/EnviarCorreo": {
      post: op({
        tag: "Notificaciones",
        summary: "Enviar correo",
        description: "No valida IP: se puede ejecutar desde cualquier IP. Sigue requiriendo el token Bearer.",
        body: obj(
          { from: str("Remitente (opcional)"), to: str("Destinatario"), subject: str("Asunto"), text: str("Cuerpo en texto plano"), html: str("Cuerpo HTML") },
          ["to"]
        ),
        example: { to: "cliente@ejemplo.com", subject: "Prueba", text: "Hola, este es un correo de prueba." },
      }),
    },
    "/soporte/whatsapp": {
      post: op({
        tag: "Notificaciones",
        summary: "Enviar WhatsApp al equipo de soporte",
        body: obj(
          { mensaje: str("Texto del mensaje"), numerosSoporte: { type: "array", items: { type: "string" }, description: "Opcional. Si no se envía, se usan los del tenant." } },
          ["mensaje"]
        ),
        example: { mensaje: "Cliente 0912345678 reporta caída de servicio" },
      }),
    },

    // ───────────── Conciliación ─────────────
    "/conciliaciones/{idInstitucion}/descargar": {
      get: {
        ...op({
          tag: "Conciliación",
          summary: "Descargar archivo de conciliación",
          description:
            "Devuelve un archivo `.txt` para descargar.\n\n" +
            "> Nota: este endpoint lee `tokenData.id` del **body** de una petición GET, por lo que no puede probarse desde Swagger UI.",
          parameters: [{ name: "idInstitucion", in: "path", required: true, schema: { type: "string" } }],
        }),
        responses: {
          200: { description: "Archivo de conciliación", content: { "text/plain": { schema: { type: "string", format: "binary" } } } },
          500: { description: "Error generando el archivo" },
          ...erroresAuth,
        },
      },
    },

    // ───────────── Tenant / Admin ─────────────
    "/tenant/config": {
      get: op({ tag: "Tenant / Admin", summary: "Configuración pública del tenant", description: "Devuelve `tenant`, `name` y `theme`." }),
    },
    "/admin/tenants": {
      get: op({ tag: "Tenant / Admin", summary: "Listar tenants" }),
      post: op({
        tag: "Tenant / Admin",
        summary: "Crear tenant",
        description: "Requiere un token con `is_admin = 1`.",
        body: obj(
          {
            tenant_key: str("Clave única del tenant"),
            name: str("Nombre"),
            theme: { type: "object", additionalProperties: true, description: "Configuración/tema (JSON)" },
            whatsapp_session: str("Sesión de WhatsApp"),
          },
          ["tenant_key", "name"]
        ),
        example: { tenant_key: "empresa_x", name: "Empresa X", theme: { primaryColor: "#0055aa" }, whatsapp_session: "empresa_x" },
        responses: { 400: errorSimple({ error: "El tenant_key ya existe" }) },
      }),
    },
  },
};
