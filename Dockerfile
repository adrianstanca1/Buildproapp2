FROM node:20-slim

WORKDIR /app

# Install build dependencies for native modules (sqlite3, etc.)
# Debian usage: apt-get instead of apk
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
# Install ALL dependencies (including dev) so 'npm run build' (vite) works
RUN npm install

# Copy source code
COPY . .

# Build Frontend
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Cloud Run sets PORT env var (default 8080)
ENV PORT=8080
EXPOSE 8080

# Start Monolith (Express serves /api + Static)
CMD ["npm", "start"]
# CMD ["node", "server/diagnosis.js"]

