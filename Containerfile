FROM registry.access.redhat.com/ubi9/nodejs-16

WORKDIR /app/

COPY --chown=default config ./config
COPY --chown=default dist ./dist
COPY --chown=default server ./server
COPY --chown=default server.js .
COPY --chown=default package*.json .

RUN npm install --omit=dev

ENV CC_NAME="My Chromecast"
ENV WEBAPP_TITLE="CC Radio"

EXPOSE 3000/tcp

CMD npm run start