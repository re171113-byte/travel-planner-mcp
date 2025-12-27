FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Expose port
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production

# Start HTTP server
CMD ["node", "dist/index.js", "http"]
