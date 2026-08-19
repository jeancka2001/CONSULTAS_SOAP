const axios = require("axios");
const { stat } = require("fs");

const https = require("https");

const agent = new https.Agent({ rejectUnauthorized: false }); // ⚠️ Solo para entornos de prueba

// 🔧 Helper para logging
async function RxEquipos(IdExterno, cfg) {
  const ENV = (cfg);
  const name = "RxEquipos (Genia ACS)";
  const url = `${ENV.HOST_ACS}/devices/${IdExterno}/tasks?connection_request`;
  console.log("URL ACS RxEquipos:", url);
  const start = Date.now();

  const countRequest = 3;
  console.log("Cantidad de requests a enviar:", countRequest);
  const bodyArray = [
    {
      name: "refreshObject",
      objectName: "InternetGatewayDevice.WANDevice.1.X_GponInterafceConfig.RXPower",
    },
    {
      name: "refreshObject",
      objectName: "InternetGatewayDevice.WANDevice.1.X_GponInterfaceConfig.RXPower",
    },
    {
      name: "refreshObject",
      objectName: "InternetGatewayDevice.WANDevice.1.X_ZTE-COM_WANPONInterfaceConfig.RXPower",
    },
  ];

  try {
    const tasks = [];
    console.log("Iniciando envío de solicitudes...", name, url, start, countRequest);
    for (let i = 0; i < countRequest; i++) {
      const body = bodyArray[i] || bodyArray[0]; // fallback

      const promise = axios
        .post(url, body)
        .then(({ status }) => {
          logRequest(name, url, start, status);
        })
        .catch((error) => {
          logRequest(name, url, start, error.response?.status, error.message);
        });

      tasks.push(promise);
    }

    // Si quieres esperar a que todas terminen pero en paralelo:
    await Promise.allSettled(tasks);
    console.log("Todas las solicitudes de RxEquipos han sido enviadas.");
    return { status: true, message: "Solicitud de RxEquipos enviada" };
  } catch (error) {
    // Aquí casi nunca entrarías, porque estás manejando errores en cada promesa,
    // pero lo dejo por seguridad.
    logRequest(name, url, start, error.response?.status, error.message);
    return {
      status: false,
      error: error.response?.data || error.message,
    };
  }
}
async function VerPotentcia(IdExterno, cfg) {
  console.log("VerPotentcia - IdExterno:", IdExterno);
  //{{urlAcs}}/devices/?projection=InternetGatewayDevice.WANDevice.1.X_GponInterafceConfig.RXPower&query={"_id": "{{idexterno}}"}
  const ENV = (cfg);
  const url = `${ENV.HOST_ACS}/devices/?projection=InternetGatewayDevice.WANDevice.1.X_GponInterafceConfig.RXPower&query={"_id": "${IdExterno}"}`;
  console.log("URL ACS VerPotentcia:", url);
  try {
    const { data, status } = await axios.get(url);
    return { data, status };
  } catch (error) {
    return { status: false, error: error.response?.data || error.message };
  }
}

async function PotenciaZte(IdExterno, cfg) {
  const ENV = (cfg);
  //{{urlAcs}}/devices/?projection=InternetGatewayDevice.WANDevice.1.X_ZTE-COM_WANPONInterfaceConfig.RXPower&query={"_id": "{{idexterno}}"}
  const url = `${ENV.HOST_ACS}/devices/?projection=InternetGatewayDevice.WANDevice.1.X_ZTE-COM_WANPONInterfaceConfig.RXPower&query={"_id": "${IdExterno}"}`;
  console.log("URL ACS PotenciaZte:", url);
  try {
    const { data, status } = await axios.get(url);
    return { data, status };
  } catch (error) {
    return { status: false, error: error.response?.data || error.message };
  }
}


module.exports = {
  RxEquipos,
  VerPotentcia,
  PotenciaZte
};