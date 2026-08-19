# Análisis de nodos Typebot

- Fecha análisis: 2026-03-12 16:33:08
- Total nodos: 335
- Enlaces explícitos (edges): 359
- Enlaces implícitos detectados: 74
- Enlaces totales analizados: 433

## Resumen por tipo
- send-message: 104
- jump: 57
- conditional: 41
- menu: 39
- api-call: 19
- code: 17
- input: 15
- transfer: 13
- wait: 9
- send-media: 7
- chatgpt-agent: 2
- team: 2
- ollama-agent: 2
- image-processor: 2
- trigger: 1
- image-buttons: 1
- ocr-vision: 1
- input-form: 1
- intent-classifier: 1
- whatsapp-template: 1

## Entradas (trigger)
- trigger-1762832574981 | Chat Trigger

## Nodos huérfanos (sin entrada y no trigger)
- input-form-1763039114399 | input-form | Input Form
- whatsapp-template-1764398678441 | whatsapp-template | WhatsApp Template
- ollama-agent-1763175986905-copy-1764481749623 | ollama-agent | Agente Ollama (copia)
- conditional-1764533270129-copy-1766250311606 | conditional | CondicionCantidadFactura tarjeta
- api-call-1766304032294 | api-call | API Externa pagar factura
- jump-1766312437511 | jump | Saltar menu activo
- api-call-1766312772508 | api-call | API Externa generar ticket preinstala
- conditional-1766317512270 | conditional | CondiciÃ³n estado ticket
- send-message-1766387508641 | send-message | Enviar Mensaje toekn
- ocr-vision-1766408107820 | ocr-vision | OCR Vision
- send-message-1766433860554 | send-message | Enviar Mensaje pÂ´reregistro sin cedula
- wait-1766497638935 | wait | Esperar
- send-message-1766585948228 | send-message | Enviar Mensaje
- image-buttons-1766689458166 | image-buttons | Imagen + Botones
- send-message-1767110307739 | send-message | Enviar Mensaje
- send-message-1767115794023 | send-message | Enviar Mensaje nuevo contrato
- send-message-1766433860554-copy-1767123789110 | send-message | Enviar Mensaje preregistro con cedula
- conditional-1767684849503 | conditional | Condicional sin onu
- conditional-1767684849503-copy-1767685426556 | conditional | Condicional sin onu (copia)
- menu-1772468245783 | menu | MenÃº
- send-message-1772736042667 | send-message | Enviar Mensaje
- conditional-1773022570775 | conditional | Condicional cuentas de banco
- wait-1773074240275 | wait | Esperar
- chatgpt-agent-1773090331132 | chatgpt-agent | ChatGPT Agent contratar
- ollama-agent-1773092255925 | ollama-agent | Ollama Agent
- send-message-1773095947607 | send-message | Enviar Mensaje renicisar
- send-message-1773160112087 | send-message | Enviar Mensaje
- team-1773170897934 | team | Equipos soporte
- send-media-1773172030245 | send-media | Enviar Multimedia 1
- send-message-1773247548223 | send-message | Enviar Mensaje imen pago

## Alcance desde trigger (explícito + implícito)
- Trigger principal: trigger-1762832574981
- Nodos alcanzables: 257
- Nodos no alcanzables: 78
- Profundidad máxima (BFS): 41
- Terminales alcanzables: 20

## Mapa completo de nodos
### trigger-1762832574981
- Tipo: trigger
- Label: Chat Trigger
- Va a:
  - [edge:default] -> image-processor-1763252921842 | Procesador de Imagen

### conditional-1762961952650
- Tipo: conditional
- Label: CondiciÃ³n cedula cliente
- Función: Condiciones: 3
- Va a: (sin salida)

### api-call-1762832594446-copy-1762969151422
- Tipo: api-call
- Label: APIConsultaCliente
- Función: API POST {url_consulta}/consultar
- Va a:
  - [edge:default] -> conditional-1772471275575 | Condicional

### send-message-1762969665923
- Tipo: send-message
- Label: MensajeBienvenida
- Función: Mensaje: Hola, ðŸ‘‹ {nombreCliente} 
- Va a:
  - [edge:default] -> send-message-1762972136890 | Mensaje de Estado

### send-media-1762970199587
- Tipo: send-media
- Label: ImagenActualizaPlan
- Va a: (sin salida)

### send-message-1762972136890
- Tipo: send-message
- Label: Mensaje de Estado
- Función: Mensaje: ðŸ“„ InformaciÃ³n del cliente  *{EstadoCliente}* *{detallePuerto}* â„¹ï¸ ID: {IdExterno}
- Va a:
  - [edge:default] -> conditional-1762994823388 | CondiciÃ³n detalle puerto

