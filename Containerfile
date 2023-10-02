# Build the code
FROM registry.access.redhat.com/ubi9/nodejs-18 AS build
WORKDIR ${APP_ROOT}

COPY package*.json .
RUN npm ci

COPY src src
COPY angular.json .
COPY tsconfig*.json .

RUN npm run build-frontend
RUN npm ci --omit=dev

# Assemble the image
FROM registry.access.redhat.com/ubi9/nodejs-18-minimal AS release
WORKDIR ${APP_ROOT}

COPY --from=build ${APP_ROOT}/node_modules node_modules
COPY --from=build ${APP_ROOT}/dist dist

COPY config config
COPY server server
COPY server.js .
COPY package*.json .

ENV CC_NAME="My Chromecast"
ENV WEBAPP_TITLE="CC Radio"

EXPOSE 3000/tcp

CMD npm run start