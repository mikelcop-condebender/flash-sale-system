# Stage 1: Development
FROM node:20 AS dev
WORKDIR /app

# Copy package.json first for better caching
COPY package*.json ./

# Install dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start dev server with proper host binding for Docker
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

# Stage 2: Production
FROM node:20 AS prod
WORKDIR /app

# Copy package.json
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]