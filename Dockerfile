# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies like Vite)
RUN npm install

# Copy application code
COPY . .

# Set build-time environment variables for Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build the frontend application
RUN npm run build

# Runtime Stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy everything from build stage to ensure all TS files are present
COPY --from=build /app ./


# Install only production dependencies
# Note: tsx is needed if running server in TS mode
RUN npm ci --only=production

# Expose port
EXPOSE 8080

# Start the server
# Note: Using tsx directly if it's in dependencies/node_modules
CMD ["npx", "tsx", "server/index.ts"]

