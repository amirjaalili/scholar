# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including devDependencies)
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the frontend (Vite) and backend (esbuild)
RUN npm run build

# Stage 2: Serve the application in a lightweight production container
FROM node:20-alpine

WORKDIR /app

# Ensure we have the production-only dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets and server from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data.json ./data.json
COPY --from=builder /app/uploads ./uploads

# Expose the application port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Start the full-stack server
CMD ["npm", "run", "start"]
