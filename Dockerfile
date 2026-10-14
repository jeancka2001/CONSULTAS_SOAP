FROM node:alpine

WORKDIR /soap

RUN apk add --no-cache tzdata

ENV TZ=America/Guayaquil

COPY server.js ./

COPY consulta.wsdl ./

COPY consultaResul.wsdl ./

COPY serviceConsulta.wsdl ./

COPY package*.json ./

RUN npm install -g npm@

RUN npm install

COPY . .

CMD ["npm", "start"]