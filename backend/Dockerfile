# Stage 1: Development
FROM node:20 AS dev
WORKDIR /app

# Copy package.json and prisma schema first
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies (including dev dependencies for development)
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 4000

# Default dev command (can be overridden by docker-compose)
CMD ["npm", "run", "dev"]

# Stage 2: Production
FROM node:20 AS prod
WORKDIR /app

# Copy package.json and prisma schema first
COPY package*.json ./
COPY prisma ./prisma

# Install production dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# Expose port
EXPOSE 4000

# Start in production
CMD ["npm", "start"]