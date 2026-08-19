const axios = require("axios");

const LRSOFT_URL = "https://api.t-ickets.com/sris/ConsultasCedula";

function logRequest(name, url, start, status, error = null) {
  const elapsed = (Date.now() - start) / 1000;
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📡 ${name}`);
  console.log(`🌐 URL: ${url}`);
  console.log(`⏱️  Tiempo: ${elapsed.toFixed(2)}s`);
  if (status) console.log(`✅ HTTP ${status}`);
  if (error) console.error(`❌ Error: ${error}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

/**
 * Consulta los datos de una cédula en el servicio externo LRSoftSolution.
 */
async function consultarCedulaLRSoft(cedula) {
  const name = "ConsultasCedula (LRSoftSolution)";
  const start = Date.now();

  try {
    const { data, status } = await axios.post(LRSOFT_URL, {
      ruc: cedula,
      usuario: process.env.LRSOFTSOLUTION_USUARIO,
      token: process.env.LRSOFTSOLUTION_TOKEN,
    });

    logRequest(name, LRSOFT_URL, start, status);
    return data;
  } catch (error) {
    logRequest(name, LRSOFT_URL, start, error.response?.status, error.message);
    return {
      estado: "001",
      mensaje: error.response?.data?.mensaje || error.message || "Error de conexión",
    };
  }
}

module.exports = { consultarCedulaLRSoft };