### send-message-1762976680161
- Tipo: send-message
- Label: BienvenidaClienteActivo
- Función: Mensaje: ðŸ“„ Estado del servicio  Estado del Servicio: *{EstadoCliente}*  Plan Contratado: *{PerfilCliente}*  Valor a Pagar: *{T...
- Va a:
  - [edge:default] -> menu-1762995979400-copy-1762997112345 | MenÃº Activo

### code-1762977774930
- Tipo: code
- Label: CodeSmartOlt
- Función: Código: let servicios = {Servicios}
- Va a:
  - [edge:default] -> api-call-1762993560680 | APISoporte

### api-call-1762993560680
- Tipo: api-call
- Label: APISoporte
- Función: API POST {url_consulta}/soporte
- Va a:
  - [edge:default] -> conditional-1764534891961 | CondiciÃ³n analisis de imagen

### conditional-1762994823388
- Tipo: conditional
- Label: CondiciÃ³n detalle puerto
- Función: Condiciones: 2
- Va a:
  - [edge:1762994840101] -> conditional-1762994915402 | CondiciÃ³n estado cliente
  - [edge:1762994843252] -> conditional-1762994915402 | CondiciÃ³n estado cliente

### conditional-1762994915402
- Tipo: conditional
- Label: CondiciÃ³n estado cliente
- Función: Condiciones: 4
- Va a:
  - [edge:1762994935432] -> send-message-1762995047208 | BienvenidaClienteSuspendido
  - [edge:1762994975154] -> send-message-1762976680161 | BienvenidaClienteActivo

### send-message-1762995047208
- Tipo: send-message
- Label: BienvenidaClienteSuspendido
- Función: Mensaje: ðŸ“„ InformaciÃ³n del servicio  Estado del Servicio: *{EstadoCliente}*  Plan Contratado: *{PerfilCliente}*  Facturas Pen...
- Va a:
  - [edge:default] -> menu-1773330445948 | MenÃº suspendido

### menu-1762995979400
- Tipo: menu
- Label: MenÃº opcion pago
- Función: Opciones: Deposito ðŸ’¸ | Pago con T.C. | MenÃº inicio 
- Va a:
  - [edge:button-1] -> jump-1766253899945 | Saltar factura deposito suspendido
  - [edge:button-2] -> send-message-1773332895410 | Enviar Mensaje pagar con TC
  - [edge:button-3] -> jump-1767112144248 | Saltar factura link de pago
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1763127054522 | (nodo no encontrado)

### menu-1762995979400-copy-1762997112345
- Tipo: menu
- Label: MenÃº Activo
- Función: Opciones: Pagar Factura ðŸ’³ | Soporte âš™ï¸ | Otras opciones ðŸ“‹
- Va a:
  - [edge:button-option-1762996133754] -> menu-1762995979400-copy-1762997112345-copy-1762997212656 | MenÃº Soporte
  - [edge:button-3] -> menu-1772481648701 | MenÃº otras opciones
  - [edge:button-1] -> menu-1762995979400 | MenÃº opcion pago
  - [edge:button-2] -> send-message-1773116650556 | Enviar Mensaje
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1763127054522 | (nodo no encontrado)

### menu-1762995979400-copy-1762997112345-copy-1762997212656
- Tipo: menu
- Label: MenÃº Soporte
- Función: Opciones: Soporte wifi ðŸ“¶ | Cambios en wifi âš™ï¸ðŸ“¶ | soporte
- Va a:
  - [edge:button-1] -> send-message-1762998601495 | MensajeEsperaSoporte
  - [edge:default] -> send-message-1762998601495 | MensajeEsperaSoporte
  - [edge:button-2] -> send-message-1773092866102 | Enviar Mensaje ante del token
  - [edge:button-3] -> jump-1773178142316 | Saltar
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1763010501173 | (nodo no encontrado)

### send-message-1762998601495
- Tipo: send-message
- Label: MensajeEsperaSoporte
- Función: Mensaje: â³ Por favor espere  Estamos verificando posibles averÃ­as. Este proceso tomarÃ¡ aproximadamente 2 minutos. ðŸ› ï¸ðŸ”
- Va a:
  - [edge:default] -> send-message-1762998601495-copy-1763007815746 | âš™ï¸ Inicia Soporte

### send-message-1762998601495-copy-1763007815746
- Tipo: send-message
- Label: âš™ï¸ Inicia Soporte
- Función: Mensaje: âš™ï¸ Inicia Soporte
- Va a:
  - [edge:default] -> conditional-1763008248784 | CondiciÃ³n idexterno

### api-call-1763007930151
- Tipo: api-call
- Label: APIRXEquipos
- Función: API POST {url_consulta}/rxequipos
- Va a:
  - [edge:default] -> send-message-1763008406084 | Enviar Mensaje potencia onu

### conditional-1763008248784
- Tipo: conditional
- Label: CondiciÃ³n idexterno
- Función: Condiciones: 2
- Va a:
  - [edge:1763008258945] -> api-call-1763007930151 | APIRXEquipos
  - [edge:1] -> send-message-1763008323358 | Usuario Sin IdExternal

### send-message-1763008323358
- Tipo: send-message
- Label: Usuario Sin IdExternal
- Función: Mensaje: ðŸ›‘ Verificar ID Externo del Perfil del Cliente  Se requiere la verificaciÃ³n del ID externo asociado al perfil del cli...
- Va a:
  - [edge:default] -> send-message-1763008526624 | Averia2

### send-message-1763008406084
- Tipo: send-message
- Label: Enviar Mensaje potencia onu
- Función: Mensaje: ðŸ“¶ *{potenciaOnu}*
- Va a:
  - [edge:default] -> send-message-1763008526624 | Averia2

### send-message-1763008526624
- Tipo: send-message
- Label: Averia2
- Función: Mensaje: âš ï¸ Un momento, estamos verificando posibles averÃ­as  Nuestro sistema se encuentra revisando el estado del servicio....
- Va a:
  - [edge:default] -> send-message-1763009797223 | MensajeOnu

### send-message-1763009797223
- Tipo: send-message
- Label: MensajeOnu
- Función: Mensaje: ðŸ“¡ InformaciÃ³n del nodo y equipo  Nodo: {NombreNodo} Conectado a: *{NodoConectado}*
- Va a:
  - [edge:default] -> conditional-1766585447748 | CondiciÃ³n onustatus

### api-call-1763010400809
- Tipo: api-call
- Label: APITicktes 
- Función: API POST {url_consulta}/tickets/crear
- Va a:
  - [edge:default] -> send-message-1766553441600 | Enviar Mensaje

### api-call-1763010400809-copy-1763010434637
- Tipo: api-call
- Label: APIConsultadispositivos conectados
- Función: API POST {url_consulta}/devices/conectados
- Va a:
  - [edge:default] -> send-message-1766319194218 | Enviar Mensaje de finalizacion  en cont disp

### input-form-1763039114399
- Tipo: input-form
- Label: Input Form
- Función: Campos: 2
- Va a: (sin salida)

### chatgpt-agent-1763225282394
- Tipo: chatgpt-agent
- Label: Agente ChatGPT
- Función: Modelo: gpt-4o-mini
- Va a:
  - [edge:default] -> intent-classifier-1763243992926 | Clasificador de Intenciones

### intent-classifier-1763243992926
- Tipo: intent-classifier
- Label: Clasificador de Intenciones
- Función: Intenciones: 5
- Va a:
  - [edge:soporte] -> send-message-1763244731373 | Mensaje de Intencion Soporte
  - [edge:facturacion] -> send-message-1763244731373-copy-1764460787502 | Mensaje de Intencion Facturacion
  - [edge:comprobante_pago] -> send-message-1763244731373-copy-1764460787502-copy-1764460797714 | Mensaje de Intencion Comprobante de Pago
  - [edge:ventas] -> send-message-1763244731373-copy-1764460787502-copy-1764460797714-copy-1764460835343 | Mensaje de Intencion Venta
  - [edge:cambiar contraseÃ±a] -> send-message-1763244731373-copy-1764460787502-copy-1764460797714-copy-1764460835343-copy-1766309556484 | Mensaje de Intencion ContraseÃ±a
  - [edge:contratar] -> send-message-1763244731373-copy-1764460787502-copy-1764460797714-copy-1764460835343-copy-1766309556484-copy-1766309602217 | Mensaje de Intencion Contratar
  - [edge:Reiniciar router] -> send-message-1763244731373-copy-1764460787502-copy-1764460797714-copy-1764460835343-copy-1766309556484-copy-1766309602217-copy-1766550710512 | Mensaje de Intencion Reinciar router
  - [edge:dispositivos conectados] -> send-message-1763244731373-copy-1764460787502-copy-1764460797714-copy-1764460835343-copy-1766309556484-copy-1766309602217 | Mensaje de Intencion Contratar
  - [edge:default] -> jump-1773171314336 | Saltar

### send-message-1763244731373
- Tipo: send-message
- Label: Mensaje de Intencion Soporte
- Función: Mensaje: Soporte IntenciÃ³n detectada: {intencion}  
- Va a:
  - [edge:default] -> team-1765286051662 | Definir Equipo soporte

### image-processor-1763252921842
- Tipo: image-processor
- Label: Procesador de Imagen
- Función: Procesa imagen a variable: imagen_analisis
- Va a:
  - [edge:default] -> menu-1773324687307 | MenÃº principal

### whatsapp-template-1764398678441
- Tipo: whatsapp-template
- Label: WhatsApp Template
- Va a: (sin salida)

### send-message-1763244731373-copy-1764460787502
- Tipo: send-message
- Label: Mensaje de Intencion Facturacion
- Función: Mensaje: Facturacion IntenciÃ³n detectada: {intencion}  
- Va a:
  - [edge:default] -> jump-1767111636413 | Saltarmenu opcion de pagos

### send-message-1763244731373-copy-1764460787502-copy-1764460797714
- Tipo: send-message
- Label: Mensaje de Intencion Comprobante de Pago
- Función: Mensaje: Comprobante IntenciÃ³n detectada: {intencion}  
- Va a:
  - [edge:default] -> jump-1766763730206 | Saltar a pago deposito

### send-message-1763244731373-copy-1764460787502-copy-1764460797714-copy-1764460835343
- Tipo: send-message
- Label: Mensaje de Intencion Venta
- Función: Mensaje: IntenciÃ³n detectada: {intencion}  
- Va a:
  - [edge:default] -> jump-1766308945599 | Saltar ventas

### ollama-agent-1763175986905-copy-1764481749623
- Tipo: ollama-agent
- Label: Agente Ollama (copia)
- Función: Modelo: llama3.2:latest
- Va a: (sin salida)

### conditional-1764533270129
- Tipo: conditional
- Label: CondicionCantidadFactura deposit
- Función: Condiciones: 3
- Va a:
  - [edge:1764533295408] -> send-message-1766250663334-copy-1766275310421-copy-1766438314619 | Enviar Mensaje mas de 1 fac sp (copia)
  - [edge:1764533321346] -> jump-1766852212705 | Saltar fact no pagadas
  - [edge:1766852165372] -> send-media-1764534131197 | Enviar Multimedia imagen pagos

### send-message-1764533973763
- Tipo: send-message
- Label: Enviar Mensaje pago con tarjetas
- Función: Mensaje: ðŸ’³ Aceptamos todas las tarjetas de crÃ©dito  Tarjetas aceptadas: Visa / Mastercard / American Express / Diners / Disco...
- Va a:
  - [edge:default] -> api-call-1766251724668 | Crear link de Pago

### send-media-1764534131197
- Tipo: send-media
- Label: Enviar Multimedia imagen pagos
- Va a:
  - [edge:default] -> input-1767648404910 | Entrada img

### conditional-1764534891961
- Tipo: conditional
- Label: CondiciÃ³n analisis de imagen
- Función: Condiciones: 2
- Va a:
  - [edge:1764534943808] -> send-message-1764534967101 | Enviar Mensaje datos de la imagen
  - [edge:1] -> send-message-1762969665923 | MensajeBienvenida

### send-message-1764534967101
- Tipo: send-message
- Label: Enviar Mensaje datos de la imagen
- Función: Mensaje: ðŸ’³ Detalle del comprobante de pago recibido  Valor: ðŸ’° {monto} NÃºmero de comprobante: ðŸ§¾ {numero_comprobante} Cue...
- Va a:
  - [edge:default] -> code-1773022732584 | CÃ³digo123

### menu-1764536546789
- Tipo: menu
- Label: MenÃº inicio pago img
- Función: Opciones: SI ðŸ’³ | NO 
- Va a:
  - [edge:button-3] -> transfer-1764537035098 | Transferir a atencion a cliente
  - [edge:button-1] -> conditional-1766202527111 | CondiciÃ³n facturas pagadas
  - [edge:button-2] -> jump-1766525918378 | Saltar inicio 3
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1763127054522 | (nodo no encontrado)

### transfer-1764537035098
- Tipo: transfer
- Label: Transferir a atencion a cliente
- Función: Transferencia a equipo: Atencion al cliente
- Va a: (sin salida)

### conditional-1765285111973
- Tipo: conditional
- Label: Existe Cliente
- Función: Condiciones: 2
- Va a:
  - [edge:1765285430352] -> code-1762977774930 | CodeSmartOlt
  - [edge:1] -> chatgpt-agent-1763225282394 | Agente ChatGPT
  - [edge:1764533295408] -> code-1762977774930 | CodeSmartOlt
  - [edge:1764533321346] -> chatgpt-agent-1763225282394 | Agente ChatGPT

### team-1765286051662
- Tipo: team
- Label: Definir Equipo soporte
- Función: Equipo: Soporte
- Va a:
  - [edge:default] -> transfer-1765286077311 | Transferir a soporte

### transfer-1765286077311
- Tipo: transfer
- Label: Transferir a soporte
- Función: Transferencia a equipo: Sin equipo asignado
- Va a: (sin salida)

### conditional-1765373523399
- Tipo: conditional
- Label: ValidaExternal
- Función: Condiciones: 2
- Va a:
  - [edge:1765373572525] -> send-message-1765373613586 | NoCuenta con Identificador
  - [edge:1] -> send-message-1773176493551 | Enviar Mensaje generar token

### send-message-1765373613586
- Tipo: send-message
- Label: NoCuenta con Identificador
- Función: Mensaje: ðŸš«No  cuentas con el identificador del equipo,  espera que un agente se comunique 
- Va a:
  - [edge:default] -> menu-1766592056133 | MenÃº ir soporte2

### transfer-1765373700225
- Tipo: transfer
- Label: Transferir Soporte
- Función: Transferencia a equipo: Soporte
- Va a: (sin salida)

### api-call-1765373757698
- Tipo: api-call
- Label: API Externa Token
- Función: API POST {url_consulta}/token/generar
- Va a:
  - [edge:default] -> conditional-1766745189212 | CondiciÃ³n estado token

### transfer-1765377688743
- Tipo: transfer
- Label: Transferir Soporte Wifi
- Función: Transferencia a equipo: Soporte
- Va a: (sin salida)

### menu-1765377905615
- Tipo: menu
- Label: MenÃº Cambio Wifi
- Función: Opciones: Cambiar nombre âœï¸ | ContraseÃ±aðŸ” | ðŸ‘ï¸â€ðŸ—¨ï¸ Ocultar red
- Va a:
  - [edge:button-3] -> menu-1766594018083 | MenÃº visivilidad wifi
  - [edge:button-2] -> input-1767107847568 | Entrada new contra
  - [edge:button-1] -> input-1767107879782 | Entrada new name wifi
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1765373700225 | Transferir Soporte

### conditional-1766202527111
- Tipo: conditional
- Label: CondiciÃ³n facturas pagadas
- Función: Condiciones: 2
- Va a:
  - [edge:1] -> jump-1767112091581 | Saltar mas fact no pag
  - [edge:1766202625484] -> send-message-1773341454527 | Enviar Mensaje

### jump-1766236483520
- Tipo: jump
- Label: SaltarCambio Clave
- Función: Salta a: conditional-1765373523399
- Va a:
  - [implicit-jump:targetNodeId] -> conditional-1765373523399 | ValidaExternal

### conditional-1764533270129-copy-1766250311606
- Tipo: conditional
- Label: CondicionCantidadFactura tarjeta
- Función: Condiciones: 3
- Va a:
  - [edge:1764533295408] -> send-message-1766251669420 | Enviar Mensaje mas de 1 factura
  - [edge:1766852049216] -> code-1766524944579-copy-1766583116913 | Code (copia)
  - [edge:1764533321346] -> send-message-1766852075584 | Enviar Mensaje de no facturas 

### transfer-1766250775008
- Tipo: transfer
- Label: Transferir a facturacion
- Función: Transferencia a equipo: Facturacion
- Va a: (sin salida)

### transfer-1766251654128
- Tipo: transfer
- Label: Transferir eq facturacion
- Función: Transferencia a equipo: Facturacion
- Va a: (sin salida)

### send-message-1766251669420
- Tipo: send-message
- Label: Enviar Mensaje mas de 1 factura
- Función: Mensaje: âš ï¸ Facturas pendientes  Al momento, posee mÃ¡s de una factura impaga. Su caso serÃ¡ transferido automÃ¡ticamente al ...
- Va a:
  - [edge:default] -> menu-1766584180467 | MenÃº de no facturass o mas facturas

### api-call-1766251724668
- Tipo: api-call
- Label: Crear link de Pago
- Función: API POST {url_consulta}/linkpagotc
- Va a:
  - [edge:default] -> conditional-1766583311426 | CondiciÃ³n link depago

### jump-1766253899945
- Tipo: jump
- Label: Saltar factura deposito suspendido
- Función: Salta a: conditional-1764533270129
- Va a:
  - [implicit-jump:targetNodeId] -> conditional-1764533270129 | CondicionCantidadFactura deposit

### send-message-1766258911584
- Tipo: send-message
- Label: contraseÃ±a a cambiada
- Función: Mensaje: ðŸ” ConfirmaciÃ³n de cambio de contraseÃ±a  Â¿EstÃ¡ seguro de que desea cambiar  la contraseÃ±a de su Wi-Fi a: *{newcon...
- Va a:
  - [edge:default] -> menu-1767817863996 | MenÃº conf contra

### menu-1766259097748
- Tipo: menu
- Label: MenÃº otro token
- Función: Opciones: Reintentar ðŸ”„ | Enviar token ðŸ“¤ðŸ”‘ | Salir a menÃº ðŸ”™ðŸ“‹
- Va a:
  - [edge:button-1] -> jump-1766259167852 | Saltar entrada tokenwifi
  - [edge:button-2] -> jump-1766261027480 | Saltar tokenwifi
  - [edge:button-3] -> jump-1766308672762 | Saltar principal
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1764537035098 | Transferir a atencion a cliente

### jump-1766259167852
- Tipo: jump
- Label: Saltar entrada tokenwifi
- Función: Salta a: input-1767107816310
- Va a:
  - [implicit-jump:targetNodeId] -> input-1767107816310 | Entrada token wifi

### send-message-1766259541281
- Tipo: send-message
- Label: Enviar Mensaje error generartoken
- Función: Mensaje: âŒ Error al generar el token  No fue posible completar la operaciÃ³n. Por favor, intente nuevamente mÃ¡s tarde. âš ï¸
- Va a:
  - [edge:default] -> menu-1766592056133 | MenÃº ir soporte2

### api-call-1766260762605
- Tipo: api-call
- Label: API Externa cambio de contra
- Función: API POST {url_consulta}/cambiar_contra
- Va a:
  - [edge:default] -> send-message-1766761706611 | Enviar Mensaje de error visivilidad

### send-message-1766260852226
- Tipo: send-message
- Label: Enviar Mensaje token no valido
- Función: Mensaje: âŒ Token invÃ¡lido  El token ingresado no es vÃ¡lido. âš ï¸ Por favor, verifique el cÃ³digo y vuelva a intentarlo.
- Va a:
  - [edge:default] -> menu-1766259097748 | MenÃº otro token

### jump-1766261027480
- Tipo: jump
- Label: Saltar tokenwifi
- Función: Salta a: conditional-1765373523399
- Va a:
  - [implicit-jump:targetNodeId] -> conditional-1765373523399 | ValidaExternal

### jump-1766263562179
- Tipo: jump
- Label: Saltar validaexternal
- Función: Salta a: conditional-1765373523399
- Va a:
  - [implicit-jump:targetNodeId] -> conditional-1765373523399 | ValidaExternal

### api-call-1766304032294
- Tipo: api-call
- Label: API Externa pagar factura
- Función: API POST {url_consulta}/pagar_factura
- Va a:
  - [edge:default] -> code-1766525598954 | Code sacar code y mensaje de pago

### send-message-1766304042461
- Tipo: send-message
- Label: Enviar Mensaje pago exitoso
- Función: Mensaje: âœ… Â¡Pago recibido con Ã©xito!  Tu pago ha sido registrado correctamente en  nuestro sistema. âœ”ï¸  â³ La actualizac...
- Va a:
  - [edge:default] -> send-message-1773159168849 | Enviar Mensaje

### conditional-1766304072641
- Tipo: conditional
- Label: CondiciÃ³n codigo resp pago
- Función: Condiciones: 3
- Va a:
  - [edge:default] -> send-message-1766304042461 | Enviar Mensaje pago exitoso
  - [edge:1766304138486] -> send-message-1766304042461 | Enviar Mensaje pago exitoso
  - [edge:1766539115186] -> send-message-1766304163319 | Enviar Mensaje pago fallido
  - [edge:1] -> send-message-1766304042461 | Enviar Mensaje pago exitoso

### send-message-1766304163319
- Tipo: send-message
- Label: Enviar Mensaje pago fallido
- Función: Mensaje: âŒ Error al realizar el pago  No fue posible completar la operaciÃ³n. Motivo: âš ï¸ {mensaje_respuesta_pago}
- Va a:
  - [edge:default] -> menu-1766305926342 | MenÃº reintentar pago

### menu-1766305926342
- Tipo: menu
- Label: MenÃº reintentar pago
- Función: Opciones: Reintentar ðŸ”„ | Ir a menÃº ðŸ“‹
- Va a:
  - [edge:button-1] -> jump-1766306034873 | Saltar acondicion factura pagadas
  - [edge:button-2] -> jump-1766306030325 | Saltar a menu
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1763127054522 | (nodo no encontrado)

### jump-1766306030325
- Tipo: jump
- Label: Saltar a menu
- Función: Salta a: menu-1764536546789
- Va a:
  - [implicit-jump:targetNodeId] -> menu-1764536546789 | MenÃº inicio pago img

### jump-1766306034873
- Tipo: jump
- Label: Saltar acondicion factura pagadas
- Función: Salta a: conditional-1766202527111
- Va a:
  - [implicit-jump:targetNodeId] -> conditional-1766202527111 | CondiciÃ³n facturas pagadas

### conditional-1766308384259
- Tipo: conditional
- Label: CondiciÃ³n error visivilidad wifi
- Función: Condiciones: 2
- Va a:
  - [edge:1766308638080] -> send-message-1766308666080 | Enviar Mensaje cambio de contra 000
  - [edge:1] -> send-message-1766308685502 | Enviar Mensaje cambio de contra 001

### send-message-1766308666080
- Tipo: send-message
- Label: Enviar Mensaje cambio de contra 000
- Función: Mensaje: âœ… ContraseÃ±a cambiada con Ã©xito  La contraseÃ±a ha sido actualizada correctamente. El cambio ya se encuentra activo....
- Va a:
  - [edge:default] -> wait-1766438633918 | Esperar

### jump-1766308672762
- Tipo: jump
- Label: Saltar principal
- Función: Salta a: send-media-1762970199587
- Va a:
  - [implicit-jump:targetNodeId] -> send-media-1762970199587 | ImagenActualizaPlan

### send-message-1766308685502
- Tipo: send-message
- Label: Enviar Mensaje cambio de contra 001
- Función: Mensaje: âŒ Error al cambiar la contraseÃ±a  No fue posible completar la operaciÃ³n. Se produjo el siguiente error:  âš ï¸ {err...
- Va a:
  - [edge:default] -> wait-1766438633918 | Esperar

### jump-1766308945599
- Tipo: jump
- Label: Saltar ventas
- Función: Salta a: menu-1766326364818
- Va a:
  - [implicit-jump:targetNodeId] -> menu-1766326364818 | MenÃº nuevo usuario

### send-message-1763244731373-copy-1764460787502-copy-1764460797714-copy-1764460835343-copy-1766309556484
- Tipo: send-message
- Label: Mensaje de Intencion ContraseÃ±a
- Va a:
  - [edge:default] -> jump-1766263562179 | Saltar validaexternal

### send-message-1763244731373-copy-1764460787502-copy-1764460797714-copy-1764460835343-copy-1766309556484-copy-1766309602217
- Tipo: send-message
- Label: Mensaje de Intencion Contratar
- Función: Mensaje: vas a ver la cantidad de dispositivos conectados
- Va a:
  - [edge:default] -> jump-1766309750957 | Saltar cliente nuevo

### jump-1766309750957
- Tipo: jump
- Label: Saltar cliente nuevo
- Función: Salta a: menu-1766729748637-copy-1766734229423
- Va a:
  - [implicit-jump:targetNodeId] -> menu-1766729748637-copy-1766734229423 | (nodo no encontrado)

### jump-1766312437511
- Tipo: jump
- Label: Saltar menu activo
- Función: Salta a: menu-1762995979400-copy-1762997112345
- Va a:
  - [implicit-jump:targetNodeId] -> menu-1762995979400-copy-1762997112345 | MenÃº Activo

### api-call-1766312772508
- Tipo: api-call
- Label: API Externa generar ticket preinstala
- Función: API GET 
- Va a:
  - [edge:default] -> conditional-1766312809790 | CondiciÃ³n install servise

### send-message-1766312795261
- Tipo: send-message
- Label: Enviar Mensaje error reg tiket
- Función: Mensaje: âŒ Error al crear ticket de instalaciÃ³n  No fue posible generar el ticket en este momento. âš ï¸ Si ya intentÃ³ varia...
- Va a:
  - [edge:default] -> menu-1766313135163 | MenÃº reintentar crear ticket

### conditional-1766312809790
- Tipo: conditional
- Label: CondiciÃ³n install servise
- Función: Condiciones: 2
- Va a:
  - [edge:1766312819069] -> send-message-1766312795261 | Enviar Mensaje error reg tiket
  - [edge:1] -> send-message-1766312901662 | Enviar Mensaje true reg ticket

### send-message-1766312901662
- Tipo: send-message
- Label: Enviar Mensaje true reg ticket
- Función: Mensaje: âœ… Ticket de instalaciÃ³n registrado. Un agente de RodNetse comunicarÃ¡ con usted pronto  para coordinar la instalaciÃ³...
- Va a:
  - [edge:default] -> wait-1766440056094 | Esperar

### menu-1766313135163
- Tipo: menu
- Label: MenÃº reintentar crear ticket
- Función: Opciones: Reintentar ðŸ”„ | Ir a menÃº ðŸ“‹ | Agente ðŸ‘¤
- Va a:
  - [edge:button-1] -> jump-1766313190309 | Saltar reintentar contratar
  - [edge:button-2] -> jump-1766313194245 | Saltar principal
  - [edge:button-3] -> transfer-1766440162573 | Transferir soporte 3
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1763127054522 | (nodo no encontrado)

### jump-1766313190309
- Tipo: jump
- Label: Saltar reintentar contratar
- Función: Salta a: send-message-1766310380947
- Va a:
  - [implicit-jump:targetNodeId] -> send-message-1766310380947 | (nodo no encontrado)

### jump-1766313194245
- Tipo: jump
- Label: Saltar principal
- Función: Salta a: menu-1766326110852
- Va a:
  - [implicit-jump:targetNodeId] -> menu-1766326110852 | (nodo no encontrado)

### send-message-1766314477609
- Tipo: send-message
- Label: Enviar Mensaje los onu
- Función: Mensaje: âš ï¸ Estado de red: LOSS  Se ha detectado que el estado de su red estÃ¡ en LOSS. Se generarÃ¡ automÃ¡ticamente un tick...
- Va a:
  - [edge:default] -> code-1766496319920-copy-1766496416726 | Code

### conditional-1766317512270
- Tipo: conditional
- Label: CondiciÃ³n estado ticket
- Función: Condiciones: 3
- Va a:
  - [edge:1766317518071] -> send-message-1766317557325 | Enviar Mensaje ticker reg
  - [edge:1] -> send-message-1766317558691 | Enviar Mensaje  ticket reg
  - [edge:1766554960148] -> send-message-1766317557325 | Enviar Mensaje ticker reg
  - [edge:1772656232920] -> send-message-1766555037869 | Enviar Mensaje error ticket

### send-message-1766317557325
- Tipo: send-message
- Label: Enviar Mensaje ticker reg
- Función: Mensaje: âš ï¸ Ticket existente  Ya existe un ticket abierto relacionado con su solicitud. Por favor, revise sus tickets para se...
- Va a:
  - [edge:default] -> menu-1766556714174 | MenÃº despues ticket

### send-message-1766317558691
- Tipo: send-message
- Label: Enviar Mensaje  ticket reg
- Función: Mensaje: âœ… Ticket registrado correctamente  Su ticket ha sido registrado con Ã©xito. âœ”ï¸ Pronto, un agente se comunicarÃ¡ co...
- Va a:
  - [edge:default] -> wait-1766556760124 | Esperar

### jump-1766317581608
- Tipo: jump
- Label: Saltar inicio
- Función: Salta a: transfer-1766440162573
- Va a:
  - [implicit-jump:targetNodeId] -> transfer-1766440162573 | Transferir soporte 3

### send-message-1766319194218
- Tipo: send-message
- Label: Enviar Mensaje de finalizacion  en cont disp
- Función: Mensaje: ðŸ“¡ Dispositivos conectados a su red  Actualmente, tiene en su red: *{cantidad_dis_conect}* dispositivos conectados.  L...
- Va a:
  - [edge:default] -> menu-1766319761365 | MenÃº ver otravez disp_con

### menu-1766319761365
- Tipo: menu
- Label: MenÃº ver otravez disp_con
- Función: Opciones: Recargar ðŸ”ƒ | ir a menÃº ðŸ“‹
- Va a:
  - [edge:button-2] -> jump-1766319856232 | Saltar inicio 2
  - [edge:button-1] -> jump-1766414628790 | Saltar menu online

### jump-1766319856232
- Tipo: jump
- Label: Saltar inicio 2
- Función: Salta a: send-media-1762970199587
- Va a:
  - [implicit-jump:targetNodeId] -> send-media-1762970199587 | ImagenActualizaPlan

### api-call-1766319940822
- Tipo: api-call
- Label: API Externa reinicio de wifi
- Función: API POST {url_consulta}/router/reiniciar
- Va a:
  - [edge:default] -> conditional-1766320796688 | CondiciÃ³n reinicio de router

### conditional-1766320796688
- Tipo: conditional
- Label: CondiciÃ³n reinicio de router
- Función: Condiciones: 2
- Va a:
  - [edge:1766321609249] -> send-message-1766321665176 | Enviar Mensaje reinicio exitoso
  - [edge:1] -> send-message-1766321657695 | Enviar Mensaje error reinicio

### send-message-1766321657695
- Tipo: send-message
- Label: Enviar Mensaje error reinicio
- Función: Mensaje: âŒ Reinicio fallido  No fue posible completar el proceso de reinicio. âš ï¸ Por favor, intente nuevamente mÃ¡s tarde. ...
- Va a:
  - [edge:default] -> menu-1766321751232 | MenÃº reinicio fallido

### send-message-1766321665176
- Tipo: send-message
- Label: Enviar Mensaje reinicio exitoso
- Función: Mensaje: âœ… Reinicio exitoso  El proceso se completÃ³ correctamente. âœ”ï¸ Estado del sistema: *{response_reincio}*
- Va a:
  - [edge:default] -> jump-1766414628790 | Saltar menu online

### menu-1766321751232
- Tipo: menu
- Label: MenÃº reinicio fallido
- Función: Opciones: reintentar ðŸ”„ | salir
- Va a:
  - [edge:button-1] -> jump-1766414628790 | Saltar menu online

### send-message-1766322819300
- Tipo: send-message
- Label: Enviar Mensaje offline onu
- Función: Mensaje: âš ï¸ Problema detectado en el router  Se ha detectado que su router presenta problemas de energÃ­a. Por favor, revise ...
- Va a:
  - [edge:default] -> code-1766496319920 | Code

### api-call-1766325219878
- Tipo: api-call
- Label: API Externa cambio de ssid
- Función: API POST {url_consulta}/wifi/ssid
- Va a:
  - [edge:default] -> conditional-1766325401132 | CondiciÃ³n estado cambiarssid

### conditional-1766325401132
- Tipo: conditional
- Label: CondiciÃ³n estado cambiarssid
- Función: Condiciones: 2
- Va a:
  - [edge:1766325701645] -> send-message-1766325727329 | Enviar Mensaje cambioname 000
  - [edge:1] -> send-message-1766325739949 | Enviar Mensaje cambio name 001

### send-message-1766325727329
- Tipo: send-message
- Label: Enviar Mensaje cambioname 000
- Función: Mensaje: El nombre ha sido actualizado correctamente. Los cambios ya se encuentran activos y visibles. âœ”ï¸
- Va a:
  - [edge:default] -> wait-1766438599315 | Esperar

### send-message-1766325739949
- Tipo: send-message
- Label: Enviar Mensaje cambio name 001
- Función: Mensaje: âŒ Fallo al cambiar el nombre de la red  No fue posible completar la actualizaciÃ³n solicitada. El nombre de la red no ...
- Va a:
  - [edge:default] -> wait-1766438599315 | Esperar

### menu-1766325820061
- Tipo: menu
- Label: MenÃº reintentar cambionamewifi
- Función: Opciones: Ir con soporte ðŸŽ§ | Salir a menÃº ðŸ”™ðŸ“‹ | Salir âŒ
- Va a:
  - [edge:button-2] -> jump-1766325925602 | Saltar principal
  - [edge:button-1] -> transfer-1766763364879 | Transferir a soporte 2
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1763127054522 | (nodo no encontrado)

### jump-1766325925602
- Tipo: jump
- Label: Saltar principal
- Función: Salta a: send-media-1762970199587
- Va a:
  - [implicit-jump:targetNodeId] -> send-media-1762970199587 | ImagenActualizaPlan

### menu-1766326364818
- Tipo: menu
- Label: MenÃº nuevo usuario
- Función: Opciones: Ver planes ðŸ“‹ | Contratar ðŸ“‘ | Salir âŒ
- Va a:
  - [edge:button-1] -> send-media-1766433608226 | Enviar Multimedia imagen planes
  - [edge:button-2] -> conditional-1767122250943 | CondiciÃ³n cedula esta vacÃ­o contrato
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1763127054522 | (nodo no encontrado)

### send-message-1766387508641
- Tipo: send-message
- Label: Enviar Mensaje toekn
- Función: Mensaje: sale con {token_wifi} {mensaje_token} {estado_token}   a los datos de  "cedula":"{cedulaCliente}",  "movil": "{telefono_...
- Va a: (sin salida)

### send-message-1766389387538
- Tipo: send-message
- Label: Enviar Mensaje respuesta validatoken
- Función: Mensaje: ðŸ“„ Respuesta del sistema  Mensaje: ðŸ’¬ {mensaje_insertoken}  Estado: âš¡ {estado_insertoken}
- Va a:
  - [edge:default] -> conditional-1766757909820 | CondiciÃ³n valida token

### send-message-1766389832162
- Tipo: send-message
- Label: Enviar Mensaje respuesta entrada token
- Función: Mensaje: Token ingresado: {tokenentrada} â³
- Va a:
  - [edge:default] -> conditional-1766853054453 | CondiciÃ³n entrada de token

### ocr-vision-1766408107820
- Tipo: ocr-vision
- Label: OCR Vision
- Función: OCR a variable: ocr_result
- Va a: (sin salida)

### jump-1766414628790
- Tipo: jump
- Label: Saltar menu online
- Función: Salta a: menu-1767129532776
- Va a:
  - [implicit-jump:targetNodeId] -> menu-1767129532776 | MenÃº conectados - reinicio

### send-media-1766433608226
- Tipo: send-media
- Label: Enviar Multimedia imagen planes
- Va a:
  - [edge:default] -> menu-1766433701298 | MenÃº contratar

### menu-1766433701298
- Tipo: menu
- Label: MenÃº contratar
- Función: Opciones: Si | No, Salir
- Va a:
  - [edge:button-1] -> conditional-1767122250943 | CondiciÃ³n cedula esta vacÃ­o contrato
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1763127054522 | (nodo no encontrado)

### send-message-1766433860554
- Tipo: send-message
- Label: Enviar Mensaje pÂ´reregistro sin cedula
- Función: Mensaje:            "cedula": "{cedulaClientenew}",           "cliente": "{nombreCliente}",           "direccion": "{direccion_cl...
- Va a:
  - [edge:default] -> api-call-1766600498965 | API Externa preregistro sin ced

### send-message-1766250663334-copy-1766275310421-copy-1766438314619
- Tipo: send-message
- Label: Enviar Mensaje mas de 1 fac sp (copia)
- Función: Mensaje: âš ï¸ Facturas pendientes  Al momento posee mÃ¡s de una factura impaga. Su caso serÃ¡ transferido al equipo de  factura...
- Va a:
  - [edge:default] -> menu-1766584180467-copy-1766852290260 | MenÃº de no facturass o mas facturas (copia)

### wait-1766438599315
- Tipo: wait
- Label: Esperar
- Función: Espera: 20 seconds
- Va a:
  - [edge:default] -> menu-1766325820061 | MenÃº reintentar cambionamewifi

### wait-1766438633918
- Tipo: wait
- Label: Esperar
- Función: Espera: 20 seconds
- Va a:
  - [edge:default] -> menu-1766325820061 | MenÃº reintentar cambionamewifi

### wait-1766440056094
- Tipo: wait
- Label: Esperar
- Función: Espera: 5 seconds
- Va a:
  - [edge:default] -> jump-1766313194245 | Saltar principal

### transfer-1766440162573
- Tipo: transfer
- Label: Transferir soporte 3
- Función: Transferencia a equipo: Soporte
- Va a: (sin salida)

### jump-1766496166671
- Tipo: jump
- Label: Saltar a crear ticket
- Función: Salta a: api-call-1763010400809
- Va a:
  - [implicit-jump:targetNodeId] -> api-call-1763010400809 | APITicktes 

### code-1766496319920
- Tipo: code
- Label: Code
- Función: Código: let estadored = "TICKET DE SOPORTE - Estado de red POWER FAIL";
- Va a:
  - [edge:default] -> jump-1766496166671 | Saltar a crear ticket

### code-1766496319920-copy-1766496416726
- Tipo: code
- Label: Code
- Función: Código: let estadored = "TICKET DE SOPORTE - Estado de red LOS";
- Va a:
  - [edge:default] -> jump-1766496166671 | Saltar a crear ticket

### wait-1766497638935
- Tipo: wait
- Label: Esperar
- Función: Espera: 10 seconds
- Va a:
  - [edge:default] -> menu-1766592056133 | MenÃº ir soporte2

### jump-1766520034093
- Tipo: jump
- Label: Saltar menu pag
- Función: Salta a: send-message-1764534967101
- Va a:
  - [implicit-jump:targetNodeId] -> send-message-1764534967101 | Enviar Mensaje datos de la imagen

### code-1766524944579
- Tipo: code
- Label: Code
- Función: Código: let data = {id_factura}
- Va a:
  - [edge:default] -> conditional-1765285111973 | Existe Cliente

### code-1766525598954
- Tipo: code
- Label: Code sacar code y mensaje de pago
- Función: Código: let data = {Codigo_Respuesta_pago}
- Va a:
  - [edge:default] -> conditional-1766304072641 | CondiciÃ³n codigo resp pago

### jump-1766525918378
- Tipo: jump
- Label: Saltar inicio 3
- Función: Salta a: conditional-1773178368045
- Va a:
  - [implicit-jump:targetNodeId] -> conditional-1773178368045 | (nodo no encontrado)

### code-1766549824794
- Tipo: code
- Label: Code sacar datos del serivicio
- Función: Código: let servicios = {Servicios}
- Va a:
  - [edge:default] -> api-call-1766319940822 | API Externa reinicio de wifi

### send-message-1763244731373-copy-1764460787502-copy-1764460797714-copy-1764460835343-copy-1766309556484-copy-1766309602217-copy-1766550710512
- Tipo: send-message
- Label: Mensaje de Intencion Reinciar router
- Función: Mensaje: se va a reinciar su equipo
- Va a:
  - [edge:default] -> jump-1766550780789 | Saltar reinicio wifi

### jump-1766550780789
- Tipo: jump
- Label: Saltar reinicio wifi
- Función: Salta a: api-call-1766319940822
- Va a:
  - [implicit-jump:targetNodeId] -> api-call-1766319940822 | API Externa reinicio de wifi

### send-message-1766553441600
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: ðŸŽ« Estado de su solicitud  ðŸ“„ Resultado: *{estatoticket}*  ðŸ“ Detalle: *{mensaje_ticket}*  ðŸ“Œ Tickets abiertos: ...
- Va a:
  - [edge:default] -> menu-1766556714174 | MenÃº despues ticket

### send-message-1766555037869
- Tipo: send-message
- Label: Enviar Mensaje error ticket
- Función: Mensaje: âŒ Error al crear ticket  No fue posible generar el ticket en este momento. âš ï¸ Por favor, intente nuevamente mÃ¡s t...
- Va a:
  - [edge:default] -> menu-1766556714174 | MenÃº despues ticket

### menu-1766556714174
- Tipo: menu
- Label: MenÃº despues ticket
- Función: Opciones: Esperar soporte â³ðŸŽ§ | Salir âŒ
- Va a:
  - [edge:button-1] -> jump-1766317581608 | Saltar inicio

### wait-1766556760124
- Tipo: wait
- Label: Esperar
- Función: Espera: 15 seconds
- Va a:
  - [edge:default] -> menu-1766556714174 | MenÃº despues ticket

### code-1766524944579-copy-1766583116913
- Tipo: code
- Label: Code (copia)
- Función: Código: let data = {id_factura}
- Va a:
  - [edge:default] -> send-message-1764533973763 | Enviar Mensaje pago con tarjetas

### conditional-1766583311426
- Tipo: conditional
- Label: CondiciÃ³n link depago
- Función: Condiciones: 3
- Va a:
  - [edge:1766583318121] -> send-message-1766583449642 | Enviar Mensaje con link pago
  - [edge:1] -> send-message-1766583450948 | Enviar Mensaje error link pago
  - [edge:1766583316062] -> jump-1766583459253 | Saltar incio

### send-message-1766583449642
- Tipo: send-message
- Label: Enviar Mensaje con link pago
- Función: Mensaje: ðŸ’³ Link de pago generado  Su enlace de pago ha sido creado correctamente. Por favor, acceda al siguiente link para com...
- Va a:
  - [edge:default] -> jump-1773116631445 | Saltar

### send-message-1766583450948
- Tipo: send-message
- Label: Enviar Mensaje error link pago
- Función: Mensaje: âŒ Error al crear el enlace  No fue posible generar el enlace solicitado. âš ï¸  Posibles motivos: â€¢ Falta de datos ...
- Va a:
  - [edge:default] -> menu-1766583565291 | MenÃº falla linkpago

### jump-1766583459253
- Tipo: jump
- Label: Saltar incio
- Función: Salta a: send-media-1762970199587
- Va a:
  - [implicit-jump:targetNodeId] -> send-media-1762970199587 | ImagenActualizaPlan

### menu-1766583565291
- Tipo: menu
- Label: MenÃº falla linkpago
- Función: Opciones: Ir con soporte ðŸŽ§ | Regresar menÃº pago  | Salir âŒ
- Va a:
  - [edge:button-2] -> jump-1766583621651 | Saltar a menu pago
  - [edge:default] -> transfer-1766583627907 | Transferir eq facturacion 4
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1763127054522 | (nodo no encontrado)

### jump-1766583621651
- Tipo: jump
- Label: Saltar a menu pago
- Función: Salta a: menu-1762995979400
- Va a:
  - [implicit-jump:targetNodeId] -> menu-1762995979400 | MenÃº opcion pago

### transfer-1766583627907
- Tipo: transfer
- Label: Transferir eq facturacion 4
- Función: Transferencia a equipo: Facturacion
- Va a: (sin salida)

### menu-1766584180467
- Tipo: menu
- Label: MenÃº de no facturass o mas facturas
- Función: Opciones: Ir con soporte ðŸŽ§ | Salir âŒ
- Va a:
  - [edge:default] -> transfer-1766251654128 | Transferir eq facturacion

### conditional-1766585447748
- Tipo: conditional
- Label: CondiciÃ³n onustatus
- Función: Condiciones: 5
- Va a:
  - [edge:1766585466857] -> send-message-1766322819300 | Enviar Mensaje offline onu
  - [edge:1766585465193] -> send-message-1766314477609 | Enviar Mensaje los onu
  - [edge:1766585567961] -> send-message-1766322819300 | Enviar Mensaje offline onu
  - [edge:1] -> menu-1767129532776 | MenÃº conectados - reinicio

### send-message-1766585948228
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje:  "id":"{servicio_id}" {status_reinicio} {mensaje_reinicio} {response_code_reinicio}
- Va a:
  - [edge:default] -> conditional-1766320796688 | CondiciÃ³n reinicio de router

### menu-1766592056133
- Tipo: menu
- Label: MenÃº ir soporte2
- Función: Opciones: Ir con soporte ðŸŽ§ | MenÃº principal ðŸ  | Salir âŒ
- Va a:
  - [edge:button-1] -> transfer-1765373700225 | Transferir Soporte
  - [edge:button-option-1766592092690] -> jump-1772471014454 | Saltar
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1763127054522 | (nodo no encontrado)

### menu-1766594018083
- Tipo: menu
- Label: MenÃº visivilidad wifi
- Función: Opciones: Ocultar red ðŸ‘ï¸â€ðŸ—¨ï¸ | Revelar red ðŸ‘ï¸ðŸ“¶
- Va a:
  - [edge:button-2] -> code-1766594229838 | Code visivilidad red off
  - [edge:button-1] -> code-1766594231291 | Code visivilidad red on
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1763127054522 | (nodo no encontrado)

### code-1766594229838
- Tipo: code
- Label: Code visivilidad red off
- Función: Código: let estadovisi = true;
- Va a:
  - [edge:default] -> send-message-1767131436818 | Enviar Mensaje

### code-1766594231291
- Tipo: code
- Label: Code visivilidad red on
- Función: Código: let estadovisi = false;
- Va a:
  - [edge:default] -> send-message-1767131436818 | Enviar Mensaje

### send-message-1766594584524
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: âŒ Error al cambiar el estado del nombre de red  No fue posible actualizar el estado de la red. âš ï¸ Por favor, inten...
- Va a:
  - [edge:default] -> menu-1766594767148 | MenÃº ir soporte

### conditional-1766594599535
- Tipo: conditional
- Label: CondiciÃ³n estado visivilidad
- Función: Condiciones: 3
- Va a:
  - [edge:1766594635082] -> send-message-1766594584524 | Enviar Mensaje
  - [edge:1766594606194] -> send-message-1766594584524-copy-1766594832116 | Enviar Mensaje (copia)

### menu-1766594767148
- Tipo: menu
- Label: MenÃº ir soporte
- Función: Opciones: Ir con soporte ðŸŽ§ | Salir âŒ
- Va a:
  - [edge:button-1] -> transfer-1766594817565 | Transferir soporte
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1763127054522 | (nodo no encontrado)

### transfer-1766594817565
- Tipo: transfer
- Label: Transferir soporte
- Función: Transferencia a equipo: Soporte
- Va a: (sin salida)

### send-message-1766594584524-copy-1766594832116
- Tipo: send-message
- Label: Enviar Mensaje (copia)
- Función: Mensaje: âœ… Estado de red cambiado con Ã©xito  El estado de la red se ha actualizado correctamente. âœ”ï¸ Todos los cambios ya ...
- Va a:
  - [edge:default] -> wait-1766594860908 | Esperar

### wait-1766594860908
- Tipo: wait
- Label: Esperar
- Función: Espera:  
- Va a:
  - [edge:default] -> jump-1766308672762 | Saltar principal

### api-call-1766600498965
- Tipo: api-call
- Label: API Externa preregistro sin ced
- Función: API POST {url_consulta}/preregistro
- Va a:
  - [edge:default] -> conditional-1766615885569 | CondiciÃ³n preregistr

### send-message-1766615831556
- Tipo: send-message
- Label: Enviar Mensaje exito preregistro
- Función: Mensaje: ðŸ“„ ActualizaciÃ³n del preregistro  *{mensaje_newprere}*  Muy pronto, un asesor de Rodnet comunicarÃ¡ con usted para co...
- Va a:
  - [edge:default] -> wait-1766616027978 | Esperar

### conditional-1766615885569
- Tipo: conditional
- Label: CondiciÃ³n preregistr
- Función: Condiciones: 3
- Va a:
  - [edge:default] -> send-message-1766615831556 | Enviar Mensaje exito preregistro
  - [edge:1] -> send-message-1766615957855 | Enviar Mensaje
  - [edge:1766615930630] -> send-message-1767117101987 | Enviar Mensaje

### send-message-1766615957855
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: no se pudo crear su ticket de instalacion: *{mensaje_newprere}*  
- Va a:
  - [edge:default] -> menu-1766616046606 | MenÃº error prereg

### wait-1766616027978
- Tipo: wait
- Label: Esperar
- Función: Espera:  
- Va a:
  - [edge:default] -> transfer-1767125619851 | Transferir soporte

### menu-1766616046606
- Tipo: menu
- Label: MenÃº error prereg
- Función: Opciones: SÃ­ âœ… | Salir âŒ
- Va a:
  - [edge:button-1] -> transfer-1767125619851 | Transferir soporte

### image-buttons-1766689458166
- Tipo: image-buttons
- Label: Imagen + Botones
- Va a: (sin salida)

### conditional-1766745189212
- Tipo: conditional
- Label: CondiciÃ³n estado token
- Función: Condiciones: 3
- Va a:
  - [edge:1766745223372] -> send-message-1766259541281 | Enviar Mensaje error generartoken
  - [edge:1766745192671] -> send-message-1766756134009 | Enviar Mensaje

### menu-1766746168785
- Tipo: menu
- Label: MenÃº ingresar token
- Función: Opciones: Insertar token ðŸ”‘ | Hablar a agente ðŸ‘¨â€ | Salir âŒ
- Va a:
  - [edge:button-2] -> transfer-1765377688743 | Transferir Soporte Wifi
  - [edge:button-1] -> input-1767107816310 | Entrada token wifi

### send-message-1766756134009
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: Se generÃ³ un token ðŸ”‘  y fue enviado a su nÃºmero de telÃ©fono ðŸ“±  *{telefono_cliente}* para realizar cambios en su...
- Va a:
  - [edge:default] -> menu-1766746168785 | MenÃº ingresar token

### conditional-1766757909820
- Tipo: conditional
- Label: CondiciÃ³n valida token
- Función: Condiciones: 3
- Va a:
  - [edge:1766757927442] -> menu-1765377905615 | MenÃº Cambio Wifi
  - [edge:1766757910833] -> send-message-1766260852226 | Enviar Mensaje token no valido
  - [edge:1766757919568] -> send-message-1766757958201 | Enviar Mensaje

### send-message-1766757958201
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: âŒ Error al validar token  No fue posible confirmar el token ingresado. âš ï¸ Por favor, verifique que sea correcto e ...
- Va a:
  - [edge:default] -> jump-1766851137971 | Saltar menu soporte 2

### send-message-1766761679086
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: ðŸ“¶ Nuevo nombre de Wi-Fi  El nombre de su red Wi-Fi ha sido actualizado correctamente a: ðŸ“› {newnamewifi} âœ”ï¸
- Va a:
  - [edge:default] -> api-call-1766325219878 | API Externa cambio de ssid

### send-message-1766761706611
- Tipo: send-message
- Label: Enviar Mensaje de error visivilidad
- Función: Mensaje: {error_contra} {status_newcontra} {statusText_newcontra}
- Va a:
  - [edge:default] -> conditional-1766308384259 | CondiciÃ³n error visivilidad wifi

### transfer-1766763364879
- Tipo: transfer
- Label: Transferir a soporte 2
- Función: Transferencia a equipo: Soporte
- Va a: (sin salida)

### jump-1766763730206
- Tipo: jump
- Label: Saltar a pago deposito
- Función: Salta a: conditional-1764533270129
- Va a:
  - [implicit-jump:targetNodeId] -> conditional-1764533270129 | CondicionCantidadFactura deposit

### send-message-1766848817610
- Tipo: send-message
- Label: Enviar Mensaje error token
- Función: Mensaje: âŒ Error al ingresar los datos  OcurriÃ³ un error al procesar la informaciÃ³n ingresada. âš ï¸ Por favor, verifique lo...
- Va a:
  - [edge:default] -> jump-1767132060731 | Saltar menu soporte

### jump-1766851137971
- Tipo: jump
- Label: Saltar menu soporte 2
- Función: Salta a: menu-1766592056133
- Va a:
  - [implicit-jump:targetNodeId] -> menu-1766592056133 | MenÃº ir soporte2

### send-message-1766852075584
- Tipo: send-message
- Label: Enviar Mensaje de no facturas 
- Función: Mensaje: âœ… Sin facturas pendientes  Usted no posee ninguna factura sin pagar. âœ”ï¸ Su cuenta estÃ¡ al dÃ­a. ðŸ’³ðŸ“„
- Va a:
  - [edge:default] -> menu-1766584180467 | MenÃº de no facturass o mas facturas

### jump-1766852212705
- Tipo: jump
- Label: Saltar fact no pagadas
- Función: Salta a: send-message-1766852075584
- Va a:
  - [implicit-jump:targetNodeId] -> send-message-1766852075584 | Enviar Mensaje de no facturas 

### menu-1766584180467-copy-1766852290260
- Tipo: menu
- Label: MenÃº de no facturass o mas facturas (copia)
- Función: Opciones: ir con soporte | salir
- Va a:
  - [edge:button-1] -> transfer-1766250775008 | Transferir a facturacion

### conditional-1766853054453
- Tipo: conditional
- Label: CondiciÃ³n entrada de token
- Función: Condiciones: 2
- Va a:
  - [edge:1766853150464] -> send-message-1766848817610 | Enviar Mensaje error token
  - [edge:1766853063170] -> api-call-1765373757698-copy-1766756934456-copy-1767901427858 | API Externa Token validar (copia)

### input-1767107816310
- Tipo: input
- Label: Entrada token wifi
- Función: Pregunta: ðŸ”‘ Ingrese el token
- Va a:
  - [edge:default] -> send-message-1772481244221 | Enviar Mensaje Validando token...

### input-1767107847568
- Tipo: input
- Label: Entrada new contra
- Función: Pregunta: ðŸ” Ingrese la nueva contraseÃ±a
- Va a:
  - [edge:default] -> send-message-1766258911584 | contraseÃ±a a cambiada

### input-1767107879782
- Tipo: input
- Label: Entrada new name wifi
- Función: Pregunta: âœï¸ Ingrese el nuevo nombre
- Va a:
  - [edge:default] -> send-message-1766761679086 | Enviar Mensaje

### send-message-1767110307739
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: {estadoanteeior_visible} {estado_visibilidadred} {nuevoestado_visivi}  "info" : "{IdExterno}",  "visible" : "{estadovisi...
- Va a:
  - [edge:default] -> conditional-1766594599535 | CondiciÃ³n estado visivilidad

### jump-1767111636413
- Tipo: jump
- Label: Saltarmenu opcion de pagos
- Función: Salta a: menu-1762995979400
- Va a:
  - [implicit-jump:targetNodeId] -> menu-1762995979400 | MenÃº opcion pago

### jump-1767112091581
- Tipo: jump
- Label: Saltar mas fact no pag
- Función: Salta a: send-message-1766251669420
- Va a:
  - [implicit-jump:targetNodeId] -> send-message-1766251669420 | Enviar Mensaje mas de 1 factura

### jump-1767112144248
- Tipo: jump
- Label: Saltar factura link de pago
- Función: Salta a: menu-1773324687307
- Va a:
  - [implicit-jump:targetNodeId] -> menu-1773324687307 | MenÃº principal

### api-call-1767113645238
- Tipo: api-call
- Label: API Externa actualizar contrato pdf
- Función: API POST {url_consulta}/contrato/link
- Va a:
  - [edge:default] -> conditional-1767126552827 | CondiciÃ³n cedula contrato

### send-message-1767115615480
- Tipo: send-message
- Label: Enviar Mensaje exito contrato new
- Función: Mensaje: ðŸ“ Nuevo contrato generado  Se ha generado un nuevo contrato. Por favor, suba la foto de su cÃ©dula y realice la firma...
- Va a:
  - [edge:default] -> wait-1767116390777 | Esperar

### send-message-1767115794023
- Tipo: send-message
- Label: Enviar Mensaje nuevo contrato
- Función: Mensaje: ðŸªª CÃ©dula para el nuevo contrato  Se registrarÃ¡ la siguiente cÃ©dula para la creaciÃ³n del nuevo contrato: ðŸ“Œ {ced...
- Va a:
  - [edge:default] -> api-call-1767113645238 | API Externa actualizar contrato pdf

### conditional-1767115993233
- Tipo: conditional
- Label: CondiciÃ³n contrato new
- Función: Condiciones: 2
- Va a:
  - [edge:1767116006878] -> send-message-1767115615480 | Enviar Mensaje exito contrato new
  - [edge:1767116002551] -> send-message-1767116023377 | Enviar Mensaje error contrato new

### send-message-1767116023377
- Tipo: send-message
- Label: Enviar Mensaje error contrato new
- Función: Mensaje: âŒ Error al crear el link de contrato  No fue posible generar el enlace en este momento. âš ï¸ Por favor, intente nuev...
- Va a:
  - [edge:default] -> menu-1767116514981 | MenÃº error contrato new

### wait-1767116390777
- Tipo: wait
- Label: Esperar
- Función: Espera: 20 seconds
- Va a:
  - [edge:default] -> transfer-1767116494840 | Transferir a soporte 4

### transfer-1767116494840
- Tipo: transfer
- Label: Transferir a soporte 4
- Función: Transferencia a equipo: Soporte
- Va a: (sin salida)

### menu-1767116514981
- Tipo: menu
- Label: MenÃº error contrato new
- Función: Opciones: Soporte âš™ï¸ | Salir âŒ
- Va a:
  - [edge:button-1] -> transfer-1767116494840 | Transferir a soporte 4
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1763127054522 | (nodo no encontrado)

### input-1767116634024
- Tipo: input
- Label: Entrada direccion exacta
- Función: Pregunta: ðŸ“ Ingresa tu direcciÃ³n exacta

Por favor, proporciona tu direcciÃ³n completa y precisa para continuar.
Incluye calle, nÃºmero y una referencia de tu hogar (color de la casa, punto cercano, negocio, etc.). âœ”ï¸
- Va a:
  - [edge:default] -> input-1767116823632 | Entrada

### send-message-1767116706408
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: â“ Vamos a hacer algunas preguntas  Para poder continuar con su instalaciÃ³n, necesitamos recopilar algunos datos. Por ...
- Va a:
  - [edge:default] -> input-1767116771553 | Entrada direccion

### input-1767116771553
- Tipo: input
- Label: Entrada direccion
- Función: Pregunta: ðŸ“ Ingresa tu direcciÃ³n

Por favor, escribe tu direcciÃ³n para continuar con el proceso.
AsegÃºrate de que la informaciÃ³n sea correcta. âœ”ï¸
- Va a:
  - [edge:default] -> input-1767116634024 | Entrada direccion exacta

### input-1767116823632
- Tipo: input
- Label: Entrada
- Función: Pregunta: Por ultimo
ðŸ“§ Ingresa tu correo electrÃ³nico
- Va a:
  - [edge:default] -> code-1767124808418 | Code sacar fecha

### send-message-1767117101987
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: ðŸ“„ Resultado del nuevo preregistro  ID del preregistro de instalaciÃ³n: ðŸ†” {id_preregistro}  Estado: âš¡ {mensaje_ne...
- Va a:
  - [edge:default] -> send-message-1766615831556 | Enviar Mensaje exito preregistro

### conditional-1767122250943
- Tipo: conditional
- Label: CondiciÃ³n cedula esta vacÃ­o contrato
- Función: Condiciones: 2
- Va a:
  - [edge:1767122254005] -> input-1767122281769 | Entrada cedula si no tiene
  - [edge:1767122252890] -> send-message-1767116706408 | Enviar Mensaje

### input-1767122281769
- Tipo: input
- Label: Entrada cedula si no tiene
- Función: Pregunta: ðŸªª Ingrese su nÃºmero de cÃ©dula
- Va a:
  - [edge:default] -> input-1767123564234 | Entrada

### input-1767123564234
- Tipo: input
- Label: Entrada
- Función: Pregunta: ðŸ“ Ingrese su nombre completo
- Va a:
  - [edge:default] -> send-message-1767116706408 | Enviar Mensaje

### conditional-1767122250943-copy-1767123725638
- Tipo: conditional
- Label: CondiciÃ³n cedula cliente esta vacÃ­o 2
- Función: Condiciones: 2
- Va a:
  - [edge:1767122254005] -> api-call-1766600498965 | API Externa preregistro sin ced
  - [edge:1767122252890] -> api-call-1766600498965-copy-1767123823398 | API Externa preregistro con ced

### send-message-1766433860554-copy-1767123789110
- Tipo: send-message
- Label: Enviar Mensaje preregistro con cedula
- Función: Mensaje:            "cedula": "{cedulaCliente}",           "cliente": "{nombreCliente}",           "direccion": "{direccion_cline...
- Va a:
  - [edge:default] -> api-call-1766600498965-copy-1767123823398 | API Externa preregistro con ced

### api-call-1766600498965-copy-1767123823398
- Tipo: api-call
- Label: API Externa preregistro con ced
- Función: API POST {url_consulta}/preregistro
- Va a:
  - [edge:default] -> conditional-1766615885569 | CondiciÃ³n preregistr

### code-1767124808418
- Tipo: code
- Label: Code sacar fecha
- Función: Código: function obtenerFechaActual() {
- Va a:
  - [edge:default] -> conditional-1767122250943-copy-1767123725638 | CondiciÃ³n cedula cliente esta vacÃ­o 2

### transfer-1767125619851
- Tipo: transfer
- Label: Transferir soporte
- Función: Transferencia a equipo: Soporte
- Va a: (sin salida)

### conditional-1767126552827
- Tipo: conditional
- Label: CondiciÃ³n cedula contrato
- Función: Condiciones: 2
- Va a:
  - [edge:1767126553919] -> conditional-1767115993233 | CondiciÃ³n contrato new
  - [edge:1767126555226] -> send-message-1767126574141 | Enviar Mensaje

### send-message-1767126574141
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: âš ï¸ CÃ©dula no registrada  No se ha encontrado una cÃ©dula para la cracion del contrato,  ingrese su cedula
- Va a:
  - [edge:default] -> input-1767213274443-copy-1773078207041 | Entrada cedula no encontrada 3

### menu-1767129532776
- Tipo: menu
- Label: MenÃº conectados - reinicio
- Función: Opciones: ver conectados ðŸ‘¥ | reiniciar router ðŸ”
- Va a:
  - [edge:button-1] -> conditional-1773119330554 | Condicional cedula ver conect
  - [edge:button-2] -> conditional-1773119330554-copy-1773119794466 | Condicional cedula reinciar
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1763127054522 | (nodo no encontrado)

### send-message-1767131436818
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: {estadovisi}
- Va a:
  - [edge:default] -> api-call-1767131573215 | API Externa visivilidad

### api-call-1767131573215
- Tipo: api-call
- Label: API Externa visivilidad
- Función: API POST {url_consulta}/wifi/ssid/visibility
- Va a:
  - [edge:default] -> conditional-1766594599535 | CondiciÃ³n estado visivilidad

### jump-1767132060731
- Tipo: jump
- Label: Saltar menu soporte
- Función: Salta a: menu-1766592056133
- Va a:
  - [implicit-jump:targetNodeId] -> menu-1766592056133 | MenÃº ir soporte2

### image-processor-1767647937252
- Tipo: image-processor
- Label: Procesar Imagen
- Función: Procesa imagen a variable: imagen_analisis
- Va a:
  - [edge:default] -> conditional-1773025295703 | Condicional si existe ced antes pago

### input-1767648404910
- Tipo: input
- Label: Entrada img
- Función: Pregunta: ðŸ“„ EnvÃ­e su comprobante de pago
âš ï¸ Solo la imagen, sin texto.
AsegÃºrese de que la foto sea clara y legible. ðŸ“¸âœ”ï¸
- Va a:
  - [edge:default] -> send-message-1773249705066 | Enviar Mensaje

### conditional-1767684849503
- Tipo: conditional
- Label: Condicional sin onu
- Función: Condiciones: 2
- Va a:
  - [edge:1767684852718] -> send-message-1767684895885 | Enviar Mensaje NO ONU
  - [edge:1767684851418] -> menu-1762995979400 | MenÃº opcion pago

### send-message-1767684895885
- Tipo: send-message
- Label: Enviar Mensaje NO ONU
- Función: Mensaje: âŒ No cuenta con una direcciÃ³n ONU Desea continuar?
- Va a:
  - [edge:default] -> menu-1772727875041 | MenÃº sin onu

### conditional-1767684849503-copy-1767685426556
- Tipo: conditional
- Label: Condicional sin onu (copia)
- Función: Condiciones: 2
- Va a:
  - [edge:1767684851418] -> menu-1762995979400-copy-1762997112345-copy-1762997212656 | MenÃº Soporte
  - [edge:1767684852718] -> menu-1772727875041 | MenÃº sin onu

### menu-1767817863996
- Tipo: menu
- Label: MenÃº conf contra
- Función: Opciones: SÃ­ âœ… | Repetir contraseÃ±a 
- Va a:
  - [edge:button-2] -> input-1767107847568 | Entrada new contra
  - [edge:button-1] -> api-call-1766260762605 | API Externa cambio de contra
  - [implicit-timeout:timeoutRedirectNode] -> transfer-1767116494840 | Transferir a soporte 4

### api-call-1765373757698-copy-1766756934456-copy-1767901427858
- Tipo: api-call
- Label: API Externa Token validar (copia)
- Función: API POST {url_consulta}/token/validar
- Va a:
  - [edge:default] -> send-message-1766389387538 | Enviar Mensaje respuesta validatoken

### menu-1772468245783
- Tipo: menu
- Label: MenÃº
- Función: Opciones: Ir a menÃº | salir
- Va a: (sin salida)

### jump-1772471014454
- Tipo: jump
- Label: Saltar
- Función: Salta a: send-media-1762970199587
- Va a:
  - [implicit-jump:targetNodeId] -> send-media-1762970199587 | ImagenActualizaPlan

### conditional-1772471275575
- Tipo: conditional
- Label: Condicional
- Función: Condiciones: 4
- Va a:
  - [edge:1772471475748] -> send-message-1773071636134 | Enviar Mensaje
  - [edge:1772471460668] -> code-1766524944579 | Code
  - [edge:1772471380385] -> chatgpt-agent-1763225282394 | Agente ChatGPT
  - [edge:1773089785131] -> code-1766524944579 | Code
  - [edge:1773089777464] -> send-message-1773071636134 | Enviar Mensaje
  - [edge:1773089445800] -> chatgpt-agent-1763225282394 | Agente ChatGPT

### menu-1772471596086
- Tipo: menu
- Label: MenÃº usuario no encontrado
- Función: Opciones: Contratar ðŸ†• | inserta otra cedula
- Va a:
  - [edge:default] -> jump-1772471741351 | Saltar
  - [edge:button-1] -> jump-1772471741351 | Saltar
  - [edge:button-2] -> send-message-1773149305108 | Enviar Mensaje nueva cedula

### jump-1772471741351
- Tipo: jump
- Label: Saltar
- Función: Salta a: menu-1766326364818
- Va a:
  - [implicit-jump:targetNodeId] -> menu-1766326364818 | MenÃº nuevo usuario

### jump-1772471767888
- Tipo: jump
- Label: Saltar
- Función: Salta a: conditional-1762961952650
- Va a:
  - [implicit-jump:targetNodeId] -> conditional-1762961952650 | CondiciÃ³n cedula cliente

### send-message-1772481244221
- Tipo: send-message
- Label: Enviar Mensaje Validando token...
- Función: Mensaje: ðŸ”‘ Validando token...
- Va a:
  - [edge:default] -> send-message-1766389832162 | Enviar Mensaje respuesta entrada token

### menu-1772481648701
- Tipo: menu
- Label: MenÃº otras opciones
- Función: Opciones: Donde Pagar ðŸ“ | Actualiza plan ðŸ“„ | Enumerar tickets ðŸ“‹
- Va a:
  - [edge:button-1] -> jump-1772482135893 | Saltar
  - [edge:button-3] -> jump-1772657711548 | Saltar
  - [edge:button-2] -> conditional-1773153146034 | Condicional cedula pdf

### menu-1772482111269
- Tipo: menu
- Label: MenÃº p de pago
- Función: Opciones: Banco del barrio ðŸ¦ | Puntos de pago ðŸ’°ðŸ“ | Retroceder
- Va a:
  - [edge:button-1] -> send-message-1772482276524 | Enviar Mensaje
  - [edge:button-2] -> send-media-1772482763135 | Enviar Multimedia puntos de pago
  - [edge:button-3] -> jump-1773199960414 | Saltar

### jump-1772482135893
- Tipo: jump
- Label: Saltar
- Función: Salta a: send-media-1772482157971
- Va a:
  - [implicit-jump:targetNodeId] -> send-media-1772482157971 | puntos de pagos

### send-media-1772482157971
- Tipo: send-media
- Label: puntos de pagos
- Va a:
  - [edge:default] -> menu-1772482111269 | MenÃº p de pago

### send-message-1772482276524
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: Banca mÃ³vil {Banca_mÃ³vil}
- Va a:
  - [edge:default] -> send-message-1772482277877 | Enviar Mensaje

### send-message-1772482277877
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: Banca web {Banca_web}
- Va a:
  - [edge:default] -> send-message-1772482279333 | Enviar Mensaje

### send-message-1772482279333
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: Banco del Barrio  {Banco_Barrio}
- Va a:
  - [edge:default] -> jump-1772485117135 | Saltar

### send-media-1772482763135
- Tipo: send-media
- Label: Enviar Multimedia puntos de pago
- Va a:
  - [edge:default] -> jump-1772485117135 | Saltar

### api-call-1772482954852
- Tipo: api-call
- Label: Apipdf
- Función: API POST {url_consulta}/contrato/link
- Va a:
  - [edge:default] -> conditional-1772483799701 | Condicional estado pdf

### send-message-1772483276895
- Tipo: send-message
- Label: Enviar Mensaje pdf genreado
- Función: Mensaje: ðŸ“„ *Documento generado correctamente*  Puede revisar y descargar su documento en el siguiente enlace: ðŸ”— {urlpdf}  S...
- Va a:
  - [edge:default] -> jump-1772483626405 | Saltar a final

### jump-1772483626405
- Tipo: jump
- Label: Saltar a final
- Función: Salta a: transfer-1773097451168
- Va a:
  - [implicit-jump:targetNodeId] -> transfer-1773097451168 | Transferir final salir

### conditional-1772483799701
- Tipo: conditional
- Label: Condicional estado pdf
- Función: Condiciones: 2
- Va a:
  - [edge:1772483831763] -> send-message-1772483276895 | Enviar Mensaje pdf genreado
  - [edge:1772483834019] -> send-message-1772483885989 | Enviar Mensaje error pdf

### send-message-1772483885989
- Tipo: send-message
- Label: Enviar Mensaje error pdf
- Función: Mensaje: *âŒ Error al generar el PDF.*  Por favor, intÃ©ntelo nuevamente ðŸ”„  o contacte a soporte ðŸŽ§ si el problema continÃº...
- Va a:
  - [edge:default] -> jump-1773157041581 | sltar a menui aux2

### jump-1772485117135
- Tipo: jump
- Label: Saltar
- Función: Salta a: menu-1772482111269
- Va a:
  - [implicit-jump:targetNodeId] -> menu-1772482111269 | MenÃº p de pago

### jump-1772657711548
- Tipo: jump
- Label: Saltar
- Función: Salta a: api-call-1772657756729
- Va a:
  - [implicit-jump:targetNodeId] -> api-call-1772657756729 | APIListatickets

### api-call-1772657756729
- Tipo: api-call
- Label: APIListatickets
- Función: API POST {url_consulta}/tickets/listar
- Va a:
  - [edge:default] -> send-message-1772657893323 | Enviar Mensaje

### send-message-1772657893323
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: Tickets abiertos: {ticketsabiertos} Tickets cerrado: {ticketscerrados}  
- Va a:
  - [edge:default] -> jump-1772661523509 | Saltar

### jump-1772661523509
- Tipo: jump
- Label: Saltar
- Función: Salta a: menu-1762995979400-copy-1762997112345
- Va a:
  - [implicit-jump:targetNodeId] -> menu-1762995979400-copy-1762997112345 | MenÃº Activo

### menu-1772727875041
- Tipo: menu
- Label: MenÃº sin onu
- Función: Opciones: SI | NO
- Va a:
  - [edge:default] -> menu-1762995979400-copy-1762997112345-copy-1762997212656 | MenÃº Soporte
  - [edge:button-2] -> jump-1773157041581 | sltar a menui aux2

### send-message-1772736042667
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje:    "idcliente": "{Id_cliente}",   "solicitante": "{nombreCliente}",   "fechavisita": "{fecha_actual}",   "turno": "TARDE...
- Va a:
  - [edge:default] -> send-message-1766553441600 | Enviar Mensaje

### conditional-1773022570775
- Tipo: conditional
- Label: Condicional cuentas de banco
- Función: Condiciones: 2
- Va a:
  - [edge:1773022583056] -> menu-1764536546789 | MenÃº inicio pago img
  - [edge:1773022578606] -> send-message-1773022750334-copy-1773022770390 | nombre_receptop no valido

### code-1773022732584
- Tipo: code
- Label: CÃ³digo123
- Función: Código: let data1 = {image_analysis}
- Va a:
  - [edge:default] -> conditional-1773336096017 | Condicional

### send-message-1773022750334-copy-1773022770390
- Tipo: send-message
- Label: nombre_receptop no valido
- Función: Mensaje: âŒ Cuenta no vÃ¡lida  La cuenta que ingresÃ³ no pertenece a la empresa. Por favor, verifique los datos e intÃ©ntelo nue...
- Va a:
  - [edge:default] -> menu-1773024452703 | MenÃº

### menu-1773024452703
- Tipo: menu
- Label: MenÃº
- Función: Opciones: Reintentar ðŸ”„ | Ir a menu
- Va a:
  - [edge:button-1] -> jump-1773024530397 | Saltar
  - [edge:button-option-1773024505038] -> jump-1773024744540 | Saltar

### jump-1773024530397
- Tipo: jump
- Label: Saltar
- Función: Salta a: send-media-1764534131197
- Va a:
  - [implicit-jump:targetNodeId] -> send-media-1764534131197 | Enviar Multimedia imagen pagos

### jump-1773024744540
- Tipo: jump
- Label: Saltar
- Función: Salta a: conditional-1762961952650
- Va a:
  - [implicit-jump:targetNodeId] -> conditional-1762961952650 | CondiciÃ³n cedula cliente

### conditional-1773025295703
- Tipo: conditional
- Label: Condicional si existe ced antes pago
- Función: Condiciones: 2
- Va a:
  - [edge:1773025297509] -> jump-1773025429577 | Saltar
  - [edge:1773025340040] -> jump-1766520034093 | Saltar menu pag

### jump-1773025429577
- Tipo: jump
- Label: Saltar
- Función: Salta a: input-1767213274443-copy-1773149024716
- Va a:
  - [implicit-jump:targetNodeId] -> input-1767213274443-copy-1773149024716 | Entrada cedula inicial

### send-message-1773071636134
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: âŒ No se encontrÃ³ un cliente con ese nÃºmero de cÃ©dula.  Por favor, verifique el nÃºmero ingresado e  intÃ©ntelo nuev...
- Va a:
  - [edge:default] -> menu-1772471596086 | MenÃº usuario no encontrado

### wait-1773074240275
- Tipo: wait
- Label: Esperar
- Función: Espera: 5 seconds
- Va a: (sin salida)

### input-1767213274443-copy-1773078207041
- Tipo: input
- Label: Entrada cedula no encontrada 3
- Función: Pregunta: ðŸªª Por favor ingresa tu nÃºmero de cÃ©dula para continuar.
- Va a:
  - [edge:default] -> api-call-1767113645238 | API Externa actualizar contrato pdf

### chatgpt-agent-1773090331132
- Tipo: chatgpt-agent
- Label: ChatGPT Agent contratar
- Función: Modelo: gpt-4
- Va a:
  - [edge:default] -> send-message-1773091397965 | Enviar Mensaje

### send-message-1773091397965
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: CÃ©dula {cedulaClientenew}  Nombre completo {nombre_clientenew}  DirecciÃ³n {direccion_clinew}  {DirecciÃ³n exacta o ref...
- Va a:
  - [edge:default] -> conditional-1767122250943 | CondiciÃ³n cedula esta vacÃ­o contrato

### ollama-agent-1773092255925
- Tipo: ollama-agent
- Label: Ollama Agent
- Función: Modelo: llama3.2-vision:11b
- Va a:
  - [edge:default] -> send-message-1773091397965 | Enviar Mensaje

### send-message-1773092866102
- Tipo: send-message
- Label: Enviar Mensaje ante del token
- Función: Mensaje: ðŸ” VerificaciÃ³n de identidad  Para realizar cambios, necesitamos verificar  su identidad enviando un token a su nÃºme...
- Va a:
  - [edge:default] -> jump-1766236483520 | SaltarCambio Clave

### send-message-1773095947607
- Tipo: send-message
- Label: Enviar Mensaje renicisar
- Función: Mensaje: {estado_consulta} cedula ingresada: {cedulaCliente1} {cedulaCliente1}
- Va a:
  - [edge:default] -> conditional-1772471275575 | Condicional

### transfer-1773097451168
- Tipo: transfer
- Label: Transferir final salir
- Función: Transferencia a equipo: 
- Va a: (sin salida)

### jump-1773097989930
- Tipo: jump
- Label: Saltar
- Función: Salta a: transfer-1773097451168
- Va a:
  - [implicit-jump:targetNodeId] -> transfer-1773097451168 | Transferir final salir

### jump-1773116631445
- Tipo: jump
- Label: Saltar
- Función: Salta a: transfer-1773097451168
- Va a:
  - [implicit-jump:targetNodeId] -> transfer-1773097451168 | Transferir final salir

### send-message-1773116650556
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: opcion no valida por el momento
- Va a:
  - [edge:default] -> jump-1773157041581 | sltar a menui aux2

### input-1767213274443-copy-1773119210258
- Tipo: input
- Label: Entrada cedula no encontrada (copia)
- Función: Pregunta: ðŸªª Por favor ingrese su nÃºmero de 
cÃ©dula para continuar. (si guion)
- Va a:
  - [edge:default] -> jump-1773119468610 | Saltar a condicion cedula

### conditional-1773119330554
- Tipo: conditional
- Label: Condicional cedula ver conect
- Función: Condiciones: 3
- Va a:
  - [edge:default] -> input-1767213274443-copy-1773119210258 | Entrada cedula no encontrada (copia)
  - [edge:1773119342842] -> api-call-1763010400809-copy-1763010434637 | APIConsultadispositivos conectados
  - [edge:1773119349431] -> send-message-1773122025728 | Enviar Mensaje sin cedula wifi

### jump-1773119468610
- Tipo: jump
- Label: Saltar a condicion cedula
- Función: Salta a: conditional-1762961952650
- Va a:
  - [implicit-jump:targetNodeId] -> conditional-1762961952650 | CondiciÃ³n cedula cliente

### conditional-1773119330554-copy-1773119794466
- Tipo: conditional
- Label: Condicional cedula reinciar
- Función: Condiciones: 3
- Va a:
  - [edge:1773119342842] -> code-1766549824794 | Code sacar datos del serivicio
  - [edge:1773119349431] -> send-message-1773122025728 | Enviar Mensaje sin cedula wifi

### send-message-1773122025728
- Tipo: send-message
- Label: Enviar Mensaje sin cedula wifi
- Función: Mensaje: ðŸ”Ž AÃºn no has registrado un nÃºmero de cÃ©dula para realizar consultas.
- Va a:
  - [edge:default] -> input-1767213274443-copy-1773119210258 | Entrada cedula no encontrada (copia)

### input-1767213274443-copy-1773149024716
- Tipo: input
- Label: Entrada cedula inicial
- Función: Pregunta: ðŸªª Por favor ingrese su nÃºmero de 
cÃ©dula para continuar. (sin guion)
- Va a:
  - [edge:default] -> conditional-1773325115772 | Condicional inicial cedula

### input-1773149146055
- Tipo: input
- Label: Entrada cedula 2
- Función: Pregunta: ðŸªª Por favor ingrese su nÃºmero de 
cÃ©dula para continuar. (si guion)
- Va a:
  - [edge:default] -> jump-1772471767888 | Saltar

### send-message-1773149305108
- Tipo: send-message
- Label: Enviar Mensaje nueva cedula
- Función: Mensaje: ðŸªª Por favor ingrese su nÃºmero de  cÃ©dula para continuar. (si guion)
- Va a:
  - [edge:default] -> input-1773149146055 | Entrada cedula 2

### send-message-1773153022802
- Tipo: send-message
- Label: Enviar Mensaje nuevo contrato pdf
- Función: Mensaje: ðŸ“„ Generando nuevo contrato... Con la cÃ©dula {cedulaCliente1}. Por favor espere un momento. â³
- Va a:
  - [edge:default] -> api-call-1772482954852 | Apipdf

### conditional-1773153146034
- Tipo: conditional
- Label: Condicional cedula pdf
- Función: Condiciones: 3
- Va a:
  - [edge:1773153146575] -> send-message-1773153022802 | Enviar Mensaje nuevo contrato pdf
  - [edge:1773153169216] -> input-1773153296778 | Entrada cedula contrato

### input-1773153296778
- Tipo: input
- Label: Entrada cedula contrato
- Función: Pregunta: ðŸªª Por favor ingrese su nÃºmero de 
cÃ©dula para continuar. (si guion)
- Va a:
  - [edge:default] -> send-message-1773153022802 | Enviar Mensaje nuevo contrato pdf

### jump-1773157041581
- Tipo: jump
- Label: sltar a menui aux2
- Función: Salta a: menu-1766556714174
- Va a:
  - [implicit-jump:targetNodeId] -> menu-1766556714174 | MenÃº despues ticket

### send-message-1773159168849
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: ðŸ§¾ Factura: {urlpdf} 
- Va a:
  - [edge:default] -> jump-1773097989930 | Saltar

### send-message-1773160112087
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: "cliente_nombre":"{nombreCliente}",     "cliente_id": "{Id_cliente}",     "idfactura": "{numero_factura}",  "pasarela":"...
- Va a: (sin salida)

### team-1773170897934
- Tipo: team
- Label: Equipos soporte
- Función: Equipo: 
- Va a: (sin salida)

### jump-1773171314336
- Tipo: jump
- Label: Saltar
- Función: Salta a: transfer-1765286077311
- Va a:
  - [implicit-jump:targetNodeId] -> transfer-1765286077311 | Transferir a soporte

### send-media-1773172030245
- Tipo: send-media
- Label: Enviar Multimedia 1
- Va a:
  - [edge:default] -> send-media-1773174574527 | Enviar Multimedia

### send-media-1773174574527
- Tipo: send-media
- Label: Enviar Multimedia
- Va a: (sin salida)

### conditional-1773175775281
- Tipo: conditional
- Label: Condicional gen token sin ced
- Función: Condiciones: 2
- Va a:
  - [edge:1773175775791] -> api-call-1765373757698 | API Externa Token
  - [edge:1773175807895] -> send-message-1773175846626 | Enviar Mensaje pasos generar token

### send-message-1773175846626
- Tipo: send-message
- Label: Enviar Mensaje pasos generar token
- Función: Mensaje: âš ï¸ Actualmente no tiene ningÃºn dato registrado en el sistema.  Para poder realizar cambios en su red WiFi, primero ...
- Va a:
  - [edge:default] -> input-1773176135506 | Entrada cedula4

### input-1773176135506
- Tipo: input
- Label: Entrada cedula4
- Función: Pregunta: ðŸªª Por favor ingrese su nÃºmero de 
cÃ©dula para continuar. (si guion)
- Va a:
  - [edge:default] -> jump-1773176207115 | Saltar

### jump-1773176207115
- Tipo: jump
- Label: Saltar
- Función: Salta a: conditional-1762961952650
- Va a:
  - [implicit-jump:targetNodeId] -> conditional-1762961952650 | CondiciÃ³n cedula cliente

### send-message-1773176493551
- Tipo: send-message
- Label: Enviar Mensaje generar token
- Función: Mensaje: {cedulaCliente1} {cedulacliente1}
- Va a:
  - [edge:default] -> conditional-1773175775281 | Condicional gen token sin ced

### jump-1773178142316
- Tipo: jump
- Label: Saltar
- Función: Salta a: transfer-1766440162573
- Va a:
  - [implicit-jump:targetNodeId] -> transfer-1766440162573 | Transferir soporte 3

### jump-1773199960414
- Tipo: jump
- Label: Saltar
- Función: Salta a: send-media-1762970199587
- Va a:
  - [implicit-jump:targetNodeId] -> send-media-1762970199587 | ImagenActualizaPlan

### code-1773243044262
- Tipo: code
- Label: CÃ³digo retornar cedula
- Función: Código: let texto = {cedulaCliente} || ""
- Va a:
  - [edge:default] -> conditional-1773325418135 | Condicional cedula 1

### code-1773247100255
- Tipo: code
- Label: CÃ³digo sacar url
- Función: Código: // Obtener valor de la variable
- Va a:
  - [edge:default] -> image-processor-1767647937252 | Procesar Imagen

### send-message-1773247548223
- Tipo: send-message
- Label: Enviar Mensaje imen pago
- Función: Mensaje: url de la imagen: {code_resultimg} imagendepo: {imagendedepo} url_comprobante: {url_comprobante}
- Va a:
  - [edge:default] -> image-processor-1767647937252 | Procesar Imagen

### send-message-1773249705066
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: ðŸ”Ž Revisando tu comprobante...
- Va a:
  - [edge:default] -> code-1773247100255 | CÃ³digo sacar url

### menu-1773324687307
- Tipo: menu
- Label: MenÃº principal
- Función: Opciones: Soy Cliente ðŸ™‹ | Donde Pagar ðŸ’· | Ventas/Instalaciones
- Va a:
  - [edge:button-1] -> jump-1773324903360 | Saltar
  - [edge:button-2] -> jump-1773333820944 | Saltar
  - [edge:button-3] -> jump-1773333822086 | Saltar

### jump-1773324903360
- Tipo: jump
- Label: Saltar
- Función: Salta a: code-1773324945649
- Va a:
  - [implicit-jump:targetNodeId] -> code-1773324945649 | CÃ³digo soy cliente

### code-1773324945649
- Tipo: code
- Label: CÃ³digo soy cliente
- Función: Código: // Escribe tu cÃ³digo JavaScript aquÃ­
- Va a:
  - [edge:default] -> send-message-1773324973427 | Enviar Mensaje variable

### send-message-1773324973427
- Tipo: send-message
- Label: Enviar Mensaje variable
- Función: Mensaje: variable de venta false o true es venta= {esVenta} 
- Va a:
  - [edge:default] -> input-1767213274443-copy-1773149024716 | Entrada cedula inicial

### conditional-1773325115772
- Tipo: conditional
- Label: Condicional inicial cedula
- Función: Condiciones: 3
- Va a:
  - [edge:1773325183432] -> code-1773243044262 | CÃ³digo retornar cedula
  - [edge:1773325118734] -> send-message-1773341602561 | Enviar Mensaje es vendedor

### conditional-1773325418135
- Tipo: conditional
- Label: Condicional cedula 1
- Función: Condiciones: 3
- Va a:
  - [edge:1773325463853] -> send-message-1773325766643 | Enviar Mensaje cedula no ingresada
  - [edge:1773325461936] -> conditional-1773325795954 | Condicional
  - [edge:1773326948192] -> send-message-1773325766643 | Enviar Mensaje cedula no ingresada

### send-message-1773325766643
- Tipo: send-message
- Label: Enviar Mensaje cedula no ingresada
- Función: Mensaje: #ï¸âƒ£ *Escribe un nÃºmero de identificaciÃ³n vÃ¡lido  por favor.* _(sin texto adicional ni guiones)_
- Va a: (sin salida)

### conditional-1773325795954
- Tipo: conditional
- Label: Condicional
- Función: Condiciones: 3
- Va a:
  - [edge:1773325801169] -> send-message-1773325766643 | Enviar Mensaje cedula no ingresada
  - [edge:1773325803112] -> jump-1773327052273 | Saltar
  - [edge:1773325796568] -> jump-1773327053578 | Saltar

### jump-1773327052273
- Tipo: jump
- Label: Saltar
- Función: Salta a: 
- Va a: (sin salida)

### jump-1773327053578
- Tipo: jump
- Label: Saltar
- Función: Salta a: send-message-1773327069909
- Va a:
  - [implicit-jump:targetNodeId] -> send-message-1773327069909 | Enviar Mensaje cedula new

### send-message-1773327069909
- Tipo: send-message
- Label: Enviar Mensaje cedula new
- Función: Mensaje: â³Cargando informaciÃ³n... 
- Va a:
  - [edge:default] -> api-call-1762832594446-copy-1762969151422 | APIConsultaCliente

### menu-1773330445948
- Tipo: menu
- Label: MenÃº suspendido
- Función: Opciones: Reportar pago | Donde Pagar ðŸ’· | Salir âŒ
- Va a:
  - [edge:button-1] -> menu-1762995979400 | MenÃº opcion pago
  - [edge:button-2] -> jump-1773330524982 | Saltar

### jump-1773330524982
- Tipo: jump
- Label: Saltar
- Función: Salta a: send-media-1772482157971
- Va a:
  - [implicit-jump:targetNodeId] -> send-media-1772482157971 | puntos de pagos

### send-message-1773332895410
- Tipo: send-message
- Label: Enviar Mensaje pagar con TC
- Función: Mensaje: FunciÃ³n estarÃ¡ disponible mas adelante,  pronto serÃ¡ atendido por un *agente*
- Va a:
  - [edge:default] -> jump-1773178142316 | Saltar

### jump-1773333820944
- Tipo: jump
- Label: Saltar
- Función: Salta a: code-1773333843352
- Va a:
  - [implicit-jump:targetNodeId] -> code-1773333843352 | CÃ³digo donde pagar

### jump-1773333822086
- Tipo: jump
- Label: Saltar
- Función: Salta a: code-1773333844944
- Va a:
  - [implicit-jump:targetNodeId] -> code-1773333844944 | CÃ³digo ventas

### code-1773333843352
- Tipo: code
- Label: CÃ³digo donde pagar
- Función: Código: // Escribe tu cÃ³digo JavaScript aquÃ­
- Va a:
  - [edge:default] -> send-message-1773333896489 | Enviar Mensaje

### code-1773333844944
- Tipo: code
- Label: CÃ³digo ventas
- Función: Código: // Escribe tu cÃ³digo JavaScript aquÃ­
- Va a:
  - [edge:default] -> send-message-1773333898111 | Enviar Mensaje

### send-message-1773333896489
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: donde pagar
- Va a: (sin salida)

### send-message-1773333898111
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: ventas
- Va a: (sin salida)

### conditional-1773336096017
- Tipo: conditional
- Label: Condicional
- Función: Condiciones: 3
- Va a:
  - [edge:1773336160728] -> send-message-1773336207145 | Enviar Mensaje
  - [edge:1773336133504] -> send-message-1773336208580 | Enviar Mensaje
  - [edge:1773336131968] -> menu-1764536546789 | MenÃº inicio pago img

### send-message-1773336207145
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: âš ï¸ *Â¡PAGO NO REGISTRADO! Te recordamos que MEGACONEXIÃ“N ya no acepta depÃ³sitos ni tranferencias a ninguna cuenta....
- Va a: (sin salida)

### send-message-1773336208580
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: âš ï¸ *Tu comprobante no ha sido reconocido como un pago a MEGACONEXIÃ“N.* _SerÃ¡s redirigido para que un operador revi...
- Va a: (sin salida)

### send-message-1773341454527
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: âœ… *Muchas gracias por tu pago. Ya se encuentra subido al sistema para su registro.*  ðŸ‘‹ _Esperamos poder servirte nu...
- Va a:
  - [edge:default] -> jump-1773341509143 | Saltar finalaa

### jump-1773341509143
- Tipo: jump
- Label: Saltar finalaa
- Función: Salta a: transfer-1773097451168
- Va a:
  - [implicit-jump:targetNodeId] -> transfer-1773097451168 | Transferir final salir

### send-message-1773341602561
- Tipo: send-message
- Label: Enviar Mensaje es vendedor
- Función: Mensaje: ðŸ‘‹ *Bienvenido a la secciÃ³n de Vendedores.*  AquÃ­ podrÃ¡s subir tu instalaciÃ³n para que  posteriormente un operador...
- Va a:
  - [edge:default] -> menu-1773341799192 | MenÃº provincias

### menu-1773341799192
- Tipo: menu
- Label: MenÃº provincias
- Función: Opciones: AZUAY | SANTA ELENA
- Va a:
  - [edge:button-option-1773341808693] -> menu-1773341948398 | MenÃº ciudad azuay
  - [edge:button-option-1773341809436] -> menu-1773341946977 | MenÃº vendedor nabon
  - [edge:button-1] -> menu-1773341948398 | MenÃº ciudad azuay
  - [edge:button-2] -> menu-1773342455126 | MenÃº ciudad santa elena

### menu-1773341946977
- Tipo: menu
- Label: MenÃº vendedor nabon
- Función: Opciones: PABLO PIEDRA | HENRY SANTOS | PATRICIO SANMARTIN | FERNANDO SANMARTIN
- Va a:
  - [edge:default] -> code-1773344338057 | CÃ³digo

### menu-1773341948398
- Tipo: menu
- Label: MenÃº ciudad azuay
- Función: Opciones: CUENCA | NABÃ“N
- Va a:
  - [edge:button-1] -> menu-1773342227077 | MenÃº vendedor cuenca
  - [edge:button-2] -> menu-1773341946977 | MenÃº vendedor nabon

### menu-1773342227077
- Tipo: menu
- Label: MenÃº vendedor cuenca
- Función: Opciones: PAUL CORDERO | PABLO PLAZA | SEBASTIAN TENESACA | HENRY ZUÃ‘A | LUIS PUGO | JUAN PARRA | JUAN PARRA | WALTER REINOSO
- Va a:
  - [edge:default] -> code-1773344338057 | CÃ³digo

### menu-1773342455126
- Tipo: menu
- Label: MenÃº ciudad santa elena
- Función: Opciones: LA LIBERTAD | SANTA ELENA | SALINAS
- Va a:
  - [edge:button-1] -> menu-1773342535645 | MenÃº
  - [edge:button-2] -> menu-1773342535645 | MenÃº
  - [edge:button-3] -> menu-1773342535645 | MenÃº

### menu-1773342535645
- Tipo: menu
- Label: MenÃº
- Función: Opciones: GALO FLORENCIA | MONICA POZO | LUIS ROSALES | JONATHAN RODRIGUEZ | MIGUEL ALAY | VICTOR GONZALEZ | ALEX YAGUAL | JOFFRE CONFORME | ANDRES LINO
- Va a:
  - [edge:default] -> code-1773344338057 | CÃ³digo

### send-message-1773343796705
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: Listo {Vendedor} vamos a gestionar tu venta lo antes posible.  
- Va a:
  - [edge:default] -> send-message-1773344267771 | Enviar Mensaje

### jump-1773344178255
- Tipo: jump
- Label: Saltar
- Función: Salta a: conditional-1773325115772
- Va a:
  - [implicit-jump:targetNodeId] -> conditional-1773325115772 | Condicional inicial cedula

### send-message-1773344267771
- Tipo: send-message
- Label: Enviar Mensaje
- Función: Mensaje: A continuaciÃ³n necesito que llenes los datos de tu cliente.  {cliNuevoProv} {cliNuevoCiud} {vendedor} {vendedor_label} ...
- Va a:
  - [edge:default] -> jump-1773344178255 | Saltar

### code-1773344338057
- Tipo: code
- Label: CÃ³digo
- Función: Código: // Escribe tu cÃ³digo JavaScript aquÃ­
- Va a:
  - [edge:default] -> send-message-1773343796705 | Enviar Mensaje


