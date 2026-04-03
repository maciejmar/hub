# Stage 1: Build
# FROM node:20 AS build  # Docker Hub — niedostępne w sieci BGK
FROM repo.bank.com.pl/zrai-docker-remote-dev/node:20 AS build

ARG NPM_REGISTRY=""
ARG NPM_AUTH_TOKEN=""

WORKDIR /app

# Konfiguracja npm registry jeśli podano
RUN if [ -n "$NPM_REGISTRY" ]; then \
    echo "registry=${NPM_REGISTRY}" > .npmrc ; \
    if [ -n "$NPM_AUTH_TOKEN" ]; then \
      REGISTRY_HOST=$(echo "$NPM_REGISTRY" | sed 's|https\?://||'); \
      echo "//${REGISTRY_HOST}:_authToken=${NPM_AUTH_TOKEN}" >> .npmrc ; \
    fi ; \
  fi

COPY package*.json ./

# Montujemy CA cert JFrog (analogicznie do pip_conf w backendzie)
RUN --mount=type=secret,id=ca_cert,target=/etc/ssl/certs/ca.pem \
    NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca.pem \
    npm ci

COPY . .

RUN npx ng build --configuration production --base-href /portal/

# Stage 2: Serve via nginx
# FROM nginx:alpine  # Docker Hub — niedostępne w sieci BGK
FROM repo.bank.com.pl/zrai-docker-remote-dev/nginx:alpine

COPY --from=build /app/dist/hub-frontend/browser /usr/share/nginx/html/portal
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
