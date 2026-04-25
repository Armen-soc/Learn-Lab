# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

# Install Docker CLI to allow the backend to manage execution containers
RUN apk add --no-cache docker-cli

WORKDIR /app

# Copy production dependencies
COPY package*.json ./
RUN npm install --production

# Copy the bundled server and necessary data files
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/courses.json ./
COPY --from=builder /app/data ./data
# Copy other necessary files if they are not bundled or needed at runtime
# (e.g., utils/database.js might be needed if not fully bundled, but esbuild bundles it)

# The server.js in dist/ will be the entrypoint
ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/server.js"]
