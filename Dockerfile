FROM node:20-slim

# Install Calibre (provides ebook-convert)
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends calibre \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json .
RUN npm install --omit=dev

COPY src/ ./src/

ENV IN_DIR=/in \
    OUT_DIR=/out \
    PORT=3000

EXPOSE 3000

CMD ["node", "src/index.js"]
