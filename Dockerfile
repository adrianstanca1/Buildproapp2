FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules (sqlite3, etc.)
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package*.json ./
RUN npm ci

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
