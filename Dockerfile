FROM node:22-alpine
WORKDIR /app

# 한국 시간대 설정
RUN apk add --no-cache tzdata
ENV TZ=Asia/Seoul

# 패키지 먼저 복사 → 캐시 효율↑
COPY package*.json ./
RUN npm ci --omit=dev

# 앱 소스 복사
COPY . .

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
