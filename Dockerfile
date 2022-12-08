FROM registry.access.redhat.com/ubi9/nodejs-16 AS base

WORKDIR /app/
COPY --chown=default . .

FROM registry.access.redhat.com/ubi9/nodejs-16 AS build

WORKDIR /app/
COPY --chown=default --from=base /app .

RUN npm install
RUN npm run build-frontend

FROM registry.access.redhat.com/ubi9/nodejs-16 AS release

WORKDIR /app/

COPY --chown=default --from=base /app/config ./config
COPY --chown=default --from=base /app/server ./server
COPY --chown=default --from=base /app/server.js .
COPY --chown=default --from=base /app/package*.json .

COPY --chown=default --from=build /app/dist ./dist

RUN npm install --omit dev

ENV CC_NAME="My Chromecast"
ENV WEBAPP_TITLE="CC Radio"

EXPOSE 3000/tcp

CMD npm run start