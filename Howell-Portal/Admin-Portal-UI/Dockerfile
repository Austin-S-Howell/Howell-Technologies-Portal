FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_PUBLIC_BASE=/
ARG VITE_STATIC_FE_ONLY=true
ARG VITE_POC_API_BASE_URL=
ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_ANON_KEY=
ARG VITE_SUPABASE_AUTH_TABLE=users
ARG VITE_SUPABASE_AUTH_USERNAME_COLUMN=username
ARG VITE_SUPABASE_AUTH_PASSWORD_COLUMN=password
ARG VITE_SUPABASE_IDEAS_COLUMN=ideas
ARG VITE_SUPABASE_SHARED_IDEAS_USERNAME=shared

COPY package.json tsconfig.base.json ./
COPY apps/operator-portal/package.json apps/operator-portal/package.json
COPY packages/portal/package.json packages/portal/package.json

RUN npm install

COPY . .
ENV VITE_PUBLIC_BASE=$VITE_PUBLIC_BASE
ENV VITE_STATIC_FE_ONLY=$VITE_STATIC_FE_ONLY
ENV VITE_POC_API_BASE_URL=$VITE_POC_API_BASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_AUTH_TABLE=$VITE_SUPABASE_AUTH_TABLE
ENV VITE_SUPABASE_AUTH_USERNAME_COLUMN=$VITE_SUPABASE_AUTH_USERNAME_COLUMN
ENV VITE_SUPABASE_AUTH_PASSWORD_COLUMN=$VITE_SUPABASE_AUTH_PASSWORD_COLUMN
ENV VITE_SUPABASE_IDEAS_COLUMN=$VITE_SUPABASE_IDEAS_COLUMN
ENV VITE_SUPABASE_SHARED_IDEAS_USERNAME=$VITE_SUPABASE_SHARED_IDEAS_USERNAME
RUN npm run build --workspace @howell-technologies/operator-portal

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/apps/operator-portal/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx \
    && touch /var/run/nginx.pid && chown nginx:nginx /var/run/nginx.pid

EXPOSE 8080

USER nginx

CMD ["nginx", "-g", "daemon off;"]
