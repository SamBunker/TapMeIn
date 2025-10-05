# Step 1: Use an official Node.js runtime as a parent image
FROM node:18-slim

# Step 2: Install build dependencies (including gcc, make, python3 for bcrypt)
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    python3-dev \
    gcc \
    make \
    && rm -rf /var/lib/apt/lists/*

# Step 3: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 4: Copy package.json and package-lock.json
COPY package*.json ./

# Step 5: Clear npm cache for clean installation
RUN npm cache clean --force

# Step 6: Install application dependencies
RUN npm install --production

# Step 7: Copy the rest of your application files
COPY . .

# Step 8: Create uploads directory for file uploads
RUN mkdir -p uploads && chmod 755 uploads

# Step 9: Expose the port that the app will run on
EXPOSE 3001

# Step 10: Health check to ensure container is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Step 11: Define the command to run your application
CMD ["node", "app.js"]
