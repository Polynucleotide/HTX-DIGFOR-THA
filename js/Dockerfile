FROM node:24.13.0-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci
RUN mkdir -p /app/js && chown -R node:node /app/js
USER node
COPY . ./js
EXPOSE 8000
CMD ["node", "js/src/server.js"]
