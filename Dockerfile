FROM node:22-alpine AS build
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY apps/operator-portal/package.json apps/operator-portal/package.json
COPY apps/client-portal-demo/package.json apps/client-portal-demo/package.json
COPY packages/portal/package.json packages/portal/package.json

RUN npm install

COPY . .
RUN npm run build --workspace @howell-technologies/operator-portal

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/operator-portal/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
