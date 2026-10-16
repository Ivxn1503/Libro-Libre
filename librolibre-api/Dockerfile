
FROM node:24-bookworm-slim

WORKDIR /app

# Herramientas para convertir HEIC/HEIF.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       imagemagick \
       libheif1 \
       libde265-0 \
       ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Dependencias del backend.
COPY package.json package-lock.json ./

RUN npm ci

# Copiar cÃ³digo y esquema Prisma.
COPY . .

# Generar el cliente Prisma.
RUN DATABASE_URL="postgresql://usuario:contrasena@localhost:5432/librolibre" \
    DIRECT_URL="postgresql://usuario:contrasena@localhost:5432/librolibre" \
    npx prisma generate

ENV NODE_ENV=production

EXPOSE 10000

CMD ["npm", "start"]
