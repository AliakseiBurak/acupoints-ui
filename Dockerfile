FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY server.js ./
COPY public/ ./public/
COPY content/ ./content/

EXPOSE 3000

CMD ["node", "server.js"]
