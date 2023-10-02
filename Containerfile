FROM registry.access.redhat.com/ubi9/nodejs-16 AS deps

WORKDIR ${APP_ROOT}
COPY package*.json .

RUN npm install --omit dev

FROM registry.access.redhat.com/ubi9/nodejs-16 AS build

WORKDIR ${APP_ROOT}
COPY . .

RUN npm install
RUN npm run build-frontend

FROM registry.access.redhat.com/ubi9/nodejs-16-minimal AS release

WORKDIR ${APP_ROOT}

COPY --from=deps ${APP_ROOT}/node_modules node_modules
COPY --from=build ${APP_ROOT}/dist dist

COPY config config
COPY server server
COPY server.js .
COPY package*.json .

ENV CC_NAME="My Chromecast"
ENV WEBAPP_TITLE="CC Radio"

EXPOSE 3000/tcp

CMD npm run start