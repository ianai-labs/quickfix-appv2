FROM node:22-alpine

WORKDIR /app

# Install nodemon for development hot-reload
RUN npm install -g nodemon

# Copy package files
COPY package*.json ./

# Install dependencies (termasuk devDependencies untuk ESLint CI)
RUN npm install

# Copy application source
COPY . .

# Expose application port
EXPOSE 3000

# Production: node server.js | Development: docker compose override ke nodemon
CMD ["node", "server.js"]
