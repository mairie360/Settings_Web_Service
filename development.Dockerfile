# syntax=docker/dockerfile:1
ARG NODE_VERSION=24.21.0
FROM node:${NODE_VERSION}-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6 AS builder

# Install dependencies
RUN apt update && apt install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/projects

# Copy package files separately for better caching
COPY package.json package-lock.json ./

# MAIR-436: the GitHub Packages token is a required BuildKit secret used only by the install.
# A readonly bind keeps the tracked npm policy without writing the token into a layer.
RUN --mount=type=secret,id=node_auth_token,env=NODE_AUTH_TOKEN,required=true \
    --mount=type=bind,source=.npmrc,target=/usr/src/projects/.npmrc \
    npm ci

# Copy source code
COPY . .

# Create non-root user
RUN useradd --system --home /usr/src/projects --shell /usr/sbin/nologin projects

# Set permissions
RUN chown -R projects:projects /usr/src/projects
USER projects

# Set environment variables
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start the app in development mode
CMD ["npm", "run", "dev"]
