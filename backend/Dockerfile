FROM node:22-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
# postinstall runs `prisma generate`, which needs the schema present
COPY prisma ./prisma
COPY prisma.config.ts ./
# `prisma generate` (postinstall) only reads the schema, but prisma.config.ts
# requires DATABASE_URL to exist. A placeholder is used for this one command;
# it is not stored in the image. The real URL is supplied at runtime.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm ci
COPY . .
ENV NODE_ENV=production
EXPOSE 3001
# Create/upgrade tables, then start the API
CMD ["sh", "-c", "npx prisma db push --skip-generate && node index.js"]
