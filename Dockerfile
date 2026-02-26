# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Define build arguments for Vite (Coolify will pass these)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL
ARG VITE_DEV_MODE=false
ARG VITE_DEBUG_API=false
ARG VITE_MOCK_DATA=false

# Set them as environment variables for the build process
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DEV_MODE=$VITE_DEV_MODE
ENV VITE_DEBUG_API=$VITE_DEBUG_API
ENV VITE_MOCK_DATA=$VITE_MOCK_DATA

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Overwrite the default Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (Coolify usually maps 80 to the assigned port)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
