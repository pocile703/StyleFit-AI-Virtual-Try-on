# StyleFit frontend — dev-parity image.
# node:22-bookworm-slim satisfies Next 16's Node >=20.9 requirement and gives
# glibc for SWC / lightningcss native binaries.
FROM node:22-bookworm-slim

WORKDIR /app

# Install in-image so the container keeps its own linux-native modules
# regardless of what the host's node_modules were built for.
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# -H 0.0.0.0 so the published port is reachable from the host / LAN.
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
