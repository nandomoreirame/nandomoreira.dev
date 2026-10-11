# Homelab staging image (http://nandomoreira.home). Production does not use it:
# App Hosting builds from apphosting.yaml. The only difference that matters is
# `--mode staging`, which makes the build serve drafts for review
# (src/lib/content/posts.ts, showDrafts).

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --mode staging

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 8080
CMD ["node", "./dist/server/entry.mjs"]
