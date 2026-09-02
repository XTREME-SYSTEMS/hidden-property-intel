FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm install -D typescript ts-node @types/node

COPY scraper-cron.ts ./

RUN npm run build

CMD ["npm", "start"]

