FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_PUBLIC_BASE=/
ARG VITE_STATIC_FE_ONLY=false
ARG VITE_POC_API_BASE_URL=

COPY package.json tsconfig.base.json ./
COPY apps/operator-portal/package.json apps/operator-portal/package.json
COPY packages/portal/package.json packages/portal/package.json

RUN npm install

COPY . .
ENV VITE_PUBLIC_BASE=$VITE_PUBLIC_BASE
ENV VITE_STATIC_FE_ONLY=$VITE_STATIC_FE_ONLY
ENV VITE_POC_API_BASE_URL=$VITE_POC_API_BASE_URL
RUN npm run build --workspace @howell-technologies/operator-portal

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/apps/operator-portal/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx \
    && touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid

EXPOSE 8080

USER nginx

CMD ["nginx", "-g", "daemon off;"]
