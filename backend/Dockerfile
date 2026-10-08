FROM node:22-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
# postinstall runs `prisma generate`, which needs the schema present
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
EXPOSE 3001
# Create/upgrade tables, then start the API
CMD ["sh", "-c", "npx prisma db push --skip-generate && node index.js"]
