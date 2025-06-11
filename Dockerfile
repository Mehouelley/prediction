# Dockerfile for Prediction API
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Run the application
CMD ["node", "index.js"]
