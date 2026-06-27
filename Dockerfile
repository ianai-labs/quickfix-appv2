FROM node:20-alpine

WORKDIR /app

# Install nodemon globally for hot-reload
RUN npm install -g nodemon

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Expose application port
EXPOSE 3000

# Start with nodemon for development
CMD ["npx", "nodemon", "server.js"]
