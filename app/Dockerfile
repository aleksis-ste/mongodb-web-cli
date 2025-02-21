# Use the official Node.js image for building
FROM node:22-alpine AS build-stage

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Use the official Nginx image for serving the application
FROM nginx:alpine AS serve-stage

# Copy the built application from the build stage
COPY --from=build-stage /usr/src/app/dist /usr/share/nginx/html

# Expose the port the app runs on
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]