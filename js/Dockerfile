FROM node:24.13.0-alpine

RUN mkdir -p /app/js && chown -R node:node /app/js
WORKDIR /app/js

COPY package*.json .
RUN npm ci

USER node

COPY . .

EXPOSE 8000

CMD ["node", "src/server.js"]
