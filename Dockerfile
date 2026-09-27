FROM node:20-bookworm-slim

# Chromium's runtime dependencies (Remotion's headless renderer needs these
# even though it downloads its own Chrome Headless Shell below).
RUN apt-get update && apt-get install -y --no-install-recommends \
	libnss3 \
	libdbus-1-3 \
	libatk1.0-0 \
	libgbm-dev \
	libasound2 \
	libxrandr2 \
	libxkbcommon-dev \
	libxfixes3 \
	libxcomposite1 \
	libxdamage1 \
	libatk-bridge2.0-0 \
	libpango-1.0-0 \
	libcairo2 \
	libcups2 \
	fonts-noto-color-emoji \
	ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Downloads Remotion's own Chrome Headless Shell into the image at build
# time, so the render service never pays that cost (or needs network
# access) on first request in production.
RUN npx remotion browser ensure

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npx", "tsx", "server/index.ts"]
