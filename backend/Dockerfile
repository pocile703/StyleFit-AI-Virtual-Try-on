# StyleFit backend — dev-parity image.
# node:22-bookworm-slim = Debian/glibc, so sharp's prebuilt libvips binary
# loads cleanly (Alpine/musl needs a different sharp build).
FROM node:22-bookworm-slim

WORKDIR /app

# Install deps in the image so the container never inherits the host's
# (possibly wrong-platform) node_modules. --include=optional pulls sharp's
# prebuilt @img/sharp-linux-* binaries.
COPY package*.json ./
RUN npm install --include=optional

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
