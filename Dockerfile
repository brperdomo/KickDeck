FROM node:20-slim

WORKDIR /app

# Install build tools for native modules (bcrypt, sharp)
RUN apt-get update && \
    apt-get install -y python3 make g++ libvips-dev && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and assets
COPY client ./client
COPY server ./server
COPY db ./db
COPY templates ./templates
COPY uploads ./uploads
COPY vite.config.ts tsconfig.json .env.production ./

# Build client assets to dist/public/
RUN npx vite build

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

# Run server with tsx (matches Replit deployment — resolves @db path aliases)
CMD ["npx", "tsx", "server/index.ts"]
