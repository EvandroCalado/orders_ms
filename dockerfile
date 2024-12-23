FROM node:21-alpine3.19

WORKDIR /usr/src/app

COPY  package.json pnpm-lock.yaml ./

RUN npm install -g pnpm

RUN pnpm install

RUN pnpm prisma generate

COPY . .

EXPOSE 3002
